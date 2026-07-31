import { describe, expect, it } from "vitest";
import {
  evaluateCondition,
  parseCondition,
  selectExit,
} from "../src/engine/branch";

describe("분기 조건 파서", () => {
  it("affinity 비교와 허용 플래그의 && 조건을 평가한다", () => {
    const state = { affinity: 72, flags: new Set(["promise"]) };
    expect(evaluateCondition("affinity >= 70 && flags.promise", state)).toBe(true);
    expect(evaluateCondition("affinity < 40", state)).toBe(false);
  });

  it("위에서 아래로 첫 조건을 고르고 마지막 default를 사용한다", () => {
    const rules = [
      { if: "affinity >= 70", next: "ending_good" },
      { if: "affinity >= 40", next: "ending_normal" },
      { default: "ending_bad" },
    ];
    expect(selectExit(rules, { affinity: 80, flags: new Set() })).toBe("ending_good");
    expect(selectExit(rules, { affinity: 50, flags: new Set() })).toBe("ending_normal");
    expect(selectExit(rules, { affinity: 20, flags: new Set() })).toBe("ending_bad");
  });

  it.each([
    "affinity >= 70 || flags.promise",
    "globalThis.alert(1)",
    "flags.promise &&",
    "affinity > 101",
    "!flags.promise",
  ])("위험하거나 알 수 없는 조건식을 거부한다: %s", (condition) => {
    expect(() => parseCondition(condition)).toThrow();
  });
});
