import { describe, expect, it } from "vitest";
import {
  applyBattleCompletion,
  applyTransformationOutcome,
  createInitialGameState,
} from "../src/state";
import { loadFixtureData } from "./fixtures";

describe("M4 중앙 GameState 적용", () => {
  it("완창만 magical 폼과 perfect_transform 플래그를 만든다", () => {
    const initial = createInitialGameState(loadFixtureData().config);
    const perfect = applyTransformationOutcome(initial, "perfect");
    const standard = applyTransformationOutcome(initial, "standard");
    const rescued = applyTransformationOutcome(initial, "rescued");

    expect(perfect.playerForm).toBe("magical");
    expect(perfect.flags.has("perfect_transform")).toBe(true);
    expect(standard.playerForm).toBe("magical");
    expect(standard.flags.has("perfect_transform")).toBe(false);
    expect(rescued.playerForm).toBe("magical");
    expect(rescued.flags.has("perfect_transform")).toBe(false);
  });

  it.each([
    ["S", 10],
    ["A", 5],
    ["B", 0],
  ] as const)("%s 등급을 한 플래그와 호감도 보정 %i로 적용한다", (grade, bonus) => {
    const initial = createInitialGameState(loadFixtureData().config);
    initial.flags.add("battle_A");
    const completed = applyBattleCompletion(initial, grade, 9);

    expect(completed.battleGrade).toBe(grade);
    expect(completed.affinity).toBe(50 + bonus);
    expect([...completed.flags].filter((flag) => flag.startsWith("battle_"))).toEqual([
      `battle_${grade}`,
    ]);
    expect(completed.totalTurn).toBe(9);
  });

  it("이미 등급이 적용된 상태에는 전투 종료 효과를 다시 적용하지 않는다", () => {
    const initial = createInitialGameState(loadFixtureData().config);
    const completed = applyBattleCompletion(initial, "S", 3);

    expect(() => applyBattleCompletion(completed, "S", 3)).toThrow(
      "이미 전투 등급이 적용",
    );
  });
});
