# Transformation Battle and Ending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 변신을 한 컷씩 보여 주고, 전투를 좌측 도윤·주노/우측 망령 구도로 순차 연출하며, 정화 설명을 거쳐 겹침 없는 엔딩으로 연결한다.

**Architecture:** 변신과 전투는 `PresentationBeat` 순수 resolver가 현재 표시할 컷·화자·행동 에셋을 정한다. 기존 `GameEngine`의 3페이즈·momentum·grade 규칙은 유지하고, `GameView`가 한 beat씩 시각 상태를 보여 준 뒤 기존 continue 콜백을 호출한다.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 4, CSS animation, existing PNG/WebP assets

---

## Scope and file ownership

- Create: `src/ui/transformationSequence.ts`
- Create: `src/ui/battleSequence.ts`
- Create: `tests/m5TransformationSequence.test.ts`
- Create: `tests/m5BattleSequence.test.ts`
- Modify: `src/ui/gameView.ts` — sequence rendering and slots
- Modify: `src/styles.css` — full-bleed transform, battle anchors, outro/ending safe zones
- Conditional Modify: `src/assets/catalog.ts` — wraith attack/hit IDs, only after the rights gate
- Modify: `src/assets/presentationBackground.ts` — p1/p2 background continuity
- Modify: `tests/m5Assets.test.ts`
- Modify: `tests/m5Presentation.test.ts`
- Modify: `tests/m5SceneBackground.test.ts`
- Conditional Add: `assets/source/gray-wraith/delivery/char_gray_wraith_attack.png`
- Conditional Add: `assets/source/gray-wraith/delivery/char_gray_wraith_hit.png`
- Conditional Add: `assets/runtime/char/char_gray_wraith_attack.png`
- Conditional Add: `assets/runtime/char/char_gray_wraith_hit.png`
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

Do not use `char_gray_wraith_death.png`; the story preserves the wraith's small remaining light. Do not generate or edit images, change battle math, add phases, alter ending conditions, or change mobile layout.

**Execution guard:** Run only in `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline` after Audio/Voice, UI Foundation, and Narrative. Overall order is **A Audio/Voice → B UI Foundation → C Narrative → D Transformation/Battle/Ending**. SceneFrame and speaker focus are prerequisites; shared-file implementation is sequential and independent reviewers do not edit. Do not push, merge main, change branches, reset, revert, or amend. New task commits are allowed.

### Task 1: Render transformation as a four-beat sequence

**Files:**
- Create: `src/ui/transformationSequence.ts`
- Create: `tests/m5TransformationSequence.test.ts`
- Modify: `src/ui/gameView.ts:925-976`
- Modify: `src/styles.css:1105-1131,1463-1475`

- [ ] **Step 1: Write the failing sequence test**

Create `tests/m5TransformationSequence.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  TRANSFORMATION_BEATS,
  resolveTransformationBeat,
} from "../src/ui/transformationSequence";

describe("변신 결과 순차 연출", () => {
  it("cast, crossfade, complete, result를 한 장씩 연다", () => {
    expect(TRANSFORMATION_BEATS).toEqual(["cast", "crossfade", "complete", "result"]);
    expect(resolveTransformationBeat(0)).toEqual({
      id: "cast",
      cutLogicalId: "transform.cast",
      showResultCard: false,
      keepsOutgoingCast: false,
    });
    expect(resolveTransformationBeat(1)).toEqual({
      id: "crossfade",
      cutLogicalId: "transform.complete",
      showResultCard: false,
      keepsOutgoingCast: true,
    });
    expect(resolveTransformationBeat(2)).toEqual({
      id: "complete",
      cutLogicalId: "transform.complete",
      showResultCard: false,
      keepsOutgoingCast: false,
    });
    expect(resolveTransformationBeat(3)).toEqual({
      id: "result",
      cutLogicalId: "transform.complete",
      showResultCard: true,
      keepsOutgoingCast: false,
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5TransformationSequence.test.ts
```

Expected: FAIL because the sequence module does not exist.

- [ ] **Step 3: Implement the pure beat resolver**

Create `src/ui/transformationSequence.ts`:

```ts
export const TRANSFORMATION_BEATS = ["cast", "crossfade", "complete", "result"] as const;
export type TransformationBeatId = (typeof TRANSFORMATION_BEATS)[number];

export interface TransformationBeat {
  readonly id: TransformationBeatId;
  readonly cutLogicalId: "transform.cast" | "transform.complete";
  readonly showResultCard: boolean;
  readonly keepsOutgoingCast: boolean;
}

export function resolveTransformationBeat(index: number): TransformationBeat {
  const id = TRANSFORMATION_BEATS[Math.min(Math.max(index, 0), 3)] ?? "result";
  return {
    id,
    cutLogicalId: id === "cast" ? "transform.cast" : "transform.complete",
    showResultCard: id === "result",
    keepsOutgoingCast: id === "crossfade",
  };
}
```

- [ ] **Step 4: Add one cancellable presentation-timer owner**

Add these members to `GameView`; call `clearPresentationTimers()` at the beginning of `commit()` before mounting the next shell. Transformation and battle share this owner, so leaving a scene cannot mutate detached DOM later:

```ts
private readonly presentationTimers = new Set<number>();

private schedulePresentationStep(callback: () => void, delayMs: number): void {
  const timerId = window.setTimeout(() => {
    this.presentationTimers.delete(timerId);
    callback();
  }, delayMs);
  this.presentationTimers.add(timerId);
}

private clearPresentationTimers(): void {
  for (const timerId of this.presentationTimers) window.clearTimeout(timerId);
  this.presentationTimers.clear();
}
```

