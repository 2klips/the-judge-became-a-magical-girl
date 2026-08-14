# Narrative Scene Beats Implementation Plan

> **Deferred historical plan — do not execute.** 이 문서의 narrative 작업은 현재 Phase 0 worktree `project-takeover-baseline`에서 실행하거나 commit하지 않는다. Phase A–E가 완료·검토된 뒤 이 narrative 범위에 대한 별도 사용자 승인과 fresh approved stacked worktree/rebase가 다시 확정되기 전에는 아래 Task·명령을 사용하지 않는다. 본문은 과거 제안의 추적 기록으로만 보존한다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시작 훅, 주노 소개, 회색 망령 전조, 사원증 반응을 기존 분기 구조 안에서 자연스러운 순차 장면으로 연결한다.

**Architecture:** 시나리오에는 회색 망령 단독 전조를 위한 cutscene 1개만 추가한다. 나머지는 기존 intent와 presentation resolver를 보강하며, `reaction mark`와 `first-entry`는 DOM/CSS primitive로 재사용해 신규 이미지 없이 표현한다.

**Tech Stack:** TypeScript 7, JSON scenario data, Zod 4, Vite 8, Vitest 4, CSS animation

---

## Scope and file ownership

- Modify: `public/scenario/scenario.json` — N0 훅, N2 intent, N3 entrance node
- Modify: `docs/심사역은_마법소녀가_되었다_완성대본_v2.md` — 기준 대본 동기화
- Create: `src/assets/presentationReaction.ts` — `?`/`!`와 첫 등장 cue
- Modify: `src/assets/presentationDoyun.ts` — N5 첫 beat 놀람
- Modify: `src/ui/gameView.ts` — reaction mark, active focus, 망령 first-entry
- Modify: `src/styles.css` — focus, reaction, entrance
- Modify: `tests/scenarioContinuity.test.ts`
- Modify: `tests/engine.test.ts`
- Modify: `tests/m5DoyunPresentation.test.ts`
- Modify: `tests/m5Presentation.test.ts`
- Create: `tests/m5ReactionPresentation.test.ts`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

Do not change node outcomes, affinity values, flags, ending conditions, battle phases, image/audio files, or mobile layout.

**Execution guard:** Run only in `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline` after Audio/Voice and UI Foundation. Overall order is **A Audio/Voice → B UI Foundation → C Narrative → D Transformation/Battle/Ending**. SceneFrame is a prerequisite; shared-file implementation is sequential and independent reviewers do not edit. Do not push, merge main, change branches, reset, revert, or amend. New task commits are allowed.

### Task 1: Strengthen N0 and N2 wording/intent contracts

**Files:**
- Modify: `tests/scenarioContinuity.test.ts:5-109`
- Modify: `public/scenario/scenario.json:3-157`
- Modify: `docs/심사역은_마법소녀가_되었다_완성대본_v2.md:151-260`

- [ ] **Step 1: Extend the scenario test shape and write failing assertions**

Replace the local test types with:

```ts
type ScenarioIntent = {
  id: string;
  examples: string[];
  keywords: string[];
  offlineReply: string;
  next: string | null;
};

type ScenarioNode = {
  nodeId: string;
  type: string;
  lines?: Array<{ speaker: string; text: string }>;
  npc?: { startEmotion: string };
  intents?: ScenarioIntent[];
  exitOnMaxTurns?: Array<{ default: string }>;
  next?: string;
};
```

Add these tests:

