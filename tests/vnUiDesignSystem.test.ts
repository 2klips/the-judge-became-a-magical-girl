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

  it("renders one to three narrative choices as a numbered response list and caps larger sets at two columns", () => {
    expect(vnStylesSource).toMatch(
      /\.vn-choice-list\s*\{[\s\S]*?counter-reset:\s*vn-choice;[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    expect(vnStylesSource).toMatch(
      /\.vn-choice-list:has\(> \.choice-button:nth-child\(4\)\)\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
    );
    expect(vnStylesSource).toMatch(
      /\.choice-button::before\s*\{[\s\S]*?content:\s*counter\(vn-choice,\s*decimal-leading-zero\);/,
    );
    expect(vnStylesSource).not.toMatch(
      /\.vn-choice-list[^{}]*\{[^{}]*grid-template-columns:\s*repeat\(3,/,
    );
  });

  it("uses an editorial borderless progress action without changing its delayed-action wiring", () => {
    expect(vnStylesSource).toMatch(
      /\.vn-advance\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/,
    );
    expect(vnStylesSource).toMatch(
      /\.vn-advance::after\s*\{[\s\S]*?content:\s*"›";/,
    );
    expect(gameViewSource).toContain("delayedAdvanceButton(");
  });

  it("pins progress actions to one bottom-right slot across core dialogue shells", () => {
    expect(vnStylesSource).toMatch(
      /\.vn-dialogue-shell:not\(\.battle-dialogue\):has\(\.vn-advance\)\s*\{[^}]*padding-bottom:/s,
    );
    expect(vnStylesSource).toMatch(
      /\.vn-dialogue-shell:not\(\.battle-dialogue\) \.vn-advance\s*\{[^}]*position:\s*absolute;[^}]*right:[^;]+;[^}]*bottom:/s,
    );
  });

  it("aligns only the gameplay BGM HUD with the VN layer while preserving audio control callbacks", () => {
    expect(vnStylesSource).toContain(
      ".game-shell:not(.title-screen) .bgm-controls",
    );
    expect(vnStylesSource).toMatch(
      /\.game-shell:not\(\.title-screen\) \.bgm-controls\s*\{[\s\S]*?left:\s*max\([\s\S]*?right:\s*auto;[\s\S]*?border-radius:\s*var\(--vn-radius-sm\);/,
    );
    expect(vnStylesSource).toMatch(
      /\.game-shell:not\(\.title-screen\) \.bgm-mute-button\s*\{[\s\S]*?background:\s*transparent;/,
    );
    expect(gameViewSource).toContain(
      "this.audioControlOptions.onMutedChange(muted)",
    );
    expect(gameViewSource).toContain(
      "this.audioControlOptions.onVolumeChange(Number(slider.value) / 100)",
    );
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
