# PC Title UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 PC TITLE을 작품명·세 메뉴·선택형 마이크·공유 BGM 설정이 있는 접근 가능한 첫 화면으로 교체하고, click/voice 새 게임과 저장 상태 보존 이어하기를 N0까지 연결한다.

**Architecture:** `titleView.ts`가 TITLE DOM·메뉴·설명·dialog를, `titleMicState.ts`가 아홉 상태 순수 FSM과 문구를 소유한다. `gameView.ts`는 기존 `bg_title` shell 생성과 TITLE 위임만, `main.ts`는 기존 Engine/Save/BGM/단일 `BrowserMicrophoneTester` 주입만 담당하며 GameState·시나리오·Worker는 바꾸지 않는다.

**Tech Stack:** TypeScript 7, Vite 8, Vanilla DOM/CSS, Vitest 4, Web Media/Web Audio API, local static WOFF2

---

## 실행 경계와 파일 지도

- 명시적 Phase C 구현 승인과 현재 Phase B tip 승인이 기록된 뒤에만 아래 preflight를 실행한다. 승인 전에 HEAD를 미리 고정하거나 branch/worktree를 만들지 않는다. 이 계획을 쓴 dirty worktree나 `main`에서 구현하지 않는다.

```powershell
$phaseBWorktree = 'F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\ptt-live-meter'
$titleWorktree = 'F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\pc-title-ui-ux'
$titleBranch = 'codex/pc-title-ui-ux'
if (-not (Test-Path -LiteralPath $phaseBWorktree)) { throw 'Approved Phase B source worktree is missing; stop and report.' }
$phaseBStatus = @(git -C $phaseBWorktree status --short)
if ($phaseBStatus.Count -ne 0) { throw 'Approved Phase B source worktree is dirty; stop and report.' }
if ((git -C $phaseBWorktree branch --show-current) -ne 'codex/ptt-live-meter') { throw 'Unexpected Phase B source branch; stop and report.' }
$phaseBHead = git -C $phaseBWorktree rev-parse HEAD
git -C $phaseBWorktree worktree list
git -C $phaseBWorktree show-ref --verify --quiet "refs/heads/$titleBranch"
if ($LASTEXITCODE -eq 0) { throw 'TITLE branch already exists; stop and report.' }
if (Test-Path -LiteralPath $titleWorktree) { throw 'TITLE worktree path already exists; stop and report.' }
git -C $phaseBWorktree worktree add -b $titleBranch $titleWorktree $phaseBHead
if ((git -C $titleWorktree branch --show-current) -ne $titleBranch) { throw 'TITLE branch verification failed.' }
$titleHead = git -C $titleWorktree rev-parse HEAD
if ($titleHead -ne $phaseBHead) { throw 'TITLE did not start at the approved Phase B tip.' }
git -C $phaseBWorktree worktree list
git -C $phaseBWorktree merge-base --is-ancestor $phaseBHead $titleHead
if ($LASTEXITCODE -ne 0) { throw 'TITLE ancestry verification failed.' }
$titleStatus = @(git -C $titleWorktree status --short)
if ($titleStatus.Count -ne 0) { throw 'New TITLE worktree is not clean; stop and report.' }
git -C $titleWorktree status --short
```

Expected: source/target status 출력은 비어 있고, source branch는 `codex/ptt-live-meter`, target branch는 `codex/pc-title-ui-ux`이며 target HEAD가 실행 시점에 승인받은 `$phaseBHead`와 같다. branch/HEAD/worktree/ancestry 검증이 모두 통과해야 한다. 승인 tip 불일치·잘못된 source·dirty 상태·이미 존재하는 branch/worktree면 재사용·삭제·switch하지 말고 중단해 보고한다. 이후 구현은 생성된 TITLE worktree에서만 한다. push, `main` merge, branch 변경, reset, revert, amend를 하지 않는다.

### Phase C 소유 파일

- Create: `src/ui/titleView.ts` — TITLE semantic DOM, 메뉴/설명, compact BGM, visual settings skeleton
- Create: `src/ui/title.css` — `[data-presentation-context="title"]` 아래 전용 데스크톱 스타일
- Create: `tests/m5TitleView.test.ts` — copy/DOM/CSS/asset/static interaction 계약
- Add only after font gate passes: `assets/source/fonts/maruburi/MaruBuri-SemiBold.woff2`, `assets/runtime/fonts/maruburi/MaruBuri-SemiBold.woff2`
- Add only after font gate passes: `assets/source/fonts/pretendard/Pretendard-Regular.woff2`, `assets/source/fonts/pretendard/Pretendard-SemiBold.woff2`, `assets/runtime/fonts/pretendard/Pretendard-Regular.woff2`, `assets/runtime/fonts/pretendard/Pretendard-SemiBold.woff2`
- Add only after font gate passes: `docs/assets/provenance/MARUBURI_LICENSE.txt`, `docs/assets/provenance/PRETENDARD_LICENSE.txt`
- Modify: `tests/m5Assets.test.ts`, `tests/m5Presentation.test.ts`, `vite.config.ts`, `src/main.ts`, `src/ui/gameView.ts`