```ts
it("N0에서 정확한 작품명을 의문형 독백으로 보여 준다", () => {
  const node = findNode(scenario, "n0_review");
  expect(node.lines?.[4]?.text).toBe(
    "다음 게임은 뭐지…… 제목이 ‘심사역은 마법소녀가 되었다’……?",
  );
  expect(node.lines?.map(({ text }) => text).join(" ")).not.toContain(
    "마법소녀는 심사역이 되었다",
  );
});

it("짧은 놀람과 마법소녀 역할 질문을 기존 N2 intent로 수렴시킨다", () => {
  const intro = findNode(scenario, "n2_juno_intro");
  const curious = intro.intents?.find(({ id }) => id === "curious_magic");
  expect(intro.npc?.startEmotion).toBe("surprised");
  expect(curious?.examples).toContain("엥? 내가?");
  expect(curious?.keywords).toEqual(expect.arrayContaining(["엥", "내가", "왜 내가"]));

  const followup = findNode(scenario, "n2_juno_followup");
  const identity = followup.intents?.find(({ id }) => id === "ask_identity");
  expect(identity?.examples).toContain("마법소녀는 뭐 하는 거야?");
  expect(identity?.keywords).toEqual(
    expect.arrayContaining(["마법소녀", "뭐 하", "하는 일"]),
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/scenarioContinuity.test.ts
```

Expected: FAIL on the missing N0 title line, N2 starting emotion, and intent examples/keywords.

- [ ] **Step 3: Make the minimal scenario edits**

In `n0_review`, insert before the final prompt:

```json
{ "speaker": "narration", "text": "다음 게임은 뭐지…… 제목이 ‘심사역은 마법소녀가 되었다’……?" }
```

Change `n2_juno_intro.npc.startEmotion` to `surprised`. Change only the two intended contracts:

```json
"examples": [
  "마법소녀? 조금 재밌겠는데.",
  "그래서 뭘 하면 돼?",
  "엥? 내가?",
  "왜 내가 마법소녀야?"
],
"keywords": ["재밌", "마법소녀", "뭘 하면", "방법", "해볼", "엥", "내가", "왜 내가"]
```

```json
"examples": ["너 대체 뭐야?", "어디서 나온 거야?", "마법소녀는 뭐 하는 거야?"],
"keywords": ["정체", "뭐야", "어디서", "누구", "주노", "마법소녀", "뭐 하", "하는 일"]
```

Do not change click labels, affinity, flags, reply, or `next` in this task.

- [ ] **Step 4: Synchronize the complete script**

In the N0 scene, add:

```text
도윤은 다음 출품작 제목을 확인한다.

> 다음 게임은 뭐지…… 제목이 ‘심사역은 마법소녀가 되었다’……?
```

In N2 player examples, add `엥? 내가?` under the proposal response and `마법소녀는 뭐 하는 거야?` under the one-question follow-up. Preserve the note that these are speech classification examples, not fixed buttons.

- [ ] **Step 5: Verify GREEN and schema limits**

```powershell
npm test -- tests/scenarioContinuity.test.ts tests/loader.test.ts tests/engine.test.ts
npm run check
```

Expected: tests PASS; each intent still has exactly three choices and no keyword list exceeds eight.

- [ ] **Step 6: Commit**

```powershell
git add public/scenario/scenario.json docs/심사역은_마법소녀가_되었다_완성대본_v2.md tests/scenarioContinuity.test.ts
git commit -m "feat(story): clarify opening and voice intents"
```

### Task 2: Insert a serial gray-wraith entrance beat

**Files:**
- Modify: `tests/scenarioContinuity.test.ts`
- Modify: `tests/engine.test.ts:35-83`
- Modify: `tests/loader.test.ts:5-13`
- Modify: `public/scenario/scenario.json:112-207`
- Modify: `docs/심사역은_마법소녀가_되었다_완성대본_v2.md`

- [ ] **Step 1: Write failing entrance-node tests**

Add to `tests/scenarioContinuity.test.ts`:

```ts
it("N2 후속 뒤 망령 단독 cutscene을 거쳐 N3 선택으로 간다", () => {
  const followup = findNode(scenario, "n2_juno_followup");
  expect(new Set(followup.intents?.map(({ next }) => next))).toEqual(
    new Set(["n3_wraith_entrance"]),
  );
  expect(followup.exitOnMaxTurns).toEqual([{ default: "n3_wraith_entrance" }]);

  const entrance = findNode(scenario, "n3_wraith_entrance");
  expect(entrance.type).toBe("cutscene");
  expect(entrance.lines).toEqual([
    {
      speaker: "gray_wraith",
      text: "평가가 반복될수록…… 기대는 남지 않는다.",
    },
  ]);
  expect(entrance.next).toBe("n3_wraith_choice");
});
```

