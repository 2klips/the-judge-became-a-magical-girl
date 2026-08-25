import { describe, expect, it } from "vitest";
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

function createEngine(): GameEngine {
  const data = loadFixtureData();
  return new GameEngine(
    data,
    new SaveRepository(
      new MemoryStorage(),
      "v31-flow",
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map(({ nodeId }) => nodeId)),
    ),
  );
}

function reachN5(engine: GameEngine, relation: "team" | "distant"): void {
  engine.startNewGame("voice");
  engine.advanceLinearNode();
  engine.chooseIntent("seek_new_fun");
  engine.chooseIntent("curious_magic");
  engine.chooseIntent("ask_why_chosen");
  engine.chooseIntent(relation === "team" ? "protect_others" : "agree_with_wraith");
  if (relation === "team") engine.advanceLinearNode();
  else engine.chooseIntent("keep_distance");
  expect(engine.getState().currentNodeId).toBe("n5_transform");
}

function completeFirstSpell(engine: GameEngine, firstIntent: string): void {
  engine.chooseIntent(firstIntent);
  expect(engine.getState().currentNodeId).toBe("battle_wraith");
  engine.submitBattleAction({ kind: "click-spell" });
}

describe("Scenario v3.1 engine route closure", () => {
  it("이전 HIDDEN 조건을 모두 만족해도 플래그를 보존한 채 GOOD으로 수렴한다", () => {
    const engine = createEngine();
    reachN5(engine, "team");
    const node = engine.getCurrentNode();
    if (node.type !== "cutscene" || !node.incantationGate) {
      throw new Error("N5 incantation gate가 없습니다.");
    }
    engine.submitIncantation(node.incantationGate.displayText, 1);
    completeFirstSpell(engine, "defend_first");
    engine.submitBattleAction({ kind: "accept-second-spell" });
    engine.submitBattleAction({ kind: "click-spell" });
    engine.chooseIntent("believe");
    engine.chooseIntent("own_spell");

    expect(engine.getState().currentNodeId).toBe("ending_good");
    expect(engine.getState().flags).toEqual(
      expect.objectContaining(
        new Set([
          "perfect_transform",
          "second_spell_opportunity",
          "defense_used",
          "attack_used",
          "n7_believe",
          "final_spell_success",
        ]),
      ),
    );
  });

  it("CYNIC이어도 N8에서 행동하고 성공하면 NORMAL로 late recovery한다", () => {
    const engine = createEngine();
    reachN5(engine, "distant");
    engine.chooseIncantationFallback();
    completeFirstSpell(engine, "attack_first");
    expect(engine.getState().currentNodeId).toBe("n7_gray_answer");
    engine.chooseIntent("cynic");
    engine.chooseIntent("default_spell");

    expect(engine.getState().currentNodeId).toBe("ending_normal");
    expect(engine.getState().flags.has("n7_cynic")).toBe(true);
    expect(engine.getState().flags.has("final_spell_success")).toBe(true);
  });

  it("N8 기술 실패는 BAD를 선택하지 않고 기존 retry/click fallback 뒤 행동을 허용한다", () => {
    const engine = createEngine();
    reachN5(engine, "distant");
    engine.chooseIncantationFallback();
    completeFirstSpell(engine, "attack_first");
    engine.chooseIntent("cynic");
    expect(engine.getState().currentNodeId).toBe("n8_final_spell");

    engine.recordSttTurnFailure();
    engine.recordSttTurnFailure();
    expect(engine.getState().currentNodeId).toBe("n8_final_spell");
    expect(engine.getState().flags.has("final_spell_success")).toBe(false);

    engine.chooseIntent("own_spell");
    expect(engine.getState().currentNodeId).toBe("ending_normal");
  });
});