### Phase D 소유 파일

- Create: `src/ui/titleMicState.ts`, `tests/titleMicState.test.ts`
- Modify: `src/ui/titleView.ts`, `src/ui/titleStart.ts`, `src/main.ts`
- Modify only if the listed adapter methods are necessary: `src/input/microphoneSetup.ts`
- Modify tests: `tests/m5TitleView.test.ts`, `tests/m5TitleStart.test.ts`, `tests/m5Microphone.test.ts`, `tests/m5Audio.test.ts`, `tests/mainVoiceLifecycle.test.ts`

### Phase E 소유 파일

- Modify only with observed results: `docs/assets/ASSET_MANIFEST.md`, `docs/assets/PROVENANCE.md`, `docs/dev/IMPLEMENTATION_LOG.md`, `docs/dev/LEARNING_LOG.md`
- Modify `docs/dev/DECISIONS.md` only if implementation forces a new accepted decision; DEC-071 반복 기록은 금지한다.

Do not change `src/state.ts`, `src/engine/nodeRunner.ts`, scenario JSON/schema, battle, Worker, background/BGM binaries, SFX, mobile CSS, or broad `GameView` ownership. `bg_title.webp` remains byte-identical. Phase C의 스타일 변경은 새 `src/ui/title.css`의 TITLE-scoped override만 허용하며 `src/styles.css`는 수정하지 않는다. 기존 전역 selector 때문에 이것이 불가능하면 임의로 ownership을 넓히지 말고 구현을 중단해 충돌 selector와 최소 대안을 보고한다.

## 고정 제품 계약

- Desktop only: 1920×1080, 1600×900, 1366×768. `scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`, and `document.documentElement.scrollHeight <= innerHeight` in TITLE and settings-open states.
- Keep `bg_title`; add only a CSS left dark-to-transparent overlay. Left title/menu, no center panel. NHN banner is covered only as much as necessary for text contrast.
- Title uses local MaruBuri SemiBold at weight 600. UI uses local Pretendard Regular/SemiBold. No CDN, variable font, mirror, synthesized weight, font modification, or TTF/OTF conversion.
- TITLE subtitle is `목소리로 이어지는 이야기`. One `h1` contains block spans on two lines, first `심사역은`, second `마법소녀가 되었다`; only `마법소녀` may use soft pink while preserving one accessible heading.
- Menu labels: `게임 시작`, `이어하기`, `설정`. Exact descriptions:
  - `목소리로 이어지는 이야기를 처음부터 시작합니다.`
  - save present: `마지막으로 저장된 장면부터 이야기를 이어갑니다.`
  - save absent: `아직 저장된 이야기가 없습니다.`
  - `음량과 마이크 등 플레이 환경을 설정합니다.`
- Default menu is transparent white with no glow. Hover/focus only: soft pink fill, dark navy text, thin border, subtle glow and one decorative sparkle; 120–180ms. Active scale is `.98`. Reduced motion removes movement/entrance transitions.
- TITLE entry runs once only: background fade 400ms, subtitle fade 300ms, h1 fade with a small upward offset 400ms, menu at +100ms, and mic affordance at +150ms. No repeating animation. `prefers-reduced-motion: reduce` displays the final state immediately.
- `이어하기` always uses a real focusable button. No save means `aria-disabled="true"`, never native `disabled`; pointer, Enter, and Space do nothing except retain the no-save description.
- `설정` is a real modal dialog containing only existing BGM mute/volume, input device, microphone test, and options actually supported by current code. X, `닫기`, Escape close it; focus is trapped, background is inert/blocked, and focus returns to `설정`.
- No permission request on entry. Only explicit `마이크 설정`/test or voice start/resume may call `getUserMedia`. Mic never prevents a click start.
- Mic states are exactly `UNKNOWN`, `REQUESTING_PERMISSION`, `READY`, `TESTING`, `TEST_SUCCESS`, `DENIED`, `NO_DEVICE`, `UNSUPPORTED`, `ERROR`. `TEST_SUCCESS` persists until start, retest, or real device change.
- Every TITLE microphone status uses non-critical `aria-live="polite"`. Multi-line bodies retain their exact newline through a `[data-title-mic-body] { white-space: pre-line; }` rule owned only by `title.css`; do not flatten them into one line or promote ordinary status to an assertive alert.
- `UNKNOWN` `게임 시작` offers voice/click; `DENIED`/`NO_DEVICE`/`UNSUPPORTED`/`ERROR` still offers click; `READY`/`TEST_SUCCESS` voice starts directly. A browser-confirmed denied permission gets settings guidance, not a fake retry prompt.
- No-save `이어하기` blocks. Click save resumes unchanged. Voice save with mic not voice-capable offers exact buttons `음성 설정 후 이어하기` and `클릭 모드로 이어하기`; click choice calls `engine.resume({ ...loaded.state, inputMode: "click" })` once. It must not call `engine.setInputMode`, because that writes the override back to the repository immediately. Existing localStorage bytes and every other state field stay unchanged until a later normal game save.
- `bgm_daily` is not requested on load. First pointer/keyboard user gesture invokes the existing `BgmController.play("bgm_daily")`; its existing NotAllowedError retry remains the only retry. New/corrupt preferences remain 20% unmuted; valid stored volume/mute wins. Mockup 30% is not a runtime default.

