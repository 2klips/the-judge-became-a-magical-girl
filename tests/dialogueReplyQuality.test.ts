import { describe, expect, it } from "vitest";
import { assertDialogueReplyQuality } from "../src/judge/schema";

describe("Juno dialogue reply quality", () => {
  it.each([
    [
      "내가 왜 그래야 돼?",
      "평가표만 넘기지 않고 끝까지 직접 확인했으니까. 네 판단을 믿었어.",
    ],
    ["어디로 움직이는데?", "저 회색 망령 앞으로 가. 먼저 무엇을 지킬지 정하자."],
    [
      "얘는 왜 나타난 거야?",
      "기대를 포기한 평가들이 뭉쳐 나타난 회색 망령이야. 끝까지 판단해야 사라져.",
    ],
    ["정면으로 맞서자", "좋아, 먼저 정면으로 맞설게. 네 선택을 믿고 따라갈게."],
    ["수당은 나와?", "수당은 없어. 대신 네가 끝까지 확인한 판단이 필요해."],
  ])("accepts a direct grounded reply for %s", (transcript, reply) => {
    expect(() => assertDialogueReplyQuality(reply, transcript)).not.toThrow();
  });

  it.each([
    ["내가 왜 그래야 돼?", "이건 이유를 묻는 거네."],
    ["어디로 움직이는데?", "왜 이동하는지 궁금하면 분명 말해 줘."],
    ["얘는 왜 나타난 거야?", "같이 얘기해보자."],
    ["어떻게 막아?", "깔끔히 정리해보자."],
    ["정면으로 맞서자", "좋아, 정면으로 맞설 연다."],
  ])("rejects meta, evasive, mismatched, or malformed reply: %s", (transcript, reply) => {
    expect(() => assertDialogueReplyQuality(reply, transcript)).toThrow(/응답 품질/);
  });
});
