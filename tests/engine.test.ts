import { describe, expect, it } from "vitest";
import type { GameData } from "../src/data/schema";
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

function createEngine(data: GameData = loadFixtureData()): GameEngine {
  return new GameEngine(
    data,
    new SaveRepository(
      new MemoryStorage(),
      "save",
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map((node) => node.nodeId)),
    ),
  );
}

function reachDialogue(engine: GameEngine): void {
  engine.startNewGame();
  engine.advanceLinearNode();
  expect(engine.getCurrentNode().type).toBe("dialogue");
}

function completePath(intentId: string): GameEngine {
  const engine = createEngine();
  reachDialogue(engine);
  for (let turn = 0; turn < 7; turn += 1) {
    engine.chooseIntent(intentId);
  }
  expect(engine.getCurrentNode().type).toBe("cutscene");
  engine.advanceLinearNode();
  return engine;
}

describe("M1 node runner", () => {
  it("한 클릭을 상태와 턴에 한 번만 반영한다", () => {
    const engine = createEngine();
    reachDialogue(engine);
    engine.chooseIntent("accept_magic");

    expect(engine.getState().affinity).toBe(53);
    expect(engine.getState().nodeTurn).toBe(1);
    expect(engine.getState().totalTurn).toBe(1);
    expect(engine.getState().flags.has("promise")).toBe(true);
  });

  it("긍정 7회로 GOOD 엔딩에 도달한다", () => {
    const engine = completePath("accept_magic");
    const node = engine.getCurrentNode();
    expect(node.type === "ending" ? node.endingId : null).toBe("good");
    expect(engine.getState().affinity).toBe(71);
  });

  it("중립 7회로 NORMAL 엔딩에 도달한다", () => {
    const engine = completePath("ask_conditions");
    const node = engine.getCurrentNode();
    expect(node.type === "ending" ? node.endingId : null).toBe("normal");
    expect(engine.getState().affinity).toBe(50);
  });

  it("부정 7회로 BAD 엔딩에 도달한다", () => {
    const engine = completePath("refuse_magic");
    const node = engine.getCurrentNode();
    expect(node.type === "ending" ? node.endingId : null).toBe("bad");
    expect(engine.getState().affinity).toBe(29);
  });

  it("intent next를 maxTurns 분기보다 우선한다", () => {
    const data = structuredClone(loadFixtureData()) as GameData;
    const dialogue = data.scenario.find((node) => node.type === "dialogue");
    if (!dialogue || dialogue.type !== "dialogue") {
      throw new Error("fixture dialogue가 없습니다.");
    }
    dialogue.maxTurns = 1;
    const intent = dialogue.intents[0];
    if (!intent) {
      throw new Error("fixture intent가 없습니다.");
    }
    intent.next = "cut_bad";

    const engine = createEngine(data);
    reachDialogue(engine);
    engine.chooseIntent(intent.id);
    expect(engine.getState().currentNodeId).toBe("cut_bad");
  });

  it("새 게임은 기존 플래그와 진행 상태를 제거한다", () => {
    const engine = createEngine();
    reachDialogue(engine);
    engine.chooseIntent("accept_magic");
    expect(engine.getState().flags.has("promise")).toBe(true);

    engine.startNewGame();
    expect([...engine.getState().flags]).toEqual([]);
    expect(engine.getState().totalTurn).toBe(0);
    expect(engine.getState().currentNodeId).toBe("prologue_review_room");
  });

  it("음성 transcript를 로컬 intent로 판정해 한 턴만 반영한다", () => {
    const engine = createEngine();
    reachDialogue(engine);

    const result = engine.submitTranscript("수당은 나와?");

    expect(result).toMatchObject({
      kind: "matched",
      transcript: "수당은 나와?",
      intentId: "ask_conditions",
      reply: "세계 구하고 나서 근로조건을 협상하자!",
    });
    expect(engine.getState().affinity).toBe(50);
    expect(engine.getState().nodeTurn).toBe(1);
    expect(engine.getState().totalTurn).toBe(1);
  });

  it("지원 환경에서 음성으로 시작하고 명시적으로 클릭과 음성을 전환한다", () => {
    const engine = createEngine();

    engine.startNewGame("voice");
    expect(engine.getState().inputMode).toBe("voice");

    engine.setInputMode("click");
    expect(engine.getState().inputMode).toBe("click");
    engine.setInputMode("voice");
    expect(engine.getState().inputMode).toBe("voice");
  });
});
