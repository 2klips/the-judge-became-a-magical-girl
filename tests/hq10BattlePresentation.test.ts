import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gameViewSource = readFileSync(
  new URL("../src/ui/gameView.ts", import.meta.url),
  "utf8",
);
const vnStylesSource = readFileSync(new URL("../src/ui/vn.css", import.meta.url), "utf8");

const renderBattle = gameViewSource.slice(
  gameViewSource.indexOf("  renderBattle("),
  gameViewSource.indexOf("  renderBattleReply("),
);
const renderBattleReply = gameViewSource.slice(
  gameViewSource.indexOf("  renderBattleReply("),
  gameViewSource.indexOf("  renderDialogue("),
);

describe("HQ-10 Battle final presentation", () => {
  it("renders one semantic command deck instead of generic button cards", () => {
    for (const className of [
      "battle-command-deck",
      "battle-command-brief",
      "battle-response-list",
      "battle-action-choice",
      "battle-voice-actions",
      "battle-input-mode-utility",
    ]) {
      expect(renderBattle, className).toContain(className);
    }
    expect(renderBattle).not.toMatch(
      /element\(\s*"button",\s*"(?:primary-button|secondary-button)"/,
    );
  });

  it("keeps actual PTT, mode switching, and one-shot battle actions wired", () => {
    expect(renderBattle.match(/this\.bindHoldToTalk\(/g)).toHaveLength(2);
    expect(renderBattle).toContain('options.onModeChange("click")');
    expect(renderBattle).toContain('options.onModeChange("voice")');
    expect(renderBattle).toMatch(/addEventListener\([\s\S]*?\{ once: true \}/);
  });

  it("uses restrained VN surfaces for the HUD, Wraith dialogue, and command deck", () => {
    expect(vnStylesSource).toMatch(
      /\.game-shell\.battle-screen \.battle-hud\s*\{[^}]*border-radius:\s*var\(--vn-radius-sm\);[^}]*box-shadow:\s*none;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-dialogue\.vn-dialogue-shell\s*\{[^}]*--vn-speaker-accent:\s*var\(--vn-accent-wraith\);[^}]*border-radius:\s*var\(--vn-radius-sm\);[^}]*box-shadow:\s*none;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-command-deck\s*\{[^}]*border-radius:\s*var\(--vn-radius-sm\);[^}]*box-shadow:\s*none;/s,
    );
  });

  it("presents click actions as quiet numbered response rows with at most two columns", () => {
    expect(vnStylesSource).toMatch(
      /\.battle-response-list\s*\{[^}]*counter-reset:\s*battle-choice;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-response-list:has\(> \.battle-action-choice:nth-child\(4\)\)\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-response-list \.battle-action-choice::before\s*\{[^}]*content:\s*counter\(battle-choice,\s*decimal-leading-zero\);/s,
    );
    expect(vnStylesSource).not.toMatch(
      /\.battle-response-list[^{}]*\{[^{}]*grid-template-columns:\s*repeat\(3,/,
    );
  });

  it("keeps narrative action, PTT, and input-mode utility at distinct visual levels", () => {
    expect(vnStylesSource).toMatch(
      /\.battle-action-choice\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-voice-primary\s*\{[^}]*border-color:\s*color-mix\([^}]*var\(--vn-accent-transform\)/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-input-mode-utility\s*\{[^}]*color:\s*var\(--vn-text-muted\);[^}]*background:\s*transparent;/s,
    );
  });

  it("keeps the Battle stage non-scrollable when input mode focus changes", () => {
    expect(vnStylesSource).toMatch(
      /\.game-shell\.battle-screen \.battle-stage\s*\{[^}]*overflow:\s*clip;/s,
    );
  });

  it("uses the same restrained progression language after a battle action", () => {
    expect(renderBattleReply).toContain("battle-result-deck");
    expect(renderBattleReply).toContain("battle-result-advance");
    expect(renderBattleReply).not.toContain('"primary-button"');
    expect(vnStylesSource).toMatch(
      /\.battle-result-deck\s*\{[^}]*border-radius:\s*var\(--vn-radius-sm\);[^}]*box-shadow:\s*none;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.battle-result-advance\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s,
    );
  });
});
