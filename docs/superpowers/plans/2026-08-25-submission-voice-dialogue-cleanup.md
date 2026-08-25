# Submission Voice, Dialogue, and Asset Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the HIDDEN submission ending, expose safe QA voice evidence, correct voice failure/level classification, harden Juno replies, and remove the purple boundary fringe from two Doyun sprites without changing frozen Battle/Ending/TITLE geometry.

**Architecture:** Keep ending selection declarative in scenario data and migrate legacy HIDDEN saves at the save boundary. Keep voice observations ephemeral: domain helpers build safe evidence, `main.ts` records it after a completed turn, and `GameView` renders it only in a QA build with `?debug=1`. Keep dialogue generation free-form but apply the same grounding prompt and deterministic reply-quality validation to realtime and text Worker paths. Perform sprite cleanup with a deterministic indexed-PNG tool that only makes audited silhouette-boundary pixels transparent and verifies source/runtime identity against the frozen pre-cleanup commit.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 4, Zod 4, Cloudflare Worker/Wrangler, Python 3 with Pillow and NumPy, CSS.

---

## Guardrails and Baseline

- Starting implementation commit: `37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e`.
- Approved design: `docs/superpowers/specs/2026-08-25-submission-voice-dialogue-cleanup-design.md`.
- Never read, edit, stage, restore, reset, stash, or commit `docs/심사역은_마법소녀가_되었다_완성대본_v2.md`.
- Preserve HQ-10 Battle geometry/composition, HQ-11 frame/header/title/CTA/actor geometry, and OpenAI TITLE.
- The explicit HIDDEN removal supersedes only HIDDEN-specific HQ-11/HQ-12 requirements. GOOD/NORMAL/BAD copy and presentation remain frozen.
- Keep `perfect_transform`, the perfect transformation result, battle initial momentum 60, the incantation gate, voice/click fallback, save schema version, BGM logic, and existing routes other than `ending_hidden`.
- Do not push, deploy, start AR-10, create a new screen, or add a dependency.

## Task 1: Establish a Clean Preflight and RED Baseline

**Files:**

- Inspect: repository Git metadata and all files listed in later tasks
- Test: existing focused suites only

- [ ] **Step 1: Verify the isolated worktree and exact baseline**

Run:

```powershell
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected:

- branch `codex/hq11-ending-final-presentation`
- HEAD `37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e`
- no output from `git status --short`

If any unrelated diff exists, stop without editing.

- [ ] **Step 2: Run the current focused baseline**

Run:

```powershell
npm test -- tests/hq11EndingPresentation.test.ts tests/hq12PostCreditClosure.test.ts tests/v31EngineFlow.test.ts tests/v31ScenarioRuntime.test.ts tests/m3Transcription.test.ts tests/m5Microphone.test.ts tests/m3Llm.test.ts tests/m3Worker.test.ts tests/m5RealtimeVoice.test.ts tests/earlySceneAssetIntegration.test.ts
```

Expected: current tests pass before new RED contracts are added.

## Task 2: Remove the HIDDEN Submission Ending and Preserve Legacy Saves

**Files:**

- Modify: `public/scenario/scenario.json`
- Modify: `src/data/schema.ts`
- Modify: `src/data/loader.ts`
- Modify: `src/state.ts`
- Modify: `src/assets/presentationBackground.ts`
- Modify: `src/assets/presentationDoyun.ts`
- Modify: `src/dev/scenePreview.ts`
- Modify: `src/ui/gameView.ts`
- Modify: `src/ui/vn.css`
- Modify: `tests/v31EngineFlow.test.ts`
- Modify: `tests/v31ScenarioRuntime.test.ts`
- Modify: `tests/hq11EndingPresentation.test.ts`
- Modify: `tests/hq12PostCreditClosure.test.ts`
- Modify: `tests/m5Assets.test.ts`
- Modify: `tests/m5SceneBackground.test.ts`
- Modify: `tests/m5DoyunPresentation.test.ts`
- Modify: `tests/m5DevScenePreview.test.ts`
- Modify: `tests/m4State.test.ts`

- [ ] **Step 1: Write RED three-ending and legacy migration tests**

Change the focused contracts to require:

```ts
expect(Object.keys(endings).sort()).toEqual(["bad", "good", "normal"]);
expect(data.scenario.some(({ nodeId }) => nodeId === "ending_hidden")).toBe(false);
expect(n8.exitOnMaxTurns).toEqual([
  {
    if: "flags.n7_believe && flags.final_spell_success",
    next: "ending_good",
  },
  { default: "ending_normal" },
]);
```

Update the former five-condition engine path to assert:

```ts
expect(engine.getState().currentNodeId).toBe("ending_good");
expect(engine.getState().flags).toEqual(
  expect.objectContaining(
    new Set([
      "perfect_transform",
      "second_spell_opportunity",
      "defense_used",
      "attack_used",
      "n7_believe",
      "final_spell_success",
    ]),
  ),
);
```

Add save-boundary fixtures for both cases:

```ts
// Legacy current ending.
currentNodeId: "ending_hidden",
history: ["n0_review", "ending_hidden"],

