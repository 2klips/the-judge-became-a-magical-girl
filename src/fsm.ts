export type SceneState =
  | "TITLE"
  | "PROLOGUE"
  | "DIALOGUE"
  | "CUTSCENE"
  | "ENDING";

const allowedTransitions: Record<SceneState, ReadonlySet<SceneState>> = {
  TITLE: new Set(["PROLOGUE", "DIALOGUE", "CUTSCENE", "ENDING"]),
  PROLOGUE: new Set(["DIALOGUE", "CUTSCENE", "ENDING"]),
  DIALOGUE: new Set(["DIALOGUE", "CUTSCENE", "ENDING"]),
  CUTSCENE: new Set(["DIALOGUE", "CUTSCENE", "ENDING"]),
  ENDING: new Set(),
};

export function transitionScene(from: SceneState, to: SceneState): SceneState {
  if (!allowedTransitions[from].has(to)) {
    throw new Error(`허용되지 않은 화면 전이입니다: ${from} → ${to}`);
  }
  return to;
}
