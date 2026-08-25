import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  resolveBackgroundAsset,
  resolveImageAsset,
} from "../src/assets/catalog";
import { endingNodeSchema } from "../src/data/schema";
import { createInitialGameState, parseStateSnapshot, serializeState } from "../src/state";
import { loadFixtureData } from "./fixtures";

const gameViewSource = readFileSync(
  new URL("../src/ui/gameView.ts", import.meta.url),
  "utf8",
);
const scenePreviewSource = readFileSync(
  new URL("../src/dev/scenePreview.ts", import.meta.url),
  "utf8",
);

describe("HQ-12 submission ending closure", () => {
  it("keeps three canonical endings terminal and removes HIDDEN/post-credit nodes", () => {
    const data = loadFixtureData();
    const endings = data.scenario.filter((node) => node.type === "ending");

    expect(endings.map(({ endingId }) => endingId).sort()).toEqual(["bad", "good", "normal"]);
    for (const ending of endings) {
      expect(ending.next).toBeUndefined();
    }
    expect(data.scenario.some(({ nodeId }) => nodeId === "ending_hidden")).toBe(false);
    expect(data.scenario.some(({ nodeId }) => nodeId === "post_credit")).toBe(false);
  });

  it("routes former HIDDEN conditions through the existing GOOD branch", () => {
    const data = loadFixtureData();
    const finalSpell = data.scenario.find(({ nodeId }) => nodeId === "n8_final_spell");

    expect(finalSpell?.type).toBe("dialogue");
    if (finalSpell?.type !== "dialogue") throw new Error("N8 dialogue가 없습니다.");
    expect(finalSpell.exitOnMaxTurns).toEqual([
      {
        if: "flags.n7_believe && flags.final_spell_success",
        next: "ending_good",
      },
      { default: "ending_normal" },
    ]);
    expect(data.config.allowedFlags).toContain("perfect_transform");
  });

  it("removes teaser presentation, preview, and runtime asset references", () => {
    expect(gameViewSource).not.toContain("ending.black_magical_girl");
    expect(gameViewSource).not.toContain('node.endingId === "post_credit"');
    expect(gameViewSource).not.toContain('"Post-credit"');
    expect(scenePreviewSource).not.toContain('id: "post-credit"');
    expect(resolveImageAsset("ending.black_magical_girl")).toBeNull();
    expect(resolveBackgroundAsset("bg_corridor_day")).toBeNull();
    expect(resolveBackgroundAsset("bg_corridor_blacklight")).toBeNull();
    expect(
      endingNodeSchema.safeParse({
        nodeId: "post_credit",
        type: "ending",
        scene: { bg: "bg_hall_good" },
        endingId: "post_credit",
        lines: [{ speaker: "narration", text: "legacy teaser" }],
      }).success,
    ).toBe(false);
  });

  it.each([
    ["ending_good", "ending_good", []],
    [
      "ending_hidden",
      "ending_good",
      [
        "perfect_transform",
        "second_spell_opportunity",
        "defense_used",
        "attack_used",
        "n7_believe",
        "final_spell_success",
      ],
    ],
  ] as const)("migrates a legacy post-credit save from %s to %s", (endingId, expected, flags) => {
    const data = loadFixtureData();
    const state = createInitialGameState(data.config);
    const snapshot = serializeState({
      ...state,
      currentNodeId: "post_credit",
      history: [state.currentNodeId, endingId, "post_credit"],
      flags: new Set(flags),
    });
    const restored = parseStateSnapshot(
      snapshot,
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map(({ nodeId }) => nodeId)),
    );

    expect(restored?.currentNodeId).toBe(expected);
    expect(restored?.history).toEqual([state.currentNodeId, expected]);
    expect(restored?.flags).toEqual(new Set(flags));
  });

  it("migrates a legacy HIDDEN current node directly to GOOD", () => {
    const data = loadFixtureData();
    const state = createInitialGameState(data.config);
    const snapshot = serializeState({
      ...state,
      currentNodeId: "ending_hidden",
      history: [state.currentNodeId, "ending_hidden"],
      flags: new Set(["perfect_transform", "final_spell_success"]),
    });
    const restored = parseStateSnapshot(
      snapshot,
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map(({ nodeId }) => nodeId)),
    );

    expect(restored?.currentNodeId).toBe("ending_good");
    expect(restored?.history).toEqual([state.currentNodeId, "ending_good"]);
    expect(restored?.flags).toEqual(new Set(["perfect_transform", "final_spell_success"]));
  });
});