// Legacy post-credit history.
currentNodeId: "post_credit",
history: ["n0_review", "ending_hidden", "post_credit"],
```

Both must restore to `ending_good`, retain permitted flags, and contain no unknown node in history.

Update presentation tests to require the existing frozen geometry for GOOD/NORMAL/BAD only and require current runtime source/CSS/preview mappings to contain no HIDDEN presentation hook. Permit the exact string `ending_hidden` only in the legacy save alias and its migration tests.

- [ ] **Step 2: Run RED ending tests**

Run:

```powershell
npm test -- tests/v31EngineFlow.test.ts tests/v31ScenarioRuntime.test.ts tests/hq11EndingPresentation.test.ts tests/hq12PostCreditClosure.test.ts tests/m4State.test.ts tests/m5Assets.test.ts tests/m5SceneBackground.test.ts tests/m5DoyunPresentation.test.ts tests/m5DevScenePreview.test.ts
```

Expected: failures show the existing HIDDEN node, first N8 branch, schema/loader requirement, preview/tone hooks, and missing legacy alias.

- [ ] **Step 3: Implement the minimal three-ending runtime**

Apply these exact domain changes:

- Delete the first six-flag `exitOnMaxTurns` branch and the `ending_hidden` node from `scenario.json`.
- Restrict `endingNodeSchema.endingId` and loader-required endings to `good | normal | bad`.
- Add `ending_hidden: "ending_good"` to `legacyNodeAliases` before known-node validation.
- Keep legacy `post_credit` recovery and make its canonical previous ending set contain `ending_good`; migrated hidden history becomes good first.
- Remove HIDDEN-only background, Doyun, Juno, preview, editorial line-break, and CSS tone hooks.
- Keep the existing GOOD/NORMAL/BAD result-frame selectors and values byte-for-byte where possible.
- Keep `perfect_transform` in state, loader validation, transformation outcome, and battle momentum initialization.

- [ ] **Step 4: Run GREEN ending tests and residue audit**

Run:

```powershell
npm test -- tests/v31EngineFlow.test.ts tests/v31ScenarioRuntime.test.ts tests/hq11EndingPresentation.test.ts tests/hq12PostCreditClosure.test.ts tests/m4State.test.ts tests/m5Assets.test.ts tests/m5SceneBackground.test.ts tests/m5DoyunPresentation.test.ts tests/m5DevScenePreview.test.ts
rg -n "ending_hidden|ending-tone-hidden|ending-heading-copy-hidden" public/scenario src tests
```

Expected:

- focused tests pass
- only the intentional legacy alias and migration-test references remain
- `perfect_transform` still appears in incantation/state/battle code and tests

- [ ] **Step 5: Commit the ending change**

Run:

```powershell
git add public/scenario/scenario.json src/data/schema.ts src/data/loader.ts src/state.ts src/assets/presentationBackground.ts src/assets/presentationDoyun.ts src/dev/scenePreview.ts src/ui/gameView.ts src/ui/vn.css tests/v31EngineFlow.test.ts tests/v31ScenarioRuntime.test.ts tests/hq11EndingPresentation.test.ts tests/hq12PostCreditClosure.test.ts tests/m5Assets.test.ts tests/m5SceneBackground.test.ts tests/m5DoyunPresentation.test.ts tests/m5DevScenePreview.test.ts tests/m4State.test.ts
git commit -m "fix(story): remove hidden submission ending"
```

## Task 3: Separate Voice Failures and Replace Peak-only `too-loud`

**Files:**

- Modify: `src/input/transcription.ts`
- Modify: `src/input/audioLevel.ts`
- Modify: `src/input/voiceFailureInjection.ts`
- Modify: `tests/m3Transcription.test.ts`
- Modify: `tests/m5Microphone.test.ts`
- Modify: `tests/voiceFailureInjection.test.ts`
- Modify: `tests/voiceTurnRecovery.test.ts`

- [ ] **Step 1: Write RED HTTP/network and headset fixtures**

Add assertions that classification preserves a safe status:

```ts
expect(classifyVoiceInputError(new Error("Realtime 음성 요청 실패 (503): unavailable"))).toEqual({
  kind: "http",
  httpStatus: 503,
  debugMessage: "Realtime 음성 요청 실패 (503): unavailable",
});
expect(formatVoiceInputError({ kind: "network", debugMessage: "Failed to fetch" })).toBe(
  "네트워크 연결 문제로 음성 서버에 닿지 못했어.",
);
expect(formatVoiceInputError({ kind: "http", httpStatus: 503, debugMessage: "upstream" })).toBe(
  "음성 서버가 요청을 처리하지 못했어.",
);
```

Build these deterministic audio cases with a 2,048-sample buffer and a calibration maximum RMS of `-14 dBFS`:

- normal headset speech around amplitude `0.12` is acceptable
- the same signal with one sample at `1.0` is acceptable despite a near-zero peak
- sustained amplitude `0.5` is too loud
- a meaningful clipped fraction above 1% is too loud
- the existing too-quiet case remains too quiet

- [ ] **Step 2: Run RED voice classification tests**

Run:

```powershell
npm test -- tests/m3Transcription.test.ts tests/m5Microphone.test.ts tests/voiceFailureInjection.test.ts tests/voiceTurnRecovery.test.ts
```

Expected: network/http copy and status tests fail; isolated-peak acceptance fails.

- [ ] **Step 3: Implement typed status and sustained loudness**

Extend the failure contract without exposing raw detail:

```ts
export interface VoiceInputFailure {
  readonly kind: VoiceFailureKind;
  readonly debugMessage: string;
  readonly httpStatus?: number;
}
```

Extract only a three-digit 4xx/5xx status from the existing request-failure message. Leave the safe normal UI status-free.

In `evaluateVoiceLevel`, remove peak-only rejection. Use:

```ts
const VOICE_LOUD_RMS_HEADROOM_DB = 3;
const VOICE_MAXIMUM_SUSTAINED_CLIPPING_RATIO = 0.01;