- [ ] **Step 5: Replace the two-cut collage with one full-bleed cut**

In `renderTransformationResult()`:

- remove the duplicate `doyun.magical_pose` sprite;
- remove the two-child `transform-cut-stage`;
- keep one `transformation-cut-layer` in ordinary beats;
- during `crossfade` only, keep the cast as an outgoing layer and place complete above it as an incoming layer;
- keep the result card in the `dialogue` slot hidden until the result beat;
- use a local `beatIndex` and `window.setTimeout` sequence of `900ms`, `420ms`, `900ms`, then result;
- on reduced motion, mount the result beat immediately.

Use this renderer helper inside the method:

```ts
const renderBeat = (): void => {
  const beat = resolveTransformationBeat(beatIndex);
  shell.dataset.transformationBeat = beat.id;
  const incoming = this.createAssetVisual(
    beat.cutLogicalId,
    beat.id === "cast" ? "변신 주문" : "변신 완료",
    `transformation-cut-layer ${beat.keepsOutgoingCast ? "is-incoming" : ""}`,
  );
  const stage = this.sceneSlot(shell, "stage");
  if (beat.keepsOutgoingCast) {
    const outgoing = this.createAssetVisual(
      "transform.cast",
      "변신 주문",
      "transformation-cut-layer is-outgoing",
    );
    stage.replaceChildren(outgoing, incoming);
  } else {
    stage.replaceChildren(incoming);
  }
  this.sceneSlot(shell, "dialogue").replaceChildren(
    ...(beat.showResultCard ? [card] : []),
  );
};
```

Call `this.commit(shell)` once before timers, then mutate only the two slots. For normal motion, render beat `0`, then chain delays from `[900, 420, 900]` through `schedulePresentationStep()` until beat `3`. The crossfade beat temporarily has exactly two role-labelled layers; the complete beat immediately removes outgoing cast and returns to one. Add a fake-timer DOM assertion for `crossfade: 2 layers` and `complete/result: 1 layer`. For reduced motion, set `beatIndex = 3` and call `renderBeat()` once. Any later `commit()` cancels the chain through the shared timer owner.

- [ ] **Step 6: Replace card styling with full-bleed styling**

Delete `.transform-cut` border, border-radius, box-shadow, rotate, and two-column grid rules. Add:

```css
.transformation-cut-layer {
  position: absolute;
  inset: calc(-1 * var(--safe-top)) calc(-1 * var(--safe-inline)) calc(-1 * var(--safe-bottom));
  overflow: hidden;
}

.transformation-cut-layer .asset-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-shell[data-transformation-beat="crossfade"] .is-outgoing {
  animation: transformation-fade-out 420ms ease both;
}

.game-shell[data-transformation-beat="crossfade"] .is-incoming {
  animation: transformation-fade-in 420ms ease both;
}

@keyframes transformation-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes transformation-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.transformation-result {
  background: var(--surface-modal);
  backdrop-filter: blur(14px);
}
```

- [ ] **Step 7: Verify GREEN**

```powershell
npm test -- tests/m5TransformationSequence.test.ts tests/m5Presentation.test.ts
npm run check
```

Browser-check reduced-motion off/on. Expected: ordinary beats have one cut; only the 420ms crossfade overlaps outgoing cast and incoming complete; no white card borders, no duplicate Doyun sprite, result card appears last.

- [ ] **Step 8: Commit**

```powershell
git add src/ui/transformationSequence.ts src/ui/gameView.ts src/styles.css tests/m5TransformationSequence.test.ts
git commit -m "feat(ui): sequence transformation cuts"
```

### Task 2: Adopt the existing gray-wraith attack and hit assets

**Files:**
- Add: `assets/source/gray-wraith/delivery/char_gray_wraith_attack.png`
- Add: `assets/source/gray-wraith/delivery/char_gray_wraith_hit.png`
- Add: `assets/runtime/char/char_gray_wraith_attack.png`
- Add: `assets/runtime/char/char_gray_wraith_hit.png`
- Modify: `src/assets/catalog.ts:87-109`
- Modify: `tests/m5Assets.test.ts:81-179,218-269`

- [ ] **Step 0: Enforce the hard rights gate before writing RED asset tests**

Obtain and record explicit confirmation that the generation service plan and every referenced input permit repository/public distribution for these exact two files. If confirmation is absent, **skip all of Task 2**: do not write the catalog/binary RED test, copy, catalog, stage, or commit either asset. Keep candidates only under `docs/gray-wraith-action-v2/`, never copy `death`, and continue at Task 3 using its separately GREEN-tested `gray_wraith.normal`/`gray_wraith.weakened` plus CSS-motion fallback. Resume Task 2 from Step 1 only after the gate is satisfied.

- [ ] **Step 1: Write the failing catalog and binary contracts**

Add these expectations to `tests/m5Assets.test.ts`:

```ts
expect(resolveImageAsset("gray_wraith.attack")).toBe(
  "assets/char/char_gray_wraith_attack.png",
);
expect(resolveImageAsset("gray_wraith.hit")).toBe(
  "assets/char/char_gray_wraith_hit.png",
);
```

Add independent cases:

```ts
it.each([
  ["char_gray_wraith_attack.png", "C7E15F68A8D1FB56433821C5F0169D5963415BE64E1CC66D49C76CA70B8C55D2"],
  ["char_gray_wraith_hit.png", "EC25530979D57214019A16AD8437E74333A6B4D308C4BDCEA8B3E4F436F100A8"],
] as const)("회색 망령 action은 검증된 ready 파일과 동일하다: %s", (filename, sha256) => {
  const source = readFileSync(resolve("assets", "source", "gray-wraith", "delivery", filename));
  const runtime = readFileSync(resolve("assets", "runtime", "char", filename));
  expect(runtime.equals(source), filename).toBe(true);
  expect(createHash("sha256").update(runtime).digest("hex").toUpperCase(), filename).toBe(sha256);
  expectTransparentCharacterAsset(
    filename,
    resolve("assets", "source", "gray-wraith", "delivery"),
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected: FAIL because catalog entries and adopted paths do not exist.

- [ ] **Step 3: Copy only the verified ready candidates**

```powershell
New-Item -ItemType Directory -Force -Path 'assets\source\gray-wraith\delivery' | Out-Null
Copy-Item -LiteralPath 'docs\gray-wraith-action-v2\delivery\char\char_gray_wraith_attack.png' -Destination 'assets\source\gray-wraith\delivery\char_gray_wraith_attack.png'
Copy-Item -LiteralPath 'docs\gray-wraith-action-v2\delivery\char\char_gray_wraith_hit.png' -Destination 'assets\source\gray-wraith\delivery\char_gray_wraith_hit.png'
Copy-Item -LiteralPath 'assets\source\gray-wraith\delivery\char_gray_wraith_attack.png' -Destination 'assets\runtime\char\char_gray_wraith_attack.png'
Copy-Item -LiteralPath 'assets\source\gray-wraith\delivery\char_gray_wraith_hit.png' -Destination 'assets\runtime\char\char_gray_wraith_hit.png'
```

- [ ] **Step 4: Add only the two catalog IDs**

```ts
"gray_wraith.attack": "assets/char/char_gray_wraith_attack.png",
"gray_wraith.hit": "assets/char/char_gray_wraith_hit.png",
```

- [ ] **Step 5: Verify GREEN**

```powershell
npm test -- tests/m5Assets.test.ts
npm run check
```

Expected only after Step 0 passes: both assets are 1200×2000 transparent PNG, under 800KiB, source/runtime identical, and hashes match the existing validation report. The unresolved-rights path never creates this RED test or changes runtime/catalog; its fallback contract is covered in Task 3.

- [ ] **Step 6: Commit**

```powershell
git add assets/source/gray-wraith/delivery assets/runtime/char/char_gray_wraith_attack.png assets/runtime/char/char_gray_wraith_hit.png src/assets/catalog.ts tests/m5Assets.test.ts
git commit -m "feat(assets): adopt gray wraith battle actions"
```

### Task 3: Keep p1/p2 in one frozen office and define battle beats

**Files:**
- Create: `src/ui/battleSequence.ts`
- Create: `tests/m5BattleSequence.test.ts`
- Modify: `tests/m5SceneBackground.test.ts:62-78`
- Modify: `src/assets/presentationBackground.ts:22-31`

- [ ] **Step 1: Write the failing background continuity test**

Change the p2 assertion:

```ts
expect(resolveBattle("p1_defend")).toBe("bg_battle_wide");
expect(resolveBattle("p2_attack")).toBe("bg_battle_wide");
expect(resolveBattle("p3_answer")).toBe("bg_mind_archive");
expect(resolveBattle("p3_answer", "spell")).toBe("bg_battle_core");
```

- [ ] **Step 2: Write the failing battle-sequence tests**

Create `tests/m5BattleSequence.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  BattleBeatRunner,
  resolveBattleBeatSfx,
  resolveBattleBeatSequence,
  resolveBattleFacing,
  resolveBattleSprite,
  type BattleBeatId,
} from "../src/ui/battleSequence";

