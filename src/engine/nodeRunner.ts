import type {
  BattleNode,
  DialogueNode,
  GameData,
  Intent,
  ScenarioNode,
} from "../data/schema";
import {
  applyBattleAction,
  createBattleState,
  overrideBattleMomentum,
  resolveCurrentPhase,
  type BattleAction,
  type BattleGrade,
  type BattleState,
} from "../battle/state";
import { transitionScene, type SceneState } from "../fsm";
import type { SaveRepository } from "../storage/saveRepository";
import {
  matchLocalIntent,
  type LocalIntentMiss,
} from "../judge/local";
import {
  parseDialogueJudgementForNode,
  type DialogueJudgementResult,
} from "../judge/schema";
import {
  evaluateIncantationAttempt,
  resolveClickIncantation,
  type IncantationResult,
} from "../judge/incantation";
import {
  applyBattleCompletion,
  applyDialogueJudgement,
  applyStoryFlags,
  applyTransformationOutcome,
  createInitialGameState,
  moveStateToNode,
  recordLlmFailure,
  recordSttTurnFailure,
  resetLlmFailures,
  setGameInputMode,
  type GameState,
  type InputMode,
  type LlmFailureResult,
  type SttFailureResult,
} from "../state";
import { selectExit } from "./branch";

export interface TurnResult {
  reply: string;
  clickLabel: string;
  advanced: boolean;
  rejectedFlags: string[];
}

export type TranscriptTurnResult =
  | (TurnResult & {
      kind: "matched";
      transcript: string;
      intentId: string;
      normalizedText: string;
      score: number;
    })
  | (LocalIntentMiss & {
      transcript: string;
    });

export type LlmTurnResult = TurnResult & {
  kind: "llm";
  transcript: string;
  intentId: string;
};

export type FallbackTurnResult = TurnResult & {
  kind: "fallback";
  transcript: string;
  intentId: string;
};

export interface BattleTurnResult {
  battleState: BattleState;
  completed: boolean;
  grade: BattleGrade | null;
  advanced: boolean;
}

function nodeScene(node: ScenarioNode, startNodeId: string): SceneState {
  if (node.nodeId === startNodeId && node.type === "cutscene") {
    return "PROLOGUE";
  }
  if (node.type === "dialogue") {
    return "DIALOGUE";
  }
  if (node.type === "cutscene") {
    return "CUTSCENE";
  }
  if (node.type === "battle") {
    return "BATTLE";
  }
  return "ENDING";
}

export class GameEngine {
  private readonly nodes: Map<string, ScenarioNode>;
  private state: GameState | null = null;
  private sceneState: SceneState = "TITLE";
  private battleState: BattleState | null = null;

  constructor(
    private readonly data: GameData,
    private readonly saves: SaveRepository,
  ) {
    this.nodes = new Map(data.scenario.map((node) => [node.nodeId, node]));
  }

  getSceneState(): SceneState {
    return this.sceneState;
  }

  getState(): GameState {
    if (!this.state) {
      throw new Error("게임이 아직 시작되지 않았습니다.");
    }
    return this.state;
  }

  getCurrentNode(): ScenarioNode {
    const state = this.getState();
    const node = this.nodes.get(state.currentNodeId);
    if (!node) {
      throw new Error(`현재 노드를 찾을 수 없습니다: ${state.currentNodeId}`);
    }
    return node;
  }

  startNewGame(inputMode: InputMode = "click"): GameState {
    this.saves.clear();
    this.battleState = null;
    this.state = setGameInputMode(
      createInitialGameState(this.data.config),
      inputMode,
    );
    this.sceneState = transitionScene("TITLE", "PROLOGUE");
    this.saves.save(this.state);
    return this.state;
  }

  setInputMode(inputMode: InputMode): GameState {
    this.state = setGameInputMode(this.getState(), inputMode);
    this.saves.save(this.state);
    return this.state;
  }

  recordSttTurnFailure(): SttFailureResult {
    const result = recordSttTurnFailure(this.getState());
    this.state = result.state;
    this.saves.save(this.state);
    return result;
  }

  recordLlmFailure(): LlmFailureResult {
    const result = recordLlmFailure(this.getState());
    this.state = result.state;
    this.saves.save(this.state);
    return result;
  }

  recordLlmSuccess(): GameState {
    this.state = resetLlmFailures(this.getState());
    this.saves.save(this.state);
    return this.state;
  }

  resume(state: GameState): GameState {
    const node = this.nodes.get(state.currentNodeId);
    if (!node) {
      throw new Error(`저장된 노드가 존재하지 않습니다: ${state.currentNodeId}`);
    }
    this.state = state;
    this.battleState = null;
    this.sceneState = transitionScene(
      "TITLE",
      nodeScene(node, this.data.config.startNodeId),
    );
    return this.state;
  }