const sustainedLoud = metrics.rmsDbfs > calibration.maximumRmsDbfs + VOICE_LOUD_RMS_HEADROOM_DB;
const meaningfullyClipped = metrics.clippingRatio > VOICE_MAXIMUM_SUSTAINED_CLIPPING_RATIO;
```

Return `too-loud` only for `sustainedLoud || meaningfullyClipped`. Keep the setup calibration meter's stricter peak feedback unchanged; the change applies to completed battle-turn acceptance only.

- [ ] **Step 4: Run GREEN voice classification tests**

Run:

```powershell
npm test -- tests/m3Transcription.test.ts tests/m5Microphone.test.ts tests/voiceFailureInjection.test.ts tests/voiceTurnRecovery.test.ts tests/mainVoiceFailurePolicy.test.ts
```

Expected: all typed recovery and battle retry/consume-turn contracts pass.

## Task 4: Add QA-only Voice Evidence

**Files:**

- Create: `src/input/voiceQaEvidence.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/gameView.ts`
- Modify: `src/styles.css`
- Create: `tests/voiceQaEvidence.test.ts`
- Modify: `tests/vnUiDesignSystem.test.ts`
- Modify: `tests/m5RealtimeVoice.test.ts`
- Modify: `tests/mainPttLiveMeter.test.ts`

- [ ] **Step 1: Write RED pure evidence and visibility tests**

Define tests for an ephemeral discriminated record:

```ts
type VoiceQaEvidence =
  | {
      readonly kind: "success";
      readonly surface: "dialogue" | "incantation" | "battle";
      readonly transcript: string;
      readonly model: string;
      readonly roundTripMs: number;
      readonly upstreamMs?: number;
      readonly firstDeltaMs?: number;
      readonly rmsDbfs?: number;
      readonly peakDbfs?: number;
      readonly clippingRatio?: number;
      readonly keywordMatches?: readonly {
        readonly keyword: string;
        readonly matched: boolean;
      }[];
    }
  | {
      readonly kind: "failure";
      readonly surface: "dialogue" | "incantation" | "battle";
      readonly failureKind: VoiceFailureKind;
      readonly httpStatus?: number;
    };
