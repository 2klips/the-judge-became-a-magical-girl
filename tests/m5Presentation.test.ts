import { describe, expect, it } from "vitest";
import type { EndingNode } from "../src/data/schema";
import {
  resolveDialogueIdentity,
  resolveEndingLines,
  resolveEndingPages,
  resolveEndingVisual,
  resolveMissingAssetPresentation,
  resolveSceneBrand,
  VOICE_TITLE_SUBTITLE,
} from "../src/ui/gameView";

describe("M5 장면 표시 계약", () => {
  it("누락 외부 이미지는 UI를 보존하는 검은 presentation으로 표시한다", () => {
    expect(resolveMissingAssetPresentation("주노 · neutral")).toEqual({
      className: "asset-black-placeholder",
      ariaLabel: "주노 · neutral 에셋 준비 중",
      preservesInteractiveUi: true,
    });
  });

  it("N1에서는 주노 정체를 이름표와 상단 링크에 노출하지 않는다", () => {
    expect(resolveDialogueIdentity("n1_first_voice", "주노")).toEqual({
      speaker: "정체불명의 목소리",
      brand: "VOICE // LINK",
    });
  });

  it("타이틀에서도 첫 음성의 정체를 미리 밝히지 않는다", () => {
    expect(VOICE_TITLE_SUBTITLE).not.toContain("주노");
  });

  it("N0와 N1은 익명 링크, N2부터 주노 링크를 표시한다", () => {
    expect(resolveSceneBrand("n0_review")).toBe("VOICE // LINK");
    expect(resolveSceneBrand("n1_first_voice")).toBe("VOICE // LINK");
    expect(resolveSceneBrand("n2_juno_intro")).toBe("JUNO // LINK");
  });

  it("ending 본문 뒤에 현재 전투 등급의 추가 대사만 붙인다", () => {
    const ending: EndingNode = {
      nodeId: "ending_good",
      type: "ending",
      scene: { bg: "bg_hall_day" },
      endingId: "good",
      lines: [
        { speaker: "narration", text: "GOOD" },
        { speaker: "narration", text: "기본 본문" },
      ],
      gradeVariants: {
        S: [{ speaker: "juno", text: "S 추가 대사" }],
        B: [{ speaker: "juno", text: "B 추가 대사" }],
      },
    };

    expect(resolveEndingLines(ending, "S").map(({ text }) => text)).toEqual([
      "GOOD",
      "기본 본문",
      "S 추가 대사",
    ]);
  });

  it("ending 본문을 배경 cue와 마지막 페이지 정보가 있는 문장별 페이지로 만든다", () => {
    const ending: EndingNode = {
      nodeId: "ending_good",
      type: "ending",
      scene: { bg: "bg_hall_day" },
      endingId: "good",
      lines: Array.from({ length: 7 }, (_, index) => ({
        speaker: "narration",
        text: `GOOD ${index}`,
      })),
    };

    const pages = resolveEndingPages(ending, null);

    expect(pages.map(({ sceneId }) => sceneId)).toEqual([
      "bg_hall_good",
      "bg_hall_good",
      "bg_hall_good",
      "bg_hall_good",
      "bg_hall_good",
      "bg_corridor_day",
      "bg_corridor_blacklight",
    ]);
    expect(pages.map(({ isLast }) => isLast)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it("ending 문장별 주노 표정과 GOOD 마지막 인물 미노출을 고정한다", () => {
    expect(resolveEndingVisual("good", 0)).toEqual({
      characterId: "juno",
      emotion: "happy",
    });
    expect(resolveEndingVisual("good", 5)).toEqual({
      characterId: "juno",
      emotion: "surprised",
    });
    expect(resolveEndingVisual("good", 6)).toBeNull();
    expect(resolveEndingVisual("normal", 0)?.emotion).toBe("neutral");
    expect(resolveEndingVisual("bad", 0)?.emotion).toBe("upset");
  });
});