describe("전투 순차 연출", () => {
  it("플레이어 주문은 준비, 도윤 행동, 망령 피격, 대사 순서다", () => {
    expect(resolveBattleBeatSequence("spell", false, undefined, false, 25)).toEqual([
      "prepare",
      "player-action",
      "enemy-hit",
      "dialogue",
    ]);
  });

  it("망령 공격은 망령 행동, 도윤 방어, 대사 순서다", () => {
    expect(resolveBattleBeatSequence("guard", false)).toEqual([
      "enemy-action",
      "player-action",
      "dialogue",
    ]);
  });

  it("마지막 성공은 정화와 설명을 추가한다", () => {
    expect(resolveBattleBeatSequence("spell", true, undefined, false, 25)).toEqual([
      "prepare",
      "player-action",
      "enemy-hit",
      "purify",
      "outro",
      "dialogue",
    ]);
  });

  it("실패·무효 행동은 망령 피격을 만들지 않는다", () => {
    expect(resolveBattleBeatSequence("failed-spell", false, undefined, false, 0)).toEqual([
      "prepare",
      "player-action",
      "dialogue",
    ]);
    expect(resolveBattleBeatSequence("freeform", false, undefined, false, -4)).not.toContain(
      "enemy-hit",
    );
  });

  it("p3 첫 prompt만 기록 공간 전환 beat로 시작한다", () => {
    expect(resolveBattleBeatSequence("prompt", false, "p3_answer", true)).toEqual([
      "space-transition",
      "dialogue",
    ]);
    expect(resolveBattleBeatSequence("prompt", false, "p3_answer", false)).toEqual([
      "dialogue",
    ]);
  });

  it("beat별 망령 에셋을 선택한다", () => {
    expect(resolveBattleSprite("enemy-action", "normal", true)).toBe("gray_wraith.attack");
    expect(resolveBattleSprite("enemy-hit", "normal", true)).toBe("gray_wraith.hit");
    expect(resolveBattleSprite("dialogue", "weakened", true)).toBe("gray_wraith.weakened");
  });

  it("action 권리 미확인 경로는 등록된 기본 에셋으로 완결된다", () => {
    expect(resolveBattleSprite("enemy-action", "normal", false)).toBe("gray_wraith.normal");
    expect(resolveBattleSprite("enemy-hit", "weakened", false)).toBe("gray_wraith.weakened");
  });

  it("action/hit cue는 기존 action 의미와 해당 시각 beat를 함께 지킨다", () => {
    expect(resolveBattleBeatSfx("enemy-action", "guard")).toBe("impact");
    expect(resolveBattleBeatSfx("player-action", "guard")).toBe("guard");
    expect(resolveBattleBeatSfx("player-action", "spell", 10)).toBe("cast");
    expect(resolveBattleBeatSfx("player-action", "spell", 25)).toBe("critical");
    expect(resolveBattleBeatSfx("player-action", "spell", 0)).toBe("recognition_fail");
    expect(resolveBattleBeatSfx("player-action", "click-spell", 25)).toBe("critical");
    expect(resolveBattleBeatSfx("player-action", "freeform", 12)).toBe("impact");
    expect(resolveBattleBeatSfx("player-action", "freeform", 0)).toBe("confirm");
    expect(resolveBattleBeatSfx("player-action", "failed-spell")).toBe("recognition_fail");
    expect(resolveBattleBeatSfx("player-action", "debug")).toBeNull();
    expect(resolveBattleBeatSfx("enemy-hit", "spell")).toBe("impact");
    expect(resolveBattleBeatSfx("dialogue", "spell")).toBeNull();
  });

  it("p3 공간 전환 뒤 대사를 연다", async () => {
    vi.useFakeTimers();
    const seen: BattleBeatId[] = [];
    const runner = new BattleBeatRunner((beat) => seen.push(beat));
    runner.start(["space-transition", "dialogue"]);
    expect(seen).toEqual(["space-transition"]);
    await vi.advanceTimersByTimeAsync(420);
    expect(seen).toEqual(["space-transition", "dialogue"]);
  });

  it("원본별 방향을 blanket flip 없이 분리한다", () => {
    expect(resolveBattleFacing("doyun.magical_attack")).toBe("flip");
    expect(resolveBattleFacing("doyun.magical_defend")).toBe("native");
    expect(resolveBattleFacing("doyun.magical_finish")).toBe("native");
    expect(resolveBattleFacing("gray_wraith.attack")).toBe("flip");
    expect(resolveBattleFacing("gray_wraith.hit")).toBe("native");
    expect(resolveBattleFacing("gray_wraith.normal")).toBe("native");
  });

  it("prompt는 준비 포즈, action beat는 페이즈 행동 포즈를 쓴다", () => {
    expect(resolveBattleDoyunSprite("p2_attack", "dialogue", true)).toBe(
      "doyun.magical_pose",
    );
    expect(resolveBattleDoyunSprite("p1_defend", "player-action", false)).toBe(
      "doyun.magical_defend",
    );
    expect(resolveBattleDoyunSprite("p2_attack", "player-action", false)).toBe(
      "doyun.magical_attack",
    );
    expect(resolveBattleDoyunSprite("p3_answer", "player-action", false)).toBe(
      "doyun.magical_finish",
    );
  });
});
```

- [ ] **Step 3: Run focused tests and verify RED**

```powershell
npm test -- tests/m5SceneBackground.test.ts tests/m5BattleSequence.test.ts
```

Expected: p2 returns `bg_hall_void`; battle sequence module does not exist.

- [ ] **Step 4: Implement background continuity**

Change `resolvePresentationBackground()`:

```ts
if (cue.kind === "battle") {
  if (cue.phaseId === "p1_defend" || cue.phaseId === "p2_attack") {
    return "bg_battle_wide";
  }
  if (cue.phaseId === "p3_answer") {
    return cue.beat === "spell" ? "bg_battle_core" : "bg_mind_archive";
  }
  return cue.baseBackground;
}
```

- [ ] **Step 5: Implement the pure battle sequence module**

Create `src/ui/battleSequence.ts`:

```ts
import type { BattleState } from "../battle/state";

export type BattleSequenceAction = "prompt" | "spell" | "click-spell" | "failed-spell" | "guard" | "freeform" | "debug";
export type BattleBeatId =
  | "space-transition"
  | "prepare"
  | "enemy-action"
  | "player-action"
  | "enemy-hit"
  | "purify"
  | "outro"
  | "dialogue";

export function resolveBattleBeatSequence(
  action: BattleSequenceAction,
  completed: boolean,
  phaseId?: string,
  firstPhaseRender = false,
  momentumDelta = 0,
): readonly BattleBeatId[] {
  if (action === "prompt") {
    return phaseId === "p3_answer" && firstPhaseRender
      ? ["space-transition", "dialogue"]
      : ["dialogue"];
  }
  const base: BattleBeatId[] =
    action === "guard"
      ? ["enemy-action", "player-action"]
      : momentumDelta > 0
        ? ["prepare", "player-action", "enemy-hit"]
        : ["prepare", "player-action"];
  if (completed) base.push("purify", "outro");
  base.push("dialogue");
  return base;
}

export function resolveBattleBeatSfx(
  beat: BattleBeatId,
  action: BattleSequenceAction,
  momentumDelta = 0,
): "cast" | "critical" | "guard" | "impact" | "confirm" | "recognition_fail" | null {
  if (beat === "player-action") {
    if (action === "guard") return "guard";
    if (action === "failed-spell" || (action === "spell" && momentumDelta === 0)) {
      return "recognition_fail";
    }
    if (action === "freeform") return momentumDelta > 0 ? "impact" : "confirm";
    if (action === "spell" || action === "click-spell") {
      return momentumDelta >= 25 ? "critical" : "cast";
    }
    return null;
  }
  if (beat === "enemy-action" || beat === "enemy-hit") return "impact";
  return null;
}