```

Tests must prove:

- incantation evidence reports all four ordered keywords `설렘`, `잠든 마음`, `해피 플레이`, `매지컬 체인지`
- matched state and `3/4` summary are derived from `IncantationResult.matchedKeywords`, not re-guessed from UI text
- dBFS values are rendered to one decimal and clipping as a percentage
- failure evidence contains kind/status only, never `debugMessage`
- `GameView` gates the richer panel with `import.meta.env.MODE === "qa" && ?debug=1`
- production build or debug-off has no voice-evidence DOM
- no evidence field is added to `GameState` or serialized snapshots

- [ ] **Step 2: Run RED evidence tests**

Run:

```powershell
npm test -- tests/voiceQaEvidence.test.ts tests/vnUiDesignSystem.test.ts tests/m5RealtimeVoice.test.ts tests/mainPttLiveMeter.test.ts
```

Expected: missing evidence module, wiring, and QA-only renderer failures.

- [ ] **Step 3: Implement pure builders and GameView presenter**

Implement pure builders in `voiceQaEvidence.ts` that accept the already validated `TranscriptionObservation`, optional `AudioLevelMetrics`, and optional ordered keyword/match lists. Do not accept or retain headers, request bodies, raw Worker error bodies, stack traces, or secrets.

In `GameView`:

- keep existing general debug navigation behavior
- add `voiceQaEnabled = import.meta.env.MODE === "qa" && this.debugEnabled`
- replace the debug result contents in place when evidence changes
- expose public success/failure recording methods used by `main.ts`
- retain existing model/timing/transcript display for successful turns
- render a compact four-row keyword checklist only when present
- render `RMS`, `peak`, and `clip` as secondary QA metadata

In `main.ts`:

- dialogue voice callbacks pass `audioLevel` as well as observation
- incantation records evidence immediately after `submitIncantation`, before retry or result rendering
- battle records evidence before volume classification so rejected turns remain diagnosable
- typed failures record safe failure evidence before existing retry/click recovery renders
- debug typed-transcript injection may omit audio fields and must not fabricate dBFS

- [ ] **Step 4: Run GREEN evidence and adjacent PTT tests**

Run:

```powershell
npm test -- tests/voiceQaEvidence.test.ts tests/vnUiDesignSystem.test.ts tests/m5RealtimeVoice.test.ts tests/mainPttLiveMeter.test.ts tests/m5PttLiveMeter.test.ts tests/mainVoiceFailurePolicy.test.ts tests/mainVoiceFailureInjection.test.ts
```

Expected: evidence is available only in QA debug, while PTT keyboard/live meter and failure recovery stay unchanged.

- [ ] **Step 5: Commit the voice changes**

Run:

```powershell
git add src/input/transcription.ts src/input/audioLevel.ts src/input/voiceFailureInjection.ts src/input/voiceQaEvidence.ts src/main.ts src/ui/gameView.ts src/styles.css tests/m3Transcription.test.ts tests/m5Microphone.test.ts tests/voiceFailureInjection.test.ts tests/voiceTurnRecovery.test.ts tests/voiceQaEvidence.test.ts tests/vnUiDesignSystem.test.ts tests/m5RealtimeVoice.test.ts tests/mainPttLiveMeter.test.ts tests/m5PttLiveMeter.test.ts tests/mainVoiceFailurePolicy.test.ts tests/mainVoiceFailureInjection.test.ts
git commit -m "fix(voice): expose safe QA evidence"
```

## Task 5: Harden Juno Context, Grammar, and Direct Answers

**Files:**

- Modify: `src/judge/schema.ts`
- Modify: `worker/index.ts`
- Create: `scripts/qa-dialogue-matrix.mjs`
- Modify: `package.json`
- Modify: `tests/m3Llm.test.ts`
- Modify: `tests/m3Worker.test.ts`
- Modify: `tests/m5RealtimeVoice.test.ts`
- Create: `tests/dialogueReplyQuality.test.ts`

- [ ] **Step 1: Write RED accepted/rejected reply matrix tests**

Add a shared `assertDialogueReplyQuality(reply, transcript)` contract and these classes of fixtures:

Accepted examples:

```ts
["내가 왜 그래야 돼?", "평가표만 넘기지 않고 끝까지 직접 확인했으니까. 네 판단을 믿었어."],
["어디로 움직이는데?", "저 회색 망령 앞으로 가. 먼저 무엇을 지킬지 정하자."],
["얘는 왜 나타난 거야?", "기대를 포기한 평가들이 뭉쳐 나타난 회색 망령이야. 끝까지 판단해야 사라져."],
["정면으로 맞서자", "좋아, 먼저 정면으로 맞설게. 네 선택을 믿고 따라갈게."],
```

Rejected examples cover:

- meta classification: `이건 이유를 묻는 거네.`
- question restatement instead of an answer: `왜 이동하는지 궁금하면 분명 말해 줘.` for `어디로 움직이는데?`
- evasive filler: `같이 얘기해보자.` or `깔끔히 정리해보자.` as the answer to who/where/why/how
- known malformed construction: `정면으로 맞설 연다.`
- existing emotion-claim and forbidden-story violations

Worker tests must assert both `/judge/dialogue` and realtime dialogue validation reject the same invalid reply before it reaches engine state.

- [ ] **Step 2: Run RED reply-quality tests**

Run:

```powershell
npm test -- tests/dialogueReplyQuality.test.ts tests/m3Llm.test.ts tests/m3Worker.test.ts tests/m5RealtimeVoice.test.ts
```

Expected: invalid meta/evasive/malformed replies currently pass and fail the new tests.

- [ ] **Step 3: Implement grounding prompt and shared validator**

In `dialogueSystemInstruction`, add compact requirements:

- answer the player's actual `누구/어디/왜/어떻게` question in the first sentence
- use supplied `llmContext` as scene facts and never replace the answer with intent classification
- do not say that the question/intent will be organized or discussed later when the context already answers it
- produce natural, complete Korean predicate agreement

Call `assertDialogueReplyQuality` from `parseDialogueJudgementForNode` and `validateDialogueJudgement` after existing schema/intent/flag/reply-policy checks. Convert validation failure to the existing safe 502 Worker error so retry/fallback remains authoritative and no flags apply.

- [ ] **Step 4: Add a deterministic live QA matrix runner**

Add `npm run qa:dialogue-matrix`, implemented by `scripts/qa-dialogue-matrix.mjs`.

The runner must:

- load `public/scenario/scenario.json` and `public/scenario/characters.json`
- send representative N2, N3, and N6 transcripts to a supplied `--base-url`
- perform no direct state mutation
- print node, transcript, returned intent, and reply
- fail nonzero on HTTP error, schema mismatch, meta/evasive/malformed reply, or unexpected intent outside the node's allowed list
- never read or print API keys, authorization headers, or raw provider bodies

Run it against the canonical local Worker after unit tests:

```powershell
npm run dev:m3:worker
npm run qa:dialogue-matrix -- --base-url http://127.0.0.1:8787
```

Use the matrix outputs to refine only the prompt/validator until every listed utterance passes. Provider output is QA evidence; it is not committed as a unit-test golden string.

- [ ] **Step 5: Run GREEN dialogue tests**

Run:

```powershell
npm test -- tests/dialogueReplyQuality.test.ts tests/m3Llm.test.ts tests/m3Worker.test.ts tests/m5RealtimeVoice.test.ts
```

Expected: deterministic matrix fixtures pass and both Worker paths share the validator.

- [ ] **Step 6: Commit the dialogue change**

Run:

```powershell
git add src/judge/schema.ts worker/index.ts scripts/qa-dialogue-matrix.mjs package.json tests/dialogueReplyQuality.test.ts tests/m3Llm.test.ts tests/m3Worker.test.ts tests/m5RealtimeVoice.test.ts
git commit -m "fix(dialogue): ground Juno voice replies"
```

## Task 6: Deterministically Remove Purple Boundary Fringe from Two Doyun PNGs

**Files:**

- Create: `assets/source/early-scene-2026-08-22/tools/clean_doyun_purple_fringe.py`
- Modify binary: `assets/source/early-scene-2026-08-22/delivery/char/char_doyun_normal_suspicious.png`
- Modify binary: `assets/runtime/char/char_doyun_normal_suspicious.png`
- Modify binary: `assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png`
- Modify binary: `assets/runtime/char/char_doyun_employee_id_surprised.png`
- Modify: `tests/earlySceneAssetIntegration.test.ts`
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`

