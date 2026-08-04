import { describe, expect, it } from "vitest";
import { resolveDoyunVisual } from "../src/assets/presentationDoyun";

describe("M5 도윤 화면 노출 계약", () => {
  it("N0 첫 두 문장만 숨기고 세 번째 문장부터 도윤을 노출한다", () => {
    expect(resolveDoyunVisual({ kind: "node", nodeId: "n0_review", lineIndex: 0 })).toBeNull();
    expect(resolveDoyunVisual({ kind: "node", nodeId: "n0_review", lineIndex: 1 })).toBeNull();
    expect(resolveDoyunVisual({ kind: "node", nodeId: "n0_review", lineIndex: 2 })).toBe(
      "doyun.normal_tired",
    );
    expect(resolveDoyunVisual({ kind: "node", nodeId: "n0_review", lineIndex: 4 })).toBe(
      "doyun.normal_startled",
    );
  });

  it("일상·관계·변신 장면에 고정 표정을 배치한다", () => {
    expect(resolveDoyunVisual({ kind: "node", nodeId: "n1_first_voice" })).toBe(
      "doyun.normal_startled",
    );
    expect(resolveDoyunVisual({ kind: "node", nodeId: "n4_team" })).toBe(
      "doyun.normal_smile",
    );
    expect(
      resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", stage: "incantation" }),
    ).toBe("doyun.normal_shy");
    expect(
      resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", stage: "transformation" }),
    ).toBe("doyun.magical_pose");
  });

  it("N2 답변 의도에 맞춰 도윤의 반응 표정을 바꾼다", () => {
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n2_juno_intro",
        intentId: "curious_magic",
      }),
    ).toBe("doyun.normal_smile");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n2_juno_intro",
        intentId: "realistic_objection",
      }),
    ).toBe("doyun.normal");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n2_juno_intro",
        intentId: "reject_juno",
      }),
    ).toBe("doyun.normal_tired");
  });

  it("N2 후속 질문의 태도에 맞춰 도윤의 표정을 바꾼다", () => {
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n2_juno_followup",
        intentId: "ask_identity",
      }),
    ).toBe("doyun.normal");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n2_juno_followup",
        intentId: "ask_why_chosen",
      }),
    ).toBe("doyun.normal_shy");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n2_juno_followup",
        intentId: "stay_cold",
      }),
    ).toBe("doyun.normal_tired");
  });

  it("N3 망령 대응 태도에 맞춰 도윤의 표정을 바꾼다", () => {
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n3_wraith_choice",
        intentId: "protect_others",
      }),
    ).toBe("doyun.normal_startled");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n3_wraith_choice",
        intentId: "seek_method",
      }),
    ).toBe("doyun.normal");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n3_wraith_choice",
        intentId: "withdraw_or_agree",
      }),
    ).toBe("doyun.normal_tired");
  });

  it("N4 관계 대사의 온도에 맞춰 도윤의 표정을 바꾼다", () => {
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n4_team",
        intentId: "focus_action",
      }),
    ).toBe("doyun.normal");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n4_cooperate",
        intentId: "complain_then_help",
      }),
    ).toBe("doyun.normal_shy");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n4_awkward",
        intentId: "repair_relation",
      }),
    ).toBe("doyun.normal_smile");
    expect(
      resolveDoyunVisual({
        kind: "node",
        nodeId: "n4_awkward",
        intentId: "keep_distance",
      }),
    ).toBe("doyun.normal_tired");
  });

  it("전투 페이즈마다 전달된 방어·공격·마무리 이미지를 사용한다", () => {
    expect(resolveDoyunVisual({ kind: "battle", phaseId: "p1_defend" })).toBe(
      "doyun.magical_defend",
    );
    expect(resolveDoyunVisual({ kind: "battle", phaseId: "p2_attack" })).toBe(
      "doyun.magical_attack",
    );
    expect(resolveDoyunVisual({ kind: "battle", phaseId: "p3_answer" })).toBe(
      "doyun.magical_finish",
    );
  });

  it("엔딩 본문은 도윤을 유지하고 GOOD 복도 독백에서만 숨긴다", () => {
    expect(resolveDoyunVisual({ kind: "ending", endingId: "good", lineIndex: 4 })).toBe(
      "doyun.normal_smile",
    );
    expect(resolveDoyunVisual({ kind: "ending", endingId: "good", lineIndex: 5 })).toBeNull();
    expect(resolveDoyunVisual({ kind: "ending", endingId: "bad", lineIndex: 2 })).toBe(
      "doyun.normal_empty",
    );
  });
});
