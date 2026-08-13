# Audio and Voice Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신규 사용자의 BGM 기본값을 20%로 맞추고, 시작 입력에서 재생을 활성화하며, 음성 실패를 한국어 상태로 분류해 같은 턴 재시도와 클릭 복구를 일관되게 제공한다.

**Architecture:** `src/audio/bgm.ts`는 설정과 재생 채널만 소유하고, `src/input/transcription.ts`는 raw 오류를 typed failure로 바꾼다. `src/input/voiceTurnRecovery.ts`는 모든 dialogue/incantation/battle이 공유하는 순수 실패 정책을 제공하며 `src/main.ts`는 현재 턴 키와 영속 상태만 연결한다.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 4, Web Audio/HTMLAudioElement, MediaRecorder, Zod 4

---

## Scope and file ownership

- Create: `src/ui/titleStart.ts` — 시작 버튼의 동기 실행 순서
- Create: `src/input/voiceTurnRecovery.ts` — 같은 턴 재시도와 누적 실패 결정
- Modify: `src/audio/bgm.ts` — 20% 기본값, 중단된 fade 채널 정리
- Modify: `src/input/transcription.ts` — typed voice failure와 안전한 문구
- Modify: `src/input/audioLevel.ts` — 실제 판정 기반 meter presentation
- Modify: `src/ui/gameView.ts` — 시작 순서, meter 표시, 현재 턴 클릭 복구
- Modify: `src/main.ts` — dialogue/incantation/battle 공통 실패 정책 연결
- Test: `tests/m5Audio.test.ts`
- Test: `tests/m5TitleStart.test.ts`
- Test: `tests/m3Transcription.test.ts`
- Test: `tests/m3Recording.test.ts`
- Test: `tests/voiceTurnRecovery.test.ts`
- Test: `tests/m5Microphone.test.ts`
- Document: `docs/dev/DECISIONS.md`
- Document: `docs/dev/IMPLEMENTATION_LOG.md`
- Document: `docs/dev/LEARNING_LOG.md`

Do not change scenario text, game branching, image/audio binaries, Worker API routes, or public deployment in this plan.

**Execution guard:** Run only in `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline` on the existing branch. Overall order is **A Audio/Voice → B UI Foundation → C Narrative → D Transformation/Battle/Ending**. Shared-file implementation is sequential and independent reviewers do not edit. Do not push, merge main, change branches, reset, revert, or amend. New task commits are allowed.

### Task 1: BGM default and fade-through-silence transition cleanup

**Files:**
- Modify: `tests/m5Audio.test.ts:14-188`
- Modify: `src/audio/bgm.ts:8-225`

- [ ] **Step 1: Write failing BGM preference and channel lifecycle tests**

Add these cases inside `describe("M5 BGM 제어", ...)`:

```ts
it("신규·손상 설정은 20%를 사용하고 유효한 기존 설정은 보존한다", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  expect(BGM_DEFAULT_VOLUME).toBe(0.2);
  expect(loadBgmPreferences(storage)).toEqual({ volume: 0.2, muted: false });

  saveBgmPreferences(storage, { volume: 0.37, muted: true });
  expect(loadBgmPreferences(storage)).toEqual({ volume: 0.37, muted: true });

  values.set(BGM_PREFERENCES_STORAGE_KEY, "{broken");
  expect(loadBgmPreferences(storage)).toEqual({ volume: 0.2, muted: false });
});

it("fade 도중 새 cue가 오면 이전 두 채널을 모두 정리하고 최신 채널만 남긴다", async () => {
  vi.useFakeTimers();
  const channels = [fakeChannel(), fakeChannel(), fakeChannel()];
  let index = 0;
  const controller = new BgmController(() => channels[index++]!, 600, null);

  await controller.play("bgm_daily");
  await vi.advanceTimersByTimeAsync(300);
  await controller.play("bgm_crisis");
  await vi.advanceTimersByTimeAsync(300);
  await controller.play("bgm_battle");

  expect(channels[0]!.pause).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(600);
  expect(channels[1]!.pause).toHaveBeenCalledOnce();
  expect(channels[2]!.pause).not.toHaveBeenCalled();
  expect(channels[2]!.volume).toBe(0.2);
});

it("서로 다른 cue는 앞 곡을 먼저 닫은 뒤 다음 곡을 연다", async () => {
  vi.useFakeTimers();
  const channels = [fakeChannel(), fakeChannel()];
  let index = 0;
  const controller = new BgmController(() => channels[index++]!, 600, null);

  await controller.play("bgm_daily");
  await vi.advanceTimersByTimeAsync(600);
  await controller.play("bgm_crisis");
  await vi.advanceTimersByTimeAsync(300);

  expect(channels[0]!.pause).toHaveBeenCalledOnce();
  expect(channels[1]!.volume).toBe(0);

  await vi.advanceTimersByTimeAsync(300);
  expect(channels[1]!.volume).toBe(0.2);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- tests/m5Audio.test.ts
```

Expected: FAIL because `BGM_DEFAULT_VOLUME` is `0.62`, the first channel is orphaned by an interrupted fade, and the old implementation overlaps both tracks throughout the transition.

- [ ] **Step 3: Implement the 20% default and live-channel retirement**

Change the constant and add a live set in `BgmController`:

```ts
export const BGM_DEFAULT_VOLUME = 0.2;

export class BgmController {
  private current: { id: string; channel: AudioChannel } | null = null;
  private readonly liveChannels = new Set<AudioChannel>();
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
```