export function resolveBattleFacing(logicalId: string): "native" | "flip" {
  return logicalId === "doyun.magical_attack" || logicalId === "gray_wraith.attack"
    ? "flip"
    : "native";
}

export function resolveBattleDoyunSprite(
  phaseId: string,
  beat: BattleBeatId,
  prompt: boolean,
): string {
  if (prompt || beat === "prepare" || beat === "dialogue") return "doyun.magical_pose";
  if (phaseId === "p1_defend") return "doyun.magical_defend";
  if (phaseId === "p2_attack") return "doyun.magical_attack";
  return "doyun.magical_finish";
}

export function resolveBattleSprite(
  beat: BattleBeatId,
  enemyState: BattleState["enemyState"],
  actionAssetsAvailable = false,
): string {
  if (actionAssetsAvailable && beat === "enemy-action") return "gray_wraith.attack";
  if (actionAssetsAvailable && beat === "enemy-hit") return "gray_wraith.hit";
  return enemyState === "weakened" ? "gray_wraith.weakened" : "gray_wraith.normal";
}

export function resolveImmediateBattleBeat(beats: readonly BattleBeatId[]): BattleBeatId {
  if (beats.includes("outro")) return "outro";
  return beats.at(-1) ?? "dialogue";
}

const beatDelayMs: Partial<Record<BattleBeatId, number>> = {
  "space-transition": 420,
  prepare: 180,
  "enemy-action": 240,
  "player-action": 240,
  "enemy-hit": 330,
  purify: 500,
};

export class BattleBeatRunner {
  private timerId: number | null = null;
  private beats: readonly BattleBeatId[] = [];
  private index = 0;

  constructor(
    private readonly onBeat: (beat: BattleBeatId) => void,
    private readonly reducedMotion = false,
  ) {}

  start(beats: readonly BattleBeatId[]): void {
    this.cancel();
    this.beats = beats;
    this.index = this.reducedMotion
      ? Math.max(0, beats.indexOf(resolveImmediateBattleBeat(beats)))
      : 0;
    this.emitCurrent();
  }

  continueFromOutro(): void {
    if (this.beats[this.index] !== "outro") return;
    this.index += 1;
    this.emitCurrent();
  }

  cancel(): void {
    if (this.timerId !== null) window.clearTimeout(this.timerId);
    this.timerId = null;
  }

  private emitCurrent(): void {
    const beat = this.beats[this.index];
    if (!beat) return;
    this.onBeat(beat);
    const delay = beatDelayMs[beat];
    if (delay === undefined) return;
    this.timerId = window.setTimeout(() => {
      this.timerId = null;
      this.index += 1;
      this.emitCurrent();
    }, delay);
  }
}
```

If the existing `BattleState` export path differs, import from the current battle state module used by `gameView.ts`; do not duplicate the union.

The facing table is deliberately logical-ID-specific. The inspected attack sources point outward in the approved composition, while Doyun defend/finish and wraith hit/normal/weakened must retain their native orientation. Do not replace it with a character-wide CSS flip.

- [ ] **Step 6: Verify GREEN**

```powershell
npm test -- tests/m5SceneBackground.test.ts tests/m5BattleSequence.test.ts
npm run check
```

Expected: focused tests and TypeScript PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/assets/presentationBackground.ts src/ui/battleSequence.ts tests/m5SceneBackground.test.ts tests/m5BattleSequence.test.ts
git commit -m "feat(battle): define continuous office beats"
```

### Task 4: Recompose the battle stage and active speakers

**Files:**
- Modify: `tests/m5Presentation.test.ts:209-280`
- Create: `src/ui/presentationSequenceOwner.ts`
- Create: `tests/m5PresentationSequenceOwner.test.ts`
- Modify: `src/main.ts:285-578`
- Modify: `src/ui/gameView.ts:132-223,978-1168,1451-1507`
- Modify: `src/styles.css:2679-3168`

- [ ] **Step 1: Extend the presentation tests**

Before the resolver-only assertions, add a fake-timer presentation harness around the battle beat scheduler. It must prove:

```ts
it("전투 beat는 순서대로 열리고 commit 시 남은 timer를 취소한다", async () => {
  vi.useFakeTimers();
  const seen: string[] = [];
  const sequence = new BattleBeatRunner((beat) => seen.push(beat));
  sequence.start(["prepare", "player-action", "enemy-hit", "dialogue"]);
  expect(seen).toEqual(["prepare"]);
  await vi.advanceTimersByTimeAsync(180);
  expect(seen).toEqual(["prepare", "player-action"]);
  sequence.cancel();
  await vi.runAllTimersAsync();
  expect(seen).toEqual(["prepare", "player-action"]);
});

it("reduced motion은 최종 dialogue 상태를 즉시 연다", () => {
  expect(resolveImmediateBattleBeat(["prepare", "enemy-hit", "dialogue"])).toBe(
    "dialogue",
  );
});
```

Add a DOM assertion that the dialogue/actions slots are empty through prepare/action/hit and mounted only at dialogue. For a completed battle, make `outro` a user-readable gated state: show the black scrim and an `정화 계속` button; clicking it opens the final dialogue/result controls. Do not auto-advance outro after 650ms.

Create `src/ui/presentationSequenceOwner.ts` and cover it in `tests/m5PresentationSequenceOwner.test.ts` before GameView wiring:

```ts
export interface CancellablePresentationSequence {
  cancel(): void;
}

export class PresentationSequenceOwner {
  private battleRunner: CancellablePresentationSequence | null = null;

  replaceBattleRunner(runner: CancellablePresentationSequence): void {
    this.battleRunner?.cancel();
    this.battleRunner = runner;
  }

  beginCommit(): void {
    this.battleRunner?.cancel();
    this.battleRunner = null;
  }

  hasActiveBattleRunner(): boolean {
    return this.battleRunner !== null;
  }
}
```

Add `private readonly sequenceOwner = new PresentationSequenceOwner();` to `GameView`. Start a real owned `BattleBeatRunner`, call the same `beginCommit()` hook used at the first line of `GameView.commit()`, advance fake timers, and assert no later beat fires and `hasActiveBattleRunner()` is false. Also stub `matchMedia` and assert the runner factory receives the actual `matchMedia("(prefers-reduced-motion: reduce)").matches` value; a direct unit call to `runner.cancel()` is not sufficient. Transformation timers remain in `clearPresentationTimers()`; `commit()` calls both owners before any DOM mutation.

Extend `BattleActionPresentation` assertions:

```ts
expect(
  resolveBattleActionPresentation({
    phaseId: "p2_attack",
    action: "spell",
    delta: 25,
    previousEnemyState: "normal",
    enemyState: "weakened",
    phaseChanged: true,
    completed: false,
    grade: null,
  }),
).toMatchObject({
  openingSpeaker: "doyun",
  closingSpeaker: "gray_wraith",
  beats: ["prepare", "player-action", "enemy-hit", "dialogue"],
});

expect(
  resolveBattleActionPresentation({
    phaseId: "p1_defend",
    action: "guard",
    delta: 3,
    previousEnemyState: "normal",
    enemyState: "normal",
    phaseChanged: false,
    completed: false,
    grade: null,
  }),
).toMatchObject({
  openingSpeaker: "gray_wraith",
  beats: ["enemy-action", "player-action", "dialogue"],
});
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/m5Presentation.test.ts tests/m5PresentationSequenceOwner.test.ts
```

Expected: FAIL because the action presentation lacks beats/speaker fields and the owner/commit/matchMedia cancellation contract is not implemented.

- [ ] **Step 3: Extend the resolver from the pure sequence**

Add to `BattleActionPresentation`:

```ts
readonly beats: readonly BattleBeatId[];
readonly openingSpeaker: "doyun" | "gray_wraith";
readonly closingSpeaker: "gray_wraith";
```

Return:

```ts
beats: resolveBattleBeatSequence(
  options.action,
  options.completed,
  options.phaseId,
  false,
  options.delta,
),
openingSpeaker: options.action === "guard" ? "gray_wraith" : "doyun",
closingSpeaker: "gray_wraith",
```

- [ ] **Step 4: Render one battle beat at a time**

In `renderBattleReply()`:

1. Start `shell.dataset.activeSpeaker` with `actionPresentation.openingSpeaker`.
2. Keep the dialogue slot empty until the `dialogue` beat.
3. For each beat, set `shell.dataset.battleBeat` and replace only stage sprite source/class.
4. Use durations `180ms prepare`, `240ms action`, `330ms hit`, and `500ms purify`; reduced motion goes directly to the final stable state. `outro` is not timed away: it remains until `정화 계속` is clicked.
5. On `dialogue`, set active speaker to `closingSpeaker`, mount reply/narration and the result controls.
6. On `outro`, show `회색 안개가 흩어지고 작은 빛만 남았다.` in a black scrim. Its local `정화 계속` opens the dialogue beat; only the existing final Continue button advances the engine.

Move battle action SFX ownership from `main.ts`'s immediate post-calculation call into the beat renderer. Pass an `onBeatSfx(cue)` callback from `main.ts` to `renderBattleReply()`, and invoke it only when `resolveBattleBeatSfx(beat, options.action, delta)` returns a cue while entering that beat. Preserve the existing action table exactly: guard→`guard`; failed/zero spell→`recognition_fail`; spell/click-spell→`critical` at delta≥25 else `cast`; freeform→`impact` when positive else `confirm`; debug→no action cue. Enemy action/hit uses `impact`. Remove the old immediate call for the same action to prevent double playback; state-transition cues such as `wraith_shift` remain owned by the state change. No WAV is adopted.

For `renderBattle()` prompt, track the previous phase ID in `GameView`. On the first `p3_answer` render after p2, run `resolveBattleBeatSequence("prompt", false, phase.phaseId, true)`: show a short black scrim/record-sheet transition in the `stage` slot, then reveal `bg_mind_archive` and the prompt. Same-phase rerenders pass `false` and show dialogue directly. Reset the tracked phase outside battle/new game. This is presentation state only; do not add a battle phase or mutate `GameEngine`.

Compute `actionAssetsAvailable` only from registered catalog IDs (`resolveImageAsset("gray_wraith.attack") !== null && resolveImageAsset("gray_wraith.hit") !== null`), never by reading untracked docs candidates. Pass `resolveBattleSprite(beat, battleState.enemyState, actionAssetsAvailable)` and `resolveBattleDoyunSprite(phaseId, beat, false)` into `createBattleStage()`. When Task 2 was skipped, the resolver returns registered normal/weakened IDs and the same beat classes provide attack/hit motion. Prompt rendering passes `prompt: true`, so all three phases begin in `doyun.magical_pose`; only the visible action beat swaps to defend/attack/finish.

