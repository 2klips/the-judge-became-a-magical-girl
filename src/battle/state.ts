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
}

export type BattleAction =
  | { kind: "spell"; transcript: string }
  | { kind: "failed-spell"; reason: "too-quiet" | "too-loud" }
  | { kind: "click-spell" }
  | { kind: "freeform"; momentumDelta: number }
  | { kind: "guard" };

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export function createBattleState(initialMomentum: number): BattleState {
  const momentum = clamp(Math.trunc(initialMomentum), 20, 100);
  return {
    momentum,
    phaseIndex: 0,
    phaseTurn: 0,
    totalTurns: 0,
    enemyState: enemyStateFor(momentum),
    complete: false,
    grade: null,
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
  const phase = battle.phases[current.phaseIndex];
  if (!phase) {
    throw new Error(`전투 페이즈를 찾을 수 없습니다: ${current.phaseIndex}`);
  }

  const momentum = clamp(current.momentum + actionDelta(action, phase), 20, 100);
  const phaseTurn = current.phaseTurn + 1;
  const totalTurns = current.totalTurns + 1;
  const shouldAdvance = momentum >= phase.advanceAt || phaseTurn >= phase.maxTurns;
  const finalPhase = current.phaseIndex === battle.phases.length - 1;

  if (shouldAdvance && finalPhase) {
    return {
      momentum,
      phaseIndex: current.phaseIndex,
      phaseTurn,
      totalTurns,
      enemyState: enemyStateFor(momentum),
      complete: true,
      grade: gradeBattleMomentum(momentum),
    };
  }
  return {
    momentum,
    phaseIndex: shouldAdvance ? current.phaseIndex + 1 : current.phaseIndex,
    phaseTurn: shouldAdvance ? 0 : phaseTurn,
    totalTurns,
    enemyState: enemyStateFor(momentum),
    complete: false,
    grade: null,
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

function enemyStateFor(momentum: number): EnemyState {
  return momentum >= 65 ? "weakened" : "normal";
}
