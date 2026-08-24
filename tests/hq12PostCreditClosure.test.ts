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
  it("keeps four canonical endings terminal and removes the post-credit node", () => {
    const data = loadFixtureData();
    const endings = data.scenario.filter((node) => node.type === "ending");

    expect(endings.map(({ endingId }) => endingId).sort()).toEqual([
      "bad",
      "good",
      "hidden",
      "normal",
    ]);
    for (const ending of endings) {
      expect(ending.next).toBeUndefined();
    }
    expect(data.scenario.some(({ nodeId }) => nodeId === "post_credit")).toBe(false);
  });

  it("preserves the HIDDEN reward copy and compound route condition", () => {
    const data = loadFixtureData();
    const hidden = data.scenario.find(({ nodeId }) => nodeId === "ending_hidden");
    const finalSpell = data.scenario.find(({ nodeId }) => nodeId === "n8_final_spell");

    expect(hidden?.type).toBe("ending");
    if (hidden?.type !== "ending") throw new Error("HIDDEN ending이 없습니다.");
    expect(hidden.lines.map(({ text }) => text)).toContain(
      "사내 인기 게시물: 한도윤 심사역 마법소녀 변신 영상, 실시간 조회 1위.",
    );

    expect(finalSpell?.type).toBe("dialogue");
    if (finalSpell?.type !== "dialogue") throw new Error("N8 dialogue가 없습니다.");
    expect(finalSpell.exitOnMaxTurns?.[0]).toEqual({
      if: "flags.perfect_transform && flags.second_spell_opportunity && flags.defense_used && flags.attack_used && flags.n7_believe && flags.final_spell_success",
      next: "ending_hidden",
    });
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
    ["ending_good", []],
    [
      "ending_hidden",
      [
        "perfect_transform",
        "second_spell_opportunity",
        "defense_used",
        "attack_used",
        "n7_believe",
        "final_spell_success",
      ],
    ],
  ] as const)("migrates a legacy post-credit save back to %s", (endingId, flags) => {
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

    expect(restored?.currentNodeId).toBe(endingId);
    expect(restored?.history).toEqual([state.currentNodeId, endingId]);
  });
});
