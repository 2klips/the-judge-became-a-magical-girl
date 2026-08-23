import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  WRAITH_OMEN_PRESENTATION,
  shouldPresentWraithOmen,
} from "../src/ui/wraithOmenPresentation";

const mainSource = readFileSync(resolve("src", "main.ts"), "utf8");
const gameViewSource = readFileSync(resolve("src", "ui", "gameView.ts"), "utf8");
const vnCssSource = readFileSync(resolve("src", "ui", "vn.css"), "utf8");

describe("natural-edge Wraith omen presentation", () => {
  it("permits only the natural advanced N2 follow-up to N3 edge", () => {
    expect(shouldPresentWraithOmen("n2_juno_followup", "n3_wraith_choice", true)).toBe(
      true,
    );
    expect(shouldPresentWraithOmen("n2_juno_followup", "n3_wraith_choice", false)).toBe(
      false,
    );
    expect(shouldPresentWraithOmen("n3_wraith_choice", "n3_wraith_choice", true)).toBe(
      false,
    );
    expect(shouldPresentWraithOmen("n2_juno_intro", "n3_wraith_choice", true)).toBe(
      false,
    );
  });

  it("owns no actors, node state, or large dialogue shell", () => {
    expect(WRAITH_OMEN_PRESENTATION).toEqual({
      sceneId: "n2_n3_wraith_omen",
      backgroundId: "bg_hall_dark",
      text: "(모니터 속 평가 문장이 한 글자씩 회색으로 번진다.)",
      durationMs: 1_100,
      actors: [],
    });
  });

  it("hooks the edge once after engine advancement and before ordinary rendering", () => {
    expect(mainSource).toContain("let transitionPresentationStarted = false");
    expect(mainSource).toMatch(
      /const nextNodeId = engine\.getState\(\)\.currentNodeId;[\s\S]*?shouldPresentWraithOmen\(node\.nodeId, nextNodeId, result\.advanced\)[\s\S]*?transitionPresentationStarted = true;[\s\S]*?view\.renderWraithOmen\(\(\) => renderCurrent\(\)\);[\s\S]*?return;/,
    );
  });

  it("renders an actor-free status caption instead of a VN dialogue shell", () => {
    expect(gameViewSource).toContain("renderWraithOmen(onContinue: () => void)");
    expect(gameViewSource).toContain('shell.dataset.actorCount = "0"');
    expect(gameViewSource).toContain('caption.setAttribute("role", "status")');
    expect(vnCssSource).toContain(".wraith-omen-caption");
    expect(vnCssSource).not.toMatch(/\.wraith-omen-caption[^}]*border-radius/s);
  });
});
