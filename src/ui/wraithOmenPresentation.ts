export const WRAITH_OMEN_PRESENTATION = Object.freeze({
  sceneId: "n2_n3_wraith_omen",
  backgroundId: "bg_hall_dark",
  text: "(모니터 속 평가 문장이 한 글자씩 회색으로 번진다.)",
  durationMs: 1_100,
  actors: [] as const,
});

export function shouldPresentWraithOmen(
  fromNodeId: string,
  toNodeId: string,
  advanced: boolean,
): boolean {
  return (
    advanced &&
    fromNodeId === "n2_juno_followup" &&
    toNodeId === "n3_wraith_choice"
  );
}
