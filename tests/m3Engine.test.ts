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

function createEngine(data: GameData = loadFixtureData() as GameData): GameEngine {
  return new GameEngine(
    data,
    new SaveRepository(
      new MemoryStorage(),
      "m3-test",
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map(({ nodeId }) => nodeId)),
    ),
  );
}

function reachDialogue(engine: GameEngine): void {
  engine.startNewGame("voice");
  engine.advanceLinearNode();
}

describe("M3 GameEngine LLM 적용", () => {
  it("검증된 LLM 판정만 중앙 상태 함수로 반영하고 미허용 flag는 버린다", () => {
    const data = structuredClone(loadFixtureData()) as GameData;
    const dialogue = data.scenario.find((node) => node.nodeId === "n1_first_voice");
    if (!dialogue || dialogue.type !== "dialogue") throw new Error("dialogue 없음");
    dialogue.allowedFlags.push("promise");
    const engine = createEngine(data);
    reachDialogue(engine);

    const result = engine.submitLlmJudgement("조건이 궁금해", {
      intentId: "want_rest",
      affinityDelta: 2,
      emotion: "happy",
      flags: ["promise", "invented_flag"],
      reply: "좋아, 조건부터 하나씩 확인하자!",
    });

    expect(result).toMatchObject({
      kind: "llm",
      intentId: "want_rest",
      reply: "좋아, 조건부터 하나씩 확인하자!",
      rejectedFlags: ["invented_flag"],
    });
    expect(engine.getState().affinity).toBe(52);
    expect([...engine.getState().flags]).toEqual(["promise"]);
    expect(engine.getState().nodeTurn).toBe(0);
  });

  it("LLM 3연속 실패를 로컬 모드 기준으로 기록하고 성공 시 초기화한다", () => {
    const engine = createEngine();
    reachDialogue(engine);

    expect(engine.recordLlmFailure()).toMatchObject({ forcedLocalMode: false });
    expect(engine.recordLlmFailure()).toMatchObject({ forcedLocalMode: false });
    expect(engine.recordLlmFailure()).toMatchObject({ forcedLocalMode: true });
    expect(engine.getState().llmFailCount).toBe(3);

    engine.recordLlmSuccess();
    expect(engine.getState().llmFailCount).toBe(0);
  });

  it("LLM 오류는 고정 폴백과 중립 판정으로 한 턴 진행한다", () => {
    const engine = createEngine();
    reachDialogue(engine);
    engine.recordLlmFailure();

    const result = engine.submitFallbackJudgement("자유 발화", "한 번 더 이야기해 줘!");

    expect(result).toMatchObject({
      kind: "fallback",
      reply: "한 번 더 이야기해 줘!",
      intentId: "want_rest",
    });
    expect(engine.getState().affinity).toBe(50);
    expect(engine.getState().npcEmotion).toBe("neutral");
    expect(engine.getState().nodeTurn).toBe(0);
    expect(engine.getState().llmFailCount).toBe(1);
  });
});
