import { describe, expect, it } from "vitest";
import type { CutsceneNode, DialogueNode } from "../src/data/schema";
import {
  resolveCutsceneLines,
  resolveDialogueOpening,
} from "../src/engine/storyPresentation";
import { loadFixtureData } from "./fixtures";

const data = loadFixtureData();

function cutscene(nodeId: string): CutsceneNode {
  const node = data.scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node || node.type !== "cutscene") throw new Error(`cutscene missing: ${nodeId}`);
  return node;
}

function dialogue(nodeId: string): DialogueNode {
  const node = data.scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node || node.type !== "dialogue") throw new Error(`dialogue missing: ${nodeId}`);
  return node;
}

describe("Scenario v3.1 relationship presentation", () => {
  it.each([
    ["relation_team", "다들 시간이 멈춰서"],
    ["relation_cooperate", "불평은 변신한 다음에"],
    ["relation_recovered", "이번에는 같이 하자"],
    ["relation_distant", "따라오기만 해"],
  ])("N5에서 %s 관계 톤을 유지한다", (flag, expected) => {
    expect(
      resolveCutsceneLines(cutscene("n5_transform"), {
        flags: new Set([flag]),
      })
        .map(({ text }) => text)
        .join(" "),
    ).toContain(expected);
  });

  it.each([
    ["relation_team", "이번엔 내가 답 안 할게"],
    ["relation_cooperate", "정답은 없어"],
    ["relation_recovered", "아까처럼 서두르지 않을게"],
    ["relation_distant", "네 말을 먼저 들을게"],
  ])("N7에서 %s 관계 callback을 회수한다", (flag, expected) => {
    expect(
      resolveDialogueOpening(dialogue("n7_gray_answer"), {
        flags: new Set([flag]),
      }),
    ).toContain(expected);
  });
});
