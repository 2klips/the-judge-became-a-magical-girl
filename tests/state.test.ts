import { describe, expect, it } from "vitest";
import {
  applyDialogueJudgement,
  createInitialGameState,
  parseStateSnapshot,
  serializeState,
} from "../src/state";
import { loadFixtureData } from "./fixtures";

describe("GameState 중앙 갱신", () => {
  it("affinity 델타와 최종값을 계약 범위로 클램프한다", () => {
    const data = loadFixtureData();
    const initial = createInitialGameState(data.config);
    const high = applyDialogueJudgement(
      { ...initial, affinity: 99 },
      { affinityDelta: 999, emotion: "happy", flags: [] },
      new Set(),
    ).state;
    const low = applyDialogueJudgement(
      { ...initial, affinity: 1 },
      { affinityDelta: -999, emotion: "upset", flags: [] },
      new Set(),
    ).state;

    expect(high.affinity).toBe(100);
    expect(low.affinity).toBe(0);
  });

  it("화이트리스트 플래그만 적용하고 나머지는 거부한다", () => {
    const data = loadFixtureData();
    const initial = createInitialGameState(data.config);
    const result = applyDialogueJudgement(
      initial,
      {
        affinityDelta: 0,
        emotion: "neutral",
        flags: ["promise", "invented_flag"],
      },
      new Set(["promise"]),
    );

    expect([...result.state.flags]).toEqual(["promise"]);
    expect(result.rejectedFlags).toEqual(["invented_flag"]);
    expect(result.state.nodeTurn).toBe(1);
    expect(result.state.totalTurn).toBe(1);
  });

  it("스냅샷을 Set 포함 상태로 왕복하고 비허용 플래그를 거부한다", () => {
    const data = loadFixtureData();
    const initial = createInitialGameState(data.config);
    initial.flags.add("promise");
    const snapshot = serializeState(initial);
    const nodeIds = new Set(data.scenario.map((node) => node.nodeId));

    const restored = parseStateSnapshot(snapshot, new Set(["promise"]), nodeIds);
    expect(restored?.flags.has("promise")).toBe(true);
    expect(restored?.currentNodeId).toBe(initial.currentNodeId);
    expect(restored).not.toHaveProperty("schemaVersion");

    expect(
      parseStateSnapshot(
        { ...snapshot, flags: ["forbidden"] },
        new Set(["promise"]),
        nodeIds,
      ),
    ).toBeNull();
  });
});
