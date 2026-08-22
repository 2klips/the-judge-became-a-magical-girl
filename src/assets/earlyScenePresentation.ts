export const DIRECT_WISH_PROMPT_TEXT = "지금 가장 원하는 것을 직접 말해주세요!";

export const EARLY_SCENE_ASSET_IDS = {
  directWishPrompt: "cut.monitor_direct_wish_prompt",
  junoMonitorEmerge: "cut.juno_monitor_emerge",
} as const;

export function resolveEarlySceneBackground(
  nodeId: string,
  lineIndex?: number,
): string | null {
  if (nodeId === "n0_review" && lineIndex === 5) {
    return EARLY_SCENE_ASSET_IDS.directWishPrompt;
  }
  if (nodeId === "n1_first_voice") {
    return EARLY_SCENE_ASSET_IDS.directWishPrompt;
  }
  return null;
}

export function shouldHideDialogueOpeningForBakedPrompt(nodeId: string): boolean {
  return nodeId === "n1_first_voice";
}
