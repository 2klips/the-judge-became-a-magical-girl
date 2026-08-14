# Voice Five-Failure Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실제 typed 음성 입력 실패를 발생 즉시 저장 총계에 반영하고, 다섯 번째 실패가 같은 턴 재시도보다 우선해 전체 클릭 모드로 전환되게 한다.

**Architecture:** `voiceTurnRecovery.ts`는 현재 턴 attempt와 이미 기록된 전역 실패 총계로 다음 UX를 결정하는 순수 정책만 소유한다. `main.ts`의 단일 `handleTypedVoiceFailure`가 실제 실패를 먼저 `GameEngine.recordSttTurnFailure()`로 저장한 뒤 dialogue/incantation/battle 공통 정책을 적용하며, 기존 `GameState.sttFailCount`와 save schema를 그대로 쓴다.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 4, existing `GameState`/`SaveRepository`

---

## Execution contract

- 명시적 Phase A 구현 승인이 기록된 뒤에만 아래 preflight를 실행한다. 승인 전에 HEAD를 미리 고정하거나 branch/worktree를 만들지 않는다.
- source는 clean한 Phase 0 worktree `project-takeover-baseline`의 동적 승인 tip이고 target은 새 branch `codex/voice-five-failure-policy`와 새 worktree `voice-five-failure-policy`다. branch 또는 path가 이미 존재하면 재사용·삭제·switch하지 말고 중단해 보고한다.

```powershell
$phase0Worktree = 'F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline'
$phaseAWorktree = 'F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\voice-five-failure-policy'
$phaseABranch = 'codex/voice-five-failure-policy'
$phase0Status = @(git -C $phase0Worktree status --short)
if ($phase0Status.Count -ne 0) { throw 'Phase 0 source worktree is dirty; stop and report.' }
if ((git -C $phase0Worktree branch --show-current) -ne 'codex/p0-required-image-assets') { throw 'Unexpected Phase 0 source branch; stop and report.' }
$phase0Head = git -C $phase0Worktree rev-parse HEAD
git -C $phase0Worktree worktree list
git -C $phase0Worktree show-ref --verify --quiet "refs/heads/$phaseABranch"
if ($LASTEXITCODE -eq 0) { throw 'Phase A branch already exists; stop and report.' }
if (Test-Path -LiteralPath $phaseAWorktree) { throw 'Phase A worktree path already exists; stop and report.' }
git -C $phase0Worktree worktree add -b $phaseABranch $phaseAWorktree $phase0Head
if ((git -C $phaseAWorktree branch --show-current) -ne $phaseABranch) { throw 'Phase A branch verification failed.' }
$phaseAHead = git -C $phaseAWorktree rev-parse HEAD
if ($phaseAHead -ne $phase0Head) { throw 'Phase A did not start at the approved Phase 0 tip.' }
git -C $phase0Worktree worktree list
git -C $phase0Worktree merge-base --is-ancestor $phase0Head $phaseAHead
if ($LASTEXITCODE -ne 0) { throw 'Phase A ancestry verification failed.' }
git -C $phaseAWorktree status --short
```

Expected: 두 status 출력은 비어 있고, branch/HEAD/worktree/ancestry 검증이 모두 통과한다. 이후 작업은 생성된 Phase A worktree에서만 한다. 기존 worktree에서 branch를 바꾸지 않는다.
- 기준 계약은 `docs/dev/DECISIONS.md`의 DEC-072, `docs/dev/IMPLEMENTATION_SPEC.md` 실패 표, `docs/dev/QA_AND_DEMO.md` QP-05·QP-06이다. 계약과 코드가 충돌하면 코드를 계약에 맞추며 기준 문서를 재해석하지 않는다.
- push, main merge, branch 변경, reset, revert, amend 금지. 명시 파일만 stage하며 실패 테스트 확인 전 production code를 바꾸지 않는다.

## File map