## Phase C — PC TITLE visual skeleton

### Task C1: Establish clean Phase B base and run the official-font gate

**Files:** font source/runtime/license files listed above; `tests/m5Assets.test.ts`; `vite.config.ts`

- [ ] **Step 1: Confirm baseline and record pre-change tests**

```powershell
Set-Location 'F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\pc-title-ui-ux'
git status --short
npm run check
npm test
npm run build
```

Expected: clean status and all three commands PASS. A Phase B failure blocks Phase C; do not hide or repair unrelated failures.

- [ ] **Step 2: Inspect official archives before writing a font test or copying bytes**

MaruBuri authority is `https://hangeul.naver.com/font` / its official `마루 부리 글꼴 다운로드`; Pretendard authority is `https://github.com/orioncactus/pretendard` tag `v1.3.9` and its OFL `LICENSE`. Download official archives to an OS temp directory, list archive entries, and inspect bundled license/copyright. Do not use `fonts-archive`, CDN files, npm repacks, third-party mirrors, or another tag.

Gate:

1. MaruBuri must contain an official unmodified static SemiBold WOFF2 plus its official license.
2. Pretendard v1.3.9 must contain official unmodified static Regular and SemiBold WOFF2 plus OFL 1.1.
3. If either official package lacks required static WOFF2, stop the font step before creating repository files. Report archive URL, entry list, license, and two choices: approve original TTF/OTF format exception, or compare another official webfont. Do not convert, subset, rename bytes from a mirror, or continue C commit until user approval.

- [ ] **Step 3: Write the failing asset contract after the gate passes**

Add one table-driven test in `tests/m5Assets.test.ts` for the three exact source/runtime pairs. Assert file magic `wOF2`, nonzero size, source/runtime `Buffer.equals`, SHA-256 equality, and license text identifying NAVER MaruBuri and Pretendard SIL OFL 1.1. Assert runtime font count is exactly three, font 추가 뒤 `assets/runtime/` 전체 재귀 합계가 `30 * 1024 * 1024` bytes 이하이고, `vite.config.ts` maps `.woff2` to `font/woff2`.

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected RED: exact local font files are missing.

- [ ] **Step 4: Copy only approved official bytes**

Create the exact source/runtime paths from the file map. Copy SemiBold MaruBuri and Regular/SemiBold Pretendard without conversion or modification; copy official license text. Add `".woff2": "font/woff2"` to `contentTypes`. Record byte counts and SHA-256 for Phase E, but do not write outcome docs yet.

```powershell
npm test -- tests/m5Assets.test.ts
npm run check
```

Expected GREEN: three font contracts and MIME contract PASS; each pair has identical hashes.

### Task C2: Extract TITLE DOM and lock the visual contract

**Files:** `src/ui/titleView.ts`, `src/ui/title.css`, `src/main.ts`, `src/ui/gameView.ts`, `tests/m5TitleView.test.ts`, `tests/m5Presentation.test.ts`

- [ ] **Step 1: Write RED copy/ownership tests**

Create `tests/m5TitleView.test.ts`. Import these constants from `titleView.ts` and assert their exact values:

```ts
export const TITLE_MENU_COPY = {
  start: { label: "게임 시작", description: "목소리로 이어지는 이야기를 처음부터 시작합니다." },
  continueWithSave: { label: "이어하기", description: "마지막으로 저장된 장면부터 이야기를 이어갑니다." },
  continueWithoutSave: { label: "이어하기", description: "아직 저장된 이야기가 없습니다." },
  settings: { label: "설정", description: "음량과 마이크 등 플레이 환경을 설정합니다." },
} as const;
```

Static assertions must require `button`, `input type="range"`, `select`, and `dialog`; `이어하기` `aria-disabled`; shared description `aria-describedby`; and reject a central `.title-block` microphone gate. Read `title.css` and require title-scoped selectors, `[data-title-mic-body] { white-space: pre-line; }`, MaruBuri SemiBold `@font-face`/h1 at weight 600, only Pretendard 400/600 faces, overlay, 120–180ms interaction transition, the one-shot 300/400ms entry timings with +100/+150ms delays, `scale(.98)`, `:focus-visible`, and reduced-motion final-state override. Reject infinite/repeating animation, `http`, `@import`, variable fonts, x/y `overflow:auto|scroll`, and mobile media rules. Phase D adds activation, mic-body DOM/line rendering, focus-trap, and Escape assertions.

