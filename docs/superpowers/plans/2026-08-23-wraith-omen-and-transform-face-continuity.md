# Wraith Omen and Transform Face Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 direct-wish CTA 위치, N2→N3 회색 망령 전조, 사원증 반응 sprite의 magenta artifact 제거, 변신 후 도윤 4종의 얼굴 공개 연속성을 Story/FSM/save/voice/composition 변경 없이 닫는다.

**Architecture:** `main.ts`의 이미 존재하는 dialogue reply continuation edge에서 `n2_juno_followup → n3_wraith_choice`만 감지해 저장되지 않는 1회성 `GameView` interstitial을 호출한다. 화면 계약은 새 순수 모듈이 소유하고, `GameView`는 작은 subtitle과 timer만 렌더하며, SFX는 기존 `SfxPlayer` oscillator cue로 추가한다. 사원증 sprite는 palette alpha만 고치는 결정적 cleanup과 alpha-safe export로 처리하고, 변신 얼굴은 각 target 원본을 보존한 채 승인 reference의 얼굴 identity를 target별 mask 안에서만 합성한다.

**Tech Stack:** TypeScript 7, Vite 8, Vanilla DOM/CSS, Vitest 4, Web Audio API, Python 3 + Pillow/NumPy asset tooling, built-in OpenAI `image_gen` for the four transformed-face edits only

---

## 0. SSOT, baseline, and hard scope

**Design SSOT:** [2026-08-23-wraith-omen-and-transform-face-continuity-design.md](../specs/2026-08-23-wraith-omen-and-transform-face-continuity-design.md)

Implementation must start from exactly:

- branch: `codex/scenario-v31-runtime-composition-p1`
- implementation starting HEAD: `4405277550dcdea522b00d7d2922d901d250d09b`
- asset pre-edit comparison baseline: `39f4370ab731377b77f3898f48496990961b81cc` (Task 4/5 verifier 전용)
- worktree: clean, including untracked files

- [ ] **Preflight before Task 1**

```powershell
Set-Location 'F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\scenario-v31-runtime-composition-p1'
$expectedBranch = 'codex/scenario-v31-runtime-composition-p1'
$expectedHead = '4405277550dcdea522b00d7d2922d901d250d09b'
if ((git branch --show-current) -ne $expectedBranch) { throw 'Unexpected branch; stop and report.' }
if ((git rev-parse HEAD) -ne $expectedHead) { throw 'Unexpected HEAD; stop and report.' }
if (@(git status --porcelain=v1 --untracked-files=all).Count -ne 0) { throw 'Dirty worktree; stop and report.' }
git status --short
```

Expected: no output from `git status --short`. Do not reset, revert, amend, rebase, switch branch, create another worktree, or push.

### Immutable/out-of-scope paths and contracts

- Do not modify `public/scenario/**`, scenario text, node IDs, branch logic, ending grades, `GameState`, save schema, relationship, flags, `nodeTurn`, or `totalTurn`.
- Do not modify Voice Worker, microphone/PTT, BGM behavior, Battle composition/UI, Ending, Post-credit, actor positions/scales, TITLE, or dependency files.
- Do not add an omen scenario node or a persisted/in-memory game flag. The only one-shot guard may be the current reply callback's ephemeral closure plus the existing one-shot CTA.
- Do not edit `doyun.magical_pose`; it is identity reference only and remains `HUMAN_RECHECK`.
- Do not generate or repaint `doyun.employee_id_surprised`; its cleanup is deterministic palette/pixel/alpha work only.
- Do not mark any edited image `approved` or `PASS`; use `ready · HUMAN_RECHECK`.
- Every atomic task ends with a clean commit. Stop on an unexpected unrelated diff rather than absorbing it.

## Task 1: Scope the direct-wish CTA anchor to its CUT only

### 1. Changed files

- Modify: `src/ui/vn.css`
- Modify: `tests/earlySceneAssetIntegration.test.ts`
- No runtime/story/asset/doc file beyond those two.

### 2. RED test

- [ ] Add a focused test that requires the center/lower anchor only under `.direct-wish-prompt-cut .early-scene-cut-controls`, and also proves the generic control rule and ordinary narration CTA remain unchanged.

```ts
it("anchors only the direct-wish CUT control above the bottom center", () => {
  expect(vnCssSource).toMatch(
    /\.direct-wish-prompt-cut \.early-scene-cut-controls\s*\{[^}]*left:\s*50%;[^}]*right:\s*auto;[^}]*bottom:\s*clamp\(56px,\s*7vh,\s*80px\);[^}]*transform:\s*translateX\(-50%\)/s,
  );
  expect(vnCssSource).not.toMatch(
    /\.juno-monitor-emergence-cut \.early-scene-cut-controls[^}]*left:\s*50%/s,
  );
  expect(vnCssSource).toMatch(
    /\.vn-dialogue-shell--narration:not\(\.battle-dialogue\) \.vn-advance\s*\{[^}]*right:/s,
  );
});
```

- [ ] Run RED:

```powershell
npx vitest run tests/earlySceneAssetIntegration.test.ts
```

Expected: the new scoped-anchor assertion fails before CSS implementation; existing early-scene tests remain green.

### 3. Minimal implementation

