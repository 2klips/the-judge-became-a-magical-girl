import { describe, expect, it } from "vitest";
import {
  M5_SCENE_PREVIEWS,
  resolveDevSceneRequest,
} from "../src/dev/scenePreview";

describe("M5 dev 장면 프리뷰 계약", () => {
  it("확정 배경 16개를 적어도 한 장면에서 직접 선택할 수 있다", () => {
    expect(new Set(M5_SCENE_PREVIEWS.map(({ backgroundId }) => backgroundId))).toEqual(
      new Set([
        "bg_title",
        "bg_office_wide",
        "bg_hall_day",
        "bg_hall_time_stop",
        "bg_hall_dark",
        "bg_hall_good",
        "bg_hall_normal",
        "bg_hall_bad",
        "bg_desk_closeup",
        "bg_transform_space",
        "bg_battle_wide",
        "bg_hall_void",
        "bg_mind_archive",
        "bg_battle_core",
        "bg_corridor_day",
        "bg_corridor_blacklight",
      ]),
    );
  });

  it("debug에서만 scene 직접 프리뷰를 허용하고 잘못된 ID를 구분한다", () => {
    expect(resolveDevSceneRequest("?scene=n8-final-spell").mode).toBe("game");
    expect(resolveDevSceneRequest("?debug=1").mode).toBe("game");

    const valid = resolveDevSceneRequest("?debug=1&scene=n8-final-spell");
    expect(valid.mode).toBe("preview");
    if (valid.mode === "preview") {
      expect(valid.preview.backgroundId).toBe("bg_battle_core");
    }

    expect(resolveDevSceneRequest("?debug=1&scene=missing")).toEqual({
      mode: "invalid",
      debugEnabled: true,
      requestedId: "missing",
    });
  });

  it("도윤이 등장하는 장면 프리셋에 장면별 runtime 상태를 연결한다", () => {
    const logicalIds = (id: string): readonly string[] =>
      M5_SCENE_PREVIEWS.find((preview) => preview.id === id)?.visuals.map(
        ({ logicalId }) => logicalId,
      ) ?? [];

    expect(logicalIds("n0-office")).not.toContain("doyun.normal_tired");
    expect(logicalIds("n0-desk")).toContain("doyun.normal_tired");
    expect(logicalIds("n1-first-voice")).toContain("doyun.normal_startled");
    expect(logicalIds("battle-p1")).toContain("doyun.magical_defend");
    expect(logicalIds("battle-p2")).toContain("doyun.magical_attack");
    expect(logicalIds("n8-final-spell")).toContain("doyun.magical_finish");
    expect(logicalIds("ending-bad")).toContain("doyun.normal_empty");
  });

  it("위기와 엔딩 프리셋은 납품된 선호 BGM을 사용한다", () => {
    const bgm = (id: string): string | null | undefined =>
      M5_SCENE_PREVIEWS.find((preview) => preview.id === id)?.bgmId;

    for (const id of [
      "n3-wraith",
      "n4-team",
      "n4-cooperate",
      "n4-awkward",
      "n4-c-recover",
      "n4-c-distance",
      "n5-intro",
      "n5-incantation",
    ]) {
      expect(bgm(id), id).toBe("bgm_crisis");
    }
    for (const id of [
      "ending-good",
      "ending-hidden",
      "post-credit",
      "ending-normal",
      "ending-bad",
    ]) {
      expect(bgm(id), id).toBe("bgm_ending");
    }
  });
});