- [ ] **Step 1: Write the RED boundary verifier contract**

Extend the asset integration test to execute the new verifier for both logical assets against baseline commit `37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e`.

Require each report to contain:

```ts
expect(report).toMatchObject({
  width: 1200,
  height: 2000,
  mode: "P",
  transparentPng: true,
  sourceRuntimeEqual: true,
  purpleBoundaryPixelsAfter: 0,
  nonTargetChangedPixels: 0,
  targetRgbChangedPixels: 0,
});
expect(report.purpleBoundaryPixelsBefore).toBeGreaterThan(0);
expect(report.targetAlphaClearedPixels).toBeGreaterThan(0);
expect(report.bytes).toBeLessThanOrEqual(800 * 1024);
```

The purple predicate must be explicit and shared by cleanup/reporting: visible alpha, blue and red dominance over green, and a minimum dark-purple chroma. Boundary means an opaque pixel with at least one transparent eight-neighbour.

- [ ] **Step 2: Run RED asset test**

Run:

```powershell
npm test -- tests/earlySceneAssetIntegration.test.ts
```

Expected: missing verifier or nonzero purple-boundary counts for both images.

- [ ] **Step 3: Implement indexed-PNG-preserving cleanup**

The script must:

1. read the frozen Git blob and current indexed PNG as RGBA for comparison
2. identify only purple-dominant pixels connected to the transparent silhouette boundary
3. iterate the newly exposed boundary for a bounded number of layers and fail if purple boundary remains
4. allocate unused palette entries that duplicate each targeted RGB with alpha 0
5. remap only targeted coordinates to those entries, preserving every non-target pixel and targeted RGB
6. save optimized mode-P PNG once, then copy identical bytes to runtime
7. emit a JSON report and fail verification on any invariant breach

