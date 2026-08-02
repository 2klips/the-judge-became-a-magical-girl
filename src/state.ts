import { z } from "zod";
import {
  emotionSchema,
  type Emotion,
  type GameConfig,
} from "./data/schema";

export type InputMode = "voice" | "click";
export type PlayerForm = "normal" | "magical";
export type BattleGrade = "S" | "A" | "B" | null;

export interface GameState {
  affinity: number;
  npcEmotion: Emotion;
  flags: Set<string>;
  playerForm: PlayerForm;
  battleGrade: BattleGrade;
  nodeTurn: number;
  totalTurn: number;
  currentNodeId: string;
  history: string[];
  inputMode: InputMode;
  sttFailCount: number;
  llmFailCount: number;
}

export interface DialogueJudgement {
  affinityDelta: number;
  emotion: Emotion;
  flags: string[];
}

export interface ApplyDialogueResult {
  state: GameState;
  rejectedFlags: string[];
}

export interface SttFailureResult {
  state: GameState;
  forcedClickMode: boolean;
}

export interface LlmFailureResult {
  state: GameState;
  forcedLocalMode: boolean;
}

const snapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    affinity: z.number().int().min(0).max(100),
    npcEmotion: emotionSchema,
    flags: z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)),
    playerForm: z.enum(["normal", "magical"]),
    battleGrade: z.enum(["S", "A", "B"]).nullable(),
    nodeTurn: z.number().int().min(0),
    totalTurn: z.number().int().min(0),
    currentNodeId: z.string().min(1),
    history: z.array(z.string().min(1)).min(1),
    inputMode: z.enum(["voice", "click"]),
    sttFailCount: z.number().int().min(0),
    llmFailCount: z.number().int().min(0),
  })
  .strict();

export type GameStateSnapshot = z.infer<typeof snapshotSchema>;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export function createInitialGameState(config: GameConfig): GameState {
  return {
    affinity: config.initialAffinity,
    npcEmotion: "neutral",
    flags: new Set<string>(),
    playerForm: "normal",
    battleGrade: null,
    nodeTurn: 0,
    totalTurn: 0,
    currentNodeId: config.startNodeId,
    history: [config.startNodeId],
    inputMode: "click",
    sttFailCount: 0,
    llmFailCount: 0,
  };
}

export function applyDialogueJudgement(
  current: GameState,
  judgement: DialogueJudgement,
  allowedFlags: ReadonlySet<string>,
): ApplyDialogueResult {
  const acceptedFlags = judgement.flags.filter((flag) => allowedFlags.has(flag));
  const rejectedFlags = judgement.flags.filter((flag) => !allowedFlags.has(flag));
  const flags = new Set(current.flags);
  acceptedFlags.forEach((flag) => flags.add(flag));
  const safeDelta = clamp(Math.trunc(judgement.affinityDelta), -3, 3);

  return {
    state: {
      ...current,
      affinity: clamp(current.affinity + safeDelta, 0, 100),
      npcEmotion: judgement.emotion,
      flags,
      nodeTurn: current.nodeTurn + 1,
      totalTurn: current.totalTurn + 1,
    },
    rejectedFlags,
  };
}

export function moveStateToNode(current: GameState, nodeId: string): GameState {
  return {
    ...current,
    currentNodeId: nodeId,
    nodeTurn: 0,
    history: [...current.history, nodeId],
  };
}

export function recordSttTurnFailure(current: GameState): SttFailureResult {
  const sttFailCount = Math.min(current.sttFailCount + 1, 5);
  const forcedClickMode = sttFailCount >= 5;
  return {
    state: {
      ...current,
      sttFailCount,
      inputMode: forcedClickMode ? "click" : current.inputMode,
    },
    forcedClickMode,
  };
}

export function setGameInputMode(
  current: GameState,
  inputMode: InputMode,
): GameState {
  return { ...current, inputMode };
}

export function recordLlmFailure(current: GameState): LlmFailureResult {
  const llmFailCount = Math.min(current.llmFailCount + 1, 3);
  return {
    state: { ...current, llmFailCount },
    forcedLocalMode: llmFailCount >= 3,
  };
}

export function resetLlmFailures(current: GameState): GameState {
  return current.llmFailCount === 0 ? current : { ...current, llmFailCount: 0 };
}

export function serializeState(state: GameState): GameStateSnapshot {
  return {
    schemaVersion: 1,
    affinity: state.affinity,
    npcEmotion: state.npcEmotion,
    flags: [...state.flags],
    playerForm: state.playerForm,
    battleGrade: state.battleGrade,
    nodeTurn: state.nodeTurn,
    totalTurn: state.totalTurn,
    currentNodeId: state.currentNodeId,
    history: [...state.history],
    inputMode: state.inputMode,
    sttFailCount: state.sttFailCount,
    llmFailCount: state.llmFailCount,
  };
}

export function parseStateSnapshot(
  input: unknown,
  allowedFlags: ReadonlySet<string>,
  knownNodeIds: ReadonlySet<string>,
): GameState | null {
  const result = snapshotSchema.safeParse(input);
  if (!result.success) {
    return null;
  }
  const snapshot = result.data;
  if (
    snapshot.flags.some((flag) => !allowedFlags.has(flag)) ||
    !knownNodeIds.has(snapshot.currentNodeId) ||
    snapshot.history.some((nodeId) => !knownNodeIds.has(nodeId))
  ) {
    return null;
  }
  return {
    affinity: snapshot.affinity,
    npcEmotion: snapshot.npcEmotion,
    flags: new Set(snapshot.flags),
    playerForm: snapshot.playerForm,
    battleGrade: snapshot.battleGrade,
    nodeTurn: snapshot.nodeTurn,
    totalTurn: snapshot.totalTurn,
    currentNodeId: snapshot.currentNodeId,
    history: [...snapshot.history],
    inputMode: snapshot.inputMode,
    sttFailCount: snapshot.sttFailCount,
    llmFailCount: snapshot.llmFailCount,
  };
}
