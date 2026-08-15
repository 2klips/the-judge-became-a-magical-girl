import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TITLE_HEADING_LINES, TITLE_MENU_COPY } from "../src/ui/titleView";

const titleSource = readFileSync(new URL("../src/ui/titleView.ts", import.meta.url), "utf8");
const titleCss = readFileSync(new URL("../src/ui/title.css", import.meta.url), "utf8");
const gameViewSource = readFileSync(new URL("../src/ui/gameView.ts", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

describe("PC TITLE visual skeleton", () => {
  it("메뉴 문구와 설명을 고정한다", () => {
    expect(TITLE_MENU_COPY).toEqual({
      start: {
        label: "게임 시작",
        description: "목소리로 이어지는 이야기를 처음부터 시작합니다.",
      },
      continueWithSave: {
        label: "이어하기",
        description: "마지막으로 저장된 장면부터 이야기를 이어갑니다.",
      },
      continueWithoutSave: {
        label: "이어하기",
        description: "아직 저장된 이야기가 없습니다.",
      },
      settings: {
        label: "설정",
        description: "음량과 마이크 등 플레이 환경을 설정합니다.",
      },
    });
  });

  it("제목·세 메뉴·compact mic·BGM의 semantic DOM을 소유한다", () => {
    expect(titleSource).toMatch(/node\("header"/);
    expect(titleSource).toContain("목소리로 이어지는 이야기");
    expect(TITLE_HEADING_LINES).toEqual(["심사역은", "마법소녀가 되었다"]);
    expect(titleSource).toMatch(/node\("nav"/);
    expect(titleSource.match(/createMenuButton\(/g)?.length ?? 0).toBe(3);
    expect(titleSource.match(/node\(\s*"button"/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(titleSource).toMatch(/aria-disabled/);
    expect(titleSource).toMatch(/aria-describedby/);
    expect(titleSource).toMatch(/aria-live/);
    expect(titleSource).toMatch(/type\s*=\s*"range"/);
    expect(titleSource).toMatch(/createElement\("select"\)/);
    expect(titleSource).toMatch(/createElement\("dialog"\)/);
    expect(titleSource).toContain("음성 플레이");
    expect(titleSource).not.toContain('className = "title-block"');
    expect(titleSource).not.toContain("dBFS");
  });

  it("GameView는 TITLE DOM을 위임하고 generic BGM을 중복 삽입하지 않는다", () => {
    expect(gameViewSource).toMatch(/new TitleView\(shell,/);
    expect(gameViewSource).toMatch(/presentationContext !== "title"/);
    expect(gameViewSource).not.toMatch(/renderTitle[\s\S]*new MicrophoneCalibrationAccumulator/);
    expect(mainSource).toMatch(/import "\.\/ui\/title\.css";/);
  });

  it("TITLE CSS는 로컬 폰트·국소 overlay·상태·motion 계약만 소유한다", () => {
    expect(titleCss).toContain('@font-face');
    expect(titleCss).toContain('font-family: "MaruBuri"');
    expect(titleCss).toContain('format("opentype")');
    expect(titleCss).toMatch(/MaruBuri-SemiBold\.otf/);
    expect(titleCss).toMatch(/font-weight:\s*600/);
    expect(titleCss.match(/Pretendard-(?:Regular|SemiBold)\.woff2/g)?.length).toBe(2);
    expect(titleCss).toMatch(/Pretendard-Regular\.woff2/);
    expect(titleCss).toMatch(/Pretendard-SemiBold\.woff2/);
    expect(titleCss).toContain('[data-presentation-context="title"]');
    expect(titleCss).toMatch(/font-size:\s*clamp\(3\.25rem,\s*3\.35vw,\s*4rem\)/);
    expect(titleCss).toMatch(/linear-gradient\(90deg/);
    expect(titleCss).toMatch(/transition:[^;]*(?:150ms|160ms|180ms)/);
    expect(titleCss).toMatch(/scale\(0\.98\)/);
    expect(titleCss).toContain(":focus-visible");
    expect(titleCss).toContain("prefers-reduced-motion: reduce");
    expect(titleCss).toMatch(/animation-duration:\s*400ms/);
    expect(titleCss).toMatch(/animation-delay:\s*100ms/);
    expect(titleCss).toMatch(/animation-delay:\s*150ms/);
    expect(titleCss).not.toMatch(/animation[^;]*infinite/);
    expect(titleCss).not.toMatch(/https?:\/\//);
    expect(titleCss).not.toContain("@import");
    expect(titleCss).not.toMatch(/font-variation-settings|\.woff2[^;]*variable/i);
    expect(titleCss).not.toMatch(/overflow-[xy]:\s*(?:auto|scroll)/);
    expect(titleCss).not.toMatch(/@media\s*\([^)]*max-width:\s*760px/);
  });
});
