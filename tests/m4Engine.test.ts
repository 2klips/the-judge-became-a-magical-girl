import { describe, expect, it } from "vitest";
import type { BattleNode, GameData } from "../src/data/schema";
import { GameEngine } from "../src/engine/nodeRunner";
import { SaveRepository, type StoragePort } from "../src/storage/saveRepository";
import { loadFixtureData } from "./fixtures";

class MemoryStorage implements StoragePort {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function m4Data(): GameData {
  const data = structuredClone(loadFixtureData()) as GameData;
  const prologue = data.scenario[0];
  if (!prologue || prologue.type !== "cutscene") throw new Error("prologue 없음");
  prologue.incantationGate = {
    displayText: "반짝이는 별의 힘이여, 지금 여기에 — 변신!",
    requiredKeywords: ["별", "힘", "변신"],
    minMatch: 2,
    maxAttempts: 2,
    failLines: [{ speaker: "juno", text: "같이 외쳐 줄게!" }],
  };
  prologue.next = "battle_trial";
  data.scenario.push({
    nodeId: "battle_trial",
    type: "battle",
    scene: { bg: "bg_hall_dark" },
    enemy: { id: "gray_wraith", name: "회색 망령" },
    phases: [1, 2, 3].map((phase) => ({
      phaseId: `p${phase}`,
      enemyPrompt: "목소리를 포기해라.",
      llmContext: "확신에 찬 긍정에 흔들린다.",
      spell: {
        displayText: "별의 힘으로 변신!",
        requiredKeywords: ["별", "힘", "변신"],
        minMatch: 2,
      },
      guardLine: "빛의 장막이 압박을 밀어낸다.",
      clickResponses: [
        { text: "포기하지 않아.", momentumDelta: 8 },
        { text: "아직 끝나지 않았어.", momentumDelta: 3 },
      ],
      maxTurns: 3,
      advanceAt: phase === 1 ? 60 : phase === 2 ? 70 : 80,
    })) as BattleNode["phases"],
    next: "ending_normal",
  });
  return data;
}

function createEngine(): GameEngine {
  const data = m4Data();
  return new GameEngine(
    data,
    new SaveRepository(
      new MemoryStorage(),
      "m4-save",
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map(({ nodeId }) => nodeId)),
    ),
  );
}

describe("M4 GameEngine 수직 흐름", () => {
  it("주문 게이트 cutscene을 일반 다음 버튼으로 우회하지 못한다", () => {
    const engine = createEngine();
    engine.startNewGame("click");
    expect(() => engine.advanceLinearNode()).toThrow("주문 게이트");
  });

  it("2회 미달은 자동 구제 뒤 battle 초기 momentum 50으로 진행한다", () => {
    const engine = createEngine();
    engine.startNewGame("voice");

    expect(engine.submitIncantation("웅얼", 1)).toMatchObject({ outcome: "retry" });
    expect(engine.getState().currentNodeId).toBe("n0_review");
    expect(engine.submitIncantation("웅얼", 2)).toMatchObject({ outcome: "rescued" });
    expect(engine.getState().playerForm).toBe("magical");
    expect(engine.getState().flags.has("perfect_transform")).toBe(false);
    expect(engine.getBattleState().momentum).toBe(50);
  });

  it("완창은 perfect_transform과 battle 초기 momentum 60을 만든다", () => {
    const engine = createEngine();
    engine.startNewGame("voice");
    engine.submitIncantation("변신, 별의 힘!", 1);

    expect(engine.getState().flags.has("perfect_transform")).toBe(true);
    expect(engine.getBattleState().momentum).toBe(60);
  });

  it("클릭 주문은 표준 변신이고 완창 플래그가 없다", () => {
    const engine = createEngine();
    engine.startNewGame("click");
    expect(engine.chooseIncantationFallback()).toMatchObject({
      outcome: "standard",
      initialMomentum: 50,
    });
    expect(engine.getBattleState().momentum).toBe(50);
  });

  it("3페이즈 완창은 S 효과를 한 번 적용하고 다음 노드로 이동한다", () => {
    const engine = createEngine();
    engine.startNewGame("voice");
    engine.submitIncantation("별 힘 변신", 1);

    engine.submitBattleAction({ kind: "spell", transcript: "별 힘 변신" });
    engine.submitBattleAction({ kind: "spell", transcript: "별 힘 변신" });
    const result = engine.submitBattleAction({ kind: "spell", transcript: "별 힘 변신" });

    expect(result).toMatchObject({ completed: true, grade: "S", advanced: true });
    expect(engine.getState()).toMatchObject({
      currentNodeId: "ending_normal",
      battleGrade: "S",
      affinity: 60,
      totalTurn: 3,
    });
    expect([...engine.getState().flags].filter((flag) => flag.startsWith("battle_"))).toEqual([
      "battle_S",
    ]);
    expect(() => engine.submitBattleAction({ kind: "guard" })).toThrow(
      "battle 노드",
    );
  });
});