```powershell
npm test -- tests/m5TitleView.test.ts tests/m5Presentation.test.ts
```

Expected RED: `titleView.ts`/`title.css` do not exist and GameView still owns `renderTitle()` internals.

- [ ] **Step 2: Create the stable TitleView boundary**

Export these interfaces from `titleView.ts`; keep event effects behind callbacks so save/engine/BGM remain in `main.ts`:

```ts
export type TitleInputMode = "voice" | "click";
export interface TitleAudioOptions {
  getVolume(): number; isMuted(): boolean;
  onVolumeChange(volume: number): void; onMutedChange(muted: boolean): void;
}
export interface TitleViewOptions {
  hasSave: boolean;
  savedInputMode: TitleInputMode | null;
  warning: string | null;
  audio: TitleAudioOptions;
  onFirstUserGesture(): void;
  onNewGame(mode: TitleInputMode, calibration: MicrophoneCalibration | null): void;
  onResume(mode: TitleInputMode, calibration: MicrophoneCalibration | null): void;
}
export class TitleView {
  constructor(private readonly shell: HTMLElement, private readonly options: TitleViewOptions) {}
  render(): void;
  destroy(): void;
}
```

C skeleton renders left `header` with subtitle `목소리로 이어지는 이야기`, one `h1` split into block lines `심사역은`/`마법소녀가 되었다`, `nav` with three real buttons and one shared `aria-live` description, top-right compact BGM controls using `options.audio`, and a closed settings `dialog`. Keep interaction callbacks safe but defer mic/start/resume state logic to Phase D.

- [ ] **Step 3: Make GameView a minimal delegate**

In `main.ts`, add `import "./ui/title.css";` immediately after `import "./styles.css";`. In `gameView.ts`, import `TitleView`/`TitleViewOptions`, replace monolithic `renderTitle()` with shell creation plus `new TitleView(shell, options).render()`, and let `commit` skip its generic BGM panel for TITLE so the compact control is not duplicated. Destroy the prior title view before replacing its shell. Do not touch non-title renderer structure.

- [ ] **Step 4: Implement scoped desktop layout**

Use `@font-face` with the configured Vite base `/the-judge-became-a-magical-girl/assets/fonts/...`; the static test must match `vite.config.ts` base and forbid remote URLs. `.game-shell[data-presentation-context="title"]` owns fixed 100dvh, hidden overflow, the dark-to-transparent `::after` overlay, safe insets, left title/menu, top-right BGM, and modal layer. All title children sit above the overlay. At 1366×768 use height/width clamps only; add no mobile layout.

- [ ] **Step 5: Verify GREEN and three visual skeletons**

```powershell
npm test -- tests/m5TitleView.test.ts tests/m5Presentation.test.ts tests/m5Assets.test.ts
npm run check
npm run build
npm run dev -- --host 127.0.0.1
```

At 1920×1080, 1600×900, 1366×768 verify: unchanged background, readable left title/menu, banner minimally covered, compact BGM top-right, no central panel, no clipping/overlap, and both scroll axes zero. Verify the entry sequence runs once with the exact timings and reduced motion skips to the final state. Capture one screenshot and viewport measurement per size for Phase E.

- [ ] **Step 6: Commit Phase C once**

```powershell
git add src/ui/titleView.ts src/ui/title.css src/ui/gameView.ts src/main.ts vite.config.ts tests/m5TitleView.test.ts tests/m5Presentation.test.ts tests/m5Assets.test.ts assets/source/fonts assets/runtime/fonts docs/assets/provenance/MARUBURI_LICENSE.txt docs/assets/provenance/PRETENDARD_LICENSE.txt
git diff --cached --check
git commit -m "feat(ui): rebuild pc title screen"
```

## Phase D — PC TITLE interaction

### Task D1: Implement the pure nine-state microphone model

**Files:** `src/ui/titleMicState.ts`, `tests/titleMicState.test.ts`

- [ ] **Step 1: Write exhaustive RED reducer tests**

Define and test this public contract:

```ts
export const TITLE_MIC_STATES = ["UNKNOWN", "REQUESTING_PERMISSION", "READY", "TESTING", "TEST_SUCCESS", "DENIED", "NO_DEVICE", "UNSUPPORTED", "ERROR"] as const;
export type TitleMicState = (typeof TITLE_MIC_STATES)[number];
export type TitleMicEvent =
  | { type: "REQUEST_SETUP" } | { type: "PERMISSION_GRANTED" }
  | { type: "START_TEST" } | { type: "TEST_PASSED" }
  | { type: "PERMISSION_DENIED"; canRequestAgain: boolean }
  | { type: "NO_DEVICE" } | { type: "UNSUPPORTED" } | { type: "FAILED" }
  | { type: "DEVICE_CHANGED" } | { type: "RETEST" } | { type: "STARTED_GAME" };
export function reduceTitleMic(state: TitleMicState, event: TitleMicEvent): TitleMicState;
export function isTitleMicVoiceCapable(state: TitleMicState): boolean;
export interface TitleMicPresentationContext {
  readonly deviceLabel?: string;
  readonly canRequestAgain?: boolean;
}
export function presentTitleMic(state: TitleMicState, context?: TitleMicPresentationContext): { heading: string; body: string; action: string | null; live: "polite" };
```

