import { describe, expect, it } from "vitest";
import {
  compositionForContext,
  findCompositionViolations,
  type SceneActor,
} from "../src/ui/sceneComposition";
import { M5_SCENE_PREVIEWS } from "../src/dev/scenePreview";
import {
  resolveMissingAssetPresentation,
  resolveOptionalAssetFailureBehavior,
} from "../src/ui/gameView";

const roles = (id: string): readonly string[] =>
  M5_SCENE_PREVIEWS.find(({ id: previewId }) => previewId === id)?.visuals.map(
    ({ role }) => role,
  ) ?? [];

describe("Scenario v3.1 global scene composition", () => {
  it("모든 sprite preset은 Doyun/Juno/Wraith에 서로 다른 safe zone을 준다", () => {
    for (const context of ["n3_wraith_choice", "n4_team", "battle_wraith"] as const) {
      const composition = compositionForContext(context);
      expect(findCompositionViolations(composition)).toEqual([]);
    }
  });

  it("N3는 큰 좌측 Wraith, 중앙 Juno, 우측 Doyun 대치 구도다", () => {
    expect(compositionForContext("n3_wraith_choice")).toMatchObject({
      preset: "confrontation",
      mode: "sprite",
      actors: {
        gray_wraith: { zone: "left", scale: "large" },
        juno: { zone: "center", scale: "small" },
        doyun: { zone: "right", scale: "large" },
      } satisfies Record<SceneActor, unknown>,
    });
  });

  it("battle은 좌측 Wraith/중앙 support Juno/우측 Doyun을 고정한다", () => {
    expect(compositionForContext("battle_wraith")).toMatchObject({
      preset: "battle",
      mode: "sprite",
      actors: {
        gray_wraith: { zone: "left" },
        juno: { zone: "center" },
        doyun: { zone: "right" },
      },
    });
  });

  it("transform preview는 cut과 live actor를 같은 frame에 두지 않는다", () => {
    expect(roles("n5-before-transform")).toEqual(["player", "enemy", "juno"]);
    expect(roles("n5-cut-01")).toEqual(["cut"]);
    expect(roles("n5-cut-02")).toEqual(["cut"]);
    expect(roles("n5-transformed-live")).toEqual(["player", "juno", "enemy"]);

    for (const id of ["n5-cut-01", "n5-cut-02"]) {
      const preview = M5_SCENE_PREVIEWS.find(({ id: previewId }) => previewId === id);
      expect(preview?.renderMode).toBe("cut");
      expect(preview?.visuals.some(({ role }) => role !== "cut")).toBe(false);
    }
  });

  it("모든 v3.1 preview에서 actor role 중복을 허용하지 않는다", () => {
    for (const preview of M5_SCENE_PREVIEWS) {
      const actorRoles = preview.visuals
        .map(({ role }) => role)
        .filter((role) => ["player", "juno", "enemy"].includes(role));
      expect(new Set(actorRoles).size, preview.id).toBe(actorRoles.length);
    }
  });

  it("post-credit 누락 asset은 debug에서 명시적 label, production에서 hidden이다", () => {
    expect(resolveMissingAssetPresentation("검은 마법소녀", "debug")).toMatchObject({
      text: "ASSET MISSING · 검은 마법소녀",
      className: "asset-missing-debug",
    });
    expect(resolveOptionalAssetFailureBehavior(true)).toBe("debug-label");
    expect(resolveOptionalAssetFailureBehavior(false)).toBe("hide");
  });
});

