import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type ScenarioIntent = {
  id: string;
  offlineReply: string;
};

type ScenarioNode = {
  nodeId: string;
  lines?: Array<{ text: string }>;
  intents?: ScenarioIntent[];
};

function readText(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

function findNode(nodes: ScenarioNode[], nodeId: string): ScenarioNode {
  const node = nodes.find((candidate) => candidate.nodeId === nodeId);
  if (!node) throw new Error(`scenario node not found: ${nodeId}`);
  return node;
}

const scenario = JSON.parse(
  readText("../public/scenario/scenario.json"),
) as ScenarioNode[];
const script = readText("../docs/심사역은_마법소녀가_되었다_완성대본_v2.md");

describe("심사팀 야근 연속성", () => {
  it("N0에서 도윤과 핵심 심사팀이 함께 늦게까지 심사한다", () => {
    const runtimeText = findNode(scenario, "n0_review")
      .lines?.map((line) => line.text)
      .join(" ");

    expect(runtimeText).toContain("도윤과 동료들");
    expect(runtimeText).not.toContain("마지막까지 남은 도윤");
    expect(script).toContain("핵심 심사팀은 각자의 자리에서 계속 출품작을 확인한다.");
    expect(script).not.toContain("마지막에는 도윤의 자리 주변만 불이 켜져 있다.");
  });

  it("N4 팀 루트에서 정지한 시간 때문에 동료들이 듣지 못한다고 설명한다", () => {
    const node = findNode(scenario, "n4_team");
    const focusAction = node.intents?.find((intent) => intent.id === "focus_action");

    expect(focusAction?.offlineReply).toBe(
      "좋아, 다들 시간이 멈춰서 듣지 못해. 마음껏 외쳐!",
    );
    expect(focusAction?.offlineReply).not.toContain("주변에는 아무도 없어");
    expect(script).toContain("다들 시간이 멈춰서 듣지 못해! 마음껏 망가져도 돼!");
  });

  it("GOOD 엔딩에서 멈춘 시간이 흐르고 긴 밤 뒤 아침이 온다", () => {
    const runtimeText = findNode(scenario, "ending_good")
      .lines?.map((line) => line.text)
      .join(" ");

    expect(runtimeText).toContain("멈췄던 시간이 다시 흐른다");
    expect(runtimeText).toContain("긴 밤 끝에 아침빛이 사무실로 들어온다");
    expect(script).toContain("멈췄던 시간이 다시 흐른다.");
    expect(script).toContain("긴 밤 끝에 아침빛이 사무실 안으로 들어온다.");
  });
});
