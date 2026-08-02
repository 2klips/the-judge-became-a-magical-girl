import type {
  DialogueNode,
  GameData,
  Intent,
  ScenarioNode,
} from "../data/schema";
import { transitionScene, type SceneState } from "../fsm";
import type { SaveRepository } from "../storage/saveRepository";
import {
  matchLocalIntent,
  type LocalIntentMiss,
} from "../judge/local";
import {
  applyDialogueJudgement,
  createInitialGameState,
  moveStateToNode,
  recordSttTurnFailure,
  setGameInputMode,
  type GameState,
  type InputMode,
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
  return "ENDING";
}

export class GameEngine {
  private readonly nodes: Map<string, ScenarioNode>;
  private state: GameState | null = null;
  private sceneState: SceneState = "TITLE";

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

  resume(state: GameState): GameState {
    const node = this.nodes.get(state.currentNodeId);
    if (!node) {
      throw new Error(`저장된 노드가 존재하지 않습니다: ${state.currentNodeId}`);
    }
    this.state = state;
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

    const allowedFlags = new Set(node.allowedFlags);
    const applied = applyDialogueJudgement(
      this.getState(),
      {
        affinityDelta: intent.affinityDelta,
        emotion: intent.npcEmotion,
        flags: intent.setFlags,
      },
      allowedFlags,
    );
    this.state = applied.state;

    const target = this.resolveDialogueTarget(node, intent);
    if (target) {
      this.moveTo(target);
    } else {
      this.saves.save(this.state);
    }

    return {
      reply: intent.offlineReply,
      clickLabel: intent.clickLabel,
      advanced: target !== null,
      rejectedFlags: applied.rejectedFlags,
    };
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

  advanceLinearNode(): GameState {
    const node = this.getCurrentNode();
    if (node.type !== "cutscene") {
      throw new Error("컷씬 노드에서만 다음 장면으로 이동할 수 있습니다.");
    }
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
    this.saves.save(this.state);
  }
}