  chooseIntent(intentId: string): TurnResult {
    const node = this.getCurrentNode();
    if (node.type !== "dialogue") {
      throw new Error("대화 노드에서만 의도를 선택할 수 있습니다.");
    }
    const intent = node.intents.find((candidate) => candidate.id === intentId);
    if (!intent) {
      throw new Error(`정의되지 않은 의도입니다: ${intentId}`);
    }

    return this.applyJudgement(node, intent, {
      intentId: intent.id,
      affinityDelta: intent.affinityDelta,
      emotion: intent.npcEmotion,
      flags: intent.setFlags,
      reply: intent.offlineReply,
    });
  }

  submitTranscript(transcript: string): TranscriptTurnResult {
    const node = this.getCurrentNode();
    if (node.type !== "dialogue") {
      throw new Error("대화 노드에서만 transcript를 판정할 수 있습니다.");
    }
    const match = matchLocalIntent(transcript, node.intents);
    if (match.kind === "unmatched") {
      return { ...match, transcript };
    }
    return {
      kind: "matched",
      transcript,
      intentId: match.intentId,
      normalizedText: match.normalizedText,
      score: match.score,
      ...this.chooseIntent(match.intentId),
    };
  }

  submitLlmJudgement(transcript: string, input: unknown): LlmTurnResult {
    const node = this.getCurrentNode();
    if (node.type !== "dialogue") {
      throw new Error("대화 노드에서만 LLM 판정을 적용할 수 있습니다.");
    }
    const judgement = parseDialogueJudgementForNode(input, node, transcript);
    const intent = node.intents.find((candidate) => candidate.id === judgement.intentId);
    if (!intent) throw new Error(`정의되지 않은 의도입니다: ${judgement.intentId}`);
    const result = this.applyJudgement(node, intent, judgement, true);
    return {
      kind: "llm",
      transcript,
      intentId: judgement.intentId,
      ...result,
    };
  }

  submitFallbackJudgement(transcript: string, reply: string): FallbackTurnResult {
    const node = this.getCurrentNode();
    if (node.type !== "dialogue") {
      throw new Error("대화 노드에서만 폴백 판정을 적용할 수 있습니다.");
    }
    const intent = [...node.intents].sort(
      (left, right) => Math.abs(left.affinityDelta) - Math.abs(right.affinityDelta),
    )[0];
    if (!intent) throw new Error("폴백에 사용할 intent가 없습니다.");
    const result = this.applyJudgement(node, intent, {
      intentId: intent.id,
      affinityDelta: 0,
      emotion: "neutral",
      flags: [],
      reply,
    });
    return {
      kind: "fallback",
      transcript,
      intentId: intent.id,
      ...result,
    };
  }

  advanceLinearNode(): GameState {
    const node = this.getCurrentNode();
    if (node.type !== "cutscene") {
      throw new Error("컷씬 노드에서만 다음 장면으로 이동할 수 있습니다.");
    }
    if (node.incantationGate) {
      throw new Error("주문 게이트가 있는 컷씬은 주문 판정 없이 이동할 수 없습니다.");
    }
    this.moveTo(node.next);
    return this.getState();
  }

  submitIncantation(transcript: string, attempt: number): IncantationResult {
    const node = this.getCurrentNode();
    if (node.type !== "cutscene" || !node.incantationGate) {
      throw new Error("주문 게이트가 있는 컷씬에서만 주문을 판정할 수 있습니다.");
    }
    const result = evaluateIncantationAttempt(transcript, node.incantationGate, attempt);
    if (result.outcome === "retry") return result;
    this.state = applyTransformationOutcome(this.getState(), result.outcome);
    this.moveTo(node.next);
    return result;
  }

  chooseIncantationFallback(): IncantationResult {
    const node = this.getCurrentNode();
    if (node.type !== "cutscene" || !node.incantationGate) {
      throw new Error("주문 게이트가 있는 컷씬에서만 클릭 주문을 선택할 수 있습니다.");
    }
    const result = resolveClickIncantation();
    this.state = applyTransformationOutcome(this.getState(), "standard");
    this.moveTo(node.next);
    return result;
  }

  getBattleState(): BattleState {
    const node = this.requireBattleNode();
    return { ...this.ensureBattleState(node) };
  }

  getCurrentBattlePhase(): BattleNode["phases"][number] {
    const node = this.requireBattleNode();
    const phase = resolveCurrentPhase(node, this.ensureBattleState(node));
    if (!phase) throw new Error("현재 battle phase를 찾을 수 없습니다.");
    return phase as BattleNode["phases"][number];
  }