아래 heading/body/action/live를 exact table-test한다. 표의 `\n`은 실제 newline 한 글자이며 `null`은 action button을 렌더하지 않는다는 뜻이다. 모든 상태는 ordinary status이므로 `live`는 `polite`이며 critical alert처럼 과장하지 않는다.

| 상태/context | heading | body | action | live |
|---|---|---|---|---|
| `UNKNOWN` | `음성 플레이` | `목소리로 대답하고 직접 주문을 외칠 수 있습니다.\n마이크 없이도 플레이할 수 있습니다.` | `마이크 설정` | `polite` |
| `REQUESTING_PERMISSION` | `마이크 확인 중` | `사용 가능한 입력 장치를 확인하고 있습니다...` | `null` | `polite` |
| `READY` + `deviceLabel` | `마이크 준비됨` | `{deviceLabel}\n마이크 없이도 플레이할 수 있습니다.` | `마이크 테스트` | `polite` |
| `TESTING` | `목소리를 확인하고 있어요.` | `평소 목소리로 한 문장을 말해주세요.\n“심사를 시작합니다.”` | `null` | `polite` |
| `TEST_SUCCESS` | `테스트 완료` | `목소리가 정상적으로 확인되었습니다.` | `다시 테스트` | `polite` |
| `DENIED` + `canRequestAgain: true` | `마이크가 꺼져 있습니다.` | `음성 플레이를 사용하려면 마이크 권한이 필요합니다.` | `다시 설정` | `polite` |
| `DENIED` + `canRequestAgain: false` | `마이크가 꺼져 있습니다.` | `주소창의 사이트 설정에서 마이크 권한을 허용한 뒤 다시 확인해 주세요.` | `null` | `polite` |
| `NO_DEVICE` | `사용 가능한 마이크가 없습니다.` | `마이크를 연결한 뒤 다시 확인하거나 마이크 없이 플레이할 수 있습니다.` | `다시 확인` | `polite` |
| `UNSUPPORTED` | `이 브라우저에서는 음성 입력을 사용할 수 없습니다.` | `마이크 없이 클릭으로 플레이해 주세요.` | `null` | `polite` |
| `ERROR` | `마이크를 확인할 수 없습니다.` | `잠시 후 다시 시도하거나 마이크 없이 플레이해 주세요.` | `다시 시도` | `polite` |

Table-test every approved transition. Required sequences: `UNKNOWN→REQUESTING_PERMISSION→READY→TESTING→TEST_SUCCESS`; success stays on irrelevant samples; retest gives `TESTING`; an eligible real device change gives `READY`; game start resets/destroys it. `UNSUPPORTED` differs from `ERROR`. Voice-capable is true only for `READY` and `TEST_SUCCESS`.

```powershell
npm test -- tests/titleMicState.test.ts
```

Expected RED: module missing.

- [ ] **Step 2: Implement minimal reducer/presentation and verify GREEN**

Implement only the tested state/event matrix; invalid events return the current state. Do not put navigator, DOM, stream, save, or engine access in this file.

```powershell
npm test -- tests/titleMicState.test.ts
npm run check
```

### Task D2: Share one microphone tester and connect settings

**Files:** `src/input/microphoneSetup.ts` only if needed, `src/ui/titleView.ts`, `tests/m5Microphone.test.ts`, `tests/m5TitleView.test.ts`

- [ ] **Step 1: Add RED ownership/resource tests**

Assert `main.ts` constructs `new BrowserMicrophoneTester()` exactly once and passes that instance to TITLE/settings. Assert first explicit setup/voice action calls `connect/getUserMedia` once and the callback continues receiving metrics. After connect resolves and at least one audio input is confirmed, state becomes `READY`, but READY samples do not enter the calibration accumulator. Pressing `마이크 테스트` resets the accumulator and enters `TESTING` without reconnecting or increasing `getUserMedia` count; the same callback then updates meter/calibration and a passing sample sequence enters persistent `TEST_SUCCESS`.

