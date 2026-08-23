import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compositionByPreset,
  compositionForContext,
  findCompositionViolations,
  type SceneActor,
} from "../src/ui/sceneComposition";
import { M5_SCENE_PREVIEWS } from "../src/dev/scenePreview";
import {
  resolveMissingAssetPresentation,
  resolveOptionalAssetFailureBehavior,
} from "../src/ui/gameView";

const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const gameViewSource = readFileSync(new URL("../src/ui/gameView.ts", import.meta.url), "utf8");
const assetManifestSource = readFileSync(
  new URL("../docs/assets/ASSET_MANIFEST.md", import.meta.url),
  "utf8",
);

const rendererSection = (start: string, end: string): string => {
  const startIndex = gameViewSource.indexOf(start);
  const endIndex = gameViewSource.indexOf(end, startIndex + start.length);
  return gameViewSource.slice(startIndex, endIndex);
};

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

  it("N3는 inward-facing enemy↔hero axis와 Doyun-side support triangle을 고정한다", () => {
    expect(compositionForContext("n3_wraith_choice")).toMatchObject({
      preset: "confrontation",
      mode: "sprite",
      actors: {
        gray_wraith: {
          zone: "left",
          scale: "large",
          dramaticSide: "enemy",
          facing: "screen-right",
          mirrorPolicy: "safe-to-mirror",
        },
        juno: {
          zone: "center",
          scale: "small",
          anchor: "center-low-support",
          dramaticSide: "hero",
          facing: "front",
          mirrorPolicy: "original-only",
        },
        doyun: {
          zone: "right",
          scale: "large",
          dramaticSide: "hero",
          facing: "screen-left",
          mirrorPolicy: "original-only",
        },
      } satisfies Record<SceneActor, unknown>,
    });
  });

  it("N3만 audited-safe Wraith horizontal mirror를 적용하고 Doyun/Juno는 반전하지 않는다", () => {
    expect(stylesSource).toMatch(
      /data-composition="confrontation"[^\n]*data-wraith-facing="screen-right"[^\n]*\.scene-enemy-visual \.asset-image,[\s\S]*?\{[^}]*transform:\s*scaleX\(-1\)/s,
    );
    expect(stylesSource).not.toMatch(
      /data-composition="confrontation"[\s\S]*?\.scene-player-visual \.asset-image\s*\{[^}]*scaleX\(-1\)/s,
    );
  });

  it("battle은 좌측 Wraith/중앙 support Juno/우측 Doyun을 고정한다", () => {
    expect(compositionForContext("battle_wraith")).toMatchObject({
      preset: "battle",
      mode: "sprite",
      actors: {
        gray_wraith: { zone: "left" },
        juno: { zone: "center", anchor: "center-mid-support" },
        doyun: { zone: "right" },
      },
    });
  });

  it("N3 low support와 battle mid support는 서로 다른 responsive anchor를 쓴다", () => {
    expect(stylesSource).toMatch(
      /data-composition="confrontation"[^}]*\.dev-role-juno\s*\{[^}]*bottom:\s*22%/s,
    );
    expect(stylesSource).toMatch(
      /data-composition="battle"[^}]*\.dev-role-juno\s*\{[^}]*bottom:\s*34%/s,
    );
    expect(stylesSource).toMatch(
      /data-composition="confrontation"[^}]*\.dev-role-juno\s*\{[^}]*left:\s*49%/s,
    );
  });

  it("N5 result는 Juno를 center-low-support에 유지한다", () => {
    expect(compositionForContext("n5_transform_result")).toMatchObject({
      preset: "protect",
      actors: {
        gray_wraith: { zone: "left" },
        juno: { zone: "center", anchor: "center-low-support" },
        doyun: { zone: "right" },
      },
    });
    expect(compositionForContext("n5_transform")).toMatchObject({
      preset: "protect",
      actors: {
        juno: { zone: "center", anchor: "center-mid-support" },
      },
    });
    expect(stylesSource).toMatch(
      /\.game-shell\[data-composition="protect"\]\.n5-transformation-result-scene \.cutscene-character\s*\{[^}]*bottom:\s*clamp\(145px, 20vh, 220px\)/s,
    );
  });

  it("N6 첫 선택에서만 Wraith를 확대하고 다른 battle actor 계약은 유지한다", () => {
    expect(stylesSource).toMatch(
      /data-presentation-context="n6_first_choice"[^}]*\.scene-enemy-visual\s*\{[^}]*left:\s*clamp\(-2%, 0vw, 2%\);[^}]*width:\s*min\(42vw, 780px\);[^}]*height:\s*min\(80vh, 860px\);/s,
    );
    expect(stylesSource).not.toMatch(
      /data-composition="battle"[^}]*\.scene-enemy-visual\s*\{[^}]*width:\s*min\(42vw, 780px\)/s,
    );
  });

  it("Battle은 BGM용 좌상단 lane을 비우고 Juno를 lower support에 둔다", () => {
    expect(stylesSource).toMatch(
      /\.game-shell\.battle-screen \.battle-hud\s*\{[^}]*left:\s*clamp\(350px, 22vw, 420px\);/s,
    );
    expect(stylesSource).toMatch(
      /data-composition="battle"[^}]*\.battle-stage-juno\s*\{[^}]*bottom:\s*clamp\(230px, 29vh, 320px\);[^}]*left:\s*clamp\(51%, 53vw, 55%\);/s,
    );
    expect(stylesSource).toMatch(
      /\.game-shell\[data-composition="battle"\] \.battle-dialogue\.dialogue-panel\s*\{[^}]*width:\s*min\(48vw, 820px\);/s,
    );
  });

  it("Battle dialogue는 desktop command dock 위에 최소 16px safe gap을 예약한다", () => {
    expect(stylesSource).toMatch(
      /\.battle-dialogue\.dialogue-panel\s*\{[^}]*bottom:\s*clamp\(228px, 26vh, 245px\);/s,
    );
    expect(stylesSource).toMatch(
      /\.battle-control-dock\s*\{[^}]*bottom:\s*clamp\(12px, 2vh, 24px\);/s,
    );
  });

  it("Ending Juno는 중앙 card 밖 left-low actor lane을 사용한다", () => {
    expect(stylesSource).toMatch(
      /\.game-shell\[data-composition="ending"\]\.ending-screen \.ending-character:not\(\.ending-black-magical-girl\)\s*\{[^}]*bottom:\s*clamp\(110px, 14vh, 160px\);[^}]*left:\s*clamp\(0%, 2vw, 3%\);/s,
    );
  });

  it("N5 protect preview는 enemy/hero/support safe zones를 runtime처럼 분리한다", () => {
    expect(stylesSource).toMatch(
      /data-composition="protect"[^}]*\.dev-role-enemy,[\s\S]*?\{[^}]*left:\s*2%[^}]*width:\s*34%/s,
    );
    expect(stylesSource).toMatch(
      /data-composition="protect"[^}]*\.dev-role-juno\s*\{[^}]*left:\s*46%[^}]*width:\s*10%/s,
    );
    expect(stylesSource).toMatch(
      /data-composition="protect"[^}]*\.dev-role-player,[\s\S]*?\{[^}]*right:\s*1%[^}]*width:\s*37%/s,
    );
  });

  it("solo-cut은 16:9 원본을 distortion 없는 full-stage cover로 표시한다", () => {
    expect(compositionByPreset("solo-cut")).toMatchObject({
      mode: "cut",
      cutPresentation: {
        stage: "full-stage",
        objectFit: "cover",
      },
    });
    expect(stylesSource).toMatch(
      /data-render-mode="cut"[^}]*\.dev-preview-stage[^}]*\{[^}]*inset:\s*0/s,
    );
    expect(stylesSource).toMatch(
      /transform-cut-stage\.transform-cut-single[^}]*\.transform-cut\s+\.asset-image\s*\{[^}]*object-fit:\s*cover/s,
    );
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

  it("CUT02 다음 transformed-live는 짧은 청백 flash 뒤 actor와 card를 fade-in한다", () => {
    expect(gameViewSource).toMatch(
      /createShell\(options\.liveSceneId, "n5_transform_result"\)[\s\S]*?classList\.add\([\s\S]*?"transform-scene-handoff"/,
    );
    expect(stylesSource).toMatch(
      /\.transform-scene-handoff::after\s*\{[^}]*animation:\s*transform-handoff-flash 220ms/s,
    );
    expect(stylesSource).toMatch(
      /\.transform-scene-handoff\s*>\s*\.character-visual[\s\S]*?animation:\s*transform-live-fade-in 340ms/s,
    );
  });

  it("transform handoff는 reduced-motion에서 flash와 live fade를 제거한다", () => {
    expect(stylesSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.transform-scene-handoff::after[\s\S]*?display:\s*none/s,
    );
    expect(stylesSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.transform-scene-handoff\s*>\s*\.character-visual[\s\S]*?animation:\s*none\s*!important/s,
    );
  });

  it("N5 result만 compact 청백 presentation variant를 사용한다", () => {
    const renderer = rendererSection("renderTransformationResult(", "renderBattle(");
    expect(renderer).toMatch(/classList\.add\([\s\S]*?"n5-transformation-result-scene"/);
    expect(renderer).toContain("transformation-result transformation-result--n5");
    expect(stylesSource).toMatch(/\.transformation-result--n5\s*\{[^}]*position:\s*absolute/s);
    expect(stylesSource).toMatch(
      /\.transformation-result--n5\s*\{[^}]*width:\s*min\(560px,/s,
    );
    expect(stylesSource).toMatch(
      /\.transformation-result--n5\s*\{[^}]*border-top:\s*4px solid var\(--spell-cyan\)/s,
    );

    const unrelatedRenderers = gameViewSource.replace(renderer, "");
    expect(unrelatedRenderers).not.toContain("transformation-result--n5");
  });

  it("N5 result CTA는 즉시 활성 one-shot 서사 버튼이다", () => {
    const renderer = rendererSection("renderTransformationResult(", "renderBattle(");
    expect(renderer).toContain('"망령에게 맞선다"');
    expect(renderer).toMatch(/addEventListener\([\s\S]*?\{ once: true \},\s*\)/);
    expect(renderer).not.toContain(
      'delayedAdvanceButton("primary-button", "망령에게 맞선다"',
    );
  });

  it("Doyun magical_pose head-only EDIT는 사람 재검수 단계로 남긴다", () => {
    expect(assetManifestSource).toContain("`doyun.magical_pose`: `EDIT APPLIED · HUMAN_RECHECK`");
    expect(assetManifestSource).toContain("신규 pose 0장, 기존 pose EDIT 1장 적용");
    expect(assetManifestSource).toContain("heart-hand body pose");
    expect(assetManifestSource).toContain("고통·패배가 아닌 코믹한 당혹감");
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
