# PTT Live Level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대화·변신 주문·전투의 기존 PTT 버튼 안에 현재 마이크 입력의 quiet/good/loud live fill을 표시한다.

**Architecture:** `beginBrowserRecording()`이 이미 연 단일 `MediaStream`에 Web Audio analyser를 붙이고 level observer를 `BrowserPttRecordingPort`와 `RecordedVoiceTurnController`를 거쳐 공통 view option으로 전달한다. `GameView`의 기존 두 hold-to-talk binder가 같은 버튼 presentation helper를 사용하며, recording session과 render replacement가 analyser/RAF/source/context/listener를 소유권에 맞게 정리한다.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 4, MediaRecorder, Web Audio API, Vanilla DOM/CSS

---

## Execution contract

- 승인된 A branch tip에서 생성된 branch `codex/ptt-live-meter`와 worktree `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\ptt-live-meter`만 사용한다.
- 시작 전 `git branch --show-current`가 정확히 `codex/ptt-live-meter`인지 확인한다. 다르면 중단한다. 기존 worktree의 branch를 바꾸지 않는다.
- A의 다섯 실제 실패 정책과 DEC-073, `IMPLEMENTATION_SPEC.md` §8.2, `QA_AND_DEMO.md` QP-04를 기준으로 삼는다.
- push, main merge, branch 변경, reset, revert, amend 금지. TDD. 명시 파일만 stage한다.
- title/Settings/microphone setup UI, title 문구·layout·meter를 바꾸지 않는다. 이미지·오디오 binary와 scenario도 바꾸지 않는다.

## File map

- Modify: `src/input/recording.ts` — 기존 capture stream의 live analyser, observer API, idempotent resource cleanup
- Modify: `src/input/transcription.ts` — `RecordedVoiceTurnController.press(observer)` 전달
- Modify: `src/input/audioLevel.ts` — live PTT percent/tone 순수 presentation
- Modify: `src/main.ts` — `voiceCapture.startCapture(observer)`와 `createVoiceTurn()` callback 연결; BGM duck/SFX suppression 보존
- Modify: `src/ui/gameView.ts` — `SharedVoiceOptions`, dialogue binder, common incantation/battle binder, render replacement cleanup
- Modify: `src/styles.css` — 기존 PTT 버튼 내부 fill/tone; 별도 meter layout 없음
- Create: `tests/pttLiveMeter.test.ts` — 단일 `getUserMedia`, live sequence, finish/abort/error cleanup
- Modify: `tests/m3Recording.test.ts` — controller observer forwarding/cancel
- Create: `tests/mainPttLiveMeter.test.ts` — main callback threading과 audio duck/suppression source contract
- Modify: `tests/m5Presentation.test.ts` — presentation/reset과 dialogue/incantation/battle exact binder contract
- Modify: `tests/keyboardPtt.test.ts` — T hold/release regression
- Modify after implementation: `docs/dev/IMPLEMENTATION_LOG.md` — 실제 명령·test count·브라우저/장치/viewport 결과
- Modify after implementation: `docs/dev/LEARNING_LOG.md` — 같은 stream 재사용과 자원 cleanup 이유

No second microphone stream, large standalone meter, technical dB text, per-frame ARIA updates, dependency, state/schema field, title change, or binary.

### Task 1: RED — specify live presentation and one-stream recording

**Files:**
- Create: `tests/pttLiveMeter.test.ts`
- Modify: `tests/m3Recording.test.ts`
- Test: `src/input/audioLevel.ts`, `src/input/recording.ts`, `src/input/transcription.ts`

- [ ] **Step 1: Add the pure presentation matrix**

```ts
it.each([
  [{ rmsDbfs: -60, peakDbfs: -50, clippingRatio: 0 }, 0, "quiet"],
  [{ rmsDbfs: -24, peakDbfs: -8, clippingRatio: 0 }, 60, "good"],
  [{ rmsDbfs: -4, peakDbfs: -0.2, clippingRatio: 0.01 }, 93, "loud"],
] as const)("live level을 %s fill과 %s tone으로 바꾼다", (metrics, percent, tone) => {
  expect(resolvePttLiveLevelPresentation(metrics)).toEqual({ percent, tone });
});
```

