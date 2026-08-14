import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const viewSource = readFileSync(new URL("../src/ui/gameView.ts", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

function section(start: string, end: string): string {
  const startIndex = viewSource.indexOf(start);
  const endIndex = viewSource.indexOf(end, startIndex + start.length);
  expect(startIndex, start).toBeGreaterThanOrEqual(0);
  expect(endIndex, end).toBeGreaterThan(startIndex);
  return viewSource.slice(startIndex, endIndex);
}

describe("GameView PTT 내부 live meter 계약", () => {
  it("dialogue와 shared voice options가 같은 observer signature를 사용한다", () => {
    expect(viewSource.match(/startCapture\(onLevel: LiveAudioLevelObserver\): Promise<void>/g)).toHaveLength(2);
  });

  it("4개 PTT surface가 공통 내부 fill button helper를 사용한다", () => {
    expect(viewSource.match(/createPttButton\(/g)?.length).toBeGreaterThanOrEqual(5);
    expect(viewSource).toContain('createPttButton(presentation.buttonLabel)');
    expect(viewSource).toContain('createPttButton("누르고 주문 읽기 (T)")');
    expect(viewSource).toContain('createPttButton("주문 · 누르고 말하기 (T)")');
    expect(viewSource).toMatch(
      /createPttButton\(\s*"자유 대응 · 누르고 말하기 \(T\)",\s*"ptt-button freeform-button",?\s*\)/,
    );
  });

  it("fill은 기존 microphone presentation을 재사용하고 접근성 상태를 갱신하지 않는다", () => {
    const update = section("function updatePttLiveLevel", "export class GameView");
    expect(update).toContain("resolvePttLiveLevelPresentation(metrics)");
    expect(update).toContain('--ptt-live-level');
    expect(update).toContain("button.dataset.levelTone = presentation.tone");
    expect(update).not.toMatch(/aria-live|aria-valuenow|dBFS/);
  });

  it("dialogue와 shared binder가 observer를 전달하고 종료 전에 즉시 0으로 초기화한다", () => {
    const dialogue = section("private renderVoiceInput", "private async handleVoiceResult");
    const shared = section("private bindHoldToTalk", "private rememberTranscription");
    for (const binder of [dialogue, shared]) {
      expect(binder).toContain("options.startCapture(onLevel)");
      expect(binder).toContain("updatePttLiveLevel");
      expect(binder).toMatch(/capturing = false;[\s\S]*?updatePttLiveLevel\([^,]+, null\);\s*setPttButtonState\([^,]+, "processing"\)/);
      expect(binder).toContain('event.key === " " || event.key === "Enter"');
    }
  });

  it("cancel·render replacement가 active capture를 취소하고 late fill을 막는다", () => {
    const commit = section("private commit", "private audioControlPanel");
    expect(viewSource).toContain("private activeVoiceCaptureCancel");
    expect(viewSource).toContain("this.activeVoiceCaptureCancel = cancelCapture");
    expect(viewSource).toMatch(/if \(!capturing \|\| !\w+\.isConnected\) return/);
    expect(commit).toContain("this.activeVoiceCaptureCancel?.()");
    expect(commit).toContain("this.activeVoiceCaptureCancel = null");
  });

  it("CSS fill은 button 내부 장식 layer이며 pointer를 가로채지 않는다", () => {
    expect(stylesSource).toMatch(/\.ptt-level-fill\s*\{[^}]*position:\s*absolute[^}]*pointer-events:\s*none[^}]*width:\s*var\(--ptt-live-level,\s*0%\)/s);
    expect(stylesSource).toMatch(/\.ptt-button-label\s*\{[^}]*position:\s*relative[^}]*z-index:/s);
    expect(stylesSource).toMatch(/\.ptt-button\[data-level-tone="quiet"\]/);
    expect(stylesSource).toMatch(/\.ptt-button\[data-level-tone="good"\]/);
    expect(stylesSource).toMatch(/\.ptt-button\[data-level-tone="loud"\]/);
  });
});
