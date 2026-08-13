# UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 16:9 전체 화면이 같은 글꼴·안전영역·레이어 계약을 사용하도록 통합하고 승인된 타이틀 배치를 구현한다.

**Architecture:** `SceneFrame`은 `hud / stage / dialogue / actions / audio` 슬롯만 정의하고 기존 직렬 FSM·렌더 함수는 유지한다. CSS는 새 override를 쌓지 않고 반복 selector를 하나로 합치며, 공식 Pretendard v1.3.9를 저장소에서 직접 제공해 네트워크 상태와 관계없이 같은 한글 글꼴을 사용한다.

**Tech Stack:** TypeScript 7, Vite 8, CSS Grid, Vitest 4, Pretendard Variable v1.3.9 (SIL OFL 1.1)

---

## Scope and file ownership

- Create: `src/ui/sceneFrame.ts` — 슬롯 이름과 class 계약
- Create: `tests/m5SceneFrame.test.ts`
- Create: `tests/m5StyleContract.test.ts`
- Add: `assets/source/font/delivery/PretendardVariable.woff2`
- Add: `assets/runtime/font/PretendardVariable.woff2`
- Add: `docs/assets/provenance/PRETENDARD_LICENSE.txt`
- Modify: `vite.config.ts` — WOFF2 MIME
- Modify: `src/ui/gameView.ts` — SceneFrame 슬롯과 승인된 타이틀 구조
- Modify: `src/styles.css` — 단일 토큰·selector·안전영역
- Modify: `tests/m5Assets.test.ts` — 글꼴 delivery/runtime 계약
- Modify: `tests/m5Presentation.test.ts` — 타이틀 문구·slot contract
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

Do not change scenario text, game rules, voice policy, battle sequencing, image/audio binaries, mobile layout, or deployment.

**Execution guard:** Run only in `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline` after Audio/Voice. Overall order is **A Audio/Voice → B UI Foundation → C Narrative → D Transformation/Battle/Ending**. Shared-file implementation is sequential and independent reviewers do not edit. Do not push, merge main, change branches, reset, revert, or amend. New task commits are allowed.

### Task 1: Adopt the repository-served Pretendard font

**Files:**
- Add: `assets/source/font/delivery/PretendardVariable.woff2`
- Add: `assets/runtime/font/PretendardVariable.woff2`
- Add: `docs/assets/provenance/PRETENDARD_LICENSE.txt`
- Modify: `tests/m5Assets.test.ts`
- Modify: `vite.config.ts:10-14`

- [ ] **Step 1: Write the failing font asset contract**

Add this test to `tests/m5Assets.test.ts` using its existing repository path helpers:

```ts
it("Pretendard Variable v1.3.9를 source/runtime 동일 바이트 WOFF2로 제공한다", () => {
  const source = readFileSync(
    fileURLToPath(new URL("../assets/source/font/delivery/PretendardVariable.woff2", import.meta.url)),
  );
  const runtime = readFileSync(
    fileURLToPath(new URL("../assets/runtime/font/PretendardVariable.woff2", import.meta.url)),
  );
  const license = readFileSync(
    fileURLToPath(new URL("../docs/assets/provenance/PRETENDARD_LICENSE.txt", import.meta.url)),
    "utf8",
  );

  expect(source.subarray(0, 4).toString("ascii")).toBe("wOF2");
  expect(source.equals(runtime)).toBe(true);
  expect(source.byteLength).toBeGreaterThan(1_000_000);
  expect(source.byteLength).toBeLessThan(5_000_000);
  expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
  expect(license).toContain("Reserved Font Name Pretendard");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected: FAIL with missing font and license paths.

- [ ] **Step 3: Download the pinned official files**

Use only the official `orioncactus/pretendard` v1.3.9 tag:

```powershell
New-Item -ItemType Directory -Force -Path 'assets\source\font\delivery','assets\runtime\font','docs\assets\provenance' | Out-Null
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2' -OutFile 'assets\source\font\delivery\PretendardVariable.woff2'
Copy-Item -LiteralPath 'assets\source\font\delivery\PretendardVariable.woff2' -Destination 'assets\runtime\font\PretendardVariable.woff2'
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE' -OutFile 'docs\assets\provenance\PRETENDARD_LICENSE.txt'
```

Do not use a CDN stylesheet at runtime. Record the exact SHA-256 and bytes produced by `Get-FileHash` and `Get-Item` in the asset documents during Task 6.

- [ ] **Step 4: Serve the font with the correct MIME type**

Add to `contentTypes` in `vite.config.ts`:

```ts
".woff2": "font/woff2",
```

- [ ] **Step 5: Verify GREEN and source/runtime identity**

```powershell
npm test -- tests/m5Assets.test.ts
npm run check
Get-FileHash -Algorithm SHA256 -LiteralPath 'assets\source\font\delivery\PretendardVariable.woff2','assets\runtime\font\PretendardVariable.woff2'
```

Expected: focused tests PASS, TypeScript PASS, and both SHA-256 values are identical.

- [ ] **Step 6: Commit**

```powershell
git add assets/source/font/delivery/PretendardVariable.woff2 assets/runtime/font/PretendardVariable.woff2 docs/assets/provenance/PRETENDARD_LICENSE.txt tests/m5Assets.test.ts vite.config.ts
git commit -m "feat(ui): add repository served Pretendard font"
```

### Task 2: Define the SceneFrame slot contract

**Files:**
- Create: `src/ui/sceneFrame.ts`
- Create: `tests/m5SceneFrame.test.ts`
- Modify: `src/ui/gameView.ts:1368-1395,1773-1859`
- Modify: `src/styles.css:1484-1535`

- [ ] **Step 1: Write the failing slot contract test**

Create `tests/m5SceneFrame.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fitsSceneFrameHeight,
  SCENE_FRAME_SLOTS,
  sceneFrameClassName,
} from "../src/ui/sceneFrame";

