export type PresentationBackgroundCue =
  | {
      readonly kind: "node";
      readonly nodeId: string;
      readonly baseBackground: string;
      readonly lineIndex?: number;
      readonly stage?: "incantation" | "transformation";
    }
  | {
      readonly kind: "battle";
      readonly phaseId: string;
      readonly beat: "prompt" | "spell";
      readonly baseBackground: string;
    }
  | {
      readonly kind: "ending";
      readonly endingId: string;
      readonly lineIndex: number;
      readonly baseBackground: string;
    };

export function resolvePresentationBackground(
  cue: PresentationBackgroundCue,
): string {
  if (cue.kind === "battle") {
    if (cue.phaseId === "p1_defend") return "bg_battle_wide";
    return cue.baseBackground;
  }
  if (cue.kind === "ending") {
    if (cue.endingId === "good" || cue.endingId === "hidden") return "bg_hall_good";
    if (cue.endingId === "normal") return "bg_hall_normal";
    if (cue.endingId === "bad") return "bg_hall_bad";
    return cue.baseBackground;
  }
  if (cue.nodeId === "n0_review" && cue.lineIndex === 0) {
    return "bg_office_wide";
  }
  if (cue.nodeId === "n1_first_voice") {
    return "bg_hall_time_stop";
  }
  if (cue.nodeId === "n5_transform") {
    if (cue.stage === "transformation") return "bg_transform_space";
    if (cue.stage === "incantation" || (cue.lineIndex ?? 0) >= 1) {
      return "bg_desk_closeup";
    }
  }
  return cue.baseBackground;
}