Use `meterPercent()` for exact percent; if its rounding produces a different middle value, assert that exact existing function result rather than duplicate arithmetic.

- [ ] **Step 2: Add a browser-session test with fake MediaRecorder/AudioContext/RAF**

The fake `getUserMedia` returns one `stream`; fake analyser emits quiet, good, loud sample arrays on three queued RAF ticks. Assert:

```ts
const session = await beginBrowserRecording(undefined, onLevel);
expect(getUserMedia).toHaveBeenCalledTimes(1);
expect(createMediaStreamSource).toHaveBeenCalledWith(stream);
runNextFrame();
runNextFrame();
runNextFrame();
expect(onLevel.mock.calls.map(([level]) => resolvePttLiveLevelPresentation(level).tone))
  .toEqual(["quiet", "good", "loud"]);
await session.finish();
expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
expect(source.disconnect).toHaveBeenCalledTimes(1);
expect(analyser.disconnect).toHaveBeenCalledTimes(1);
expect(context.close).toHaveBeenCalledTimes(1);
expect(track.stop).toHaveBeenCalledTimes(1);
```

Add separate abort and recorder-error cases. Each must assert listener removal and exactly-once cleanup. The error case rejects `finish()` with `브라우저 녹음 중 오류가 발생했습니다.`. Also assert recorder creation/start failure stops tracks and closes analyser resources.

- [ ] **Step 3: Add controller forwarding test**

Change the fake `PttRecordingPort.start` signature to accept an observer. Capture it, emit a metric, and assert the observer supplied to `RecordedVoiceTurnController.press(onLevel)` receives the same object. After `cancel()`, late emissions must not mutate UI-facing state.

- [ ] **Step 4: Verify RED**

```powershell
npm test -- tests/pttLiveMeter.test.ts tests/m3Recording.test.ts
```

Expected: FAIL because observer APIs and live analyser do not exist.

### Task 2: GREEN — analyse the same MediaStream and clean every terminal path

**Files:**
- Modify: `src/input/audioLevel.ts`
- Modify: `src/input/recording.ts`
- Modify: `src/input/transcription.ts`

- [ ] **Step 1: Add the live presentation API**

```ts
export type PttLiveLevelPresentation = MicrophoneMeterPresentation;

export function resolvePttLiveLevelPresentation(
  metrics: AudioLevelMetrics,
): PttLiveLevelPresentation {
  return resolveMicrophoneMeterPresentation(metrics, "sampling");
}
```

This is a thin public alias over the existing meter policy. Do not export private `evaluateMicrophoneTestSample()` or duplicate its thresholds.

- [ ] **Step 2: Thread the observer through recording/controller APIs**

```ts
export type LiveAudioLevelObserver = (metrics: AudioLevelMetrics) => void;
export type BeginRecording = (onLevel?: LiveAudioLevelObserver) => Promise<RecordingSession>;

export interface PttRecordingPort {
  start(onLevel?: LiveAudioLevelObserver): Promise<void>;
  stop(): Promise<RecordedAudio>;
  cancel(): void;
}
```

`PushToTalkCapture.press(onLevel)`, `BrowserPttRecordingPort.start(onLevel)`, and `RecordedVoiceTurnController.press(onLevel)` each forward the same callback once. In `main.ts`, construct the port with `(onLevel) => beginBrowserRecording(inputDeviceId, onLevel)`.

- [ ] **Step 3: Attach analyser after the existing one `getUserMedia` call**

In `beginBrowserRecording(deviceId?, onLevel?)`, keep its current constraints and call count. When observer exists, create one `AudioContext`, `MediaStreamAudioSourceNode`, and `AnalyserNode`; set `fftSize = 2048`, connect source to analyser, read `Float32Array` on RAF, and call `calculateAudioLevel(samples)`. Each tick checks the disposed flag before emitting or scheduling another frame. Never call `getUserMedia` from the observer helper.