- Modify: `src/input/voiceTurnRecovery.ts` — 이미 기록된 전역 총계와 현재 턴 attempt로 retry/current-click/global-click 결정
- Modify: `src/main.ts` — 모든 실제 typed failure를 즉시 한 번 기록하고 세 surface에 같은 adapter 적용
- Verify unchanged: `src/state.ts`, `src/engine/nodeRunner.ts` — 기존 `sttFailCount` +1/max 5/click과 변경 직후 save 재사용
- Modify: `tests/voiceTurnRecovery.test.ts` — 첫째·둘째·다섯째, unsupported 정책 단위 테스트
- Create: `tests/mainVoiceFailurePolicy.test.ts` — typed handler 기록 순서, 세 surface wiring, 제외 경로 source contract
- Modify: `tests/state.test.ts` — 실제 실패별 총계, 비감소, 새 게임 초기 상태
- Modify: `tests/engine.test.ts` — 즉시 저장, resume 보존, 새 게임 reset
- Modify: `tests/mainVoiceLifecycle.test.ts` — transient attempt reset/prune와 persisted total 분리
- Modify: `tests/mainVoiceFailureInjection.test.ts` — DEV injection이 동일 typed handler만 통과함을 고정
- Modify after implementation: `docs/dev/IMPLEMENTATION_LOG.md`, `docs/dev/LEARNING_LOG.md` — 실행 증거와 실제 실패 횟수·저장/resume 설명

Do not add a `GameState` field or schema version. Do not change scenario, Worker route, audio/image binary, BGM, PTT UI, title, or deployment.

### Task 1: RED — lock the pure five-failure decision

**Files:**
- Modify: `tests/voiceTurnRecovery.test.ts`
- Test: `src/input/voiceTurnRecovery.ts`

- [ ] **Step 1: Replace old failed-turn assertions with actual-failure assertions**

Use the post-record total as the second argument. Exact expected contract:

```ts
it.each([
  [0, 1, { nextAttemptInTurn: 1, forceClickForTurn: false,
    forceGlobalClick: false, next: "retry" }],
  [1, 2, { nextAttemptInTurn: 0, forceClickForTurn: true,
    forceGlobalClick: false, next: "click" }],
] as const)("attempt %d, 저장 총계 %d의 다음 UX", (attempt, total, expected) => {
  expect(resolveVoiceTurnFailure(attempt, total)).toEqual(expected);
});

it.each([0, 1])("다섯 번째 실제 실패는 attempt %d보다 우선한다", (attempt) => {
  expect(resolveVoiceTurnFailure(attempt, 5)).toEqual({
    nextAttemptInTurn: 0,
    forceClickForTurn: true,
    forceGlobalClick: true,
    next: "global-click",
  });
});

it("recordingSupported=false는 총계 대상이 아닌 즉시 capability fallback이다", () => {
  expect(resolveUnavailableVoiceFailure(false, 0, 4)).toMatchObject({
    capabilityUnavailable: true,
    forceGlobalClick: true,
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/voiceTurnRecovery.test.ts
```

Expected: FAIL because current policy exposes `countFailedTurn`, reads a pre-failure total, and lets the first same-turn attempt retry even when it is the fifth actual failure.

### Task 2: GREEN — make the pure policy use the post-record total

**Files:**
- Modify: `src/input/voiceTurnRecovery.ts`
- Test: `tests/voiceTurnRecovery.test.ts`

- [ ] **Step 1: Replace the decision shape and resolver**

```ts
export interface VoiceTurnFailureDecision {
  readonly nextAttemptInTurn: number;
  readonly forceClickForTurn: boolean;
  readonly forceGlobalClick: boolean;
  readonly next: "retry" | "click" | "global-click";
}

export function resolveVoiceTurnFailure(
  attemptInTurn: number, persistedFailureTotal: number,
): VoiceTurnFailureDecision {
  if (persistedFailureTotal >= 5) {
    return {
      nextAttemptInTurn: 0,
      forceClickForTurn: true,
      forceGlobalClick: true,
      next: "global-click",
    };
  }
  if (attemptInTurn <= 0) {
    return {
      nextAttemptInTurn: 1,
      forceClickForTurn: false,
      forceGlobalClick: false,
      next: "retry",
    };
  }
  return {
    nextAttemptInTurn: 0,
    forceClickForTurn: true,
    forceGlobalClick: false,
    next: "click",
  };
}
```

