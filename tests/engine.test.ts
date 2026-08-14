import { describe, expect, it } from "vitest";
import type { GameData } from "../src/data/schema";
import { GameEngine } from "../src/engine/nodeRunner";
import { resolveVoiceLevelFailure } from "../src/input/audioLevel";
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
  expect(engine.getState().currentNodeId).toBe("n1_first_voice");
}

const paths = {
  good: [
    "seek_new_fun",
    "curious_magic",
    "ask_why_chosen",
    "protect_others",
    "match_rhythm",
  ],
  normal: [
    "want_rest",
    "realistic_objection",
    "ask_identity",
    "seek_method",
    "follow_steps",
  ],
  bad: [
    "want_rest",
    "reject_juno",
    "stay_cold",
    "withdraw_or_agree",
    "keep_distance",
  ],
} as const;

function completePath(kind: keyof typeof paths): GameEngine {
  const engine = createEngine();
  reachDialogue(engine);
  paths[kind].forEach((intentId) => engine.chooseIntent(intentId));
  expect(engine.getState().currentNodeId).toBe("n5_transform");
  engine.chooseIncantationFallback();
  expect(engine.getState().currentNodeId).toBe("battle_wraith");
  while (engine.getCurrentNode().type === "battle") {
    engine.submitBattleAction({ kind: "click-spell" });
  }
  expect(engine.getState().currentNodeId).toBe("ch3_gray_answer");
  engine.chooseIntent(
    kind === "good"
      ? "allow_one_more_play"
      : kind === "normal"
        ? "reserve_final_judgement"
        : "reject_final_hope",
  );
  return engine;
}