TITLE lifetime owns exactly one `devicechange` subscription. Settings close must retain it; game start and `TitleView.destroy()` must unsubscribe it exactly once. In `UNKNOWN` or whenever no tester connection exists, `devicechange` only invalidates/refreshes the cached device list and must call neither `connect` nor `getUserMedia`. Only `hasActiveConnection === true` and state가 `READY`, `TESTING`, or `TEST_SUCCESS`인 경우에만 same tester를 disconnect/reconnect한 뒤 `READY`로 전환한다. `REQUESTING_PERMISSION`의 in-flight connect는 두 번째 connect를 만들지 않고 list/state만 invalidate한다. 모든 branch는 recorded explicit-permission history를 보존하고 concurrent stream이나 synthetic permission prompt를 만들지 않는다. Add tests for every branch, reconnect-to-READY, unsubscribe ownership, unchanged `canRequestAgain`, and exact connect/getUserMedia counts. Also test settings-open/render makes zero permission/connect calls, retest count stays one, start/destroy cleanup runs, and DOMException mapping is `NotAllowedError→DENIED`, `NotFoundError→NO_DEVICE`, `API absence→UNSUPPORTED`, `other failures→ERROR`. Node/Vitest unit and source-contract tests require exact body strings containing `\n`, one `[data-title-mic-body]` selector, `title.css` source containing `white-space: pre-line`, and `aria-live="polite"` for every state; no `assertive` branch exists. They do not call `getComputedStyle()` or claim visible line layout. Add source contracts for click/Enter/Space no-save guards, X/닫기/Escape, focus trap/return, background inert, and cleanup.

- [ ] **Step 2: Add only the adapters TitleView cannot own safely**

If required, add to the existing tester—not a second abstraction—`queryPermission(): Promise<PermissionState | "unknown">` and `subscribeDeviceChange(listener: () => void): () => void`. Unsupported Permissions API returns `"unknown"`; the unsubscribe removes the exact listener. Keep `connect`/`disconnect` and stream ownership unchanged.

Extend, rather than replace, the Phase C view contract:

```ts
export interface TitleMicrophoneOptions {
  supported: boolean;
  connect(deviceId: string | undefined, onLevel: (metrics: AudioLevelMetrics) => void): Promise<MicrophoneConnection>;
  disconnect(): Promise<void>;
  queryPermission(): Promise<PermissionState | "unknown">;
  subscribeDeviceChange(listener: () => void): () => void;
}
// Add `microphone: TitleMicrophoneOptions` to TitleViewOptions.
```

- [ ] **Step 3: Render one functional settings dialog**

TitleView uses the same audio callbacks as compact BGM and the same microphone callbacks as start/resume. Dialog contains BGM mute, 0–100 range/current output, actual `audioinput` select, mic test button/meter/status, X and `닫기`. Opening it does not request permission. An explicit mic setup connects once; connect resolution plus a confirmed device enters READY while metrics are ignored for calibration. Test starts by resetting the accumulator only, reuses the live callback/stream, and enters TEST_SUCCESS on pass. Retest never reconnects. TITLE render/start owns the one `devicechange` subscription; Settings close retains it, while game start/destroy unsubscribes. Apply the `hasActiveConnection && READY|TESTING|TEST_SUCCESS` reconnect-to-READY guard from Step 1; a `REQUESTING_PERMISSION` connect remains single in-flight. Implement a focus trap over enabled focusables, Escape close, `inert` on the title content behind the dialog, and trigger focus restoration. Start/destroy disconnects the tester through the existing entry helper. Never render unsupported fake options as working controls.

```powershell
npm test -- tests/titleMicState.test.ts tests/m5Microphone.test.ts tests/m5TitleView.test.ts
npm run check
```

Expected GREEN: all FSM, error, single-stream, modal and accessibility contracts PASS.

### Task D3: Connect new game, resume, BGM gesture, and Title→N0

**Files:** `src/ui/titleStart.ts`, `src/ui/titleView.ts`, `src/main.ts`, listed Phase D tests

- [ ] **Step 1: Write RED decision and gesture tests**

Extend `titleStart.ts` with pure/testable policy, preserving `enterGameFromTitle` synchronous-enter-then-async-disconnect behavior:

```ts
export type TitleActivation =
  | { kind: "offer-start-modes" } | { kind: "start"; mode: "voice" | "click" }
  | { kind: "blocked-no-save" } | { kind: "resume"; mode: "voice" | "click" }
  | { kind: "offer-voice-resume-modes" };
export function resolveTitleStart(state: TitleMicState): TitleActivation;
export function resolveTitleResume(hasSave: boolean, savedMode: InputMode | null, state: TitleMicState): TitleActivation;
export function withTitleResumeMode(state: GameState, mode: InputMode): GameState;
export function installFirstTitleGesture(target: TitleGestureTarget, play: () => void): () => void;
```

Test UNKNOWN offers modes; READY/TEST_SUCCESS starts voice; failure states permit click; no-save blocks; click save resumes click; voice save + non-capable mic offers two resume modes; voice-capable resumes voice. `withTitleResumeMode` must return a runtime copy whose only changed field is `inputMode`, leave the source snapshot untouched, and preserve node/history/affinity/flags/sttFailCount. Gesture test fires pointerdown/keydown repeatedly and expects one `play` call plus listener cleanup; installation alone expects zero.

- [ ] **Step 2: Wire exact actions in TitleView**