Add a helper in `tests/engine.test.ts`:

```ts
function advanceEntranceIfPresent(engine: GameEngine): void {
  if (engine.getState().currentNodeId !== "n3_wraith_entrance") return;
  engine.advanceLinearNode();
  expect(engine.getState().currentNodeId).toBe("n3_wraith_choice");
}
```

Call it immediately after every `engine.chooseIntent(intentId)` inside `completePath()`:

```ts
paths[kind].forEach((intentId) => {
  engine.chooseIntent(intentId);
  advanceEntranceIfPresent(engine);
});
```

In `tests/loader.test.ts`, change the repository data contract from 14 to 15 total nodes and from 2 to 3 cutscenes. Keep dialogue, battle, ending, and character counts unchanged:

```ts
expect(data.scenario).toHaveLength(15);
expect(data.scenario.filter((node) => node.type === "dialogue")).toHaveLength(8);
expect(data.scenario.filter((node) => node.type === "cutscene")).toHaveLength(3);
expect(data.scenario.filter((node) => node.type === "battle")).toHaveLength(1);
expect(data.scenario.filter((node) => node.type === "ending")).toHaveLength(3);
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/scenarioContinuity.test.ts tests/engine.test.ts
```

Expected: scenario test FAIL because the entrance node is absent; path test fails once the test expects the new serial step.

- [ ] **Step 3: Add the entrance node and redirect N2**

Change all three `n2_juno_followup` intent `next` values and its default exit to `n3_wraith_entrance`. Insert before `n3_wraith_choice`:

```json
{
  "nodeId": "n3_wraith_entrance",
  "type": "cutscene",
  "scene": { "bg": "bg_hall_dark", "bgm": "bgm_crisis" },
  "lines": [
    {
      "speaker": "gray_wraith",
      "text": "평가가 반복될수록…… 기대는 남지 않는다."
    }
  ],
  "next": "n3_wraith_choice"
}
```

Do not change `n3_wraith_choice` intents, affinity, flags, fallback, or exits.

- [ ] **Step 4: Synchronize the script flow**

Change the flow chart to `N3-0 회색 망령 단독 전조` then `N3 회색 망령 등장과 자유 대화`. Add before N3's Juno explanation:

```text
화면의 평가 문장이 회색 안개로 번지고, 사무실 소리가 낮아진다.
회색 망령만 화면에 모습을 드러낸다.

> 회색 망령: 평가가 반복될수록…… 기대는 남지 않는다.
```

- [ ] **Step 5: Verify GREEN and all endings**

```powershell
npm test -- tests/scenarioContinuity.test.ts tests/engine.test.ts tests/loader.test.ts
npm run check
```

Expected: GOOD/NORMAL/BAD paths still reach `n5_transform`, battle, convergence, and their original endings; entrance appears once per path.

- [ ] **Step 6: Commit**

```powershell
git add public/scenario/scenario.json docs/심사역은_마법소녀가_되었다_완성대본_v2.md tests/scenarioContinuity.test.ts tests/engine.test.ts tests/loader.test.ts
git commit -m "feat(story): add gray wraith entrance beat"
```

### Task 3: Add reusable reaction marks and first-entry presentation

**Files:**
- Create: `src/assets/presentationReaction.ts`
- Create: `tests/m5ReactionPresentation.test.ts`
- Modify: `src/main.ts:580-790`
- Modify: `src/ui/gameView.ts:777-843,1170-1271,1368-1395`
- Modify: `src/styles.css:1560-1640,1700-1720`

- [ ] **Step 1: Write the failing resolver test**

