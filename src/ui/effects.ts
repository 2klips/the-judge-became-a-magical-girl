export type SceneEffect = "flash" | "shake" | "transform" | "none";

export function applySceneEffect(shell: HTMLElement, effect: SceneEffect): void {
  if (effect !== "none") shell.classList.add(`effect-${effect}`);
}
