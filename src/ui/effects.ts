export type SceneEffect = "flash" | "shake" | "transform" | "fade" | "none";

export function applySceneEffect(shell: HTMLElement, effect: SceneEffect): void {
  if (effect === "none") return;
  const className = `effect-${effect}`;
  shell.classList.add(className);
  const remove = (event: AnimationEvent): void => {
    if (event.target !== shell) return;
    shell.classList.remove(className);
    shell.removeEventListener("animationend", remove);
  };
  shell.addEventListener("animationend", remove);
}