describe("SceneFrame 슬롯", () => {
  it("모든 화면이 같은 다섯 슬롯을 같은 class로 사용한다", () => {
    expect(SCENE_FRAME_SLOTS).toEqual(["hud", "stage", "dialogue", "actions", "audio"]);
    expect(SCENE_FRAME_SLOTS.map(sceneFrameClassName)).toEqual([
      "scene-slot scene-slot-hud",
      "scene-slot scene-slot-stage",
      "scene-slot scene-slot-dialogue",
      "scene-slot scene-slot-actions",
      "scene-slot scene-slot-audio",
    ]);
  });

  it("BGM은 fixed 좌표가 아니라 audio 슬롯을 따른다", () => {
    const css = readFileSync(resolve("src/styles.css"), "utf8");
    const block = css.match(/\.bgm-controls\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(block).toContain("position: relative");
    expect(block).toContain("inset: auto");
    expect(block).not.toMatch(/position:\s*fixed|\btop:|\bright:|\bleft:/);
    expect(css).not.toMatch(/\.game-shell\.debug-enabled \.bgm-controls\s*\{[^}]*\bleft:/s);
  });

  it("1280×720의 같은 행 HUD/audio는 큰 쪽 하나만 높이 예산에 센다", () => {
    expect(fitsSceneFrameHeight({
      viewport: 720, safeTop: 16, safeBottom: 16,
      hud: 56, audio: 56, stage: 160, dialogue: 244, actions: 160, gap: 12,
    })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5SceneFrame.test.ts
```

Expected: FAIL because `src/ui/sceneFrame.ts` does not exist and BGM still uses fixed top/right coordinates.

- [ ] **Step 3: Implement the slot module**

Create `src/ui/sceneFrame.ts`:

```ts
export const SCENE_FRAME_SLOTS = ["hud", "stage", "dialogue", "actions", "audio"] as const;
export type SceneFrameSlot = (typeof SCENE_FRAME_SLOTS)[number];

export function sceneFrameClassName(slot: SceneFrameSlot): string {
  return `scene-slot scene-slot-${slot}`;
}

export interface SceneFrameHeightBudget {
  viewport: number;
  safeTop: number;
  safeBottom: number;
  hud: number;
  audio: number;
  stage: number;
  dialogue: number;
  actions: number;
  gap: number;
}

export function fitsSceneFrameHeight(value: SceneFrameHeightBudget): boolean {
  const used = Math.max(value.hud, value.audio) + value.stage + value.dialogue +
    value.actions + value.gap * 3;
  return used <= value.viewport - value.safeTop - value.safeBottom;
}
```

- [ ] **Step 4: Mount slots once per shell**

Import the module in `src/ui/gameView.ts`, then add these methods:

```ts
private createSceneFrame(): HTMLElement {
  const frame = element("div", "scene-frame");
  for (const slotName of SCENE_FRAME_SLOTS) {
    const slot = element("div", sceneFrameClassName(slotName));
    slot.dataset.sceneSlot = slotName;
    frame.append(slot);
  }
  return frame;
}

private sceneSlot(shell: HTMLElement, slot: SceneFrameSlot): HTMLElement {
  const target = shell.querySelector<HTMLElement>(`[data-scene-slot="${slot}"]`);
  if (!target) throw new Error(`SceneFrame slot not found: ${slot}`);
  return target;
}

private appendToSceneSlot(
  shell: HTMLElement,
  slot: SceneFrameSlot,
  ...nodes: (Node | string)[]
): void {
  this.sceneSlot(shell, slot).append(...nodes);
}
```

At the end of `createShell()`, append the frame after background/ambient elements:

```ts
shell.append(this.createSceneFrame());
return shell;
```

In `commit()`, replace the direct audio append with:

```ts
this.appendToSceneSlot(shell, "audio", this.audioControlPanel());
```

Move `.bgm-controls` into normal slot flow: explicitly remove `position: fixed`, `top`, `right`, and the debug-only `left` override. Set `position: relative`, `inset: auto`, `max-width: 100%`, and let `.scene-slot-audio { justify-self: end; align-self: start; }` own placement. Add a static style assertion rejecting fixed positioning and a 1280×720 bounding-box assertion that audio stays inside the SceneFrame and at least 16px from HUD/dialogue.

Keep the existing background elements outside `SceneFrame`; they remain below all slots.

- [ ] **Step 5: Verify GREEN**

```powershell
npm test -- tests/m5SceneFrame.test.ts tests/m5Presentation.test.ts
npm run check
```

Expected: tests and TypeScript PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/ui/sceneFrame.ts src/ui/gameView.ts src/styles.css tests/m5SceneFrame.test.ts
git commit -m "refactor(ui): add shared scene frame slots"
```

### Task 3: Consolidate typography, surfaces, safe zones, and z-index

**Files:**
- Create: `tests/m5StyleContract.test.ts`
- Modify: `src/styles.css:1-3171`

- [ ] **Step 1: Write the failing static style contract**

Create `tests/m5StyleContract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../src/styles.css", import.meta.url)),
  "utf8",
);

describe("M5 공통 UI 스타일 계약", () => {
  it("Pretendard와 공통 타입·surface·safe-zone·z-index 토큰을 한 번 정의한다", () => {
    expect(css).toContain("font-family: \"Pretendard Variable\"");
    for (const token of [
      "--font-ui",
      "--type-title",
      "--type-body",
      "--type-meta",
      "--surface-dialogue",
      "--surface-actions",
      "--surface-modal",
      "--safe-top",
      "--safe-bottom",
      "--safe-inline",
      "--z-background",
      "--z-character",
      "--z-dialogue",
      "--z-actions",
      "--z-hud",
      "--z-audio",
      "--speaker-juno",
      "--speaker-doyun",
      "--speaker-wraith",
      "--speaker-narration",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("대화 패널 최종 selector와 본문 font-family를 중복 소유하지 않는다", () => {
    expect(css.match(/^\.dialogue-panel\s*\{/gm)).toHaveLength(1);
    expect(css.match(/^body\s*\{/gm)).toHaveLength(1);
    expect(css).not.toMatch(/Georgia|Arial Black|Courier New/);
    expect(css).not.toMatch(/https?:\/\/(?:cdn|unpkg|cdnjs)/i);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5StyleContract.test.ts
```

Expected: FAIL because the font is not declared, common tokens are missing, and `.dialogue-panel` is repeated.

- [ ] **Step 3: Add the single token and font block**

Before deleting any historical block, inventory the four current `.dialogue-panel` owners in the test as a temporary migration fixture. The consolidated owner must preserve these explicit final semantics from the newest visual-novel contract:

- `position: relative`, `z-index: var(--z-dialogue)`, `align-self: flex-end`;
- `width: min(76vw, 1080px)`, `min-height: 154px`;
- at desktop heights up to 720px, `min-height: 0`, `max-height: 34vh`, reduced vertical padding, and internal text scrolling only when content exceeds the budget;
- centered or side-specific margins through `.dialogue-side-left/right/center` only;
- `padding: clamp(30px, 3vw, 42px) clamp(30px, 4vw, 54px) clamp(24px, 3vw, 38px)`;
- `overflow: visible`, `border-radius: 18px 18px 8px 8px`, `clip-path: none`;
- `background: var(--surface-dialogue)`, 14px blur, `box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)`;
- pseudo-elements and nameplate placement remain in their dedicated child/tone selectors;
- older cyan grid, left 5px border, clipped-corner panel, `overflow: hidden`, and earlier 920/1040px widths are removed.

Add static assertions for those retained values before changing CSS. The later viewport preview is the required rendered regression check; selector-count alone is not sufficient.

Put this block at the top of `src/styles.css`:

```css
@font-face {
  font-family: "Pretendard Variable";
  src: url("/the-judge-became-a-magical-girl/assets/font/PretendardVariable.woff2") format("woff2-variations");
  font-style: normal;
  font-weight: 45 920;
  font-display: swap;
}

:root {
  --font-ui: "Pretendard Variable", "Noto Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif;
  --type-title: clamp(2.75rem, 5.2vw, 6rem);
  --type-body: clamp(1rem, 1.25vw, 1.25rem);
  --type-meta: clamp(0.78rem, 0.9vw, 0.95rem);
  --surface-dialogue: rgb(11 12 24 / 82%);
  --surface-actions: rgb(11 12 24 / 88%);
  --surface-modal: rgb(11 12 24 / 76%);
  --safe-top: clamp(1rem, 2vw, 2rem);
  --safe-bottom: clamp(1rem, 2vw, 2rem);
  --safe-inline: clamp(1rem, 3vw, 3.75rem);
  --slot-gap: clamp(0.75rem, 1.25vw, 1rem);
  --z-background: 0;
  --z-character: 20;
  --z-dialogue: 30;
  --z-actions: 40;
  --z-hud: 50;
  --z-audio: 60;
  --speaker-juno: #ffe266;
  --speaker-doyun: #82d9ff;
  --speaker-wraith: #b88cff;
  --speaker-narration: #f5f5f7;
}

body {
  margin: 0;
  font-family: var(--font-ui);
}
```

Remove all later `body` blocks and merge their non-font declarations into this one. Replace all title/body/HUD/button/narration font stacks with `var(--font-ui)`.

- [ ] **Step 4: Add the desktop SceneFrame grid and merge repeated ownership**

Add one final owner for these selectors:

```css
.scene-frame {
  position: absolute;
  inset: var(--safe-top) var(--safe-inline) var(--safe-bottom);
  z-index: var(--z-character);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  grid-template-areas:
    "hud audio"
    "stage stage"
    "dialogue dialogue"
    "actions actions";
  gap: var(--slot-gap);
  pointer-events: none;
}

.scene-slot { min-width: 0; min-height: 0; }
.scene-slot > * { pointer-events: auto; }
.scene-slot-hud { grid-area: hud; z-index: var(--z-hud); }
.scene-slot-stage { grid-area: stage; z-index: var(--z-character); }
.scene-slot-dialogue { grid-area: dialogue; z-index: var(--z-dialogue); }
.scene-slot-actions { grid-area: actions; z-index: var(--z-actions); }
.scene-slot-audio { grid-area: audio; z-index: var(--z-audio); justify-self: end; }

.dialogue-panel {
  position: relative;
  z-index: var(--z-dialogue);
  align-self: flex-end;
  width: min(76vw, 1080px);
  min-height: 154px;
  margin-inline: auto;
  padding: clamp(30px, 3vw, 42px) clamp(30px, 4vw, 54px) clamp(24px, 3vw, 38px);
  overflow: visible;
  color: #f7f5ff;
  background: var(--surface-dialogue);
  border: 1px solid rgb(255 255 255 / 44%);
  border-radius: 18px 18px 8px 8px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  clip-path: none;
  backdrop-filter: blur(14px);
}

@media (max-height: 760px) and (min-width: 1024px) {
  .scene-slot-dialogue,
  .scene-slot-actions { min-height: 0; }
  .dialogue-panel {
    min-height: 0;
    max-height: 34vh;
    padding-block: clamp(18px, 2.4vh, 26px);
    overflow-y: auto;
  }
  .scene-slot-actions { max-height: 28vh; overflow-y: auto; }
}
```

Move only the inventoried retained declarations into this owner, then delete repeated blocks. Keep side selectors for margins/marker position and tone selectors such as `.dialogue-tone-juno` and `.dialogue-tone-wraith` only for accent border/nameplate differences. Do not carry forward the explicitly rejected historical values above.

The Task 2 pure budget helper makes the 1280×720 arithmetic executable without a DOM emulator. The shared first row uses `max(hud, audio)`, not their sum. Keep actual `getBoundingClientRect()` containment/intersection checks browser-only at 1280×720 and 1920×1080: every slot stays inside the frame and dialogue/actions/audio have zero intersection.

- [ ] **Step 5: Verify GREEN**

```powershell
npm test -- tests/m5StyleContract.test.ts tests/m5SceneFrame.test.ts tests/m5Presentation.test.ts
npm run check
```

Expected: all focused tests PASS and no repeated ownership remains for `body` or `.dialogue-panel`.

- [ ] **Step 6: Commit**

```powershell
git add src/styles.css tests/m5StyleContract.test.ts
git commit -m "refactor(ui): consolidate visual design tokens"
```

### Task 4: Build the approved title composition

**Files:**
- Modify: `tests/m5Presentation.test.ts:25-121`
- Modify: `src/ui/gameView.ts:54-55,590-775`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing title-copy contract**

Export and test these constants in `tests/m5Presentation.test.ts`:

```ts
expect(TITLE_PRODUCT_NAME).toBe("심사역은 마법소녀가 되었다");
expect(TITLE_MICROPHONE_HEADING).toBe("마이크 테스트");
expect(TITLE_MICROPHONE_PROMPT).toBe("“심사를 시작합니다.”");
expect(TITLE_MICROPHONE_IDLE).toBe("마이크를 연결해 입력을 확인해 주세요.");
for (const copy of [
  TITLE_PRODUCT_NAME,
  TITLE_MICROPHONE_HEADING,
  TITLE_MICROPHONE_PROMPT,
  TITLE_MICROPHONE_IDLE,
]) {
  expect(copy).not.toMatch(/마이크 준비|연결되어야 플레이|연결하고.*말해/);
}
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/m5Presentation.test.ts
```

Expected: FAIL because the title constants do not exist and current copy is repeated.

- [ ] **Step 3: Export the copy and simplify `renderTitle()`**

Add in `src/ui/gameView.ts`:

```ts
export const TITLE_PRODUCT_NAME = "심사역은 마법소녀가 되었다";
export const TITLE_MICROPHONE_HEADING = "마이크 테스트";
export const TITLE_MICROPHONE_PROMPT = "“심사를 시작합니다.”";
export const TITLE_MICROPHONE_IDLE = "마이크를 연결해 입력을 확인해 주세요.";
```

Build three semantic elements:

```ts
const titleHero = element("header", "title-hero");
titleHero.append(
  element("p", "title-eyebrow", "목소리로 이어지는 이야기"),
  element("h1", "title-heading", TITLE_PRODUCT_NAME),
  element("p", "title-subtitle", "늦은 밤, 한 심사역에게 도착한 이상한 요청"),
);

const microphoneCard = element("section", "title-microphone-card");
microphoneCard.setAttribute("aria-labelledby", "microphone-heading");
const microphoneHeading = element("h2", "microphone-heading", TITLE_MICROPHONE_HEADING);
microphoneHeading.id = "microphone-heading";
```

Use `TITLE_MICROPHONE_PROMPT` for the prompt and `TITLE_MICROPHONE_IDLE` for the initial status. Append device, meter, readout, prompt, status, connect button, and `title-actions` to `microphoneCard`. Append `titleHero` and `microphoneCard` to the `stage` slot. Do not wrap the left title in a black panel.

- [ ] **Step 4: Apply the approved desktop layout**

Add one owner for title layout:

```css
.game-shell[data-presentation-context="title"] .scene-frame {
  grid-template-columns: minmax(28rem, 1.2fr) minmax(30rem, 0.8fr);
  grid-template-areas:
    ". audio"
    "stage stage"
    ". ."
    ". .";
}

.game-shell[data-presentation-context="title"] .scene-slot-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(30rem, 0.8fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 6rem);
}

.title-hero {
  align-self: center;
  max-width: 58rem;
  color: #fff;
  text-shadow: 0 2px 28px rgb(0 0 0 / 72%);
}

.title-heading {
  margin: 0;
  font-size: var(--type-title);
  font-weight: 720;
  line-height: 1.02;
  letter-spacing: -0.045em;
  white-space: nowrap;
}

.title-microphone-card {
  align-self: center;
  padding: clamp(1.25rem, 2vw, 2rem);
  background: var(--surface-modal);
  border: 1px solid rgb(255 255 255 / 34%);
  border-radius: 1.25rem;
  backdrop-filter: blur(14px);
}

.title-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
```

At 1280×720, reduce the title font with the existing desktop-short media query but keep `white-space: nowrap`; do not add mobile behavior.

- [ ] **Step 5: Verify GREEN and both desktop viewports**

```powershell
npm test -- tests/m5Presentation.test.ts tests/m5SceneFrame.test.ts tests/m5StyleContract.test.ts
npm run check
```

Start the F: worktree UI and verify 1280×720 and 1920×1080:

- title is one line;
- left side has no black box;
- microphone card is right and translucent;
- Start/Resume is bottom-right inside the card;
- BGM controls do not overlap card or title;
- horizontal and vertical overflow are both 0.

- [ ] **Step 6: Commit**

```powershell
git add src/ui/gameView.ts src/styles.css tests/m5Presentation.test.ts
git commit -m "feat(ui): rebuild title composition"
```

### Task 5: Migrate story and ending screens to SceneFrame

**Files:**
- Modify: `src/ui/gameView.ts:777-924,1174-1365`
- Modify: `src/styles.css`
- Modify: `tests/m5Presentation.test.ts`

- [ ] **Step 1: Write the failing semantic placement resolver test**

Add and test this exported resolver:

```ts
expect(resolveSceneElementSlot("character")).toBe("stage");
expect(resolveSceneElementSlot("dialogue")).toBe("dialogue");
expect(resolveSceneElementSlot("actions")).toBe("actions");
expect(resolveSceneElementSlot("hud")).toBe("hud");
expect(resolveSceneElementSlot("audio")).toBe("audio");
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/m5Presentation.test.ts
```

Expected: FAIL because `resolveSceneElementSlot` does not exist.

- [ ] **Step 3: Implement the resolver**

Add in `src/ui/gameView.ts`:

```ts
export type SceneElementKind = "character" | "dialogue" | "actions" | "hud" | "audio";

export function resolveSceneElementSlot(kind: SceneElementKind): SceneFrameSlot {
  return kind === "character" ? "stage" : kind;
}
```

- [ ] **Step 4: Migrate each non-battle renderer without changing game behavior**

Use `appendToSceneSlot` as follows:

- `renderLine`: all character visuals to `stage`, panel to `dialogue`.
- `renderIncantation`: characters/effects to `stage`, incantation card text to `dialogue`, PTT/click controls to `actions`.
- `renderDialogue` and `renderDialogueReply`: all visuals to `stage`, dialogue card to `dialogue`, choices/PTT to `actions`.
- `renderEnding`: character visuals to `stage`, one ending card to `dialogue`, continue/restart controls to `actions`.
- `renderError`: error panel to `dialogue`.

Where a renderer currently builds one card containing text and actions, split only the final button/input wrapper out; keep all callbacks and labels unchanged. Do not introduce an event bus or alter `GameEngine`.

- [ ] **Step 5: Add the common non-overlap CSS**

```css
.scene-slot-stage {
  position: relative;
  overflow: visible;
}

.scene-slot-dialogue,
.scene-slot-actions {
  display: flex;
  justify-content: center;
}

.scene-slot-dialogue:empty,
.scene-slot-actions:empty,
.scene-slot-hud:empty {
  display: none;
}

.scene-slot-dialogue + .scene-slot-actions {
  margin-top: 0;
}
```

Delete obsolete absolute `bottom` declarations that positioned migrated dialogue/action panels against `.game-shell`.

- [ ] **Step 6: Verify all story and ending previews**

```powershell
npm test -- tests/m5Presentation.test.ts tests/m5DevScenePreview.test.ts tests/m5DoyunPresentation.test.ts
npm run check
```

Browser-check these dev scenes at 1280×720 and 1920×1080: `n0-review`, `n1-first-voice`, `n2-juno-intro`, `n3-wraith`, `n5-incantation`, GOOD/NORMAL/BAD ending previews. Expected: dialogue/actions gap at least 16px, BGM controls separate, faces/hands visible, overflow 0.

- [ ] **Step 7: Commit**

```powershell
git add src/ui/gameView.ts src/styles.css tests/m5Presentation.test.ts
git commit -m "refactor(ui): migrate story screens to scene frame"
```

### Task 6: Record font provenance and UI verification

**Files:**
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Run complete automated verification**

```powershell
npm run check
npm test
npm run build
git diff --check
```

Expected: TypeScript PASS, all Vitest tests PASS, build PASS with only the known Transformers chunk warning, diff check PASS.

- [ ] **Step 2: Record exact font and UI facts**

In `ASSET_MANIFEST.md`, add the exact WOFF2 bytes and SHA-256 from Task 1 plus source/runtime paths. In `PROVENANCE.md`, record upstream repository, tag `v1.3.9`, original filename, author/copyright, SIL OFL 1.1, download date, and local paths. In `DECISIONS.md`, record repository hosting, one font family, SceneFrame slots, and desktop-only scope. Put exact commands, counts, screenshots/viewports, overflow and console results in `IMPLEMENTATION_LOG.md`; explain shared slots and fallback fonts in `LEARNING_LOG.md`.

- [ ] **Step 3: Commit documentation**

```powershell
git add docs/assets/ASSET_MANIFEST.md docs/assets/PROVENANCE.md docs/dev/DECISIONS.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git commit -m "docs: record UI foundation and font provenance"
```

## Acceptance gate

- Pretendard v1.3.9 is local, source/runtime byte-identical, WOFF2, and OFL text is tracked.
- Runtime HTML/CSS has no font CDN dependency.
- `body` and `.dialogue-panel` each have one final owner.
- This plan's title, line, dialogue, incantation, error, and ending screens share `hud / stage / dialogue / actions / audio` slots. Transformation and battle join the contract in the required final plan.
- Title is one line, unboxed on left; translucent microphone card and CTA are on right.
- 1280×720 and 1920×1080 have x/y overflow 0 and no BGM/HUD/dialogue/action collision.
- No scenario, voice, battle, image, or audio behavior changed in this plan.
