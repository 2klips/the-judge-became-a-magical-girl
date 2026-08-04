export type DoyunPresentationCue =
  | {
      readonly kind: "node";
      readonly nodeId: string;
      readonly lineIndex?: number;
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
    if (cue.endingId === "good") {
      return cue.lineIndex >= 5 ? null : "doyun.normal_smile";
    }
    if (cue.endingId === "normal") return "doyun.normal_smile";
    if (cue.endingId === "bad") return "doyun.normal_empty";
    return null;
  }

  if (cue.nodeId === "n0_review") {
    const lineIndex = cue.lineIndex ?? 0;
    if (lineIndex < 2) return null;
    return lineIndex >= 4 ? "doyun.normal_startled" : "doyun.normal_tired";
  }
  if (cue.nodeId === "n1_first_voice" || cue.nodeId === "n2_juno_intro") {
    return "doyun.normal_startled";
  }
  if (cue.nodeId === "n2_juno_followup") return "doyun.normal";
  if (cue.nodeId === "n3_wraith_choice") return "doyun.normal_startled";
  if (cue.nodeId === "n4_team") return "doyun.normal_smile";
  if (cue.nodeId === "n4_cooperate") return "doyun.normal";
  if (cue.nodeId === "n4_awkward") return "doyun.normal_shy";
  if (cue.nodeId === "n5_transform") {
    return cue.stage === "transformation" ? "doyun.magical_pose" : "doyun.normal_shy";
  }
  if (cue.nodeId === "ch3_gray_answer") return "doyun.magical_pose";
  return null;
}