Keep `resolveUnavailableVoiceFailure()` as the only capability exception: unsupported returns its existing `capabilityUnavailable: true` immediate-global shape without recording, while supported permission/recording delegates to the new post-record `resolveVoiceTurnFailure()` contract. Do not add a count flag only for this exception. Keep `clearVoiceFailureAttempts()` and `formatVoiceTurnFailureMessage()` unchanged.

- [ ] **Step 2: Verify GREEN**

```powershell
npm test -- tests/voiceTurnRecovery.test.ts
npm run check
```

Expected: focused tests and TypeScript PASS.

### Task 3: RED/GREEN — record every typed failure before choosing retry

**Files:**
- Create: `tests/mainVoiceFailurePolicy.test.ts`
- Modify: `tests/mainVoiceFailureInjection.test.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Write source-wiring tests for one adapter and three exact surfaces**

Read `src/main.ts` as existing lifecycle tests do. Assert all of these independently:

```ts
expect(typedHandler).toMatch(
  /const recorded = engine\.recordSttTurnFailure\(\);[\s\S]*handleVoiceFailure\([\s\S]*recorded\.state\.sttFailCount/,
);
expect(typedHandler.indexOf("engine.recordSttTurnFailure()"))
  .toBeLessThan(typedHandler.indexOf("handleVoiceFailure("));

expect(dialogueSection).toContain("handleTypedVoiceFailure(dialogueTurnKey, failure)");
expect(incantationSection).toContain("handleTypedVoiceFailure(incantationTurnKey, failure)");
expect(battleSection).toContain("handleTypedVoiceFailure(battleTurnKey, failure)");
```

For each dialogue/incantation/battle section, require both `onTurnFailed` and `onUnavailable` to call that exact adapter. Table all seven `VoiceFailureKind` values and require no kind-specific return before the record call. Require `consumeInjectedVoiceFailure` to call only `handleTypedVoiceFailure(turnKey, failure)` and never record directly.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/mainVoiceFailurePolicy.test.ts tests/mainVoiceFailureInjection.test.ts
```

Expected: FAIL because current handler records only after the second failure.

- [ ] **Step 3: Change the main adapter in this order**

```ts
const handleVoiceFailure = (
  turnKey: string,
  message: string,
  persistedFailureTotal: number,
): VoiceTurnFailureDecision => {
  const attempt = voiceFailureAttempts.get(turnKey) ?? 0;
  const decision = resolveVoiceTurnFailure(attempt, persistedFailureTotal);
  if (decision.forceGlobalClick) {
    voiceFailureAttempts.delete(turnKey);
    renderCurrent("음성 인식 실패가 5회 누적돼 클릭 모드로 전환했어.");
    return decision;
  }
  if (decision.next === "retry") {
    voiceFailureAttempts.set(turnKey, decision.nextAttemptInTurn);
    renderCurrent(formatVoiceTurnFailureMessage(message, "retry"));
    return decision;
  }
  voiceFailureAttempts.delete(turnKey);
  renderCurrent(formatVoiceTurnFailureMessage(message, "click"), true);
  return decision;
};

const handleTypedVoiceFailure = (
  turnKey: string,
  failure: VoiceInputFailure,
): void => {
  if (!recordingSupported) {
    const unavailable = resolveUnavailableVoiceFailure(false, 0, engine.getState().sttFailCount);
    if (unavailable.capabilityUnavailable) {
      engine.setInputMode("click");
      renderCurrent("이 브라우저에서는 음성 입력을 사용할 수 없어. 클릭으로 진행해 줘.");
      return;
    }
  }
  const recorded = engine.recordSttTurnFailure();
  handleVoiceFailure(
    turnKey,
    formatVoiceInputError(failure),
    recorded.state.sttFailCount,
  );
};
```

`recordSttTurnFailure()` already persists and forces click at 5, so do not add a second save or a new counter. Permission and recording are counted exactly like no-speech, timeout, http, schema, and network when recording is supported.

- [ ] **Step 4: Verify GREEN**

```powershell
npm test -- tests/mainVoiceFailurePolicy.test.ts tests/mainVoiceFailureInjection.test.ts tests/voiceTurnRecovery.test.ts
npm run check
```

Expected: all three surface wiring tests PASS; fifth failure renders global-click copy without retry/current-turn copy.

### Task 4: Prove persistence, reset boundaries, and exclusions

**Files:**
- Modify: `tests/state.test.ts`
- Modify: `tests/engine.test.ts`
- Modify: `tests/mainVoiceLifecycle.test.ts`
- Test: `src/state.ts`, `src/engine/nodeRunner.ts`, `src/main.ts`, `src/ui/gameView.ts`

- [ ] **Step 1: Add exact state/engine tests**

Test that five consecutive `recordSttTurnFailure()` calls produce totals `[1,2,3,4,5]`, save each result immediately, and cap at 5. Test `setGameInputMode`, `moveStateToNode`, and successful dialogue judgement preserve a nonzero total. Test `engine.resume(savedState)` preserves 4; `engine.startNewGame()` resets to 0.

```ts
const saved = { ...engine.getState(), sttFailCount: 4, inputMode: "voice" as const };
engine.resume(saved);
expect(engine.getState().sttFailCount).toBe(4);
engine.recordSttTurnFailure();
expect(repository.load().state?.sttFailCount).toBe(5);
engine.startNewGame("voice");
expect(engine.getState().sttFailCount).toBe(0);
```

- [ ] **Step 2: Extend lifecycle/source exclusions**

Require `resetVoiceFailureSession()` to clear only the attempt map before New Game, Resume, and ending restart; ending restart/New Game must call `engine.startNewGame`, while saved Resume must call `engine.resume` without resetting `sttFailCount`. Require node/phase pruning. Assert cancelled, manual click, unsupported capability, LLM fallback, and battle dBFS paths never call the typed handler/record method; success deletes only its attempt key.

- [ ] **Step 3: Run focused lifecycle tests**

```powershell
npm test -- tests/state.test.ts tests/engine.test.ts tests/mainVoiceLifecycle.test.ts tests/mainVoiceFailurePolicy.test.ts tests/mainVoiceFailureInjection.test.ts tests/m3Recording.test.ts tests/m5Presentation.test.ts
```

Expected: PASS. Dialogue, incantation, and battle each count all seven real typed failure kinds only through the shared handler. DEV injection counts only because it enters that handler.

- [ ] **Step 4: Commit the tested implementation as its independent rollback unit**

```powershell
git status --short
git add src/input/voiceTurnRecovery.ts src/main.ts tests/voiceTurnRecovery.test.ts tests/mainVoiceFailurePolicy.test.ts tests/mainVoiceFailureInjection.test.ts tests/state.test.ts tests/engine.test.ts tests/mainVoiceLifecycle.test.ts
git diff --cached --check
git commit -m "fix(voice): count every failed input"
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

Expected: TypeScript PASS, all Vitest files PASS, Vite build PASS with only previously documented Transformers chunk warning, diff check PASS.

- [ ] **Step 2: Run manual game-mode QA**

At the real game URL, test dialogue, incantation, and battle. Across the seven values `permission`, `recording`, `no-speech`, `timeout`, `http`, `schema`, `network`, confirm each injected capture reaches the typed handler and increases saved `sttFailCount` once. Confirm failures 1–4 keep first-attempt retry/second-attempt current-turn click; failure 5 forces global click immediately even when it is a first attempt. Confirm cancel, manual click, unsupported browser, LLM local fallback, and battle dBFS failures do not count. Save with total 4, resume, fail once, and confirm global click; New Game and ending restart begin at 0.

- [ ] **Step 3: Record facts only after commands and QA**

Append exact commit, test file/test counts, commands, URL, browser, save/resume observations, PASS/PENDING state, and exclusions to `IMPLEMENTATION_LOG.md`. Update `LEARNING_LOG.md` to explain actual-failure counting and why transient attempts reset on Resume while saved total does not. DEC-072, implementation spec, and QA matrix are upstream contracts; do not duplicate or rewrite them.

- [ ] **Step 4: Commit documentation evidence**

```powershell
git add docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git diff --cached --check
git commit -m "docs: record voice failure threshold verification"
git status --short
```
