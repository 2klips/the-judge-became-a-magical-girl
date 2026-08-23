# Human Scene Composition Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Wraith omen user-advanced and remove the latest speaker, N6 lead-in Wraith, Battle HUD/Juno, and Ending Juno overlap regressions without changing story, save, voice, or binary assets.

**Architecture:** Keep the existing natural-edge omen hook and named composition presets. Add one explicit omen advance control, one stable VN speaker inset, and narrowly scoped CSS overrides for N6, Battle, and Ending rather than changing global actor geometry.

**Tech Stack:** TypeScript, Vanilla DOM, CSS, Vitest, Vite, browser QA.

---

### Task 1: User-advanced Wraith omen

**Files:**
- Modify: `tests/wraithOmenPresentation.test.ts`
- Modify: `src/ui/gameView.ts`
- Modify: `src/ui/vn.css`

- [x] **Step 1: Write the failing test**

Assert that `renderWraithOmen` creates a `wraith-omen-advance vn-advance` button, binds a one-shot click, and does not schedule `omen.durationMs` automatic advancement.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/wraithOmenPresentation.test.ts`

Expected: FAIL because the current renderer advances with `window.setTimeout` and has no button.

- [x] **Step 3: Write minimal implementation**

Keep the actor-free caption and natural transition edge. Append compact `계속 ›`, resolve only once on click, and style it as a caption control rather than a card.

- [x] **Step 4: Run targeted test**

Run: `npm test -- --run tests/wraithOmenPresentation.test.ts`

Expected: PASS.

### Task 2: Stable speaker and scene safe zones

**Files:**
- Modify: `tests/vnUiDesignSystem.test.ts`
- Modify: `tests/v31Composition.test.ts`
- Modify: `src/ui/vn.css`
- Modify: `src/styles.css`

- [x] **Step 1: Write failing tests**

Assert fixed speaker insets, `n6_first_choice`-only Wraith enlargement, a Battle top-left BGM reservation, lower Battle Juno, and left-low Ending Juno.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/vnUiDesignSystem.test.ts tests/v31Composition.test.ts`

Expected: FAIL on the new layout contracts.

- [x] **Step 3: Write minimal implementation**

Use scoped CSS selectors: ordinary VN speaker names get a fixed top-left slot; `[data-presentation-context="n6_first_choice"]` gets the larger Wraith; `.battle-screen` reserves the top-left HUD lane and lowers Juno; `.ending-screen` places Juno left-low outside the central card.

- [x] **Step 4: Run targeted tests**

Run: `npm test -- --run tests/vnUiDesignSystem.test.ts tests/v31Composition.test.ts`

Expected: PASS.

### Task 3: Rendered QA and SSOT reconciliation

**Files:**
- Modify: `docs/dev/HUMAN_SCENE_QA_BACKLOG.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`

- [x] **Step 1: Start the canonical UI and inspect the target flow**

Open the omen edge, N6 first choice, Battle, and an actual Ending through the production flow.

- [x] **Step 2: Verify 1920x1080, 1600x900, and 1366x768**

Check scroll 0, actor/UI overlap 0 for the requested regions, actor/core visibility, explicit omen progression, and console error 0.

- [x] **Step 3: Update living QA records**

Record implementation as `HUMAN_RECHECK`; do not mark visual items `PASS` without user review.

- [x] **Step 4: Run full verification**

Run: `npm run check`, `npm test`, `npm run build`, `npm run build:qa`, and `git diff --check`.

- [ ] **Step 5: Commit**

Commit message: `fix(ui): refine scene progression and safe zones`

Push: prohibited.
