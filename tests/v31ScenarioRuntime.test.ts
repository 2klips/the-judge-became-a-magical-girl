import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { BattleNode, DialogueNode, EndingNode } from "../src/data/schema";
import { parseStateSnapshot } from "../src/state";
import { loadFixtureData } from "./fixtures";

const data = loadFixtureData();

function dialogue(nodeId: string): DialogueNode {
  const node = data.scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node || node.type !== "dialogue") throw new Error(`dialogue missing: ${nodeId}`);
  return node;
}

function battle(nodeId: string): BattleNode {
  const node = data.scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node || node.type !== "battle") throw new Error(`battle missing: ${nodeId}`);
  return node;
}

function ending(nodeId: string): EndingNode {
  const node = data.scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node || node.type !== "ending") throw new Error(`ending missing: ${nodeId}`);
  return node;
}

describe("Scenario v3.1 runtime data contract", () => {
  it("N2는 긍정 발화가 아니라 끝까지 직접 확인하는 행동을 선택 이유로 쓴다", () => {
    const reason = dialogue("n2_juno_followup").intents.find(
      ({ id }) => id === "ask_why_chosen",
    );
    expect(reason?.offlineReply).toContain("끝까지 직접");
    expect(reason?.offlineReply).not.toContain("포기하지 않았");
  });

  it("N3 네 방향을 별도 관계 플래그로 보존하고 N4 회복/거리 상태를 구분한다", () => {
    const n3 = dialogue("n3_wraith_choice");
    expect(n3.intents.map(({ id }) => id)).toEqual([
      "protect_others",
      "seek_method",
      "withdraw",
      "agree_with_wraith",
    ]);
    expect(n3.intents.map(({ setFlags }) => setFlags)).toEqual([
      ["relation_team"],
      ["relation_cooperate"],
      ["relation_awkward"],
      ["relation_awkward"],
    ]);

    const awkward = dialogue("n4_awkward");
    expect(awkward.intents.map(({ setFlags }) => setFlags)).toEqual([
      ["relation_recovered"],
      ["relation_distant"],
    ]);
  });

  it("N6 첫 선택은 방어/공격이고 dual intent도 첫 행동 순서를 명시한다", () => {
    const firstChoice = dialogue("n6_first_choice");
    expect(firstChoice.intents.map(({ id }) => id)).toEqual([
      "defend_first",
      "attack_first",
      "protect_then_confront",
    ]);
    expect(firstChoice.intents[2]?.setFlags).toEqual([
      "first_action_defend",
      "dual_intent",
    ]);

    const n6 = battle("battle_wraith");
    expect(n6.phases.map(({ phaseId }) => phaseId)).toEqual([
      "p1_defend",
      "p2_attack",
    ]);
    expect(n6.storyFlow).toEqual({
      phaseOrderByFlag: {
        first_action_defend: ["p1_defend", "p2_attack"],
        first_action_attack: ["p2_attack", "p1_defend"],
      },
      secondSpell: {
        eligibleFlags: [
          "relation_team",
          "relation_cooperate",
          "relation_recovered",
          "dual_intent",
        ],
        opportunityFlag: "second_spell_opportunity",
        usedPhaseFlags: {
          p1_defend: "defense_used",
          p2_attack: "attack_used",
        },
      },
    });
  });

  it("N7 BELIEVE/POSSIBILITY/CYNIC 의미 경계와 N8 성공/거절 route를 고정한다", () => {
    const n7 = dialogue("n7_gray_answer");
    expect(n7.intents.map(({ id }) => id)).toEqual([
      "believe",
      "possibility",
      "cynic",
    ]);
    expect(n7.intents[0]?.examples.join(" ")).toContain("끝까지");
    expect(n7.intents[0]?.examples.join(" ")).toContain("내가 판단");
    expect(n7.intents[1]?.examples.join(" ")).toContain("한 번 더");
    expect(n7.intents[1]?.examples.join(" ")).not.toContain("끝까지");

    const n8 = dialogue("n8_final_spell");
    expect(n8.intents.map(({ id }) => id)).toEqual([
      "default_spell",
      "own_spell",
      "narrative_refusal",
    ]);
    expect(n8.intents[2]?.next).toBe("ending_bad");
    expect(n8.exitOnMaxTurns).toEqual([
      {
        if: "flags.perfect_transform && flags.second_spell_opportunity && flags.defense_used && flags.attack_used && flags.n7_believe && flags.final_spell_success",
        next: "ending_hidden",
      },
      {
        if: "flags.n7_believe && flags.final_spell_success",
        next: "ending_good",
      },
      { default: "ending_normal" },
    ]);
  });

  it("제출판의 GOOD/HIDDEN/NORMAL/BAD는 모두 terminal ending이다", () => {
    expect(ending("ending_good").next).toBeUndefined();
    expect(ending("ending_hidden").next).toBeUndefined();
    expect(ending("ending_normal").next).toBeUndefined();
    expect(ending("ending_bad").next).toBeUndefined();
    expect(data.scenario.some(({ nodeId }) => nodeId === "post_credit")).toBe(false);
  });

  it("기술적 음성 실패는 N8 narrative_refusal intent를 자동 선택하는 데이터 경로가 없다", () => {
    const source = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/onTurnFailed[\s\S]{0,240}narrative_refusal/);
    expect(source).not.toMatch(/onUnavailable[\s\S]{0,240}narrative_refusal/);
  });

  it("v3.1 신규 플래그가 없는 schema-v1 저장도 그대로 복구한다", () => {
    const oldSnapshot = {
      schemaVersion: 1,
      affinity: 50,
      npcEmotion: "neutral",
      flags: [],
      playerForm: "normal",
      battleGrade: null,
      nodeTurn: 0,
      totalTurn: 0,
      currentNodeId: "n0_review",
      history: ["n0_review"],
      inputMode: "click",
      sttFailCount: 0,
      llmFailCount: 0,
    };
    expect(
      parseStateSnapshot(
        oldSnapshot,
        new Set(data.config.allowedFlags),
        new Set(data.scenario.map(({ nodeId }) => nodeId)),
      ),
    ).toMatchObject({ currentNodeId: "n0_review", battleGrade: null });
  });

  it("v2 ch3_gray_answer 저장은 schema-v1을 유지한 채 v3.1 N7로 복구한다", () => {
    const oldSnapshot = {
      schemaVersion: 1,
      affinity: 60,
      npcEmotion: "neutral",
      flags: ["promise"],
      playerForm: "magical",
      battleGrade: "A",
      nodeTurn: 1,
      totalTurn: 12,
      currentNodeId: "ch3_gray_answer",
      history: ["n0_review", "battle_wraith", "ch3_gray_answer"],
      inputMode: "voice",
      sttFailCount: 2,
      llmFailCount: 0,
    };

    expect(
      parseStateSnapshot(
        oldSnapshot,
        new Set(data.config.allowedFlags),
        new Set(data.scenario.map(({ nodeId }) => nodeId)),
      ),
    ).toMatchObject({
      currentNodeId: "n7_gray_answer",
      history: ["n0_review", "battle_wraith", "n7_gray_answer"],
      battleGrade: "A",
      inputMode: "voice",
      sttFailCount: 2,
    });
  });
});