After `await next.play()` succeeds, register the channel before setting `current`:

```ts
this.clearAutoplayRetry();
this.liveChannels.add(next);
const previous = this.current?.channel ?? null;
this.current = { id: logicalId, channel: next };
this.fadeThroughSilence(previous, next);
```

Replace `stop()` and `crossfade()` with a two-half transition: first half fades the old cue out completely, then the second half fades the new cue in. This avoids the audible BPM collision reported in the playtest.

```ts
stop(): void {
  this.cancelFade();
  for (const channel of this.liveChannels) channel.pause();
  this.liveChannels.clear();
  this.current = null;
  this.clearAutoplayRetry();
}

private fadeThroughSilence(previous: AudioChannel | null, next: AudioChannel): void {
  this.cancelFade();
  for (const channel of [...this.liveChannels]) {
    if (channel === previous || channel === next) continue;
    channel.pause();
    this.liveChannels.delete(channel);
  }
  const previousStartVolume = previous?.volume ?? 0;
  const steps = 12;
  const midpoint = steps / 2;
  let step = 0;
  next.volume = 0;
  this.fadeTimer = setInterval(() => {
    step += 1;
    if (step <= midpoint) {
      const fadeOutProgress = step / midpoint;
      if (previous) previous.volume = (1 - fadeOutProgress) * previousStartVolume;
      if (step === midpoint && previous) {
        previous.pause();
        this.liveChannels.delete(previous);
      }
      return;
    }

    const fadeInProgress = (step - midpoint) / (steps - midpoint);
    next.volume = Math.min(1, fadeInProgress) * this.targetVolume();
    if (step < steps) return;
    this.cancelFade();
  }, Math.max(16, this.fadeDurationMs / steps));
}

private cancelFade(): void {
  if (this.fadeTimer) clearInterval(this.fadeTimer);
  this.fadeTimer = null;
}
```

In the audio `error` listener, remove `next` from `liveChannels` after pausing it:

```ts
next.pause();
this.liveChannels.delete(next);
this.current = null;
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- tests/m5Audio.test.ts
npm run check
```

Expected: all `m5Audio` tests PASS and TypeScript check PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/audio/bgm.ts tests/m5Audio.test.ts
git commit -m "fix(audio): stabilize bgm defaults and transitions"
```

### Task 2: Preserve the start-button user gesture

**Files:**
- Create: `src/ui/titleStart.ts`
- Create: `tests/m5TitleStart.test.ts`
- Modify: `src/ui/gameView.ts:351-362,756-770`

- [ ] **Step 1: Write the failing order test**

Create `tests/m5TitleStart.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { enterGameFromTitle } from "../src/ui/titleStart";