Do not quantize or redraw the full image. Do not edit any other sprite.

- [ ] **Step 4: Run cleanup for both pairs**

Run:

```powershell
python assets/source/early-scene-2026-08-22/tools/clean_doyun_purple_fringe.py --baseline 37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e --source assets/source/early-scene-2026-08-22/delivery/char/char_doyun_normal_suspicious.png --runtime assets/runtime/char/char_doyun_normal_suspicious.png
python assets/source/early-scene-2026-08-22/tools/clean_doyun_purple_fringe.py --baseline 37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e --source assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png --runtime assets/runtime/char/char_doyun_employee_id_surprised.png
```

Record the emitted changed-pixel counts, bytes, and SHA-256 values for documentation.

- [ ] **Step 5: Verify the binaries and visually inspect both**

Run:

```powershell
python assets/source/early-scene-2026-08-22/tools/clean_doyun_purple_fringe.py --verify --baseline 37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e --source assets/source/early-scene-2026-08-22/delivery/char/char_doyun_normal_suspicious.png --runtime assets/runtime/char/char_doyun_normal_suspicious.png
python assets/source/early-scene-2026-08-22/tools/clean_doyun_purple_fringe.py --verify --baseline 37da7d7ddd379cf6bc77f4bc4bc33130a1889f3e --source assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png --runtime assets/runtime/char/char_doyun_employee_id_surprised.png
npm test -- tests/earlySceneAssetIntegration.test.ts tests/m5DoyunPresentation.test.ts
```

