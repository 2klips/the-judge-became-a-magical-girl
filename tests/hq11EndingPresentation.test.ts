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
    expect(renderEnding).toMatch(/isEditorialEndingId\(node\.endingId\)/);
    expect(renderEnding).toMatch(/node\.endingId === "post_credit"/);
  });

  it("splits the frozen ending heading into editorial label and copy spans", () => {
    expect(gameViewSource).toContain("resolveEditorialEndingHeading");
    expect(renderEnding).toContain("ending-heading-label");
    expect(renderEnding).toContain("ending-heading-copy");
    expect(renderEnding).toContain("ending-kicker");
  });

  it("removes the giant modal chrome and reserves a center-left editorial lane", () => {
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-editorial\s*\{[^}]*position:\s*absolute;[^}]*left:\s*clamp\([^}]*width:\s*min\([^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/s,
    );
    expect(vnStylesSource).toContain("width: min(35vw, 660px);");
    expect(vnStylesSource).toMatch(
      /\.ending-editorial-screen \.ending-advance\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s,
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
