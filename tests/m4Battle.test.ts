import { describe, expect, it } from "vitest";
import {
  applyBattleAction,
  createBattleState,
  gradeBattleMomentum,
  type BattleContract,
} from "../src/battle/state";

const battle: BattleContract = {
  phases: [
    {
      phaseId: "p1",
      spell: { requiredKeywords: ["별", "힘", "변신"], minMatch: 2 },
      maxTurns: 3,
      advanceAt: 60,
    },
    {
      phaseId: "p2",
      spell: { requiredKeywords: ["빛", "마음", "보호"], minMatch: 2 },
      maxTurns: 3,
      advanceAt: 70,
    },
    {
      phaseId: "p3",
      spell: { requiredKeywords: ["즐거움", "다시", "시작"], minMatch: 2 },
      maxTurns: 3,
      advanceAt: 80,
    },
  ],
};

describe("M4 3페이즈 언령 배틀", () => {
  it("완창 +25, 성공 +15, 내용·음량 불발 0, 자유 대응 -5..10, guard +3을 적용한다", () => {
    expect(
      applyBattleAction(battle, createBattleState(20), {
        kind: "spell",
        transcript: "별의 힘으로 변신",
      }).momentum,
    ).toBe(45);
    expect(
      applyBattleAction(battle, createBattleState(20), {
        kind: "spell",
        transcript: "별의 힘",
      }).momentum,
    ).toBe(35);
    expect(
      applyBattleAction(battle, createBattleState(20), {
        kind: "spell",
        transcript: "불발",
      }).momentum,
    ).toBe(20);
    expect(
      applyBattleAction(battle, createBattleState(20), {
        kind: "failed-spell",
        reason: "too-quiet",
      }).momentum,
    ).toBe(20);
    expect(
      applyBattleAction(battle, createBattleState(50), {
        kind: "freeform",
        momentumDelta: 99,
      }).momentum,
    ).toBe(60);
    expect(
      applyBattleAction(battle, createBattleState(20), {
        kind: "freeform",
        momentumDelta: -99,
      }).momentum,
    ).toBe(20);
    expect(
      applyBattleAction(battle, createBattleState(50), { kind: "guard" }).momentum,
    ).toBe(53);
  });

  it("momentum 65 경계에서 적 상태를 현재 값으로 파생한다", () => {
    const weakened = applyBattleAction(battle, createBattleState(62), { kind: "guard" });
    const normal = applyBattleAction(
      battle,
      { ...weakened, momentum: 65 },
      { kind: "freeform", momentumDelta: -5 },
    );

    expect(weakened.enemyState).toBe("weakened");
    expect(normal.enemyState).toBe("normal");
  });

  it("임계와 턴 상한을 동시에 충족해도 페이즈를 하나만 넘긴다", () => {
    const result = applyBattleAction(
      battle,
      { ...createBattleState(57), phaseTurn: 2, totalTurns: 2 },
      { kind: "guard" },
    );

    expect(result).toMatchObject({ phaseIndex: 1, phaseTurn: 0, totalTurns: 3 });
  });

  it("연속 불발도 하한 20을 지키며 정확히 9턴 뒤 B로 끝난다", () => {
    let state = createBattleState(20);
    for (let turn = 0; turn < 9; turn += 1) {
      state = applyBattleAction(battle, state, { kind: "spell", transcript: "불발" });
    }

    expect(state).toMatchObject({
      momentum: 20,
      phaseIndex: 2,
      phaseTurn: 3,
      totalTurns: 9,
      complete: true,
      grade: "B",
    });
    expect(() => applyBattleAction(battle, state, { kind: "guard" })).toThrow(
      "이미 종료된 전투",
    );
  });

  it("등급 경계 79/80과 54/55를 결정적으로 판정한다", () => {
    expect(gradeBattleMomentum(80)).toBe("S");
    expect(gradeBattleMomentum(79)).toBe("A");
    expect(gradeBattleMomentum(55)).toBe("A");
    expect(gradeBattleMomentum(54)).toBe("B");
  });
});
