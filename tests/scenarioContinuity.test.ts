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
  linesByFlag?: Record<string, Array<{ text: string }>>;
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

function sectionLines(lines: string[], startHeading: string, endHeading: string): string[] {
  const start = lines.indexOf(startHeading);
  const end = lines.indexOf(endHeading);
  if (start < 0 || end <= start) {
    throw new Error(`script section not found: ${startHeading}`);
  }
  return lines.slice(start + 1, end);
}

const scenario = JSON.parse(
  readText("../public/scenario/scenario.json"),
) as ScenarioNode[];
const script = readText("../docs/심사역은_마법소녀가_되었다_완성대본_v3.md");
const scriptLines = script.split(/\r?\n/).map((line) => line.trimEnd());

describe("심사팀 야근 연속성", () => {
  it("N0에서 도윤과 핵심 심사팀이 함께 늦게까지 심사한다", () => {
    const node = findNode(scenario, "n0_review");
    const runtimeText = node.lines?.map((line) => line.text).join(" ");

    expect(node.lines?.[0]?.text).toBe(
      "늦은 밤, 도윤과 동료들의 모니터에 평가표가 이어진다.",
    );
    expect(runtimeText).not.toContain("마지막까지 남은 도윤");
    const n0Lines = sectionLines(
      scriptLines,
      "# N0. 반복되는 심사",
      "# N1. 첫 번째 목소리",
    );
    expect(n0Lines).toContain("늦은 밤의 사무실. 여러 심사역이 각자 출품작을 확인한다.");
    expect(n0Lines).toContain("happy_break_v0.3");
  });

  it("N4 팀 루트에서 정지한 시간 때문에 동료들이 듣지 못한다고 설명한다", () => {
    const node = findNode(scenario, "n5_transform");
    const relationLines = node.linesByFlag?.relation_team;

    expect(relationLines?.at(-1)?.text).toBe(
      "다들 시간이 멈춰서 듣지 못해! 마음껏 망가져도 돼!",
    );
    const n5Lines = sectionLines(scriptLines, "# N5. 변신", "# N6. 전투");
    const n5QuoteText = n5Lines.map((line) => line.replace(/^>\s?/, ""));

    expect(n5Lines).toContain("> 다들 시간이 멈춰서 듣지 못해! 마음껏 망가져도 돼!");
    expect(n5QuoteText).toContain("다들 시간이 멈춰서 듣지 못해! 마음껏 망가져도 돼!");
    expect(n5QuoteText).not.toContain("주변에는 아무도 없어! 마음껏 망가져도 돼!");
  });

  it("GOOD 엔딩에서 멈춘 시간이 흐르고 긴 밤 뒤 아침이 온다", () => {
    const node = findNode(scenario, "ending_good");

    expect(node.lines?.[0]?.text).toBe("GOOD — 끝까지 보고 판단하기");
    expect(node.lines?.[1]?.text).toBe(
      "멈췄던 시간이 흐르고 긴 밤 끝에 아침빛이 사무실로 들어온다.",
    );

    const goodLines = sectionLines(
      scriptLines,
      "# 엔딩 A. GOOD — 끝까지 보고 판단하기",
      "# 엔딩 B. NORMAL — 한 번만 더",
    );
    expect(goodLines).toContain(
      "멈췄던 시간이 다시 흐른다. 긴 밤 끝에 아침빛이 사무실 안으로 들어온다.",
    );
  });
});