`UNKNOWN`에서 mode dialog가 표시될 때 `클릭 모드로 시작` 선택을 항상 유지한다. `음성으로 시작` is the only dialog branch that may request permission. `READY`/`TEST_SUCCESS`는 dialog 없이 voice로 바로 시작한다. No-save `이어하기` guards pointer/click and key activation. Voice-save choice dialog uses the two exact labels; its click branch never touches mic. 설정 description/status updates through one `aria-live` region.

- [ ] **Step 3: Inject existing services in main**

Pass `savedInputMode: loaded.state?.inputMode ?? null`, existing audio callbacks, single tester callbacks, and `onFirstUserGesture: () => { void bgm.play("bgm_daily"); }`. New game callback resets recent turns/voice failure session then calls `engine.startNewGame(mode)`. Resume callback resets only transient voice failure attempts and calls `engine.resume(withTitleResumeMode(loaded.state!, mode))`; it never calls `engine.setInputMode`. Assign calibration/device only when present. Call `enterGameFromTitle` so engine transition happens before tester disconnect cleanup.

- [ ] **Step 4: Add regression assertions**

`m5Audio.test.ts`: no title-load `play`, first gesture one `bgm_daily`, stored 37%/mute unchanged, fresh/corrupt 20%, controller NotAllowedError retry unchanged. `mainVoiceLifecycle.test.ts`: reset before new/resume, resume preserves saved `sttFailCount`, click override is supplied to `engine.resume` and `engine.setInputMode` is absent. `m5TitleStart.test.ts`: all activation tables, no-save click/Enter/Space block, source snapshot equality, and localStorage/repository bytes unchanged immediately after click override. `m5Presentation.test.ts`: `isActBoundaryTransition("title", "n0_review")` remains true. Add a deterministic main/source integration assertion that click `게임 시작` calls `startNewGame("click")` and current node is N0; voice calls `startNewGame("voice")`.

```powershell
npm test -- tests/titleMicState.test.ts tests/m5TitleView.test.ts tests/m5TitleStart.test.ts tests/m5Microphone.test.ts tests/m5Audio.test.ts tests/mainVoiceLifecycle.test.ts tests/m5Presentation.test.ts tests/engine.test.ts
npm run check
npm run build
```

Expected: targeted suite, TypeScript, and build PASS; no new GameState field or scenario change.

- [ ] **Step 5: Commit Phase D once**

```powershell
git add src/ui/titleMicState.ts src/ui/titleView.ts src/ui/titleStart.ts src/input/microphoneSetup.ts src/main.ts tests/titleMicState.test.ts tests/m5TitleView.test.ts tests/m5TitleStart.test.ts tests/m5Microphone.test.ts tests/m5Audio.test.ts tests/mainVoiceLifecycle.test.ts tests/m5Presentation.test.ts
git diff --cached --check
git commit -m "feat(ui): connect title interactions"
```

If `src/input/microphoneSetup.ts` stayed unchanged, omit it from `git add`; do not manufacture a change.

## Phase E — verification and factual documentation

### Task E1: Run automated and browser matrices

**Files:** no production changes

- [ ] **Step 1: Run full automated gate**

```powershell
npm run check
npm test
npm run build
npm run build:qa
git diff --check
```

Expected: all commands PASS. `build:qa` exists in current `package.json`; do not mark N/A. Record counts, duration, and exact warnings without converting warnings into PASS claims.

- [ ] **Step 2: Run the three-viewport layout matrix**

At each viewport, test TITLE default, each menu hover/focus/active, no-save/save `이어하기`, compact BGM, `설정` open, mic status, and modal close paths. In DevTools evaluate:

```js
({
  viewport: [innerWidth, innerHeight],
  xScroll: document.documentElement.scrollWidth - innerWidth,
  yScroll: document.documentElement.scrollHeight - innerHeight,
  bodyYScroll: document.body.scrollHeight - innerHeight,
})
```

Expected for 1920×1080, 1600×900, 1366×768: all scroll deltas `<= 0`; title/menu/mic/BGM/modal pairwise rectangle intersections are zero; banner remains materially visible. Record screenshots and numeric results, not visual guesses.

Then serve the cold QA build with `npm run preview -- --host 127.0.0.1`. For each official viewport, enable DevTools **Disable cache**, use **Empty cache and hard reload**, and capture three independent trials. Every trial must show the three WOFF2 requests returning HTTP 200 with response MIME `font/woff2`; `document.fonts.check("600 1em 'MaruBuri'")`, `document.fonts.check("400 1em 'Pretendard'")`, and `document.fonts.check("600 1em 'Pretendard'")` must all be true. Define cold first-screen time as the maximum of `PerformanceNavigationTiming.loadEventEnd` and the three font `PerformanceResourceTiming.responseEnd` values; each of the three trials at each viewport must be `<= 3000ms`. Record the nine raw timings and network/font evidence. A miss is a failure to investigate, not an average-away result.