Create `tests/m5ReactionPresentation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  resolveFirstEntryClass,
  resolveReactionMark,
  resolveSceneEntrySfx,
} from "../src/assets/presentationReaction";

describe("장면 반응 presentation", () => {
  it("의문 비트에는 물음표, 주노 첫 등장에는 느낌표를 사용한다", () => {
    expect(resolveReactionMark({ nodeId: "n0_review", lineIndex: 4 })).toBe("?");
    expect(
      resolveReactionMark({ nodeId: "n1_first_voice", intentId: "seek_new_fun" }),
    ).toBe("?");
    expect(resolveReactionMark({ nodeId: "n2_juno_intro" })).toBe("!");
    expect(resolveReactionMark({ nodeId: "n2_juno_followup" })).toBeNull();
  });

  it("주노와 망령 첫 진입 class를 다른 context와 분리한다", () => {
    expect(resolveFirstEntryClass("n2_juno_intro")).toBe("juno-first-entrance");
    expect(resolveFirstEntryClass("n3_wraith_entrance")).toBe("wraith-first-entrance");
    expect(resolveFirstEntryClass("n3_wraith_choice")).toBeNull();
  });

  it("주노 첫 노드 진입에만 기존 합성 등장음을 한 번 요청한다", () => {
    expect(resolveSceneEntrySfx("n1_first_voice", "n2_juno_intro")).toBe("cast");
    expect(resolveSceneEntrySfx("n2_juno_intro", "n2_juno_intro")).toBeNull();
    expect(resolveSceneEntrySfx(null, "n0_review")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- tests/m5ReactionPresentation.test.ts
```

Expected: FAIL because the resolver module does not exist.

- [ ] **Step 3: Implement the pure resolver**

Create `src/assets/presentationReaction.ts`:

```ts
export interface ReactionCue {
  readonly nodeId: string;
  readonly lineIndex?: number;
  readonly intentId?: string;
}

export function resolveReactionMark(cue: ReactionCue): "?" | "!" | null {
  if (cue.nodeId === "n0_review" && cue.lineIndex === 4) return "?";
  if (cue.nodeId === "n1_first_voice" && cue.intentId === "seek_new_fun") return "?";
  if (cue.nodeId === "n2_juno_intro") return "!";
  return null;
}

export function resolveFirstEntryClass(presentationContext: string): string | null {
  if (presentationContext === "n2_juno_intro") return "juno-first-entrance";
  if (presentationContext === "n3_wraith_entrance") return "wraith-first-entrance";
  return null;
}

export function resolveSceneEntrySfx(
  previousNodeId: string | null,
  nextNodeId: string,
): "cast" | null {
  return previousNodeId !== nextNodeId && nextNodeId === "n2_juno_intro"
    ? "cast"
    : null;
}
```

- [ ] **Step 4: Mount marks and one-time entry classes**

In `GameView`, add:

```ts
private appendReactionMark(shell: HTMLElement, cue: ReactionCue): void {
  const mark = resolveReactionMark(cue);
  if (!mark) return;
  const elementNode = element("span", "reaction-mark", mark);
  elementNode.setAttribute("aria-hidden", "true");
  this.appendToSceneSlot(shell, "stage", elementNode);
}
```

Call it from `renderLine()` with `{ nodeId, lineIndex }`, from opening `renderDialogue()` with `{ nodeId }`, and from `renderDialogueReply()` with `{ nodeId, intentId }`. For N2 opening, append the mark only when `shell.classList.contains("juno-first-entrance")`; same-node re-renders must not leave a static `!`. The reply call supplies `?` after `seek_new_fun`, instead of an unrelated photographic reaction asset.

In `createShell()`, replace the N2-specific conditional and remove `enteredPresentationContexts`. Entry animation is based on the immediately previous presentation context, not a session-lifetime Set; therefore replaying a new game can show the entrance again:

```ts
const firstEntryClass = resolveFirstEntryClass(presentationContext);
if (firstEntryClass && this.currentPresentationContext !== presentationContext) {
  shell.classList.add(firstEntryClass);
}
```

