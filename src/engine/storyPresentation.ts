import type { CutsceneNode, DialogueNode } from "../data/schema";
import type { GameState } from "../state";

export function resolveDialogueOpening(
  node: DialogueNode,
  state: Pick<GameState, "flags">,
): string {
  for (const [flag, opening] of Object.entries(node.openingByFlag ?? {})) {
    if (state.flags.has(flag)) return opening;
  }
  return node.opening;
}

export function resolveCutsceneLines(
  node: CutsceneNode,
  state: Pick<GameState, "flags">,
): CutsceneNode["lines"] {
  for (const [flag, lines] of Object.entries(node.linesByFlag ?? {})) {
    if (state.flags.has(flag)) return lines;
  }
  return node.lines;
}
