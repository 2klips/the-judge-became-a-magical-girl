import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveDialoguePresentation } from "../src/ui/gameView";

const gameViewSource = readFileSync(
  new URL("../src/ui/gameView.ts", import.meta.url),
  "utf8",
);
const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const vnStylesSource = readFileSync(
  new URL("../src/ui/vn.css", import.meta.url),
  "utf8",
);

describe("Phase A VN UI design system", () => {
  it("loads the isolated VN layer after legacy styles and before TITLE overrides", () => {
    expect(mainSource).toMatch(
      /import "\.\/styles\.css";\s*import "\.\/ui\/vn\.css";\s*import "\.\/ui\/title\.css";/,
    );
  });

  it("defines the restrained shared surface, text, accent, border, spacing, and radius tokens", () => {
    for (const token of [
      "--vn-surface",
      "--vn-surface-raised",
      "--vn-surface-subtle",
      "--vn-text-primary",
      "--vn-text-secondary",
      "--vn-text-muted",
      "--vn-accent-juno",
      "--vn-accent-doyun",
      "--vn-accent-wraith",
      "--vn-accent-system",
      "--vn-accent-transform",
      "--vn-border-subtle",
      "--vn-border-active",
      "--vn-space-sm",
      "--vn-space-md",
      "--vn-space-lg",
      "--vn-radius-sm",
      "--vn-radius-md",
    ]) {
      expect(vnStylesSource, token).toContain(token);
    }
  });

  it("gives core dialogue semantic classes without absorbing battle dialogue", () => {
    expect(gameViewSource).toContain("vn-dialogue-shell");
    expect(gameViewSource).toContain("vn-speaker-name");
    expect(gameViewSource).toContain("vn-dialogue-copy");
    expect(vnStylesSource).toContain(".vn-dialogue-shell:not(.battle-dialogue)");
  });

  it("keeps narration label-free and gives it an editorial shell modifier", () => {
    expect(resolveDialoguePresentation("narration").showName).toBe(false);
    expect(gameViewSource).toContain("vn-dialogue-shell--${presentation.tone}");
    expect(vnStylesSource).toContain(".vn-dialogue-shell--narration");
  });

  it("separates narrative choices, progress, and input-mode utility hierarchy", () => {
    expect(gameViewSource).toContain("vn-choice-list");
    expect(gameViewSource).toContain("vn-advance");
    expect(gameViewSource).toContain("vn-input-mode-utility");
    expect(vnStylesSource).toContain(".vn-input-mode-utility");
  });

  it("keeps debug transcript metadata debug-only and visually secondary", () => {
    const start = gameViewSource.indexOf("private appendDebugTranscript(");
    expect(start).toBeGreaterThanOrEqual(0);
    const section = gameViewSource.slice(start);
    expect(section).toMatch(/if \(!this\.debugEnabled\) \{\s*return;/);
    expect(vnStylesSource).toContain(".vn-debug-transcript");
  });

  it("scopes core migration away from TITLE and includes desktop-height responsive contracts", () => {
    expect(vnStylesSource).toContain(".game-shell:not(.title-screen)");
    expect(vnStylesSource).toContain("@media (max-height: 920px)");
    expect(vnStylesSource).toContain("@media (max-height: 800px)");
  });
});