Use the image viewer on both runtime PNGs at original detail. Confirm face, hair silhouette, hands, employee ID, clothes, pose, and transparency are intact and no purple contour remains.

- [ ] **Step 6: Update asset provenance with measured facts**

Update current manifest rows and append dated provenance/production entries with:

- deterministic Pillow/NumPy palette-alpha cleanup
- frozen baseline commit
- per-file changed pixel count, final bytes, and SHA-256
- source/runtime byte identity
- no generative model, no pose/face/clothing/RGB redraw
- status `HUMAN_RECHECK`, not automatic visual approval

Retain all historical magenta-cleanup records as superseded history.

- [ ] **Step 7: Commit the asset change**

Run:

```powershell
git add assets/source/early-scene-2026-08-22/tools/clean_doyun_purple_fringe.py assets/source/early-scene-2026-08-22/delivery/char/char_doyun_normal_suspicious.png assets/runtime/char/char_doyun_normal_suspicious.png assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png assets/runtime/char/char_doyun_employee_id_surprised.png tests/earlySceneAssetIntegration.test.ts docs/assets/ASSET_MANIFEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md
git commit -m "fix(assets): remove Doyun purple fringe"
```

## Task 7: Update Current SSOT Without Rewriting History

**Files:**

- Modify: `docs/dev/HUMAN_SCENE_QA_BACKLOG.md`
- Modify: `docs/dev/QA_AND_DEMO.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/TEAM_PROGRESS_CHECKLIST.md`

- [ ] **Step 1: Update only current-state requirements**

Record the dated superseding decision:

- submission runtime now has GOOD/NORMAL/BAD only
- prior HIDDEN five-condition runs converge to GOOD
- `perfect_transform` remains a transformation/battle modifier, not an ending selector
- legacy `ending_hidden` saves migrate to GOOD
- QA-only voice evidence and network/http separation are available
- battle turn acceptance ignores isolated peaks and uses sustained RMS/clipping evidence
- Juno prompt/validator matrix status
- two Doyun sprites received deterministic boundary-alpha cleanup
- HIDDEN actual-path gate is superseded, so HQ-12 closure now requires GOOD/NORMAL/BAD terminal regression only

Keep earlier HIDDEN design/QA/provenance paragraphs as historical dated records. Do not edit the screenplay.

- [ ] **Step 2: Commit current SSOT updates**

Run:

```powershell
git add docs/dev/HUMAN_SCENE_QA_BACKLOG.md docs/dev/QA_AND_DEMO.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/TEAM_PROGRESS_CHECKLIST.md
git commit -m "docs(qa): record submission voice cleanup"
```

## Task 8: Full Automated Verification

**Files:**

- Verify: all modified source, tests, docs, and assets

- [ ] **Step 1: Run focused regression matrix**

Run:

```powershell
npm test -- tests/hq10BattlePresentation.test.ts tests/hq11EndingPresentation.test.ts tests/hq12PostCreditClosure.test.ts tests/v31EngineFlow.test.ts tests/v31ScenarioRuntime.test.ts tests/m4State.test.ts tests/m3Transcription.test.ts tests/m5Microphone.test.ts tests/voiceQaEvidence.test.ts tests/mainVoiceFailurePolicy.test.ts tests/dialogueReplyQuality.test.ts tests/m3Llm.test.ts tests/m3Worker.test.ts tests/m5RealtimeVoice.test.ts tests/earlySceneAssetIntegration.test.ts tests/m5DoyunPresentation.test.ts tests/m5TitleStart.test.ts
```