Before starting a reply sequence, create the runner with `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, pass it to `this.sequenceOwner.replaceBattleRunner(runner)`, and start the resolved beats. `commit()` calls `this.sequenceOwner.beginCommit()` and `clearPresentationTimers()` at its first lines, so every unrelated render cancels/nulls the active runner before touching the DOM. Since the reply must commit its shell before starting its own runner, store/start the new runner only after that initial commit returns.

For prompt screens, keep `activeSpeaker = "gray_wraith"` because the enemy prompt is speaking. For result action beats, do not leave it permanently on the wraith.

- [ ] **Step 5: Put Doyun/Juno left and wraith right**

Replace battle anchor ownership with:

```css
.battle-stage-doyun {
  left: clamp(6%, 9vw, 12%);
  right: auto;
  transform-origin: center bottom;
}

.battle-stage-juno {
  left: clamp(37%, 39vw, 43%);
  right: auto;
  bottom: 26%;
}

.battle-stage-wraith {
  right: clamp(5%, 8vw, 11%);
  left: auto;
  transform-origin: center bottom;
}

.battle-stage-doyun .asset-image,
.battle-stage-wraith .asset-image {
  object-position: center bottom;
}

.battle-stage-character[data-facing="flip"] .asset-image { transform: scaleX(-1); }
```

Set `data-facing={resolveBattleFacing(logicalId)}` on each battle visual. Flip only the inner image of logical IDs marked `flip`, not the animated figure container. Verify Doyun pose/defend/attack/finish and wraith normal/weakened/attack/hit independently; do not edit image pixels or apply a blanket character selector.

Use a dedicated Juno anchor above and between Doyun's body and wand. At both target viewports, Juno's alpha bounds must not intersect Doyun's wand silhouette.

- [ ] **Step 6: Separate HUD, dialogue, actions, and BGM**

Using SceneFrame from the UI plan:

- append phase/momentum HUD to `hud`;
- append characters and effects to `stage`;
- append enemy/player lines to `dialogue`;
- append spell choices/PTT/result button to `actions`;
- keep BGM panel in `audio`.

Remove the old battle-only in-place branch from `commit()` and replace the whole incoming `SceneFrame` through the normal `root.replaceChildren(shell)` path. Do not query a nested stage and then remove its parent: that mutates a detached node. Sprite continuity remains owned by `applySpriteContinuity(shell)` before replacement. Add a two-consecutive-battle-render regression test asserting the second shell remains attached, contains exactly one `SceneFrame`, and its `hud/stage/dialogue/actions/audio` slots all belong to that same attached frame.

Set `row-gap: max(16px, var(--slot-gap))` for battle SceneFrame. Delete old absolute top/bottom declarations that made `.battle-control-dock` and `.battle-dialogue` overlap.

- [ ] **Step 7: Verify GREEN and viewports**

```powershell
npm test -- tests/m5Presentation.test.ts tests/m5PresentationSequenceOwner.test.ts tests/m5BattleSequence.test.ts tests/m5DevScenePreview.test.ts tests/m5Assets.test.ts
npm run check
```

Browser-check `battle-p1`, `battle-p2`, `battle-p3-question`, `battle-p3-spell` at 1280×720 and 1920×1080. Expected:

- Doyun and Juno left, wraith right, inward-facing;
- Juno/wand overlap 0;
- BGM/HUD gap at least 16px;
- dialogue/actions gap at least 16px;
- p1/p2 frozen coworkers remain visible;
- rights-approved attack/hit sprites appear in sequence, or normal/weakened fallback sprites carry the same CSS action/hit beats;
- cast/impact cues occur when their player-action/enemy-action/enemy-hit beats become visible, with no duplicate immediate cue;
- p3 first entry has one space-transition beat; same-phase rerenders do not repeat it;
- visible blue rectangle from `bg_battle_wide` is not covered by new CSS; if still judged intrusive, stop and request separate background-edit approval.

- [ ] **Step 8: Commit**

```powershell
git add src/main.ts src/ui/gameView.ts src/ui/presentationSequenceOwner.ts src/styles.css tests/m5Presentation.test.ts tests/m5PresentationSequenceOwner.test.ts
git commit -m "feat(battle): sequence combat presentation"
```

### Task 5: Keep the purification outro and endings in safe zones

**Files:**
- Modify: `tests/m5Presentation.test.ts:123-192`
- Modify: `src/ui/gameView.ts:267-313,1076-1168,1273-1345`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing outro and ending-layout contract**

Add exported data tests:

```ts
expect(resolveBattleOutro(true)).toEqual({
  showPurification: true,
  narration: "회색 안개가 흩어지고 작은 빛만 남았다.",
  nextContext: "ch3_gray_answer",
});
expect(resolveBattleOutro(false)).toBeNull();

expect(resolveEndingLayout("good", 0)).toEqual({
  cardSlot: "dialogue",
  characterSlot: "stage",
  showOneCard: true,
});
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/m5Presentation.test.ts
```

Expected: FAIL because the two resolver exports do not exist.

- [ ] **Step 3: Implement the pure contracts**

Add:

```ts
export function resolveBattleOutro(completed: boolean): {
  readonly showPurification: true;
  readonly narration: "회색 안개가 흩어지고 작은 빛만 남았다.";
  readonly nextContext: "ch3_gray_answer";
} | null {
  return completed
    ? {
        showPurification: true,
        narration: "회색 안개가 흩어지고 작은 빛만 남았다.",
        nextContext: "ch3_gray_answer",
      }
    : null;
}

