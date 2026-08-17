import { normalizeIncantation } from "../judge/incantation";

export type BattleGrade = "S" | "A" | "B";
export type EnemyState = "normal" | "weakened";

export interface BattleSpellContract {
  requiredKeywords: readonly string[];
  minMatch: number;
}

export interface BattlePhaseContract {
  phaseId: string;
  spell: BattleSpellContract;
  maxTurns: number;
  advanceAt: number;
}

export interface BattleContract {
  phases: readonly BattlePhaseContract[];
}

export interface BattleState {
  momentum: number;
  phaseIndex: number;
  phaseTurn: number;
  totalTurns: number;
  enemyState: EnemyState;
  complete: boolean;
  grade: BattleGrade | null;
  phaseOrder: string[];
  successfulPhaseIds: string[];
  awaitingSecondSpellChoice: boolean;
  secondSpellOpportunity: boolean;
  offerSecondSpell: boolean;
  requireSecondSpellDecision: boolean;
}

export interface BattlePlan {
  phaseOrder: readonly string[];
  offerSecondSpell: boolean;
  requireSecondSpellDecision: boolean;
}

export type BattleAction =
  | { kind: "spell"; transcript: string }
  | { kind: "failed-spell"; reason: "too-quiet" | "too-loud" }
  | { kind: "click-spell" }
  | { kind: "freeform"; momentumDelta: number }
  | { kind: "guard" }
  | { kind: "accept-second-spell" }
  | { kind: "decline-second-spell" };

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export function createBattleState(
  initialMomentum: number,
  plan?: BattlePlan,
): BattleState {
  const momentum = clamp(Math.trunc(initialMomentum), 20, 100);
  return {
    momentum,
    phaseIndex: 0,
    phaseTurn: 0,
    totalTurns: 0,
    enemyState: enemyStateFor(momentum),
    complete: false,
    grade: null,
    phaseOrder: [...(plan?.phaseOrder ?? [])],
    successfulPhaseIds: [],
    awaitingSecondSpellChoice: false,
    secondSpellOpportunity: false,
    offerSecondSpell: plan?.offerSecondSpell ?? false,
    requireSecondSpellDecision: plan?.requireSecondSpellDecision ?? false,
  };
}

export function applyBattleAction(
  battle: BattleContract,
  current: BattleState,
  action: BattleAction,
): BattleState {
  if (current.complete) {
    throw new Error("이미 종료된 전투입니다.");
  }
  if (action.kind === "accept-second-spell") {
    if (!current.awaitingSecondSpellChoice) {
      throw new Error("두 번째 주문 선택 상태가 아닙니다.");
    }
    return {
      ...current,
      phaseIndex: current.phaseIndex + 1,
      phaseTurn: 0,
      awaitingSecondSpellChoice: false,
    };
  }
  if (action.kind === "decline-second-spell") {
    if (!current.awaitingSecondSpellChoice) {
      throw new Error("두 번째 주문 선택 상태가 아닙니다.");
    }
    return completeBattle(current, current.momentum);
  }
  if (current.awaitingSecondSpellChoice) {
    throw new Error("두 번째 주문 사용 여부를 먼저 선택해야 합니다.");
  }

  const phase = resolveCurrentPhase(battle, current);
  if (!phase) {
    throw new Error(`전투 페이즈를 찾을 수 없습니다: ${current.phaseIndex}`);
  }

  const delta = actionDelta(action, phase);
  const momentum = clamp(current.momentum + delta, 20, 100);
  const phaseTurn = current.phaseTurn + 1;
  const totalTurns = current.totalTurns + 1;
  const phaseSucceeded =
    (action.kind === "spell" || action.kind === "click-spell") && delta >= 15;
  const shouldAdvance =
    momentum >= phase.advanceAt ||
    phaseTurn >= phase.maxTurns ||
    (current.requireSecondSpellDecision && phaseSucceeded);
  const successfulPhaseIds = phaseSucceeded
    ? [...new Set([...current.successfulPhaseIds, phase.phaseId])]
    : current.successfulPhaseIds;
  const phaseOrder = effectivePhaseOrder(battle, current);
  const finalPhase = current.phaseIndex === phaseOrder.length - 1;

  if (shouldAdvance && finalPhase) {
    return completeBattle(
      { ...current, phaseTurn, totalTurns, successfulPhaseIds },
      momentum,
    );
  }
  if (shouldAdvance && current.requireSecondSpellDecision && current.phaseIndex === 0) {
    if (successfulPhaseIds.includes(phase.phaseId) && current.offerSecondSpell) {
      return {
        ...current,
        momentum,
        phaseTurn,
        totalTurns,
        enemyState: enemyStateFor(momentum),
        successfulPhaseIds,
        awaitingSecondSpellChoice: true,
        secondSpellOpportunity: true,
      };
    }
    return completeBattle(
      { ...current, phaseTurn, totalTurns, successfulPhaseIds },
      momentum,
    );
  }
  return {
    ...current,
    momentum,
    phaseIndex: shouldAdvance ? current.phaseIndex + 1 : current.phaseIndex,
    phaseTurn: shouldAdvance ? 0 : phaseTurn,
    totalTurns,
    enemyState: enemyStateFor(momentum),
    complete: false,
    grade: null,
    successfulPhaseIds,
  };
}

export function gradeBattleMomentum(momentum: number): BattleGrade {
  if (momentum >= 80) return "S";
  if (momentum >= 55) return "A";
  return "B";
}

export function overrideBattleMomentum(
  current: BattleState,
  momentum: number,
): BattleState {
  if (current.complete) {
    throw new Error("이미 종료된 전투입니다.");
  }
  const safeMomentum = clamp(Math.trunc(momentum), 20, 100);
  return {
    ...current,
    momentum: safeMomentum,
    enemyState: enemyStateFor(safeMomentum),
  };
}

function actionDelta(action: BattleAction, phase: BattlePhaseContract): number {
  if (action.kind === "accept-second-spell" || action.kind === "decline-second-spell") {
    return 0;
  }
  if (action.kind === "failed-spell") return 0;
  if (action.kind === "guard") return 3;
  if (action.kind === "click-spell") return 15;
  if (action.kind === "freeform") return clamp(Math.trunc(action.momentumDelta), -5, 10);

  const transcript = normalizeIncantation(action.transcript);
  const matchCount = phase.spell.requiredKeywords.filter((keyword) =>
    transcript.includes(normalizeIncantation(keyword)),
  ).length;
  if (matchCount === phase.spell.requiredKeywords.length) return 25;
  if (matchCount >= phase.spell.minMatch) return 15;
  return 0;
}

function effectivePhaseOrder(
  battle: BattleContract,
  state: BattleState,
): readonly string[] {
  return state.phaseOrder?.length > 0
    ? state.phaseOrder
    : battle.phases.map(({ phaseId }) => phaseId);
}

export function resolveCurrentPhase(
  battle: BattleContract,
  state: BattleState,
): BattlePhaseContract | undefined {
  const phaseId = effectivePhaseOrder(battle, state)[state.phaseIndex];
  return battle.phases.find((phase) => phase.phaseId === phaseId);
}

function completeBattle(current: BattleState, momentum: number): BattleState {
  return {
    ...current,
    momentum,
    enemyState: enemyStateFor(momentum),
    complete: true,
    grade: gradeBattleMomentum(momentum),
    awaitingSecondSpellChoice: false,
  };
}

function enemyStateFor(momentum: number): EnemyState {
  return momentum >= 65 ? "weakened" : "normal";
}
