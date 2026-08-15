import type { GameState, InputMode } from "../state";
import {
  isTitleMicVoiceCapable,
  type TitleMicState,
} from "./titleMicState";

export type TitleActivation =
  | { kind: "offer-start-modes" }
  | { kind: "start"; mode: InputMode }
  | { kind: "blocked-no-save" }
  | { kind: "resume"; mode: InputMode }
  | { kind: "offer-voice-resume-modes" };

export interface TitleGestureTarget {
  addEventListener(type: "pointerdown" | "keydown", listener: (event: { key?: string }) => void): void;
  removeEventListener(type: "pointerdown" | "keydown", listener: (event: { key?: string }) => void): void;
}

export function resolveTitleStart(state: TitleMicState): TitleActivation {
  if (isTitleMicVoiceCapable(state)) return { kind: "start", mode: "voice" };
  if (state === "UNKNOWN") return { kind: "offer-start-modes" };
  return { kind: "start", mode: "click" };
}

export function resolveTitleResume(
  hasSave: boolean,
  savedMode: InputMode | null,
  state: TitleMicState,
): TitleActivation {
  if (!hasSave || !savedMode) return { kind: "blocked-no-save" };
  if (savedMode === "click") return { kind: "resume", mode: "click" };
  return isTitleMicVoiceCapable(state)
    ? { kind: "resume", mode: "voice" }
    : { kind: "offer-voice-resume-modes" };
}

export function withTitleResumeMode(state: GameState, mode: InputMode): GameState {
  return { ...state, inputMode: mode };
}

export function installFirstTitleGesture(
  target: TitleGestureTarget,
  play: () => void,
): () => void {
  let active = true;
  const cleanup = (): void => {
    if (!active) return;
    active = false;
    target.removeEventListener("pointerdown", activatePointer);
    target.removeEventListener("keydown", activateKeyboard);
  };
  const activate = (): void => {
    if (!active) return;
    cleanup();
    play();
  };
  const activatePointer = (): void => activate();
  const activateKeyboard = (event: { key?: string }): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    activate();
  };
  target.addEventListener("pointerdown", activatePointer);
  target.addEventListener("keydown", activateKeyboard);
  return cleanup;
}

export function enterGameFromTitle(
  enterGame: () => void,
  disconnectMicrophone: () => Promise<void>,
): void {
  enterGame();
  void disconnectMicrophone().catch(() => undefined);
}