- [ ] **Step 3: Run interaction/accessibility matrix**

Cover mouse and keyboard; no-save and click/voice saves; UNKNOWN, REQUESTING_PERMISSION, READY, TESTING, TEST_SUCCESS, DENIED, NO_DEVICE, UNSUPPORTED, ERROR; every status uses `aria-live="polite"`; in the actual browser, assert `getComputedStyle(micBody).whiteSpace === "pre-line"` and visually confirm the UNKNOWN/READY/TESTING newline bodies occupy two lines. This computed-style/visible-layout evidence belongs only to Phase E browser QA. Also cover X/닫기/Escape; focus trap/return/background block; reduced motion; first-gesture BGM/persistence/autoplay retry; one tester/stream; settings-open permission calls zero; connect/getUserMedia one; READY metrics ignored; test/retest reconnect count unchanged; click `게임 시작` through N0; READY voice start through N0; click save normal resume; voice-save setup resume; voice-save click override with repository bytes and node/history/affinity/flags/sttFailCount unchanged except runtime `inputMode="click"`. Denied with browser-level permanent denial must show settings guidance and make no fake re-request. Mic failures must never block click progress.

- [ ] **Step 4: Inspect forbidden changes and runtime artifacts**

```powershell
git diff --name-only HEAD~2..HEAD
git diff --stat HEAD~2..HEAD
git status --short
Get-FileHash -Algorithm SHA256 assets\source\fonts\maruburi\MaruBuri-SemiBold.woff2,assets\runtime\fonts\maruburi\MaruBuri-SemiBold.woff2,assets\source\fonts\pretendard\Pretendard-Regular.woff2,assets\runtime\fonts\pretendard\Pretendard-Regular.woff2,assets\source\fonts\pretendard\Pretendard-SemiBold.woff2,assets\runtime\fonts\pretendard\Pretendard-SemiBold.woff2
```

Expected: only planned files, identical source/runtime pairs, `assets/runtime/` total `<= 30 MiB`, no `src/styles.css`/scenario/Worker/battle/background/BGM/SFX/mobile changes, and clean status before documentation edits.

### Task E2: Record only observed outcomes

**Files:** Phase E documents listed above

- [ ] **Step 1: Update asset facts**

In `ASSET_MANIFEST.md`, add exactly three runtime fonts with family/weight/format/bytes/hash/source/runtime identity and QA state. Update runtime file count/bytes from disk. In `PROVENANCE.md`, record official page/repository, exact archive or tag `v1.3.9`, upstream entry names, copyright/license, download date, local paths, hashes, and the fact that no modification/conversion/CDN occurred. Do not claim approval beyond evidence.

- [ ] **Step 2: Update implementation/learning facts**

In `IMPLEMENTATION_LOG.md`, record Phase C/D commit IDs, exact automated command results, three viewport numbers/screenshots, interaction/mic/save/BGM/Title→N0 results, and any failed/retested case. In `LEARNING_LOG.md`, explain why optional mic, one tester, session-only click override, and first-gesture BGM reduce failure without changing saved story state. Update `DECISIONS.md` only if an actual new user-approved decision occurred.

- [ ] **Step 3: Re-run docs/diff gate and commit Phase E once**

```powershell
npm run check
npm test
npm run build
npm run build:qa
git diff --check
git status --short
git add docs/assets/ASSET_MANIFEST.md docs/assets/PROVENANCE.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git diff --cached --check
git commit -m "docs(qa): verify pc title experience"
```

Add `docs/dev/DECISIONS.md` only if Step 2 legitimately changed it. Expected: exact three commits in order: `feat(ui): rebuild pc title screen`, `feat(ui): connect title interactions`, `docs(qa): verify pc title experience`.

## Final acceptance gate

- Local official static WOFF2 only; source/runtime identical; license/provenance complete; no CDN/conversion/variable font; runtime total `<= 30 MiB`.
- `bg_title` bytes and all scenario/engine schema/Worker/battle/BGM/SFX assets unchanged.
- Desktop three-viewport scroll deltas zero and no title/menu/mic/BGM/modal overlap; banner minimally covered.
- Menu copy/styles/keyboard behavior exact; no-save `이어하기` stays focusable and inert.
- All nine mic states distinct, success persistence correct, denial guidance accurate, one tester/stream, no entry permission prompt.
- `설정` uses shared BGM/mic state and passes dialog focus/X/닫기/Escape/background blocking.
- New click/voice starts reach N0. Saves resume correctly; voice-save click override passes a copied state to `engine.resume`, preserves repository bytes/story state, and changes only runtime session input mode without `engine.setInputMode`.
- `bgm_daily` begins only after first gesture through existing controller/retry; 20% default and valid stored values pass.
- Full check/test/build/build:qa, all three viewports' three-trial cold-load `<= 3s` with font HTTP/MIME/`document.fonts.check` evidence, browser matrices, factual docs, diff/status pass. No push or `main` merge.