Use one idempotent `dispose()` owned by the returned `RecordingSession`: cancel RAF, disconnect source/analyser, remove named `dataavailable`/`stop`/`error` listeners, stop all stream tracks, and close non-closed context. Call it from successful finish, recorder error, abort/cancel, and setup/start catch before rethrow. A second finish/abort must not duplicate cleanup.

- [ ] **Step 4: Verify GREEN**

```powershell
npm test -- tests/pttLiveMeter.test.ts tests/m3Recording.test.ts
npm run check
```

Expected: one stream, ordered live samples, and all terminal cleanup assertions PASS.

### Task 3: RED/GREEN — thread callback through main without audio regressions

**Files:**
- Create: `tests/mainPttLiveMeter.test.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Write main source-contract tests**

Require `voiceCapture.startCapture` to accept `onLevel`, preserve injection before audio changes, preserve duck/suppression before `voice.press(onLevel)`, and reset both on catch/finish/cancel:

```ts
expect(capture).toMatch(
  /startCapture: async \(onLevel: LiveAudioLevelObserver\)[\s\S]*consumeInjectedVoiceFailure[\s\S]*bgm\.setDucked\(true\)[\s\S]*sfx\.setSuppressed\(true\)[\s\S]*voice\.press\(onLevel\)/,
);
expect(capture.match(/bgm\.setDucked\(false\)/g)?.length).toBeGreaterThanOrEqual(3);
expect(capture.match(/sfx\.setSuppressed\(false\)/g)?.length).toBeGreaterThanOrEqual(3);
expect(createTurn).toContain("(onLevel) => beginBrowserRecording(inputDeviceId, onLevel)");
```

- [ ] **Step 2: Verify RED, implement, verify GREEN**

```powershell
npm test -- tests/mainPttLiveMeter.test.ts
```

Expected RED: callback types/calls absent. Modify imports and `voiceCapture`/`createVoiceTurn` exactly as asserted, then run:

```powershell
npm test -- tests/mainPttLiveMeter.test.ts tests/mainVoiceFailureInjection.test.ts tests/m5Audio.test.ts tests/m5Sfx.test.ts
npm run check
```

Expected GREEN: callback threading PASS; DEV failure injection still returns before mic/BGM/SFX acquisition; successful/error/cancel paths restore duck/suppression.

### Task 4: RED/GREEN — render one accessible button-internal fill on all surfaces

**Files:**
- Modify: `tests/m5Presentation.test.ts`
- Modify: `tests/keyboardPtt.test.ts`
- Modify: `src/ui/gameView.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write exact view tests**

Require `DialogueInputOptions` and `SharedVoiceOptions` to expose:

```ts
startCapture(onLevel: LiveAudioLevelObserver): Promise<void>;
```

Require dialogue `renderVoiceInput`, incantation `renderIncantation`, and battle `renderBattle` sections each to bind a `.ptt-button` through the live-level helper. For battle, require both spell and freeform buttons. Vitest has no DOM package here, so test the pure presentation and existing source-contract pattern:

```ts
expect(resolvePttLiveLevelPresentation(
  { rmsDbfs: -24, peakDbfs: -8, clippingRatio: 0 },
)).toEqual({ percent: 60, tone: "good" });
const levelHelper = rendererSection("function updatePttLiveLevel(", "export class GameView");
expect(levelHelper).toContain('fill.setAttribute("aria-hidden", "true")');
expect(levelHelper).toContain('style.setProperty("--ptt-live-level"');
expect(levelHelper).not.toContain("aria-valuenow");
```