describe("타이틀 시작 입력", () => {
  it("게임 진입을 동기 호출한 뒤 마이크 연결을 비동기로 정리한다", async () => {
    const order: string[] = [];
    let finishDisconnect!: () => void;
    const disconnect = vi.fn(
      () => new Promise<void>((resolve) => {
        finishDisconnect = () => {
          order.push("disconnect");
          resolve();
        };
      }),
    );

    enterGameFromTitle(() => order.push("enter"), disconnect);

    expect(order).toEqual(["enter"]);
    finishDisconnect();
    await vi.waitFor(() => expect(order).toEqual(["enter", "disconnect"]));
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5TitleStart.test.ts
```

Expected: FAIL because `src/ui/titleStart.ts` does not exist.

- [ ] **Step 3: Implement the synchronous entry helper and use it**

Create `src/ui/titleStart.ts`:

```ts
export function enterGameFromTitle(
  enterGame: () => void,
  disconnectMicrophone: () => Promise<void>,
): void {
  enterGame();
  void disconnectMicrophone();
}
```

Import it in `src/ui/gameView.ts`:

```ts
import { enterGameFromTitle } from "./titleStart";
```

Replace both delayed title handlers with synchronous entry:

```ts
startButton.addEventListener("click", () => {
  const acceptedCalibration = calibration;
  if (!acceptedCalibration) return;
  startButton.disabled = true;
  enterGameFromTitle(
    () => options.onNewGame(acceptedCalibration),
    options.disconnectMicrophone,
  );
});

resumeButton?.addEventListener("click", () => {
  const acceptedCalibration = calibration;
  if (!acceptedCalibration) return;
  resumeButton!.disabled = true;
  enterGameFromTitle(
    () => options.onResume(acceptedCalibration),
    options.disconnectMicrophone,
  );
});
```

This makes `renderCurrent()` call `bgm.play()` during the original click stack instead of waiting for `disconnectMicrophone()`.

- [ ] **Step 4: Verify GREEN**

```powershell
npm test -- tests/m5TitleStart.test.ts tests/m5Audio.test.ts
npm run check
```

Expected: both test files PASS and TypeScript check PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/ui/titleStart.ts src/ui/gameView.ts tests/m5TitleStart.test.ts
git commit -m "fix(audio): preserve title start gesture"
```

### Task 3: Classify voice failures and block raw errors

**Files:**
- Modify: `tests/m3Transcription.test.ts:1-83`
- Modify: `tests/m3Recording.test.ts:1-84`
- Modify: `src/input/transcription.ts:45-60,155-206,208-345`
- Modify: `src/ui/gameView.ts:40-43,2067-2137`

- [ ] **Step 1: Write failing classification and presentation tests**

Extend the imports in `tests/m3Transcription.test.ts` with `classifyVoiceInputError`, then add:

```ts
it.each([
  [new DOMException("denied", "NotAllowedError"), "permission", "마이크 권한"],
  [new TypeError("Failed to fetch"), "network", "음성 서버"],
  [new Error("STT timeout"), "timeout", "예상보다 오래"],
  [new Error("Realtime 음성 요청 실패 (503)"), "http", "음성 서버"],
  [new Error("STT Worker 응답이 JSON이 아닙니다: <html>"), "schema", "응답 형식"],
  [new Error("전사문이 비어 있습니다."), "no-speech", "목소리를 찾지"],
  [new Error("Unable to decode audio data"), "recording", "녹음이 너무 짧"],
] as const)("%s 오류를 %s 상태와 안전한 문구로 바꾼다", (error, kind, phrase) => {
  const failure = classifyVoiceInputError(error);
  const message = formatVoiceInputError(failure);

  expect(failure.kind).toBe(kind);
  expect(message).toContain(phrase);
  expect(message).not.toMatch(/Failed to fetch|<html>|503|Realtime|STT Worker/i);
});
```

Add this test to `tests/m3Recording.test.ts`:

```ts
it("전사 오류를 raw Error 대신 typed failure로 반환한다", async () => {
  const recording: PttRecordingPort = {
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => ({
      wavBlob: new Blob(["voice"], { type: "audio/wav" }),
      level,
    })),
    cancel: vi.fn(),
  };
  const transcription: TranscriptionPort = {
    provider: "openai",
    transcribe: vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  };
  const controller = new RecordedVoiceTurnController(recording, transcription);

  await controller.press();
  await expect(controller.release()).resolves.toMatchObject({
    kind: "error",
    failure: { kind: "network" },
  });
});
```

Replace the existing formatter-only assertion in `tests/m3Transcription.test.ts` so it follows the new typed API instead of passing a raw `Error`:

```ts
expect(
  formatVoiceInputError(
    classifyVoiceInputError(new Error("Unable to decode audio data")),
  ),
).toContain("녹음이 너무 짧");
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/m3Transcription.test.ts tests/m3Recording.test.ts
```

Expected: FAIL because typed failure exports and `failure` result do not exist.

- [ ] **Step 3: Implement the typed failure contract**

Add these types and functions in `src/input/transcription.ts`:

```ts
export type VoiceFailureKind =
  | "recording"
  | "permission"
  | "network"
  | "timeout"
  | "http"
  | "schema"
  | "no-speech";

export interface VoiceInputFailure {
  readonly kind: VoiceFailureKind;
  readonly debugMessage: string;
}

export function classifyVoiceInputError(error: unknown): VoiceInputFailure {
  const value = toError(error);
  const message = value.message.trim();
  if (value instanceof DOMException && value.name === "NotAllowedError") {
    return { kind: "permission", debugMessage: message };
  }
  if (/unable to decode audio data/i.test(message)) {
    return { kind: "recording", debugMessage: message };
  }
  if (/전사문이 비어|no speech/i.test(message)) {
    return { kind: "no-speech", debugMessage: message };
  }
  if (/timeout|시간 초과/i.test(message)) {
    return { kind: "timeout", debugMessage: message };
  }
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return { kind: "network", debugMessage: message };
  }
  if (/요청 실패 \([45][0-9]{2}\)/i.test(message)) {
    return { kind: "http", debugMessage: message };
  }
  if (/응답이 JSON이 아닙니다|zod|invalid.*response|schema/i.test(message)) {
    return { kind: "schema", debugMessage: message };
  }
  return { kind: "recording", debugMessage: message };
}

export function formatVoiceInputError(failure: VoiceInputFailure): string {
  switch (failure.kind) {
    case "permission":
      return "마이크 권한을 사용할 수 없어.";
    case "network":
    case "http":
      return "음성 서버에 연결하지 못했어.";
    case "timeout":
      return "음성 처리가 예상보다 오래 걸렸어.";
    case "schema":
      return "음성 서버 응답 형식을 확인하지 못했어.";
    case "no-speech":
      return "녹음에서 목소리를 찾지 못했어.";
    case "recording":
      return "녹음이 너무 짧아 음성을 처리하지 못했어.";
  }
}
```

Change `RecordedVoiceResult` and controller error returns:

```ts
export type RecordedVoiceResult =
  | {
      kind: "transcript";
      transcript: string;
      audioLevel: AudioLevelMetrics;
      observation: TranscriptionObservation;
    }
  | { kind: "cancelled" }
  | { kind: "error"; failure: VoiceInputFailure };
```

```ts
if (!transcript) {
  return {
    kind: "error",
    failure: classifyVoiceInputError(new Error("전사문이 비어 있습니다.")),
  };
}
```

```ts
return { kind: "error", failure: classifyVoiceInputError(error) };
```

In both `GameView` finished-capture error branches, preserve the typed failure instead of formatting it in the view:

```ts
options.onTurnFailed(result.failure);
```

In both press/start catch branches, replace `microphoneErrorMessage(error)` with `classifyVoiceInputError(error)` and pass that typed value to `options.onUnavailable(...)`. Update the relevant option callback types to `VoiceInputFailure`; Task 4 will make both callbacks converge on one recovery adapter. Do not stringify the failure inside `GameView`.

Keep `failure.debugMessage` out of production DOM. Diagnostics may log it with `console.warn` only in debug mode.

- [ ] **Step 4: Verify GREEN and forbidden-string coverage**

```powershell
npm test -- tests/m3Transcription.test.ts tests/m3Recording.test.ts tests/m5Presentation.test.ts
npm run check
```

Expected: focused tests PASS; no test DOM-facing string contains `Failed to fetch`, HTML, status code, model, or provider.

- [ ] **Step 5: Commit**

```powershell
git add src/input/transcription.ts src/ui/gameView.ts tests/m3Transcription.test.ts tests/m3Recording.test.ts
git commit -m "fix(voice): classify input failures safely"
```

### Task 4: Apply one retry policy to dialogue, incantation, and battle

**Files:**
- Create: `src/input/voiceTurnRecovery.ts`
- Create: `src/input/voiceFailureInjection.ts`
- Create: `tests/voiceTurnRecovery.test.ts`
- Create: `tests/voiceFailureInjection.test.ts`
- Create: `tests/mainVoiceFailureInjection.test.ts`
- Create: `tests/mainVoiceLifecycle.test.ts`
- Modify: `src/main.ts:136-142,213-282,285-578,580-751`
- Modify: `src/ui/gameView.ts:364-437,845-923,978-1074`
- Modify: `tests/state.test.ts:75-90`
- Modify: `tests/m5Presentation.test.ts`

- [ ] **Step 1: Write the failing pure-policy tests**

Create `tests/voiceTurnRecovery.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  clearVoiceFailureAttempts,
  formatVoiceTurnFailureMessage,
  resolveUnavailableVoiceFailure,
  resolveVoiceTurnFailure,
} from "../src/input/voiceTurnRecovery";
import { resolveDebugVoiceFailure } from "../src/input/voiceFailureInjection";

describe("음성 실패 복구 정책", () => {
  it("첫 실패는 같은 턴 음성을 유지하고 누적 실패를 올리지 않는다", () => {
    expect(resolveVoiceTurnFailure(0, 4)).toEqual({
      nextAttemptInTurn: 1,
      countFailedTurn: false,
      forceClickForTurn: false,
      forceGlobalClick: false,
    });
  });

  it("두 번째 실패는 현재 턴 클릭으로 전환하고 실패한 턴을 한 번 센다", () => {
    expect(resolveVoiceTurnFailure(1, 3)).toEqual({
      nextAttemptInTurn: 0,
      countFailedTurn: true,
      forceClickForTurn: true,
      forceGlobalClick: false,
    });
  });

  it("첫 실패와 두 번째 실패의 안내가 서로 상충하지 않는다", () => {
    const first = formatVoiceTurnFailureMessage("음성 서버에 연결하지 못했어.", "retry");
    const second = formatVoiceTurnFailureMessage("음성 서버에 연결하지 못했어.", "click");
    expect(first).toContain("한 번 더");
    expect(first).not.toContain("클릭");
    expect(second).toContain("이 턴은 클릭");
    expect(second).not.toMatch(/한 번 더|다시 시도/);
  });

  it("다섯 번째 실패 턴의 두 번째 실패에서만 전체 클릭 모드가 된다", () => {
    expect(resolveVoiceTurnFailure(1, 4)).toEqual({
      nextAttemptInTurn: 0,
      countFailedTurn: true,
      forceClickForTurn: true,
      forceGlobalClick: true,
    });
  });

  it.each(["dialogue", "incantation", "battle"] as const)(
    "%s permission/device-open 실패는 1회 재시도 후 현재 턴 click이다",
    () => {
      expect(resolveUnavailableVoiceFailure(true, 0, 0)).toMatchObject({
        forceClickForTurn: false,
        forceGlobalClick: false,
      });
      expect(resolveUnavailableVoiceFailure(true, 1, 0)).toMatchObject({
        forceClickForTurn: true,
        forceGlobalClick: false,
      });
    },
  );

  it("브라우저 녹음 API 자체 미지원만 즉시 전역 click이다", () => {
    expect(resolveUnavailableVoiceFailure(false, 0, 0)).toMatchObject({
      forceClickForTurn: true,
      forceGlobalClick: true,
      capabilityUnavailable: true,
    });
  });

  it("voice failure 주입은 debug URL에서만 허용한다", () => {
    expect(resolveDebugVoiceFailure("?voiceFailure=network", false)).toBeNull();
    expect(resolveDebugVoiceFailure("?debug=1&voiceFailure=network", true)).toBe("network");
    expect(resolveDebugVoiceFailure("?debug=1&voiceFailure=unknown", true)).toBeNull();
  });

  it.each(["new-game", "resume", "ending-restart"] as const)(
    "%s 세션 진입은 이전 턴 attempt를 비운다",
    () => {
      const attempts = new Map([["dialogue:n1_first_voice:0", 1]]);
      clearVoiceFailureAttempts(attempts);
      expect(attempts.size).toBe(0);
    },
  );
});
```

Create `tests/voiceFailureInjection.test.ts` in the same RED step:

```ts
import { describe, expect, it } from "vitest";
import {
  consumeDebugVoiceFailure,
  createPendingDebugVoiceFailure,
} from "../src/input/voiceFailureInjection";

describe("debug 음성 실패 주입", () => {
  it("production에서는 query를 무시한다", () => {
    expect(
      createPendingDebugVoiceFailure(
        "?debug=1&voiceFailure=network&voiceFailureCount=2",
        true,
        false,
      ),
    ).toEqual({ kind: null, remaining: 0 });
  });

  it("기본값은 다음 capture 한 번만 typed failure로 소비한다", () => {
    const pending = createPendingDebugVoiceFailure(
      "?debug=1&voiceFailure=permission",
      true,
      true,
    );
    expect(consumeDebugVoiceFailure(pending)).toEqual({
      kind: "permission",
      debugMessage: "debug injected permission",
    });
    expect(consumeDebugVoiceFailure(pending)).toBeNull();
  });

  it("수동 2회 실패 검수는 각 capture에서 한 항목씩 소비한다", () => {
    const pending = createPendingDebugVoiceFailure(
      "?debug=1&voiceFailure=network&voiceFailureCount=2",
      true,
      true,
    );
    expect(consumeDebugVoiceFailure(pending)?.kind).toBe("network");
    expect(consumeDebugVoiceFailure(pending)?.kind).toBe("network");
    expect(consumeDebugVoiceFailure(pending)).toBeNull();
  });
});
```

Also create `tests/mainVoiceFailureInjection.test.ts` before production edits. Read `src/main.ts` and assert it imports `createPendingDebugVoiceFailure`/`consumeDebugVoiceFailure`, creates one pending holder at bootstrap while passing both `debugEnabled` and `import.meta.env.DEV`, expands the common helper to `voiceCapture(voice, turnKey)`, and checks this exact statement before real capture begins:

```ts
if (consumeInjectedVoiceFailure(turnKey)) return;
```

Assert the three existing spread call sites pass their stable keys as the second argument: `voiceCapture(voice, dialogueTurnKey)`, `voiceCapture(voice, incantationTurnKey)`, and `voiceCapture(voice, battleTurnKey)`. The wiring test must also reject direct `engine.setInputMode()` and direct game-action submission inside `consumeInjectedVoiceFailure`; injected and real failures must enter the same `handleTypedVoiceFailure()` adapter.

Before production wiring, add `tests/m5Presentation.test.ts` RED contracts for all three renderers. Read the rendered control model used by `renderDialogue`, `renderIncantation`, and `renderBattle` (not one repeated boolean-only assertion) and assert that `forceClickForTurn: true` yields click actions but no `음성 입력으로 전환` control for each surface. Add a `tests/mainVoiceLifecycle.test.ts` source/wiring contract asserting title New Game, title Resume, and ending restart each call the shared session-reset helper before their engine state transition. This test is intentionally RED until Step 4 connects the callbacks.

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/voiceTurnRecovery.test.ts tests/voiceFailureInjection.test.ts tests/mainVoiceFailureInjection.test.ts tests/m5Presentation.test.ts tests/mainVoiceLifecycle.test.ts
```

Expected: FAIL because the policy/injection modules, typed next-capture consumption, three-surface callback wiring, renderer control model, and session-reset wiring do not exist.

- [ ] **Step 3: Implement the pure policy**

Create `src/input/voiceTurnRecovery.ts`:

```ts
export interface VoiceTurnFailureDecision {
  readonly nextAttemptInTurn: number;
  readonly countFailedTurn: boolean;
  readonly forceClickForTurn: boolean;
  readonly forceGlobalClick: boolean;
}

export function formatVoiceTurnFailureMessage(
  baseMessage: string,
  next: "retry" | "click",
): string {
  return next === "retry"
    ? `${baseMessage} 같은 턴에서 한 번 더 말해 줘.`
    : `${baseMessage} 이 턴은 클릭으로 진행해 줘.`;
}

export function resolveVoiceTurnFailure(
  attemptInTurn: number,
  accumulatedFailedTurns: number,
): VoiceTurnFailureDecision {
  if (attemptInTurn <= 0) {
    return {
      nextAttemptInTurn: 1,
      countFailedTurn: false,
      forceClickForTurn: false,
      forceGlobalClick: false,
    };
  }
  return {
    nextAttemptInTurn: 0,
    countFailedTurn: true,
    forceClickForTurn: true,
    forceGlobalClick: accumulatedFailedTurns + 1 >= 5,
  };
}

export function resolveUnavailableVoiceFailure(
  recordingSupported: boolean,
  attemptInTurn: number,
  accumulatedFailedTurns: number,
): VoiceTurnFailureDecision & { readonly capabilityUnavailable: boolean } {
  if (!recordingSupported) {
    return {
      nextAttemptInTurn: 0,
      countFailedTurn: false,
      forceClickForTurn: true,
      forceGlobalClick: true,
      capabilityUnavailable: true,
    };
  }
  return {
    ...resolveVoiceTurnFailure(attemptInTurn, accumulatedFailedTurns),
    capabilityUnavailable: false,
  };
}

export function clearVoiceFailureAttempts(attempts: Map<string, number>): void {
  attempts.clear();
}
```

Create `src/input/voiceFailureInjection.ts`:

```ts
import type { VoiceInputFailure } from "./transcription";

const DEBUG_VOICE_FAILURES = [
  "permission", "recording", "no-speech", "timeout", "http", "schema", "network",
] as const;
export type DebugVoiceFailure = (typeof DEBUG_VOICE_FAILURES)[number];

export interface PendingDebugVoiceFailure {
  kind: DebugVoiceFailure | null;
  remaining: number;
}

export function resolveDebugVoiceFailure(
  search: string,
  debugEnabled: boolean,
): DebugVoiceFailure | null {
  if (!debugEnabled) return null;
  const value = new URLSearchParams(search).get("voiceFailure");
  return DEBUG_VOICE_FAILURES.find((kind) => kind === value) ?? null;
}

export function createPendingDebugVoiceFailure(
  search: string,
  debugEnabled: boolean,
  developmentBuild: boolean,
): PendingDebugVoiceFailure {
  if (!developmentBuild) return { kind: null, remaining: 0 };
  const kind = resolveDebugVoiceFailure(search, debugEnabled);
  if (!kind) return { kind: null, remaining: 0 };
  const requestedCount = Number(new URLSearchParams(search).get("voiceFailureCount") ?? "1");
  return {
    kind,
    remaining: requestedCount === 2 ? 2 : 1,
  };
}

export function consumeDebugVoiceFailure(
  pending: PendingDebugVoiceFailure,
): VoiceInputFailure | null {
  if (!pending.kind || pending.remaining <= 0) return null;
  const kind = pending.kind;
  pending.remaining -= 1;
  if (pending.remaining === 0) pending.kind = null;
  return { kind, debugMessage: `debug injected ${kind}` };
}
```

- [ ] **Step 4: Connect turn keys and current-turn click rendering**

In `src/main.ts`, import the helper and add state next to `battleVolumeFailures`:

```ts
import { formatVoiceInputError } from "./input/transcription";
import {
  consumeDebugVoiceFailure,
  createPendingDebugVoiceFailure,
} from "./input/voiceFailureInjection";
import {
  clearVoiceFailureAttempts,
  formatVoiceTurnFailureMessage,
  resolveUnavailableVoiceFailure,
  resolveVoiceTurnFailure,
} from "./input/voiceTurnRecovery";

const voiceFailureAttempts = new Map<string, number>();
```

Export a shared control model from `gameView.ts` and make all three renderers consume it before appending controls:

```ts
export function resolveVoiceControlContract(
  surface: "dialogue" | "incantation" | "battle",
  inputMode: InputMode,
  speechSupported: boolean,
  forceClickForTurn: boolean,
): {
  readonly surface: "dialogue" | "incantation" | "battle";
  readonly showVoiceCapture: boolean;
  readonly showClickActions: boolean;
  readonly showVoiceModeSwitch: boolean;
} {
  const showVoiceCapture = inputMode === "voice" && speechSupported && !forceClickForTurn;
  return {
    surface,
    showVoiceCapture,
    showClickActions: !showVoiceCapture,
    showVoiceModeSwitch: !showVoiceCapture && speechSupported && !forceClickForTurn,
  };
}
```

The RED tests from Step 1 must exercise each surface's returned contract and the exact renderer branch that consumes it; do not replace them with three calls to a boolean-only helper.

Add a shared decision helper inside `bootstrap()`:

```ts
const handleVoiceFailure = (
  turnKey: string,
  message: string,
): { readonly forceClickForTurn: boolean; readonly forceGlobalClick: boolean } => {
  const state = engine.getState();
  const attempt = voiceFailureAttempts.get(turnKey) ?? 0;
  const decision = resolveVoiceTurnFailure(attempt, state.sttFailCount);
  if (!decision.countFailedTurn) {
    voiceFailureAttempts.set(turnKey, decision.nextAttemptInTurn);
    renderCurrent(formatVoiceTurnFailureMessage(message, "retry"));
    return decision;
  }
  voiceFailureAttempts.delete(turnKey);
  const failure = engine.recordSttTurnFailure();
  if (failure.forcedClickMode || decision.forceGlobalClick) {
    engine.setInputMode("click");
    renderCurrent("음성 인식에 실패한 턴이 5회 누적돼 클릭 모드로 전환했어.");
    return { ...decision, forceGlobalClick: true };
  }
  renderCurrent(formatVoiceTurnFailureMessage(message, "click"), true);
  return decision;
};
```

Use stable keys:

```ts
const dialogueTurnKey = `dialogue:${node.nodeId}:${state.nodeTurn}`;
const incantationTurnKey = `incantation:${node.nodeId}:${incantationAttempt}`;
const battleTurnKey = `battle:${phase.phaseId}:${battleState.phaseTurn}`;
```

At the beginning of each successful transcript handler, clear its key:

```ts
voiceFailureAttempts.delete(dialogueTurnKey);
```

Delete the existing `microphoneErrorMessage()` strings that say `클릭 모드로 계속할게`. `classifyVoiceInputError()` now carries permission/device-open/recording-start failures as `VoiceInputFailure`; `formatVoiceInputError()` returns only a neutral cause, and `formatVoiceTurnFailureMessage()` is the sole owner of retry/current-turn-click guidance. Browser API capability absence (`recordingSupported === false`) is the only immediate global-click case. Do not call `engine.setInputMode("click")` on the second recoverable failure unless the global threshold is reached. Exact tests must require first-failure copy to contain `한 번 더` but not `클릭`, and second-failure copy to contain `이 턴은 클릭` but neither `한 번 더` nor `다시 시도`.

Extend `SharedVoiceOptions`:

```ts
interface SharedVoiceOptions {
  speechSupported: boolean;
  notice?: string;
  forceClickForTurn?: boolean;
  startCapture(): Promise<void>;
  finishCapture(): Promise<RecordedVoiceResult>;
  cancel(): void;
  onTurnFailed(failure: VoiceInputFailure): void;
  onUnavailable(failure: VoiceInputFailure): void;
  onModeChange(inputMode: InputMode): void;
}
```

For incantation and battle, change the voice branch condition to:

```ts
if (state.inputMode === "voice" && options.speechSupported && !options.forceClickForTurn) {
```

Pass `forceClickForTurn` from `renderCurrent()` through `renderIncantationNode()` and `renderBattleNode()` into their view options. Their click branches already expose the spell/fallback actions, so no new game branch is needed.

When `forceClickForTurn` is true, the shared control contract must make every dialogue, incantation, and battle renderer omit `음성 입력으로 전환`. Call `clearVoiceFailureAttempts(voiceFailureAttempts)` in title New Game, title Resume, and ending restart callbacks before engine state changes; the Step 1 wiring test must fail if any callback omits or reverses that order. Also delete keys whose node/phase no longer matches the current `renderCurrent()` turn; this bounds the map during a full run.

Replace the string-only unavailable path with one typed adapter used by both real and injected failures:

```ts
const handleTypedVoiceFailure = (
  turnKey: string,
  failure: VoiceInputFailure,
): void => {
  const baseMessage = formatVoiceInputError(failure);
  if (failure.kind === "permission" || failure.kind === "recording") {
    const decision = resolveUnavailableVoiceFailure(
      recordingSupported,
      voiceFailureAttempts.get(turnKey) ?? 0,
      engine.getState().sttFailCount,
    );
    if (decision.capabilityUnavailable) {
      engine.setInputMode("click");
      renderCurrent("이 브라우저에서는 음성 입력을 사용할 수 없어. 클릭으로 진행해 줘.");
      return;
    }
  }
  handleVoiceFailure(turnKey, baseMessage);
};
```

Change `SharedVoiceOptions.onUnavailable` to receive `VoiceInputFailure`, and have the real permission/device-open/recording-start catch classify the error and call `handleTypedVoiceFailure(turnKey, failure)`. Real finished-capture errors must use this same adapter too. This removes a debug-only recovery branch: permission/recording injection now exercises the exact typed unavailable decision used by actual failures, while other kinds exercise the exact finished-capture failure decision.

At all three renderer option call sites, wire both typed callbacks to the same adapter:

```ts
onTurnFailed: (failure) => {
  sfx.play("recognition_fail");
  handleTypedVoiceFailure(turnKey, failure);
},
onUnavailable: (failure) => {
  handleTypedVoiceFailure(turnKey, failure);
},
```

Use the stable dialogue/incantation/battle key for `turnKey`. The UI view owns only capture state; it never chooses click mode or formats a raw technical error.

After `handleTypedVoiceFailure` is declared inside `bootstrap()`, create and wire the debug adapter:

```ts
const pendingDebugVoiceFailure = createPendingDebugVoiceFailure(
  window.location.search,
  debugEnabled,
  import.meta.env.DEV,
);

const consumeInjectedVoiceFailure = (turnKey: string): boolean => {
  const failure = consumeDebugVoiceFailure(pendingDebugVoiceFailure);
  if (!failure) return false;
  sfx.play("recognition_fail");
  handleTypedVoiceFailure(turnKey, failure);
  return true;
};
```

Change the existing common helper signature to `voiceCapture(voice, turnKey)` and put `if (consumeInjectedVoiceFailure(turnKey)) return;` as the first line of its single `startCapture` callback, before ducking or microphone permission/device access. Pass `dialogueTurnKey`, `incantationTurnKey`, and `battleTurnKey` at the three existing `...voiceCapture(voice)` call sites. Do not invent three duplicate capture callbacks. The adapter must not call `engine.setInputMode()` or submit an action: it only feeds a typed `VoiceInputFailure` into the same adapter used after real capture. A production build ignores the query even with `?debug=1` because `import.meta.env.DEV` is false; a development build additionally requires `debugEnabled`. A normal development debug URL consumes the next capture once and clears it; `voiceFailureCount=2` queues exactly two independently consumed entries for deterministic first/second same-turn QA, then clears.

- [ ] **Step 5: Verify all three paths and state threshold**

```powershell
npm test -- tests/voiceTurnRecovery.test.ts tests/voiceFailureInjection.test.ts tests/mainVoiceFailureInjection.test.ts tests/state.test.ts tests/m3Recording.test.ts tests/m5Presentation.test.ts tests/mainVoiceLifecycle.test.ts
npm run check
```

Expected: first failure keeps voice, second forces only current-turn click, fifth failed turn forces global click; recoverable unavailable errors use the same policy while true browser API absence skips voice immediately; all tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/input/voiceTurnRecovery.ts src/input/voiceFailureInjection.ts src/main.ts src/ui/gameView.ts tests/voiceTurnRecovery.test.ts tests/voiceFailureInjection.test.ts tests/mainVoiceFailureInjection.test.ts tests/state.test.ts tests/m5Presentation.test.ts tests/mainVoiceLifecycle.test.ts
git commit -m "fix(voice): restore per-turn retry policy"
```

### Task 5: Make the microphone meter match its judgement

**Files:**
- Modify: `tests/m5Microphone.test.ts:1-76`
- Modify: `src/input/audioLevel.ts:15-128`
- Modify: `src/ui/gameView.ts:620-714`
- Modify: `src/styles.css:610-650`

- [ ] **Step 1: Write the failing meter-presentation tests**

Extend imports in `tests/m5Microphone.test.ts` with `resolveMicrophoneMeterPresentation`, then add:

```ts
it.each([
  [-55, "too-quiet", "quiet"],
  [-24, "sampling", "good"],
  [-5, "too-loud", "loud"],
] as const)("%d dBFS와 %s 판정을 %s meter tone으로 표시한다", (rmsDbfs, state, tone) => {
  expect(
    resolveMicrophoneMeterPresentation(
      { rmsDbfs, peakDbfs: rmsDbfs, clippingRatio: 0 },
      state,
    ),
  ).toMatchObject({ tone });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5Microphone.test.ts
```

Expected: FAIL because the presentation resolver does not exist.

- [ ] **Step 3: Implement and render the actual state**

Add to `src/input/audioLevel.ts`:

```ts
export interface MicrophoneMeterPresentation {
  readonly percent: number;
  readonly tone: "quiet" | "good" | "loud";
}

export function resolveMicrophoneMeterPresentation(
  metrics: AudioLevelMetrics,
  state: MicrophoneTestState,
): MicrophoneMeterPresentation {
  return {
    percent: meterPercent(metrics.rmsDbfs),
    tone:
      state === "too-loud"
        ? "loud"
        : state === "too-quiet" || state === "waiting"
          ? "quiet"
          : "good",
  };
}
```

In `GameView.updateLevel`, replace direct `meterPercent` usage:

```ts
const presentation = resolveMicrophoneMeterPresentation(metrics, state);
meter.style.setProperty("--microphone-level", `${presentation.percent}%`);
meter.dataset.tone = presentation.tone;
meter.setAttribute("aria-valuenow", String(presentation.percent));
```

Remove the fixed `::after` red marker from `src/styles.css`. Use meter state only:

```css
.microphone-meter[data-tone="quiet"] .microphone-meter-fill {
  background: #7da9c7;
}

.microphone-meter[data-tone="good"] .microphone-meter-fill {
  background: #74c69d;
}

.microphone-meter[data-tone="loud"] .microphone-meter-fill {
  background: #ef6f6c;
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
npm test -- tests/m5Microphone.test.ts tests/m5Presentation.test.ts
npm run check
```

Expected: meter tests PASS and no fixed 80% marker selector remains.

- [ ] **Step 5: Commit**

```powershell
git add src/input/audioLevel.ts src/ui/gameView.ts src/styles.css tests/m5Microphone.test.ts
git commit -m "fix(mic): align meter with judgement"
```

### Task 6: Validate the complete reliability slice and record it

**Files:**
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Run automated verification**

```powershell
npm run check
npm test
npm run build
git diff --check
```

Expected: TypeScript PASS, all Vitest files PASS, build PASS with only the already-known Transformers chunk warning, diff check PASS.

- [ ] **Step 2: Run desktop microphone and Worker verification**

Start both services from this F: worktree:

```powershell
npm run dev:m3:worker
npm run dev:m3:ui
```

Verify at `http://127.0.0.1:5173/the-judge-became-a-magical-girl/`:

1. Clean profile shows BGM 20% and title remains silent.
2. Existing saved 37% and mute preferences remain unchanged.
3. One Start click begins daily BGM without another pointer input.
4. On dialogue, incantation, and battle separately, inject each failure class: permission, device-open/recording-start, no-speech, timeout, HTTP, schema, and disconnected network/Worker.
5. For every matrix cell, confirm first failure keeps voice and says retry without `클릭`; second same-turn failure exposes only current-turn click; the fifth failed turn alone changes global mode.
6. Confirm true `recordingSupported=false` skips voice immediately and is the only immediate global-click case.
7. Confirm DOM and visible UI contain none of `Failed to fetch`, HTML, HTTP status, model, or provider.
8. Confirm meter color changes match quiet/acceptable/loud states and no fixed red marker exists.
9. With headphones, let `bgm_daily`, `bgm_crisis`, `bgm_battle`, and `bgm_ending` each loop three complete times; record click, unintended silence, and beat-jump counts, all expected zero.
10. Let non-loop `bgm_transform` finish once and also leave it early once; confirm both routes enter the next cue without a surprise restart or orphaned channel.

Use the existing `?debug=1` surface plus the development-only `voiceFailure` selector (`permission`, `recording`, `no-speech`, `timeout`, `http`, `schema`, `network`). For each surface/kind, run `voiceFailureCount=1` to inspect first-failure copy and a fresh run with `voiceFailureCount=2` to consume two captures on the same turn and inspect current-turn click fallback. The selector must be ignored unless debug mode is active and must never bypass `handleVoiceFailure`; it only creates the injected typed failure consumed by the next capture. Add a test that production URLs ignore it. Record the exact full debug URL for every matrix row so the result is reproducible without changing device/browser permissions between runs.

If an existing binary has a seam, record the exact cue/time and stop at the separate BGM comparison/approval gate. Do not edit BGM files in this plan.

- [ ] **Step 3: Record exact facts in the existing SSOT documents**

Add one decision to `DECISIONS.md` covering the 20% fresh default, valid preference preservation, typed errors, and two-attempt turn policy. Add exact test counts, browser URL, viewport, Worker state, and observed results to `IMPLEMENTATION_LOG.md`. Explain in `LEARNING_LOG.md` that raw technical errors stay in diagnostics while players see recoverable states.

- [ ] **Step 4: Commit the evidence**

```powershell
git add docs/dev/DECISIONS.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git commit -m "docs: record audio and voice reliability"
```

## Acceptance gate

- Fresh or invalid BGM preference is exactly 20%; valid saved volume and mute survive.
- Start and Resume call game entry before asynchronous microphone cleanup.
- Interrupted cue changes leave one audible/live channel after fade completion.
- First transport failure does not increment `sttFailCount` or force click.
- Second failure in the same turn increments once and forces only that turn to click.
- Global click starts only on the fifth failed turn.
- Dialogue, incantation, and battle use the same policy.
- Production UI never renders raw fetch, HTML, HTTP, schema, provider, or model text.
- Meter has no unexplained fixed red line and reflects actual judgement state.