export function resolveEndingLayout(
  _endingId: string,
  _lineIndex: number,
): {
  readonly cardSlot: "dialogue";
  readonly characterSlot: "stage";
  readonly showOneCard: true;
} {
  return { cardSlot: "dialogue", characterSlot: "stage", showOneCard: true };
}
```

Use `_endingId` and `_lineIndex` exactly to satisfy `noUnusedParameters` while leaving room for the already-existing per-ending visual resolver.

- [ ] **Step 4: Connect outro and ending slots**

Use `resolveBattleOutro(options.completed)` during the battle `outro` beat. Do not add a scenario node or change the saved FSM. Keep the existing continue callback as the only transition to convergence.

In `renderEnding()`, mount at most one current-page card in `dialogue`, all current-page characters in `stage`, and restart/continue button in `actions`. Keep corridor pages' existing no-Doyun/no-Juno resolver behavior.

- [ ] **Step 5: Add safe-zone CSS**

```css
.battle-outro {
  align-self: stretch;
  display: grid;
  place-items: center;
  min-height: 12rem;
  padding: 2rem;
  color: #f7f5ff;
  background: rgb(0 0 0 / 82%);
  text-align: center;
}

.ending-screen .scene-slot-dialogue {
  justify-content: flex-start;
  align-items: end;
}

.ending-screen .ending-card {
  width: min(46rem, 52vw);
  max-height: 34vh;
  overflow: auto;
  background: var(--surface-dialogue);
}

.ending-screen .scene-slot-actions {
  justify-content: flex-start;
}
```

Adjust GOOD/NORMAL/BAD character anchors only inside `.ending-screen` so faces and torsos remain outside the card bounds.

- [ ] **Step 6: Verify GREEN and all endings**

```powershell
npm test -- tests/m5Presentation.test.ts tests/engine.test.ts tests/m5DevScenePreview.test.ts
npm run check
```

Browser-check completed battle and all three endings at 1280×720 and 1920×1080. Expected: purification, one outro narration, convergence, one ending card per beat; no card/character/BGM overlap; overflow 0.

- [ ] **Step 7: Commit**

```powershell
git add src/ui/gameView.ts src/styles.css tests/m5Presentation.test.ts
git commit -m "feat(ui): add battle outro and ending safe zones"
```

### Task 6: Record asset lineage, scene mapping, and final verification

**Files:**
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Update asset and mapping SSOTs**

If the rights gate passed and adoption occurred, record attack/hit exact paths, bytes, SHA-256, 1200×2000, alpha, source/runtime identity, generation job IDs, and the confirmation evidence. Mark them `ready`, not `approved`, until remaining human composite QA passes. If the rights gate did not pass, record only that docs candidates remain unadopted and the runtime uses normal/weakened + CSS motion; do not claim source/runtime identity. In both cases, `death` remains unadopted.

Update p1/p2 to `bg_battle_wide`; p3 question/archive and final spell/core remain unchanged. Record the approved left Doyun/Juno-right wraith composition, full-bleed transform sequence, and outro text.

- [ ] **Step 2: Run complete automated verification**

```powershell
npm run check
npm test
npm run build
git diff --check
```

Expected: TypeScript PASS, all Vitest files PASS, build PASS with only the known Transformers chunk warning, diff check PASS.

- [ ] **Step 3: Run the complete desktop playthrough**

At both 1280×720 and 1920×1080, complete GOOD/NORMAL/BAD paths and inspect all dev previews. Record:

- one transform cut visible at a time;
- no transform white border or duplicate Doyun;
- Doyun/Juno left, wraith right, inward-facing;
- attack/hit order when rights-approved assets were adopted, or normal/weakened CSS action/hit states when they were not; active-speaker order in both paths;
- frozen coworkers present in p1/p2;
- p3 transition visually explicit;
- purification/outro before convergence;
- ending card/character/BGM collisions 0;
- x/y overflow 0;
- console warnings/errors 0;
- source/runtime hash identity only if the two assets passed the hard rights gate and were actually adopted.

If the embedded blue barrier remains visually unacceptable, do not edit it in this plan. Capture the exact scene and request separate user approval for a masked background edit.

- [ ] **Step 4: Record implementation and learning evidence**

Put exact test counts, build warning, viewport, routes, observations, pending rights, and any unresolved blue-barrier caveat in `IMPLEMENTATION_LOG.md`. Add the durable decisions to `DECISIONS.md`. Explain why sequential rendering and registered fallback sprites avoided mandatory image generation; mention action candidates as a saving only if the rights gate passed.

- [ ] **Step 5: Commit documentation**

```powershell
git add docs/assets/ASSET_MANIFEST.md docs/assets/SCENE_ASSET_MAPPING.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/dev/DECISIONS.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git commit -m "docs: record transformation and battle polish"
```

## Acceptance gate

- Transform ordinary cast/complete/result beats have one layer; only crossfade has two role-labelled layers, then complete returns to one.
- Transform cut borders and duplicate Doyun sprite are absent.
- `gray_wraith.attack` and `gray_wraith.hit` are adopted only after the hard rights gate; otherwise registered normal/weakened + CSS motion is the completed path. `death` remains excluded.
- Doyun/Juno are left; wraith is right; all face inward; Juno/wand overlap is 0.
- p1 and p2 keep frozen coworkers in the same office; p3 transitions explicitly.
- Result beats change active speaker from action owner to wraith reply instead of hardcoding wraith throughout.
- Completed battle shows purification and `회색 안개가 흩어지고 작은 빛만 남았다.` before convergence.
- GOOD/NORMAL/BAD show one card per beat with no card/character/BGM collision.
- Game rules, phases, affinity, flags, grade thresholds, endings, and mobile behavior remain unchanged.