- [ ] Keep the generic `.early-scene-cut-controls` rule intact and add only this override:

```css
.direct-wish-prompt-cut .early-scene-cut-controls {
  left: 50%;
  right: auto;
  bottom: clamp(56px, 7vh, 80px);
  transform: translateX(-50%);
}
```

- [ ] Do not change button copy, `delayedAdvanceButton()`, borderless style, focus, one-shot behavior, ordinary `계속 ›`, Transform CUT, Battle, or Ending selectors.

### 4. Targeted validation

```powershell
npx vitest run tests/earlySceneAssetIntegration.test.ts tests/vnUiDesignSystem.test.ts
npm run check
git diff --check
```

Expected: PASS; diff contains only the scoped CSS override and focused contract test.

### 5. Browser QA

- [ ] Production/debug OFF, direct-wish prompt at 1920×1080, 1600×900, 1366×768.
- [ ] `다음 장면 ›` is horizontally centered and `56–80px` above the bottom, discoverable, keyboard-focusable, and not clipped.
- [ ] Compare one ordinary narration screen, Transform CUT, Battle, and Ending: their CTA placement is byte/style-contract unaffected.
- [ ] At all three viewports: scroll 0, BGM HUD collision 0, duplicate visible baked prompt 0, console error 0.

### 6. Docs/manifest/provenance

- No docs, manifest, or provenance update in this atomic selector task. `IMPLEMENTATION_LOG` and QA evidence are recorded once in Task 6 after browser verification; asset SSOT is unaffected.

### 7. Expected atomic commit

```powershell
git add src/ui/vn.css tests/earlySceneAssetIntegration.test.ts
git commit -m "fix(ui): anchor direct-wish progress control"
```

## Task 2: Add a natural-edge-only Wraith omen presentation

### 1. Changed files

- Create: `src/ui/wraithOmenPresentation.ts`
- Create: `tests/wraithOmenPresentation.test.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/gameView.ts`
- Modify: `src/ui/vn.css`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/dev/QA_AND_DEMO.md`
- Do not modify scenario JSON, engine, state, save/schema, relationship, flags, actor composition, or BGM.

### 2. RED test

- [ ] Add pure edge and presentation-contract tests before runtime wiring:

```ts
import {
  WRAITH_OMEN_PRESENTATION,
  shouldPresentWraithOmen,
} from "../src/ui/wraithOmenPresentation";

it("permits only the natural advanced N2 follow-up to N3 edge", () => {
  expect(shouldPresentWraithOmen("n2_juno_followup", "n3_wraith_choice", true)).toBe(true);
  expect(shouldPresentWraithOmen("n2_juno_followup", "n3_wraith_choice", false)).toBe(false);
  expect(shouldPresentWraithOmen("n3_wraith_choice", "n3_wraith_choice", true)).toBe(false);
  expect(shouldPresentWraithOmen("n2_juno_intro", "n3_wraith_choice", true)).toBe(false);
});

it("owns no actors, node state, or large dialogue shell", () => {
  expect(WRAITH_OMEN_PRESENTATION).toEqual({
    sceneId: "n2_n3_wraith_omen",
    backgroundId: "bg_hall_dark",
    text: "(모니터 속 평가 문장이 한 글자씩 회색으로 번진다.)",
    actors: [],
  });
});
```

- [ ] Add source-contract assertions that `continueFromReply` queries `engine.getState().currentNodeId`, calls the helper before `renderCurrent`, and contains an ephemeral `transitionPresentationStarted` guard. Assert no `GameState`, save, scenario, or flags file is in the staged diff.

- [ ] Run RED:

```powershell
npx vitest run tests/wraithOmenPresentation.test.ts
```

Expected: module import fails before creation.

### 3. Minimal implementation

- [ ] Create the immutable presentation contract and exact edge predicate:

```ts
export const WRAITH_OMEN_PRESENTATION = Object.freeze({
  sceneId: "n2_n3_wraith_omen",
  backgroundId: "bg_hall_dark",
  text: "(모니터 속 평가 문장이 한 글자씩 회색으로 번진다.)",
  actors: [] as const,
});

