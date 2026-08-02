import { describe, expect, it } from "vitest";
import { matchLocalIntent } from "../src/judge/local";
import { loadFixtureData } from "./fixtures";

describe("M2 로컬 intent 판정", () => {
  it("정규화된 transcript에서 유일 최고 키워드 intent를 찾는다", () => {
    const dialogue = loadFixtureData().scenario.find(
      (node) => node.type === "dialogue",
    );
    if (!dialogue || dialogue.type !== "dialogue") {
      throw new Error("fixture dialogue가 없습니다.");
    }

    const result = matchLocalIntent("새로운 게임은 재미있겠다.", dialogue.intents);

    expect(result).toMatchObject({
      kind: "matched",
      intentId: "seek_new_fun",
      normalizedText: "새로운게임은재미있겠다",
      score: 3,
    });
  });

  it("최고 점수가 동점이면 intent를 임의 선택하지 않는다", () => {
    const dialogue = loadFixtureData().scenario.find(
      (node) => node.type === "dialogue",
    );
    if (!dialogue || dialogue.type !== "dialogue") {
      throw new Error("fixture dialogue가 없습니다.");
    }

    expect(matchLocalIntent("게임 끝나면 집에 갈래.", dialogue.intents)).toMatchObject({
      kind: "unmatched",
      reason: "tie",
      candidateIds: ["seek_new_fun", "want_rest"],
    });
  });

  it("키워드 점수가 0이면 미매칭으로 반환한다", () => {
    const dialogue = loadFixtureData().scenario.find(
      (node) => node.type === "dialogue",
    );
    if (!dialogue || dialogue.type !== "dialogue") {
      throw new Error("fixture dialogue가 없습니다.");
    }

    expect(matchLocalIntent("오늘 날씨가 어때?", dialogue.intents)).toMatchObject({
      kind: "unmatched",
      reason: "no_match",
      candidateIds: [],
    });
  });
});