Expected: all focused suites pass; HQ-10, three-ending HQ-11 geometry, HQ-12 terminal flow, and OpenAI TITLE regression remain green.

- [ ] **Step 2: Run full validation**

Run:

```powershell
npm run check
npm test
npm run build
npm run build:qa
git diff --check
git diff --stat
git diff --name-only
git status --short
```

Expected:

- TypeScript pass
- test count does not decrease; obsolete HIDDEN-specific assertions are replaced by three-ending, migration, voice, dialogue, and asset contracts
- production and QA builds pass
- only the known Transformers chunk warning is permitted
- diff check passes
- no user screenplay path is staged or modified

## Task 9: Actual Chrome QA and Release Evidence

**Files:**

- Evidence outside Git: repository QA evidence directory or system temporary directory
- No source edits unless a new failing defect is first reported

- [ ] **Step 1: Start production-equivalent and QA runtimes**

Use production/debug-off for regression and QA build with `?debug=1` for evidence. Use the canonical local Worker configuration and never print secrets.

- [ ] **Step 2: Verify ending convergence and frozen geometry**

At 1920×1080 and 1366×768:

- complete a route that previously met all HIDDEN flags and verify GOOD appears
- verify no HIDDEN code/title/node/preview is reachable
- verify GOOD/NORMAL/BAD Result Frame, header/title anchors, CTA, actors, BGM, crop, and scroll remain unchanged
- verify `처음부터` returns to N0 without stuck state or invalid FSM transition

- [ ] **Step 3: Verify voice evidence and failure recovery**

In QA `?debug=1`:

- perform the transformation incantation with partial and full phrases
- capture transcript, four ordered keyword rows, match total, RMS, peak, clip, model, and timings
- confirm an isolated peak fixture/real headset spike does not trigger `too-loud`
- confirm sustained loud speech or meaningful clipping still triggers the existing retry behavior
- inject/observe `network` and `http` failures and confirm distinct normal copy plus safe QA kind/status
- confirm production/debug-off contains no evidence panel

- [ ] **Step 4: Verify Juno matrix and sprite composition**

- run N2/N3/N6 representative utterances through the actual voice-capable path
- confirm direct, grammatical, context-grounded replies and no meta/evasive patterns
- inspect `doyun.normal_suspicious` and `doyun.employee_id_surprised` on their actual dark-office scenes
- confirm purple outline visible count 0, broken image 0, console error/warning 0, and page scroll 0

- [ ] **Step 5: Final evidence report and stop state**

Report:

- starting/final HEAD and commits
- HIDDEN runtime removal and legacy migration
- voice transcript/keyword/dBFS/peak evidence
- network/http and level-policy results
- Juno live matrix results
- per-PNG hashes/bytes/changed pixels and screenshots
- focused/full validation
- HQ-10/HQ-11/OpenAI TITLE regression status

Leave the changed submission cleanup at `HUMAN_RECHECK`. Do not push or deploy.

## Final Self-review Checklist

- [ ] Every design requirement maps to a task and verification step.
- [ ] No `TBD`, `TODO`, placeholder command, or unknown file path remains.
- [ ] Type names in examples match the intended implementation.
- [ ] HIDDEN removal does not remove perfect transformation mechanics.
- [ ] QA evidence cannot persist or expose secrets/raw upstream bodies.
- [ ] Peak-only rejection is removed only from completed turn evaluation, not setup guidance.
- [ ] Both Worker dialogue paths share the same deterministic reply-quality guard.
- [ ] Only two authorized binary assets are changed and source/runtime bytes match.
- [ ] Historical records remain; current SSOT receives a dated superseding decision.
- [ ] User-owned screenplay is untouched and absent from every `git add` command.
- [ ] Final status is `HUMAN_RECHECK`, with no push/deploy.
