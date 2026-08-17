export type SceneState =
  | "TITLE"
  | "PROLOGUE"
  | "DIALOGUE"
  | "CUTSCENE"
  | "BATTLE"
  | "ENDING";

const allowedTransitions: Record<SceneState, ReadonlySet<SceneState>> = {
  TITLE: new Set(["PROLOGUE", "DIALOGUE", "CUTSCENE", "BATTLE", "ENDING"]),
  PROLOGUE: new Set(["DIALOGUE", "CUTSCENE", "BATTLE", "ENDING"]),
  DIALOGUE: new Set(["DIALOGUE", "CUTSCENE", "BATTLE", "ENDING"]),
  CUTSCENE: new Set(["DIALOGUE", "CUTSCENE", "BATTLE", "ENDING"]),
  BATTLE: new Set(["DIALOGUE", "CUTSCENE", "ENDING"]),
  ENDING: new Set(["ENDING"]),
};

export function transitionScene(from: SceneState, to: SceneState): SceneState {
  if (!allowedTransitions[from].has(to)) {
    throw new Error(`허용되지 않은 화면 전이입니다: ${from} → ${to}`);
  }
  return to;
}
