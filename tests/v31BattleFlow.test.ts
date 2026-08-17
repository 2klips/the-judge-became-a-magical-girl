import { describe, expect, it } from "vitest";
import {
  applyBattleAction,
  createBattleState,
  type BattleContract,
} from "../src/battle/state";

const battle: BattleContract = {
  phases: [
    {
      phaseId: "p1_defend",
      spell: { requiredKeywords: ["구름", "감싸", "프로텍션"], minMatch: 2 },
      maxTurns: 2,
      advanceAt: 60,
    },
    {
      phaseId: "p2_attack",
      spell: { requiredKeywords: ["별빛", "밝혀", "브레이크"], minMatch: 2 },
      maxTurns: 2,
      advanceAt: 70,
    },
  ],
};

describe("Scenario v3.1 conditional second spell reducer", () => {
  it("방어/공격 중 선택한 phase를 첫 행동으로 사용한다", () => {
    expect(
      createBattleState(50, {
        phaseOrder: ["p2_attack", "p1_defend"],
        offerSecondSpell: true,
        requireSecondSpellDecision: true,
      }).phaseOrder,
    ).toEqual(["p2_attack", "p1_defend"]);
  });

  it("첫 주문 실패는 관계와 무관하게 두 번째 주문 기회를 열지 않는다", () => {
    let state = createBattleState(50, {
      phaseOrder: ["p1_defend", "p2_attack"],
      offerSecondSpell: true,
      requireSecondSpellDecision: true,
    });
    state = applyBattleAction(battle, state, { kind: "spell", transcript: "불발" });
    state = applyBattleAction(battle, state, { kind: "spell", transcript: "불발" });

    expect(state).toMatchObject({
      complete: true,
      awaitingSecondSpellChoice: false,
      secondSpellOpportunity: false,
      successfulPhaseIds: [],
    });
  });

  it("첫 주문 성공과 관계/dual eligibility가 함께 있을 때만 선택 기회를 연다", () => {
    const state = applyBattleAction(
      battle,
      createBattleState(50, {
        phaseOrder: ["p1_defend", "p2_attack"],
        offerSecondSpell: true,
        requireSecondSpellDecision: true,
      }),
      { kind: "click-spell" },
    );

    expect(state).toMatchObject({
      complete: false,
      awaitingSecondSpellChoice: true,
      secondSpellOpportunity: true,
      successfulPhaseIds: ["p1_defend"],
    });
  });

  it("기회를 거절하면 턴을 소모하지 않고 전투를 끝낸다", () => {
    const waiting = applyBattleAction(
      battle,
      createBattleState(50, {
        phaseOrder: ["p1_defend", "p2_attack"],
        offerSecondSpell: true,
        requireSecondSpellDecision: true,
      }),
      { kind: "click-spell" },
    );
    const declined = applyBattleAction(battle, waiting, {
      kind: "decline-second-spell",
    });

    expect(declined).toMatchObject({
      complete: true,
      totalTurns: waiting.totalTurns,
      successfulPhaseIds: ["p1_defend"],
      secondSpellOpportunity: true,
    });
  });

  it("기회를 수락한 뒤 반대 주문에 성공해야 두 phase 사용으로 기록한다", () => {
    const waiting = applyBattleAction(
      battle,
      createBattleState(50, {
        phaseOrder: ["p2_attack", "p1_defend"],
        offerSecondSpell: true,
        requireSecondSpellDecision: true,
      }),
      { kind: "click-spell" },
    );
    const accepted = applyBattleAction(battle, waiting, {
      kind: "accept-second-spell",
    });
    const completed = applyBattleAction(battle, accepted, { kind: "click-spell" });

    expect(accepted).toMatchObject({ phaseIndex: 1, phaseTurn: 0, totalTurns: 1 });
    expect(completed).toMatchObject({
      complete: true,
      successfulPhaseIds: ["p2_attack", "p1_defend"],
    });
  });
});

