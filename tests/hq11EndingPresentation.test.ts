import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gameViewSource = readFileSync(
  new URL("../src/ui/gameView.ts", import.meta.url),
  "utf8",
);
const vnStylesSource = readFileSync(new URL("../src/ui/vn.css", import.meta.url), "utf8");
const scenario = JSON.parse(
  readFileSync(new URL("../public/scenario/scenario.json", import.meta.url), "utf8"),
) as Array<{
    nodeId: string;
    endingId?: string;
    next?: string;
    lines?: Array<{ text: string }>;
}>;
const renderEnding = gameViewSource.slice(
  gameViewSource.indexOf("  renderEnding("),
  gameViewSource.indexOf("  renderError("),
);

describe("HQ-11 Ending final presentation", () => {
  it("isolates the four canonical endings from the untouched post-credit surface", () => {
    expect(gameViewSource).toContain("isEditorialEndingId");
    expect(renderEnding).toContain("ending-editorial-screen");
    expect(renderEnding).toContain("ending-editorial");
    expect(renderEnding).toContain("ending-result-plate");
    expect(renderEnding).toMatch(/isEditorialEndingId\(node\.endingId\)/);
    expect(renderEnding).toMatch(/node\.endingId === "post_credit"/);
  });

  it("splits the frozen ending heading into editorial label and copy spans", () => {
    expect(gameViewSource).toContain("resolveEditorialEndingHeading");
    expect(renderEnding).toContain("ending-heading-label");
    expect(renderEnding).toContain("ending-heading-copy");
    expect(renderEnding).toContain("ending-kicker");
  });

  it("frames the editorial result with a compact translucent plate, not a giant modal", () => {
    const resultPlateRule =
      vnStylesSource.match(/\.ending-editorial-screen \.ending-result-plate\s*\{[^}]*/s)?.[0] ?? "";
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-result-plate\s*\{[^}]*width:\s*100%;[^}]*padding:\s*26px 30px 24px;[^}]*border:\s*1px solid var\(--ending-plate-border\);[^}]*border-radius:\s*var\(--vn-radius-md\);[^}]*background:\s*var\(--ending-plate-bg\);[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*blur\(6px\);/s,
    );
    expect(resultPlateRule).not.toContain("background: var(--vn-surface);");
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-advance\s*\{[^}]*border:\s*1px solid var\(--ending-plate-border\);[^}]*background:\s*rgba\(8, 11, 20, 0\.48\);[^}]*box-shadow:\s*none;/s,
    );
  });

  it("uses one fixed result-frame geometry and centered internal slots for every ending", () => {
    expect(renderEnding).toContain("ending-result-layout");
    expect(renderEnding).toContain("ending-support-slot");
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-result-layout\s*\{[^}]*position:\s*absolute;[^}]*top:\s*clamp\([^}]*left:\s*clamp\([^}]*width:\s*clamp\(480px, 35vw, 680px\);[^}]*justify-items:\s*center;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-result-plate\s*\{[^}]*width:\s*100%;[^}]*block-size:\s*clamp\(270px, 33\.333vh, 360px\);[^}]*grid-template-rows:\s*1px minmax\(0, 1fr\);[^}]*text-align:\s*center;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-support-slot\s*\{[^}]*text-align:\s*center;/s,
    );
  });

  it("centers the core result content and removes the empty form-like support footprint", () => {
    expect(renderEnding).toContain("ending-result-content");
    expect(renderEnding).toContain("resultContent.append");
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-result-content\s*\{[^}]*align-self:\s*center;[^}]*display:\s*grid;[^}]*width:\s*100%;[^}]*text-align:\s*center;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-support-slot:empty\s*\{[^}]*display:\s*none;/s,
    );
    const supportRule =
      vnStylesSource.match(/\.ending-editorial-screen \.ending-support-slot\s*\{[^}]*/s)?.[0] ?? "";
    expect(supportRule).not.toContain("border-top");
    expect(supportRule).not.toContain("min-height: 62px");
  });

  it("uses one title scale and detaches a centered CTA below the result frame", () => {
    expect(renderEnding).toContain("resultLayout.append(card, button)");
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-heading-copy\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 3vw, 3\.5rem\);/s,
    );
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-advance\s*\{[^}]*justify-self:\s*center;[^}]*margin:\s*14px 0 0;[^}]*border:\s*1px solid var\(--ending-plate-border\);/s,
    );
  });

  it("uses restrained plate tones for all four canonical endings", () => {
    for (const endingId of ["good", "normal", "bad", "hidden"]) {
      expect(vnStylesSource).toMatch(
        new RegExp(
          `\\.ending-editorial-screen\\.ending-tone-${endingId}\\s*\\{[^}]*--ending-plate-bg:\\s*rgba\\(`,
          "s",
        ),
      );
    }
  });

  it("balances the HIDDEN heading into two visual lines without changing its copy", () => {
    expect(gameViewSource).toContain("resolveEditorialEndingCopyLines");
    expect(gameViewSource).toContain('"완벽한 호흡,"');
    expect(gameViewSource).toContain('"완벽한 사고"');
    expect(renderEnding).toContain("ending-heading-copy-hidden");
    expect(renderEnding).toContain("ending-heading-line");
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-heading-copy-hidden\s*\{[^}]*display:\s*grid;/s,
    );
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-heading-line\s*\{[^}]*display:\s*block;/s,
    );
  });

  it("keeps Juno left-low and Doyun right outside the editorial title lane", () => {
    expect(vnStylesSource).toMatch(
      /\.game-shell\[data-composition="ending"\]\.ending-editorial-screen\s+\.ending-character:not\(\.ending-black-magical-girl\)\s*\{[^}]*left:\s*clamp\([^}]*width:\s*min\(/s,
    );
    expect(vnStylesSource).toMatch(
      /\.game-shell\[data-composition="ending"\]\.ending-editorial-screen\s+\.ending-player-visual\s*\{[^}]*right:\s*clamp\([^}]*width:\s*min\(/s,
    );
  });

  it("freezes ending IDs, titles, and GOOD/HIDDEN post-credit routing", () => {
    const endings = Object.fromEntries(
      scenario
        .filter((node) => node.endingId && node.endingId !== "post_credit")
        .map((node) => [node.endingId, node]),
    );

    expect(Object.keys(endings).sort()).toEqual(["bad", "good", "hidden", "normal"]);
    expect(endings.good.lines?.[0]?.text).toBe("GOOD — 끝까지 보고 판단하기");
    expect(endings.normal.lines?.[0]?.text).toBe("NORMAL — 한 번만 더");
    expect(endings.bad.lines?.[0]?.text).toBe("BAD — 회색 업무일지");
    expect(endings.hidden.lines?.[0]?.text).toBe(
      "HIDDEN — 완벽한 호흡, 완벽한 사고",
    );
    expect(endings.good.next).toBe("post_credit");
    expect(endings.hidden.next).toBe("post_credit");
    expect(endings.normal.next).toBeUndefined();
    expect(endings.bad.next).toBeUndefined();
  });
});