describe("M5 node runner", () => {
  it("한 클릭을 상태와 턴에 한 번만 반영한다", () => {
    const engine = createEngine();
    reachDialogue(engine);
    engine.chooseIntent("seek_new_fun");

    expect(engine.getState().affinity).toBe(52);
    expect(engine.getState().nodeTurn).toBe(0);
    expect(engine.getState().totalTurn).toBe(1);
    expect(engine.getState().currentNodeId).toBe("n2_juno_intro");
  });

  it("긍정 경로와 promise로 GOOD 엔딩에 도달한다", () => {
    const engine = completePath("good");
    const node = engine.getCurrentNode();
    expect(node.type === "ending" ? node.endingId : null).toBe("good");
    expect(engine.getState().affinity).toBe(76);
    expect(engine.getState().flags.has("promise")).toBe(true);
  });

  it("유보 응답은 NORMAL 엔딩으로 직접 이동한다", () => {
    const engine = completePath("normal");
    const node = engine.getCurrentNode();
    expect(node.type === "ending" ? node.endingId : null).toBe("normal");
    expect(engine.getState().affinity).toBe(63);
  });

  it("거절 응답은 BAD 엔딩으로 직접 이동한다", () => {
    const engine = completePath("bad");
    const node = engine.getCurrentNode();
    expect(node.type === "ending" ? node.endingId : null).toBe("bad");
    expect(engine.getState().affinity).toBe(46);
  });

  it("intent next를 maxTurns 분기보다 우선한다", () => {
    const data = structuredClone(loadFixtureData()) as GameData;
    const dialogue = data.scenario.find((node) => node.nodeId === "n1_first_voice");
    if (!dialogue || dialogue.type !== "dialogue") {
      throw new Error("fixture dialogue가 없습니다.");
    }
    dialogue.maxTurns = 1;
    const intent = dialogue.intents[0];
    if (!intent) throw new Error("fixture intent가 없습니다.");
    intent.next = "ending_bad";

    const engine = createEngine(data);
    reachDialogue(engine);
    engine.chooseIntent(intent.id);
    expect(engine.getState().currentNodeId).toBe("ending_bad");
  });

  it("새 게임은 기존 플래그와 진행 상태를 제거한다", () => {
    const engine = completePath("good");
    expect(engine.getState().flags.has("promise")).toBe(true);

    engine.startNewGame();
    expect([...engine.getState().flags]).toEqual([]);
    expect(engine.getState().totalTurn).toBe(0);
    expect(engine.getState().currentNodeId).toBe("n0_review");
  });

  it("음성 transcript를 로컬 intent로 판정해 한 턴만 반영한다", () => {
    const engine = createEngine();
    reachDialogue(engine);

    const result = engine.submitTranscript("집에 가고 싶어.");

    expect(result).toMatchObject({
      kind: "matched",
      transcript: "집에 가고 싶어.",
      intentId: "want_rest",
      reply: "이 정도로 지친 사람에게는 긴급한 설렘이 필요해!",
    });
    expect(engine.getState().affinity).toBe(50);
    expect(engine.getState().totalTurn).toBe(1);
  });

  it("지원 환경에서 음성과 클릭 입력을 명시적으로 전환한다", () => {
    const engine = createEngine();

    engine.startNewGame("voice");
    expect(engine.getState().inputMode).toBe("voice");
    engine.setInputMode("click");
    expect(engine.getState().inputMode).toBe("click");
    engine.setInputMode("voice");
    expect(engine.getState().inputMode).toBe("voice");
  });

  it("새 게임은 누적 음성 입력 실패를 초기화한다", () => {
    const engine = createEngine();
    engine.startNewGame("voice");
    engine.recordSttTurnFailure();
    engine.recordSttTurnFailure();
    expect(engine.getState().sttFailCount).toBe(2);

    engine.startNewGame("voice");

    expect(engine.getState().sttFailCount).toBe(0);
    expect(engine.getState().inputMode).toBe("voice");
  });

  it("이어하기는 저장된 누적 음성 입력 실패를 보존한다", () => {
    const source = createEngine();
    source.startNewGame("voice");
    source.recordSttTurnFailure();
    source.recordSttTurnFailure();
    const savedState = source.getState();
    const resumed = createEngine();

    resumed.resume(savedState);

    expect(resumed.getState().sttFailCount).toBe(2);
    expect(resumed.getState().inputMode).toBe("voice");
  });

  it("실패를 즉시 저장하고 total 4 이어하기의 다음 실패를 total 5로 저장한다", () => {
    const data = loadFixtureData();
    const storage = new MemoryStorage();
    const createRepository = (): SaveRepository =>
      new SaveRepository(
        storage,
        "save",
        new Set(data.config.allowedFlags),
        new Set(data.scenario.map((node) => node.nodeId)),
      );
    const source = new GameEngine(data, createRepository());
    source.startNewGame("voice");

    for (let failure = 0; failure < 4; failure += 1) {
      source.recordSttTurnFailure();
      expect(JSON.parse(storage.getItem("save") ?? "null")).toMatchObject({
        sttFailCount: failure + 1,
        inputMode: "voice",
      });
    }

    const saved = createRepository().load().state;
    expect(saved).not.toBeNull();
    if (!saved) throw new Error("저장 상태가 없습니다.");
    const resumed = new GameEngine(data, createRepository());
    resumed.resume(saved);

    const fifth = resumed.recordSttTurnFailure();

    expect(fifth.forcedClickMode).toBe(true);
    expect(JSON.parse(storage.getItem("save") ?? "null")).toMatchObject({
      sttFailCount: 5,
      inputMode: "click",
    });
  });

  it("성공·노드 이동·수동 click 전환은 누적 음성 입력 실패를 줄이지 않는다", () => {
    const engine = createEngine();
    reachDialogue(engine);
    engine.setInputMode("voice");
    engine.recordSttTurnFailure();

    engine.submitTranscript("집에 가고 싶어.");
    expect(engine.getState().sttFailCount).toBe(1);

    engine.setInputMode("click");
    expect(engine.getState().sttFailCount).toBe(1);
  });

  it("LLM fallback과 battle dBFS 실패는 음성 입력 실패 총계에 포함하지 않는다", () => {
    const engine = createEngine();
    engine.startNewGame("voice");
    engine.recordSttTurnFailure();

    engine.recordLlmFailure();
    expect(resolveVoiceLevelFailure(0)).toBe("retry");
    expect(resolveVoiceLevelFailure(1)).toBe("consume-turn");

    expect(engine.getState().sttFailCount).toBe(1);
  });
});
