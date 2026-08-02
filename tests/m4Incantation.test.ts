import { describe, expect, it } from "vitest";
import {
  evaluateIncantationAttempt,
  normalizeIncantation,
  resolveClickIncantation,
} from "../src/judge/incantation";

const gate = {
  displayText: "반짝이는 별의 힘이여, 지금 여기에 — 변신!",
  requiredKeywords: ["별", "힘", "변신"],
  minMatch: 2,
  maxAttempts: 2,
  failLines: [
    { speaker: "juno", text: "괜찮아, 내가 같이 외쳐 줄게." },
  ],
} as const;

describe("M4 변신 주문 판정", () => {
  it("NFC로 합치고 공백·문장부호를 제거한다", () => {
    expect(normalizeIncantation(" 별, 힘!  변신? ")).toBe("별힘변신");
  });

  it("키워드 순서와 문장부호에 관계없이 전부 포함하면 완창이다", () => {
    const result = evaluateIncantationAttempt(
      "변신! 지금 여기에 별의 힘!",
      gate,
      1,
    );

    expect(result).toMatchObject({
      outcome: "perfect",
      matchedKeywords: ["별", "힘", "변신"],
      matchCount: 3,
      initialMomentum: 60,
    });
  });

  it("minMatch 경계는 표준 성공이고 마지막 미달은 자동 구제다", () => {
    expect(evaluateIncantationAttempt("별의 힘", gate, 1)).toMatchObject({
      outcome: "standard",
      matchCount: 2,
      initialMomentum: 50,
    });
    expect(evaluateIncantationAttempt("웅얼웅얼", gate, 1)).toMatchObject({
      outcome: "retry",
      matchCount: 0,
    });
    expect(evaluateIncantationAttempt("웅얼웅얼", gate, 2)).toMatchObject({
      outcome: "rescued",
      matchCount: 0,
      initialMomentum: 50,
    });
  });

  it("클릭은 완창 플래그 없는 표준 변신이다", () => {
    expect(resolveClickIncantation()).toEqual({
      outcome: "standard",
      matchedKeywords: [],
      matchCount: 0,
      attempt: 0,
      initialMomentum: 50,
    });
  });
});