export function shouldPresentWraithOmen(
  fromNodeId: string,
  toNodeId: string,
  advanced: boolean,
): boolean {
  return (
    advanced &&
    fromNodeId === "n2_juno_followup" &&
    toNodeId === "n3_wraith_choice"
  );
}
```

- [ ] In `renderReply`, declare `let transitionPresentationStarted = false` next to `continueFromReply`. In the callback, read the engine's already-advanced current node and invoke the omen only once:

```ts
const nextNodeId = engine.getState().currentNodeId;
if (
  !transitionPresentationStarted &&
  shouldPresentWraithOmen(node.nodeId, nextNodeId, result.advanced)
) {
  transitionPresentationStarted = true;
  view.renderWraithOmen(() => renderCurrent());
  return;
}
```

Keep the existing N1→N2 Juno emergence condition and normal fallback. Resume, debug preview, and ordinary N3 re-render call `renderCurrent()` directly and therefore cannot enter this edge hook.

- [ ] Add `GameView.renderWraithOmen(onContinue)` following the proven interstitial shell/commit lifecycle, but with explicit user advancement instead of a timer:

```ts
renderWraithOmen(onContinue: () => void): void {
  const omen = WRAITH_OMEN_PRESENTATION;
  const shell = this.createShell(omen.backgroundId, omen.sceneId);
  shell.classList.add("wraith-omen-interstitial");
  shell.dataset.actorCount = "0";
  shell.append(element("div", "wraith-omen-monitor-haze"));
  const caption = element("p", "wraith-omen-caption", omen.text);
  caption.setAttribute("role", "status");
  const advance = element("button", "wraith-omen-advance vn-advance", "계속");
  advance.type = "button";
  advance.dataset.advanceState = "ready";
  advance.addEventListener("click", () => {
    advance.disabled = true;
    advance.dataset.advanceState = "used";
    this.onAdvance?.();
    onContinue();
  }, { once: true });
  shell.append(caption, advance);
  this.commit(shell);
}
```

- [ ] Style only `.wraith-omen-interstitial`, `.wraith-omen-monitor-haze`, and `.wraith-omen-caption`. The caption is a one-line lower-third subtitle: `width: fit-content`, `max-width: min(760px, calc(100vw - 64px))`, no `dialogue-panel`/`vn-dialogue-shell`, no detached card, no large padding, no center-screen modal. Use subtle gray text/line, not a rounded panel.
- [ ] Normal motion: one short monitor haze/noise/flicker. Reduced motion: remove flicker/scale and retain opacity-only entrance. 후속 human QA amendment로 두 모드 모두 caption 전용 `계속 ›` 입력을 기다리며 자동 hold timer는 사용하지 않는다.
- [ ] Render no live Doyun/Juno/Wraith and add no actor via `appendDialogueVisuals`.

### 4. Targeted validation

```powershell
npx vitest run tests/wraithOmenPresentation.test.ts tests/earlySceneAssetIntegration.test.ts tests/v31Composition.test.ts
npm run check
git diff --check
git diff --name-only
```

Before commit, explicitly inspect `git diff --name-only`; it must not include `src/state.ts`, `src/engine/**`, `src/data/schema.ts`, `public/scenario/**`, save files, voice, battle, ending, or asset binaries.

### 5. Browser QA

- [ ] Production/debug OFF natural click path: complete `n2_juno_followup`; observe exactly one omen that remains until the caption-specific `계속 ›` is activated, then approved N3 composition. Automatic timer advancement must be 0.
- [ ] Natural actual voice path: same edge, exactly one omen.
- [ ] Reload/Resume while current node is N3: omen count 0.
- [ ] Open `?debug=1&scene=n3-wraith`: omen count 0.
- [ ] Force ordinary N3 re-render (resize/focus/QA rerender path): omen count remains 0.
- [ ] Interstitial: actor count 0, caption does not use/cover the VN shell, center stage remains visible, BGM behavior unchanged, console error 0.
- [ ] Repeat at 1920×1080, 1600×900, 1366×768; scroll/clipping 0. Enable reduced motion and confirm no flicker/scale.

### 6. Docs/manifest/provenance

- Update `SCENE_ASSET_MAPPING.md` N2→N3 row with natural-edge-only ephemeral presentation, actor 0, exact caption, Resume/debug/re-render 0, and unchanged N3 actor composition/BGM.
- Add a manual checkbox matrix to `QA_AND_DEMO.md` for natural click, natural voice, Resume, debug, re-render, reduced motion, and three viewports.
- `ASSET_MANIFEST.md`, `PROVENANCE.md`, `AI_PRODUCTION_LOG.md`: no change because this task adds no binary or generated asset.

### 7. Expected atomic commit

```powershell
git add src/ui/wraithOmenPresentation.ts src/main.ts src/ui/gameView.ts src/ui/vn.css tests/wraithOmenPresentation.test.ts docs/assets/SCENE_ASSET_MAPPING.md docs/dev/QA_AND_DEMO.md
git commit -m "feat(ui): add natural-edge wraith omen"
```

## Task 3: Add the fail-soft `wraith_omen` Web Audio cue

### 1. Changed files

- Modify: `src/audio/sfx.ts`
- Modify: `src/main.ts`
- Modify: `tests/m5Sfx.test.ts`
- Modify: `tests/wraithOmenPresentation.test.ts`
- Modify: `docs/dev/QA_AND_DEMO.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- No MP3/WAV/SFX binary, BGM, voice, Worker, PTT, scenario, or save changes.

### 2. RED test

- [ ] Extend the fake AudioContext test to require two oscillator starts for `wraith_omen`, 40ms duplicate blocking, PTT suppression, and fail-soft:

```ts
it("plays one two-layer wraith omen and keeps suppression/fail-soft", () => {
  const { context, starts } = fakeAudioContext();
  let now = 500;
  const player = new SfxPlayer(() => context, () => now);
  expect(player.play("wraith_omen")).toBe(true);
  expect(starts).toHaveLength(2);
  expect(player.play("wraith_omen")).toBe(false);
  now += 40;
  expect(player.play("wraith_omen")).toBe(true);
  player.setSuppressed(true);
  expect(player.play("wraith_omen")).toBe(false);
});
```

- [ ] Assert the natural-edge block contains exactly one `sfx.play("wraith_omen")`; Resume/debug code contains none.
- [ ] Run RED:

```powershell
npx vitest run tests/m5Sfx.test.ts tests/wraithOmenPresentation.test.ts
```

Expected: TypeScript/test failure because `wraith_omen` is not yet a `SfxCue`.

### 3. Minimal implementation

- [ ] Add `"wraith_omen"` to `SfxCue` and two low layers only:

```ts
wraith_omen: [
  { type: "sine", startHz: 92, endHz: 64, offset: 0, duration: 0.62, gain: 0.046 },
  { type: "triangle", startHz: 148, endHz: 82, offset: 0.08, duration: 0.52, gain: 0.028 },
],
```

Total audible window is 0.60–0.70 seconds. Reuse the existing master gain, duplicate window, `setSuppressed`, `AudioContext` creation catch, and silent failure return.

- [ ] Call `sfx.play("wraith_omen")` immediately before `view.renderWraithOmen(() => renderCurrent())` inside the already-tested natural-edge block only. Do not duck/switch/restart BGM and do not add audio state.

### 4. Targeted validation

```powershell
npx vitest run tests/m5Sfx.test.ts tests/wraithOmenPresentation.test.ts tests/mainPttLiveMeter.test.ts
npm run check
git diff --check
```

Expected: cue plays two layers; the existing PTT suppression/release and fail-soft tests remain green.

### 5. Browser QA

- [ ] With normal audio enabled, traverse the natural N2→N3 edge once: one low omen cue, no clipping, N3 BGM begins through its existing path.
- [ ] Resume at N3, debug N3, and re-render N3: omen audio count 0.
- [ ] Voice-path transition after capture release: one cue; no duplicate `/voice/realtime`, no BGM duck/recover regression.
- [ ] AudioContext blocked/unavailable simulation: silent continuation to N3, console exception 0.
- [ ] Three desktop viewports and reduced motion: audio count remains independent of CSS motion preference.

### 6. Docs/manifest/provenance

- Record browser/manual audio checks and cue count in `QA_AND_DEMO.md` and one dated implementation entry in `IMPLEMENTATION_LOG.md`.
- `ASSET_MANIFEST.md`, `PROVENANCE.md`, `AI_PRODUCTION_LOG.md`: no change. This is synthesized runtime WebAudio, not a distributed binary and not the deferred Suno SFX source integration.

### 7. Expected atomic commit

```powershell
git add src/audio/sfx.ts src/main.ts tests/m5Sfx.test.ts tests/wraithOmenPresentation.test.ts docs/dev/QA_AND_DEMO.md docs/dev/IMPLEMENTATION_LOG.md
git commit -m "feat(audio): cue the wraith omen transition"
```

## Task 4: Remove the employee-ID magenta artifact without repainting

This is an isolated deterministic asset-maintenance task. Do not invoke `image_gen`.

### 1. Changed files

- Modify: `assets/source/early-scene-2026-08-22/tools/build_early_scene_assets.py`
- Create: `assets/source/early-scene-2026-08-22/tools/clean_magenta_artifact.py`
- Create: `assets/source/early-scene-2026-08-22/tools/test_early_scene_asset_pipeline.py`
- Modify: `assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png`
- Modify: `assets/runtime/char/char_doyun_employee_id_surprised.png`
- Modify: `tests/earlySceneAssetIntegration.test.ts`
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/dev/HUMAN_SCENE_QA_BACKLOG.md`
- Do not modify the preserved original, suspicious Doyun, character catalog/mapping, or any other binary.

### 2. RED test

- [ ] Add Python tests using temporary files. The first constructs a palette PNG with visible magenta artifact and asserts cleanup changes only artifact alpha. The second passes an RGBA antialiased edge through `save_indexed` and asserts no opaque saturated magenta plus multi-level alpha preservation.

```py
def saturated_magenta(rgba: np.ndarray) -> np.ndarray:
    return (
        (rgba[:, :, 0] >= 220)
        & (rgba[:, :, 1] <= 64)
        & (rgba[:, :, 2] >= 160)
        & (rgba[:, :, 3] >= 128)
    )

def test_cleanup_changes_only_artifact_alpha(self):
    before = np.array(Image.open(self.fixture).convert("RGBA"))
    cleaned = np.array(clean_magenta_artifact(Image.open(self.fixture)).convert("RGBA"))
    candidate = saturated_magenta(before)
    self.assertGreater(int(candidate.sum()), 0)
    self.assertTrue(np.array_equal(before[~candidate], cleaned[~candidate]))
    self.assertTrue(np.all(cleaned[candidate, 3] == 0))
```

- [ ] Extend `earlySceneAssetIntegration.test.ts` with `execFileSync` and parse the verifier's stdout; require `opaqueSaturatedMagenta=0`, `nonArtifactChangedPixels=0`, 1200×2000, source/runtime byte equality, and file ≤800KB:

```ts
const cleanupReport = JSON.parse(
  execFileSync(
    "python",
    [
      "assets/source/early-scene-2026-08-22/tools/clean_magenta_artifact.py",
      "--verify",
      "--baseline",
      "39f4370ab731377b77f3898f48496990961b81cc",
      "--source",
      "assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png",
      "--runtime",
      "assets/runtime/char/char_doyun_employee_id_surprised.png",
    ],
    { encoding: "utf8" },
  ),
);
expect(cleanupReport).toMatchObject({
  opaqueSaturatedMagenta: 0,
  nonArtifactChangedPixels: 0,
  width: 1200,
  height: 2000,
  sourceRuntimeEqual: true,
});
expect(cleanupReport.bytes).toBeLessThanOrEqual(800 * 1024);
```
- [ ] Run RED:

```powershell
python assets/source/early-scene-2026-08-22/tools/test_early_scene_asset_pipeline.py
npx vitest run tests/earlySceneAssetIntegration.test.ts
```

Expected: missing cleanup module/new report assertion fails before implementation.

### 3. Minimal implementation

- [ ] Replace the magenta-matte `save_indexed` body with RGBA-aware FASTOCTREE quantization; do not flatten over any key color:

```py
def save_indexed(image: Image.Image, destination: Path) -> None:
    indexed = image.convert("RGBA").quantize(
        colors=255,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.NONE,
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    indexed.save(destination, format="PNG", optimize=True, compress_level=9)
```

The regression test must prove the exported PNG retains `tRNS`/multiple alpha levels and introduces zero saturated magenta. Do not rebuild unrelated existing assets merely because the exporter changed.

- [ ] Implement the current asset cleanup by editing palette transparency only. Preserve every RGB palette entry and every non-artifact decoded RGBA pixel; set alpha 0 only for palette indices whose RGB meets the audited saturated-magenta threshold. Preserve the existing transparent index/alpha table.
- [ ] Run cleanup against the existing delivery PNG, write through a temporary file, verify it, then atomically replace delivery and copy the exact resulting bytes to runtime. Never touch `originals/image_03_doyun_employee_id_surprised.png`.
- [ ] Give `clean_magenta_artifact.py` two explicit modes: default cleanup writes a temporary verified output and replaces only `--source` plus its `--runtime` copy; `--verify --baseline <sha>` writes the following JSON report to stdout without changing files. Compare the baseline blob at the supplied Git SHA with the cleaned output. Gate on:
  - before artifact pixel count > 0;
  - after opaque saturated magenta count = 0;
  - decoded pixels outside the identified artifact set changed = 0;
  - dimensions = 1200×2000;
  - transparent PNG and source/runtime byte equality;
  - size ≤800KB.
- [ ] Visually compare baseline/current overlays at 400% around hair, head, hands, ID card, shirt, trousers, and full silhouette. Any facial/hair shape, expression, ID, hands, clothing, pose, or body-proportion change blocks the task.

### 4. Targeted validation

```powershell
python assets/source/early-scene-2026-08-22/tools/test_early_scene_asset_pipeline.py
npx vitest run tests/earlySceneAssetIntegration.test.ts tests/m5Assets.test.ts tests/m5DoyunPresentation.test.ts
npm run check
git diff --check
git diff --name-status
```

Before commit, binary diff scope must be exactly the delivery/runtime pair for `char_doyun_employee_id_surprised.png`; preserved original and other assets remain byte-identical.

### 5. Browser QA

- [ ] N5 employee-ID beat at 1920×1080, 1600×900, 1366×768, production/debug OFF.
- [ ] Purple/magenta line count visually 0 at hair and silhouette; eyes/face, hair shape, expression, floating-ID gaze, hands, clothing, proportions, anchor, actor/dialogue collision are unchanged.
- [ ] Debug frame confirms logical ID `doyun.employee_id_surprised`; console error and asset 404 = 0.
- [ ] Status remains `HUMAN_RECHECK`; automated and agent visual inspection do not make it PASS.

### 6. Docs/manifest/provenance

- `ASSET_MANIFEST.md`: replace byte size/SHA-256 with measured cleaned values; record `pixel/alpha-safe palette cleanup`, regenerated-file count 1, `ready · HUMAN_RECHECK`, not approved. Recalculate runtime total files/bytes/MiB and 30MiB gate from disk.
- `PROVENANCE.md`: retain user-provided creator/model UNKNOWN facts; add non-generative deterministic cleanup, baseline SHA, exact delivery/runtime paths, before/after hashes, and non-artifact changed pixels = 0.
- `AI_PRODUCTION_LOG.md`: amend/add the 2026-08-23 maintenance line to say no model/image generation was used for this cleanup; do not imply a new creative origin.
- `SCENE_ASSET_MAPPING.md`: keep the N5-only mapping and add artifact cleanup pending human scene recheck.
- `HUMAN_SCENE_QA_BACKLOG.md`: HQ-03 remains `HUMAN_RECHECK`; append cleanup evidence without PASS.

### 7. Expected atomic commit

```powershell
git add assets/source/early-scene-2026-08-22/tools/build_early_scene_assets.py assets/source/early-scene-2026-08-22/tools/clean_magenta_artifact.py assets/source/early-scene-2026-08-22/tools/test_early_scene_asset_pipeline.py assets/source/early-scene-2026-08-22/delivery/char/char_doyun_employee_id_surprised.png assets/runtime/char/char_doyun_employee_id_surprised.png tests/earlySceneAssetIntegration.test.ts docs/assets/ASSET_MANIFEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/assets/SCENE_ASSET_MAPPING.md docs/dev/HUMAN_SCENE_QA_BACKLOG.md
git commit -m "fix(assets): clean employee ID sprite alpha"
```

## Task 5: Reveal four transformed faces with target-specific masked edits

This is the only generative image-edit task. Execute it separately from code/UI/audio and use the `imagegen` skill before any image call.

### 1. Changed files

- Create: `assets/source/doyun/face-continuity-2026-08-23/masks/char_doyun_magical_mask.png`
- Create: `assets/source/doyun/face-continuity-2026-08-23/masks/char_doyun_magical_defend_mask.png`
- Create: `assets/source/doyun/face-continuity-2026-08-23/masks/char_doyun_magical_attack_mask.png`
- Create: `assets/source/doyun/face-continuity-2026-08-23/masks/char_doyun_magical_finish_mask.png`
- Create: `assets/source/doyun/face-continuity-2026-08-23/tools/apply_masked_face_edit.py`
- Create: `assets/source/doyun/face-continuity-2026-08-23/tools/verify_face_edits.py`
- Modify: `assets/source/doyun/delivery/char_doyun_magical.png`
- Modify: `assets/source/doyun/delivery/char_doyun_magical_defend.png`
- Modify: `assets/source/doyun/delivery/char_doyun_magical_attack.png`
- Modify: `assets/source/doyun/delivery/char_doyun_magical_finish.png`
- Modify the same four filenames under `assets/runtime/char/`
- Modify: `tests/m5Assets.test.ts`
- Modify: `tests/m5DoyunPresentation.test.ts`
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/dev/HUMAN_SCENE_QA_BACKLOG.md`
- Do not modify `char_doyun_magical_pose.png`, catalog IDs, mapping logic, composition, scenario, or code outside verification tooling/tests.

### 2. RED test

- [ ] Before generating, add physical/mask contracts for all four logical IDs:

```ts
const transformedFaces = [
  "char_doyun_magical.png",
  "char_doyun_magical_defend.png",
  "char_doyun_magical_attack.png",
  "char_doyun_magical_finish.png",
] as const;

it.each(transformedFaces)("keeps %s source/runtime identical and ready for human recheck", (name) => {
  const source = readFileSync(resolve("assets/source/doyun/delivery", name));
  const runtime = readFileSync(resolve("assets/runtime/char", name));
  expect(runtime.equals(source)).toBe(true);
  expect(readPngDimensions(runtime)).toEqual({ width: 1200, height: 2000 });
  expect(manifestSource).toContain(`${name}`);
  expect(manifestSource).toMatch(new RegExp(`${name}[^\\n]*HUMAN_RECHECK`));
});
```

- [ ] Add `verify_face_edits.py` contract tests that compare the baseline blob at `39f4370ab731377b77f3898f48496990961b81cc` with each candidate through its 1200×2000 L mask and require:
  - changed pixels outside mask = 0;
  - alpha changes outside mask = 0;
  - all non-face canvas/body/costume/pose pixels exactly equal;
  - source/runtime byte equality;
  - each output ≤800KB and transparent;
  - four masked face-region hashes are all distinct;
  - `char_doyun_magical_pose.png` baseline/current bytes identical.
- [ ] Run RED before creating masks/edits:

```powershell
python assets/source/doyun/face-continuity-2026-08-23/tools/verify_face_edits.py --baseline 39f4370ab731377b77f3898f48496990961b81cc
npx vitest run tests/m5Assets.test.ts tests/m5DoyunPresentation.test.ts
```

Expected: verifier/mask paths do not exist and the new HUMAN_RECHECK manifest assertions fail.

### 3. Minimal implementation

- [ ] Inspect each target original and `assets/runtime/char/char_doyun_magical_pose.png` with `view_image` before editing. Treat the target as the sole authority for body, costume, crown, gloves, staff, ribbons, hands, legs, pose, silhouette, mouth shape, and action tension. Treat `magical_pose` only as Doyun's visible eyes/face identity reference.
- [ ] Run four separate `image_gen` edits, each with exactly two referenced inputs: first the target, second `magical_pose`. Write candidates outside delivery/runtime until all gates pass. Prompts must share invariants but preserve distinct action acting:
  - `doyun.magical`: remove the gray eye shadow; reveal the approved brown eyes with a cautious, overwhelmed transformed fallback expression; preserve the existing clenched mouth and hand/staff pose.
  - `doyun.magical_defend`: reveal narrowed, strained-but-determined eyes; preserve defensive bracing, sweat, clenched mouth, two-hand staff grip, and all costume geometry.
  - `doyun.magical_attack`: reveal focused, decisive eyes following the attack axis; preserve the existing clenched mouth, torso twist, staff direction, and attack tension.
  - `doyun.magical_finish`: reveal wide, forceful, determined eyes; preserve the open shout mouth, final-spell exertion, staff grip, and full pose.

Every prompt explicitly forbids changing body/costume/crown/hair silhouette/gloves/staff/ribbons/hands/legs/pose/canvas/background and forbids copying the `magical_pose` embarrassed smile into the action sprites.

- [ ] Build four 1200×2000 grayscale masks from the audited target face/eye-shadow region. White may cover only the face/eye band needed to remove the gray shadow; crown, hair outer silhouette, ears outside the correction, neck, mouth when preservation is required, costume, hands, staff, and body remain black. Use a 2–4px internal feather that never extends beyond the audited face envelope.
- [ ] `apply_masked_face_edit.py` aligns only the generated face crop to the target face envelope, composites through the corresponding mask over the exact target baseline, writes optimized transparent PNG, and copies identical bytes to runtime. The script must never resize or re-encode the baseline outside the mask.
- [ ] Before replacing any final file, run `verify_face_edits.py`; any outside-mask changed pixel, alpha change, pose/silhouette mismatch, source/runtime mismatch, duplicate face hash, or `magical_pose` hash change stops the task.
- [ ] Inspect all four full sprites and 400% face crops side-by-side. Automated uniqueness is not semantic approval: verify visually that fallback/defend/attack/finish retain different eyes, mouth, and tension.

### 4. Targeted validation

```powershell
python assets/source/doyun/face-continuity-2026-08-23/tools/verify_face_edits.py --baseline 39f4370ab731377b77f3898f48496990961b81cc
npx vitest run tests/m5Assets.test.ts tests/m5DoyunPresentation.test.ts tests/v31Composition.test.ts tests/v31ScenarioRuntime.test.ts
npm run check
git diff --check
```

Also verify the staged binary set is exactly four source delivery files, four runtime files, and four source-only masks; `magical_pose` and every other binary are absent from the diff.

### 5. Browser QA

- [ ] Production/debug OFF at 1920×1080, 1600×900, 1366×768:
  - N5 transformed fallback/result where `doyun.magical` can appear;
  - Battle p1 `magical_defend`;
  - Battle p2 `magical_attack`;
  - N7/N8 final spell `magical_finish`.
- [ ] Confirm visible eyes persist after Transform CUT full-face reveal, while pre-transform sprites remain obscured.
- [ ] Confirm four actions read differently and preserve original mouth/tension/body/costume/pose; actor anchors, no-overlap, hands/staff, Wraith/Juno composition, CUT/SPRITE exclusivity, scroll, clipping, and console error remain unchanged.
- [ ] Capture full-stage and face crop evidence for the user. End every asset at `HUMAN_RECHECK`; do not self-approve.

### 6. Docs/manifest/provenance

- `ASSET_MANIFEST.md`: update each of four rows with exact measured bytes/SHA-256, `head/face masked edit`, its preserved action emotion, `ready · HUMAN_RECHECK`; recalculate runtime total files/bytes/MiB and 30MiB gate. Keep `magical_pose` unchanged.
- `PROVENANCE.md`: record target-original authority, `magical_pose` identity reference, exact prompt/tool date, source/runtime hashes, mask path, baseline SHA, and outside-mask changed pixels = 0 per target. Do not invent model/version/work ID if unavailable.
- `AI_PRODUCTION_LOG.md`: add four separate output descriptions or a four-row batch with target-specific acting; state image generation plus deterministic masked composite, not full-sprite replacement.
- `SCENE_ASSET_MAPPING.md`: record Option A as implemented for N5–N8 and list fallback/defend/attack/finish distinct acting. Do not change scene mapping IDs.
- `HUMAN_SCENE_QA_BACKLOG.md`: HQ-05 `OPEN / HUMAN DECISION REQUIRED → HUMAN_RECHECK`; decision Option A and binary implementation are recorded, but PASS remains user-only. HQ-07 stays `HUMAN_RECHECK` and `magical_pose` is not re-edited.

### 7. Expected atomic commit

```powershell
git add assets/source/doyun/face-continuity-2026-08-23 assets/source/doyun/delivery/char_doyun_magical.png assets/source/doyun/delivery/char_doyun_magical_defend.png assets/source/doyun/delivery/char_doyun_magical_attack.png assets/source/doyun/delivery/char_doyun_magical_finish.png assets/runtime/char/char_doyun_magical.png assets/runtime/char/char_doyun_magical_defend.png assets/runtime/char/char_doyun_magical_attack.png assets/runtime/char/char_doyun_magical_finish.png tests/m5Assets.test.ts tests/m5DoyunPresentation.test.ts docs/assets/ASSET_MANIFEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/assets/SCENE_ASSET_MAPPING.md docs/dev/HUMAN_SCENE_QA_BACKLOG.md
git commit -m "feat(assets): reveal Doyun transformed faces"
```

## Task 6: Final SSOT and regression closure

### 1. Changed files

- Modify only if the preceding atomic commits did not already capture final measured evidence: `docs/dev/IMPLEMENTATION_LOG.md`, `docs/dev/QA_AND_DEMO.md`, `docs/assets/ASSET_MANIFEST.md`, `docs/assets/PROVENANCE.md`, `docs/assets/AI_PRODUCTION_LOG.md`, `docs/assets/SCENE_ASSET_MAPPING.md`, `docs/dev/HUMAN_SCENE_QA_BACKLOG.md`
- No code, scenario, dependency, or binary change in this task.

### 2. RED test

- [ ] Add no new product behavior. Before documentation closure, run a stale-state search and treat any stale claim as RED:

```powershell
rg -n 'HQ-05.*OPEN / HUMAN DECISION REQUIRED|magenta.*미해결|employee_id_surprised.*2442E797|wraith omen.*OPEN|doyun\.magical_(defend|attack|finish).*눈 가림' docs
```

Expected before final doc alignment: at least the historical/current-state lines requiring narrow update are found. Do not delete historical evidence; mark it superseded where history must remain.

### 3. Minimal implementation

- [ ] Record exact commit SHAs, measured hashes/bytes, test counts, browser viewports, and HUMAN_RECHECK status from Tasks 1–5.
- [ ] Keep these statements explicit:
  - omen is presentation-only on natural `n2_juno_followup → n3_wraith_choice`, one time per transition callback;
  - Resume/debug/re-render replay = 0;
  - no GameState/save/schema/relationship/flag change;
  - employee-ID cleanup is non-generative and non-artifact changed pixels = 0;
  - transformed targets use target body/pose authority and `magical_pose` face identity reference;
  - four transformed expressions remain distinct;
  - image outputs are `ready · HUMAN_RECHECK`, not approved/PASS;
  - direct-wish selector does not alter other CTA systems.

### 4. Targeted validation

Run the complete gate after the stale-state search and SSOT/document reconciliation. Documentation changes may still be uncommitted here, so do not expect `git status --short` to be clean yet:

```powershell
python assets/source/early-scene-2026-08-22/tools/test_early_scene_asset_pipeline.py
python assets/source/doyun/face-continuity-2026-08-23/tools/verify_face_edits.py --baseline 39f4370ab731377b77f3898f48496990961b81cc
npm run check
npm test
npm run build
npm run build:qa
git diff --check
```

Expected: all PASS and only the existing Transformers large-chunk warning if unchanged. Report actual test file/test counts; do not copy historical numbers. Commit the reconciled docs in Step 7 before checking final cleanliness.

### 5. Browser QA

- [ ] One final production/debug OFF click playthrough covering direct-wish → N2 → omen → N3 → N5 employee ID → Transform → Battle p1/p2 → N8.
- [ ] One actual voice path through the N2→N3 edge only if the canonical Worker environment is already available; do not reopen/change voice infrastructure. If unavailable, retain prior actual voice PASS and report this pass as click-only rather than faking evidence.
- [ ] 1920×1080, 1600×900, 1366×768: scroll/clipping/collision 0, CTA scoped, omen count/SFX count 1 on natural edge, replay count 0, actor count 0 during omen, N3 approved composition restored, no magenta artifact, four faces visible/distinct, console error/404 0.
- [ ] Capture evidence links and request user visual approval. Do not convert HUMAN_RECHECK to PASS.

### 6. Docs/manifest/provenance

- Reconcile the seven listed SSOT/QA docs only with facts produced by the actual implementation. Recompute runtime counts and bytes; never retain a stale total.
- Rights/provenance wording remains as currently attested. Asset editing does not upgrade `USER ATTESTED` to legal approval or `ready` to `approved`.
- `public/scenario/**`, `DECISIONS.md`, `MILESTONES.md`, and unrelated logs remain unchanged unless implementation exposed a genuinely new product decision; the approved design itself is not repeated as a new decision.

### 7. Expected atomic commit

If final measured evidence required a separate docs change:

```powershell
git add docs/dev/IMPLEMENTATION_LOG.md docs/dev/QA_AND_DEMO.md docs/assets/ASSET_MANIFEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/assets/SCENE_ASSET_MAPPING.md docs/dev/HUMAN_SCENE_QA_BACKLOG.md
git commit -m "docs(qa): record omen and face continuity evidence"
```

If the preceding commits already contain exact final evidence and no stale line remains, create no empty documentation commit.

After the Task 6 docs commit, or after confirming no docs commit is needed, rerun the complete gate at the final HEAD and check cleanliness last:

```powershell
python assets/source/early-scene-2026-08-22/tools/test_early_scene_asset_pipeline.py
python assets/source/doyun/face-continuity-2026-08-23/tools/verify_face_edits.py --baseline 39f4370ab731377b77f3898f48496990961b81cc
npm run check
npm test
npm run build
npm run build:qa
git diff --check
git status --short
```

Expected: all complete-gate commands PASS, only the unchanged Transformers large-chunk warning is allowed, and the final `git status --short` output is empty.

## Final implementation handoff report

After Task 6, report and stop:

```text
[Wraith Omen + Transform Face Continuity]

Git:
- baseline:
- final HEAD:
- commits:
- clean:

Direct-wish CTA:
- scoped selector:
- other CTA regression:

Wraith omen:
- natural edge count:
- Resume count:
- debug count:
- re-render count:
- caption:
- actors:
- SFX:
- reduced motion:

Employee-ID cleanup:
- method:
- generative edit:
- artifact before/after:
- non-artifact changed pixels:
- source/runtime hash:
- HUMAN_RECHECK:

Transform faces:
- magical:
- defend:
- attack:
- finish:
- outside-mask changes:
- magical_pose changed:
- HUMAN_RECHECK:

Regression:
- check:
- tests:
- build:
- build:qa:
- diff-check:
- browser:

Out of scope unchanged:
- Story/FSM/save:
- Voice/PTT/BGM:
- Battle composition:
- Ending/Post-credit:

Push: NO
```

Do not start Phase C, other asset production, release integration, or push after this report.
