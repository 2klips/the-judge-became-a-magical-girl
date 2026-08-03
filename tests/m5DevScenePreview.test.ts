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
    expect(resolveDevSceneRequest("?scene=battle-p3-spell").mode).toBe("game");
    expect(resolveDevSceneRequest("?debug=1").mode).toBe("game");

    const valid = resolveDevSceneRequest("?debug=1&scene=battle-p3-spell");
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
});