The new cutscene's only speaker is `gray_wraith`, so `renderLine()` shows no Doyun or Juno and keeps active speaker `gray_wraith`.

In `src/main.ts`, declare `let lastRenderedNodeId: string | null = null` next to `renderCurrent`. Immediately after resolving the current node, call `resolveSceneEntrySfx(lastRenderedNodeId, node.nodeId)`, play the returned existing synthesized `cast` cue, then set `lastRenderedNodeId = node.nodeId`. Re-renders of the same node remain silent. In both title `onNewGame` and ending `onNewGame` callbacks, set `lastRenderedNodeId = null` immediately before `engine.startNewGame(...)`; the later N1→N2 transition then fires exactly once on every playthrough. Do not adopt `assets/source/sfx/sfx_juno_appear.wav` in this plan—the external binary remains a separate rights and audio-approval gate.

- [ ] **Step 5: Add visual focus and reduced-motion-safe CSS**

```css
.game-shell[data-active-speaker] [data-sprite-slot] {
  opacity: 0.5;
  filter: saturate(0.72) brightness(0.78);
  transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease;
}

.game-shell[data-active-speaker="doyun"] [data-sprite-slot="doyun"],
.game-shell[data-active-speaker="juno"] [data-sprite-slot="juno"],
.game-shell[data-active-speaker="gray_wraith"] [data-sprite-slot="gray_wraith"] {
  opacity: 1;
  filter: saturate(1) brightness(1.06) drop-shadow(0 0 1.2rem var(--speaker-active));
  transform: translateY(-0.5rem);
}

.game-shell[data-active-speaker="juno"] { --speaker-active: var(--speaker-juno); }
.game-shell[data-active-speaker="doyun"] { --speaker-active: var(--speaker-doyun); }
.game-shell[data-active-speaker="gray_wraith"] { --speaker-active: var(--speaker-wraith); }
.game-shell[data-active-speaker="narration"] { --speaker-active: var(--speaker-narration); }

.reaction-mark {
  position: absolute;
  top: 12%;
  left: 54%;
  z-index: calc(var(--z-character) + 1);
  font: 800 clamp(2.5rem, 6vw, 6rem) / 1 var(--font-ui);
  color: #fff3a6;
  text-shadow: 0 0 1rem rgb(255 224 112 / 80%);
  animation: reaction-pop 420ms ease-out both;
}

.wraith-first-entrance [data-sprite-slot="gray_wraith"] {
  animation: wraith-enter 900ms ease-out both;
}

@keyframes reaction-pop {
  from { opacity: 0; transform: translateY(1rem) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes wraith-enter {
  from { opacity: 0; filter: blur(12px) grayscale(1); transform: translateY(2rem) scale(0.94); }
  to { opacity: 1; filter: blur(0) grayscale(0.3); transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .reaction-mark,
  .wraith-first-entrance [data-sprite-slot="gray_wraith"] {
    animation: none;
  }
}
```

Merge these with the single active-speaker owner from the UI Foundation plan; do not leave the old 0.72 opacity rule duplicated.

- [ ] **Step 6: Verify GREEN**

```powershell
npm test -- tests/m5ReactionPresentation.test.ts tests/m5Presentation.test.ts tests/m5DevScenePreview.test.ts
npm run check
```

Expected: tests PASS; N0 title and N1 fun-selection reply have `?`; N2 first render has `!` plus one synthesized entrance cue; N3 entrance renders only wraith once; starting another new game re-enables both entrance classes.

- [ ] **Step 7: Commit**

```powershell
git add src/assets/presentationReaction.ts src/main.ts src/ui/gameView.ts src/styles.css tests/m5ReactionPresentation.test.ts
git commit -m "feat(ui): add scene reaction and entrance cues"
```

### Task 4: Show surprise only on the badge-float beat

**Files:**
- Modify: `tests/m5DoyunPresentation.test.ts:16-29`
- Modify: `src/assets/presentationDoyun.ts:66-68`

- [ ] **Step 1: Write the failing N5 beat test**