  submitBattleAction(action: BattleAction): BattleTurnResult {
    const node = this.requireBattleNode();
    const battleState = applyBattleAction(node, this.ensureBattleState(node), action);
    this.battleState = battleState;
    if (!battleState.complete) {
      return {
        battleState: { ...battleState },
        completed: false,
        grade: null,
        advanced: false,
      };
    }
    if (!battleState.grade) throw new Error("종료된 전투에 등급이 없습니다.");
    this.state = applyBattleCompletion(
      this.applyBattleStoryFlags(node, battleState),
      battleState.grade,
      battleState.totalTurns,
    );
    this.moveTo(node.next);
    return {
      battleState: { ...battleState },
      completed: true,
      grade: battleState.grade,
      advanced: true,
    };
  }

  setBattleMomentumForDebug(momentum: number): BattleState {
    const node = this.requireBattleNode();
    this.battleState = overrideBattleMomentum(this.ensureBattleState(node), momentum);
    return { ...this.battleState };
  }

  completeBattleForDebug(grade: BattleGrade): GameState {
    const node = this.requireBattleNode();
    const battleState = this.ensureBattleState(node);
    this.state = applyBattleCompletion(
      this.applyBattleStoryFlags(node, battleState),
      grade,
      battleState.totalTurns,
    );
    this.moveTo(node.next);
    return this.getState();
  }

  private resolveDialogueTarget(node: DialogueNode, intent: Intent): string | null {
    if (intent.next) {
      return intent.next;
    }
    const state = this.getState();
    if (state.totalTurn >= this.data.config.totalTurnLimit) {
      return this.data.config.finalConvergenceNodeId;
    }
    if (state.nodeTurn >= node.maxTurns) {
      return selectExit(node.exitOnMaxTurns, state);
    }
    return null;
  }

  private applyJudgement(
    node: DialogueNode,
    intent: Intent,
    judgement: DialogueJudgementResult,
    resetLlmFailure = false,
  ): TurnResult {
    const applied = applyDialogueJudgement(
      resetLlmFailure ? resetLlmFailures(this.getState()) : this.getState(),
      {
        affinityDelta: judgement.affinityDelta,
        emotion: judgement.emotion,
        flags: judgement.flags,
      },
      new Set(node.allowedFlags),
    );
    this.state = applied.state;
    const target = this.resolveDialogueTarget(node, intent);
    if (target) this.moveTo(target);
    else this.saves.save(this.state);
    return {
      reply: judgement.reply,
      clickLabel: intent.clickLabel,
      advanced: target !== null,
      rejectedFlags: applied.rejectedFlags,
    };
  }

  private moveTo(nodeId: string): void {
    const target = this.nodes.get(nodeId);
    if (!target) {
      throw new Error(`이동할 노드를 찾을 수 없습니다: ${nodeId}`);
    }
    this.sceneState = transitionScene(
      this.sceneState,
      nodeScene(target, this.data.config.startNodeId),
    );
    this.state = moveStateToNode(this.getState(), nodeId);
    this.battleState = null;
    this.saves.save(this.state);
  }

  private requireBattleNode(): BattleNode {
    const node = this.getCurrentNode();
    if (node.type !== "battle") {
      throw new Error("battle 노드에서만 전투 행동을 처리할 수 있습니다.");
    }
    return node;
  }

  private ensureBattleState(node: BattleNode): BattleState {
    if (!this.battleState) {
      const storyFlow = node.storyFlow;
      const selectedPhaseOrder = storyFlow
        ? Object.entries(storyFlow.phaseOrderByFlag).find(([flag]) =>
            this.getState().flags.has(flag),
          )?.[1]
        : undefined;
      const phaseOrder = selectedPhaseOrder ?? node.phases.map(({ phaseId }) => phaseId);
      const offerSecondSpell = storyFlow
        ? storyFlow.secondSpell.eligibleFlags.some((flag) =>
            this.getState().flags.has(flag),
          )
        : false;
      this.battleState = createBattleState(
        this.getState().flags.has("perfect_transform") ? 60 : 50,
        storyFlow
          ? {
              phaseOrder,
              offerSecondSpell,
              requireSecondSpellDecision: true,
            }
          : undefined,
      );
    }
    if (!resolveCurrentPhase(node, this.battleState)) {
      throw new Error("현재 전투 페이즈 데이터가 없습니다.");
    }
    return this.battleState;
  }

  advanceEndingNode(): GameState {
    const node = this.getCurrentNode();
    if (node.type !== "ending" || !node.next) {
      throw new Error("이어지는 post-credit가 있는 엔딩에서만 이동할 수 있습니다.");
    }
    this.moveTo(node.next);
    return this.getState();
  }

  private applyBattleStoryFlags(node: BattleNode, battleState: BattleState): GameState {
    if (!node.storyFlow) return this.getState();
    const flags: string[] = [];
    if (battleState.secondSpellOpportunity) {
      flags.push(node.storyFlow.secondSpell.opportunityFlag);
    }
    for (const phaseId of battleState.successfulPhaseIds) {
      const flag = node.storyFlow.secondSpell.usedPhaseFlags[phaseId];
      if (flag) flags.push(flag);
    }
    return applyStoryFlags(this.getState(), flags);
  }
}
