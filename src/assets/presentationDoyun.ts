export type DoyunPresentationCue =
  | {
      readonly kind: "node";
      readonly nodeId: string;
      readonly lineIndex?: number;
      readonly intentId?: string;
      readonly stage?: "incantation" | "transformation";
    }
  | {
      readonly kind: "battle";
      readonly phaseId: string;
    }
  | {
      readonly kind: "ending";
      readonly endingId: string;
      readonly lineIndex: number;
    };

export function resolveDoyunVisual(cue: DoyunPresentationCue): string | null {
  if (cue.kind === "battle") {
    if (cue.phaseId === "p1_defend") return "doyun.magical_defend";
    if (cue.phaseId === "p2_attack") return "doyun.magical_attack";
    return "doyun.magical_finish";
  }
  if (cue.kind === "ending") {
    if (cue.endingId === "good" || cue.endingId === "hidden") {
      return "doyun.normal_smile";
    }
    if (cue.endingId === "normal") return "doyun.normal_smile";
    if (cue.endingId === "bad") return "doyun.normal_empty";
    return null;
  }

  if (cue.nodeId === "n0_review") {
    const lineIndex = cue.lineIndex ?? 0;
    if (lineIndex < 2) return null;
    return "doyun.normal_tired";
  }
  if (cue.nodeId === "n1_first_voice") return "doyun.normal";
  if (cue.nodeId === "n2_juno_intro") {
    if (cue.intentId === "curious_magic") return "doyun.normal_smile";
    if (cue.intentId === "realistic_objection") return "doyun.normal";
    if (cue.intentId === "reject_juno") return "doyun.normal_tired";
    return "doyun.normal_startled";
  }
  if (cue.nodeId === "n2_juno_followup") {
    if (cue.intentId === "stay_cold") return "doyun.normal_tired";
    return "doyun.normal";
  }
  if (cue.nodeId === "n3_wraith_choice") {
    if (cue.intentId === "protect_others" || cue.intentId === "seek_method") {
      return "doyun.normal";
    }
    if (cue.intentId === "withdraw" || cue.intentId === "agree_with_wraith") {
      return "doyun.normal_tired";
    }
    return "doyun.normal_startled";
  }
  if (cue.nodeId === "n4_team") {
    return cue.intentId === "focus_action" ? "doyun.normal" : "doyun.normal_smile";
  }
  if (cue.nodeId === "n4_cooperate") {
    return "doyun.normal";
  }
  if (cue.nodeId === "n4_awkward") {
    if (cue.intentId === "repair_relation") return "doyun.normal_smile";
    if (cue.intentId === "keep_distance") return "doyun.normal_tired";
    return "doyun.normal";
  }
  if (cue.nodeId === "n5_transform") {
    if (cue.stage === "transformation") return "doyun.magical_pose";
    if (cue.stage === "incantation") return "doyun.normal";
    return cue.lineIndex === 0 ? "doyun.normal_startled" : "doyun.normal";
  }
  if (cue.nodeId === "n6_first_choice") return "doyun.magical_pose";
  if (cue.nodeId === "n7_gray_answer" || cue.nodeId === "n8_final_spell") {
    return "doyun.magical_finish";
  }
  return null;
}