Replace the N5 assertions with:

```ts
expect(
  resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", lineIndex: 0 }),
).toBe("doyun.normal_startled");
expect(
  resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", lineIndex: 1 }),
).toBe("doyun.normal_shy");
expect(
  resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", stage: "incantation" }),
).toBe("doyun.normal_shy");
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- tests/m5DoyunPresentation.test.ts
```

Expected: first N5 line returns `doyun.normal_shy`, causing the first assertion to fail.

- [ ] **Step 3: Implement the line-specific resolver**

Replace the N5 branch:

```ts
if (cue.nodeId === "n5_transform") {
  if (cue.stage === "transformation") return "doyun.magical_pose";
  if (cue.stage === "incantation") return "doyun.normal_shy";
  return (cue.lineIndex ?? 0) === 0
    ? "doyun.normal_startled"
    : "doyun.normal_shy";
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
npm test -- tests/m5DoyunPresentation.test.ts tests/m5Presentation.test.ts
npm run check
```

Expected: first badge line is startled; later lines and incantation remain shy.

- [ ] **Step 5: Commit**

```powershell
git add src/assets/presentationDoyun.ts tests/m5DoyunPresentation.test.ts
git commit -m "feat(story): add badge float reaction"
```

### Task 5: Update mapping and validate the full scene slice

**Files:**
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Update the stable mapping contracts**

In `SCENE_ASSET_MAPPING.md`:

- add `n3_wraith_entrance` between N2 and N3;
- state that it contains only `gray_wraith.normal`, crisis cue, and fog/monitor CSS;
- change N3 choice to Juno explanation plus three-character composition;
- change N5 intro mapping to `normal_startled` on line 0 and `normal_shy` afterward;
- remove the statement that scenario JSON is never modified; replace it with “presentation-only changes avoid schema changes; approved story beat changes update JSON and the complete script together.”

- [ ] **Step 2: Run automated verification**

```powershell
npm run check
npm test
npm run build
git diff --check
```

Expected: TypeScript PASS, all Vitest files PASS, build PASS with only the known Transformers chunk warning, diff check PASS.

- [ ] **Step 3: Run desktop scene verification**

At 1280×720 and 1920×1080, verify:

1. exact title is `심사역은 마법소녀가 되었다`, never reversed;
2. N0 title beat shows `?` without changing the background/camera;
3. N2 first render shows Juno `surprised`, `!`, then response emotion;
4. `엥? 내가?` selects `curious_magic` and `마법소녀는 뭐 하는 거야?` selects `ask_identity` without click fallback;
5. N2 moves to one wraith-only beat before Juno's N3 explanation;
6. active speaker is the only fully bright sprite;
7. N5 badge-float line is startled, subsequent order preparation is shy;
8. no new image is loaded and console warn/error count is 0.

- [ ] **Step 4: Record decisions and evidence**

Add the single approved N3 entrance node and exact intent expansion to `DECISIONS.md`. Put exact commands/counts, browser route, viewport, speech phrases, and visual observations in `IMPLEMENTATION_LOG.md`. Explain “새 분기 대신 기존 intent 확장” and “새 이미지 대신 reaction mark” in `LEARNING_LOG.md`.

- [ ] **Step 5: Commit documentation**

```powershell
git add docs/assets/SCENE_ASSET_MAPPING.md docs/dev/DECISIONS.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git commit -m "docs: record narrative scene beat polish"
```

## Acceptance gate

- Exact product title appears in N0; reversed title never appears.
- `엥? 내가?` and `마법소녀는 뭐 하는 거야?` map to existing intents.
- N2 proposal opens with Juno `surprised` and no branch/affinity change.
- One serial wraith-only cutscene precedes N3 choice and replays once per new game path.
- N3 choice retains all three original outcomes.
- Active speaker contrast is clear and reduced-motion safe.
- N5 first line is startled; later order beats are shy.
- No new image, audio, branch outcome, flag, ending condition, or mobile behavior is added.