Assert idle, processing, start error, finished error, cancelled, and render replacement all reset `--ptt-live-level` to `0%` and tone `quiet`. Keep `aria-pressed`, `aria-busy`, and existing labels as the accessible state; no live region or per-frame ARIA mutation.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/m5Presentation.test.ts tests/keyboardPtt.test.ts
```

Expected: FAIL because PTT live markup/state helper and callback signature are absent.

- [ ] **Step 3: Implement shared button presentation and render cleanup**

Create each PTT button through one helper that appends decorative `.ptt-level-fill[aria-hidden=true]` and `.ptt-button-label`; change `setPttButtonState()` to update the label without replacing children. `updatePttLiveLevel()` applies `resolvePttLiveLevelPresentation()` as CSS percent/tone only while listening. Both `renderVoiceInput()` and `bindHoldToTalk()` pass that updater into `options.startCapture(onLevel)`.

Track the active capture cancel callback in `GameView`. `commit()` calls and clears it before either root replacement or battle-stage replacement. Clear it before awaiting transcript rendering after a normal finish so a subsequent commit does not abort a completed capture. Reset level to zero before processing and on every catch/error/cancel.

Add CSS only under `.ptt-button`: isolate content with `overflow: hidden`, position fill behind label, transition width/color, and map quiet/good/loud to muted blue/green/coral. Preserve action size, label contrast, hover/focus/pressed states, and button click target. Do not add a standalone meter or dB string.

- [ ] **Step 4: Verify all three surfaces and keyboard semantics**

```powershell
npm test -- tests/m5Presentation.test.ts tests/keyboardPtt.test.ts tests/pttLiveMeter.test.ts tests/m3Recording.test.ts tests/mainPttLiveMeter.test.ts
npm run check
```

Expected: dialogue, incantation, battle spell/freeform share the helper; pointer/T/Space/Enter hold/release behavior remains PASS.

- [ ] **Step 5: Commit implementation as its independent rollback unit**

```powershell
git status --short
git add src/input/recording.ts src/input/transcription.ts src/input/audioLevel.ts src/main.ts src/ui/gameView.ts src/styles.css tests/pttLiveMeter.test.ts tests/m3Recording.test.ts tests/mainPttLiveMeter.test.ts tests/m5Presentation.test.ts tests/keyboardPtt.test.ts
git diff --cached --check
git commit -m "feat(voice): show live level in ptt"
```

### Task 5: Verification before completion and evidence

**Files:**
- Modify after verification: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify after verification: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Run fresh automated verification**

```powershell
npm run check
npm test
npm run build
git diff --check
```

Expected: TypeScript PASS, full Vitest PASS, Vite build PASS with only previously documented Transformers chunk warning, diff check PASS.

- [ ] **Step 2: Run desktop visual/browser QA**

At `1920×1080`, `1600×900`, and `1366×768`, test real game-mode dialogue, incantation, battle spell, and battle freeform. For each: pointer hold/release, focused Space/Enter, and global T show a smooth internal fill; quiet/good/loud tone follows voice; release immediately resets to zero while processing. Confirm no overflow, label loss, large meter, dB text, per-frame screen-reader announcement, double mic permission, or second `getUserMedia`. Replace the rendered scene while holding, cancel, force recorder error, and confirm mic indicator, browser recording icon, RAF, tracks, and AudioContext stop. Confirm BGM ducks and SFX suppress only during capture and restore afterward.

- [ ] **Step 3: Record facts after verification**

Append exact commit, commands, file/test counts, browser version, audio device class, all three viewport results, `getUserMedia` observation, cleanup/error observations, and PASS/PENDING items to `IMPLEMENTATION_LOG.md`. Add a short `LEARNING_LOG.md` explanation of reusing one stream and treating Web Audio cleanup as capture ownership. Do not rewrite DEC-073, implementation spec, QA matrix, title documentation, or asset records.

- [ ] **Step 4: Commit evidence**

```powershell
git add docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git diff --cached --check
git commit -m "docs: record ptt live level verification"
git status --short
```

## Acceptance gate

- One `getUserMedia` and one MediaStream per PTT capture; analyser uses that stream.
- Finish, abort, error, cancel, and render replacement clean analyser, RAF, source, AudioContext, listeners, and tracks exactly once.
- Dialogue, incantation, battle spell/freeform show the same button-internal quiet/good/loud fill.
- Idle, processing, error, and cancelled states show 0 level.
- Pointer, T, Space, Enter, BGM duck, and SFX suppression semantics remain unchanged.
- No large meter, technical dB text, per-frame ARIA announcement, title change, binary, new dependency, or schema field.
