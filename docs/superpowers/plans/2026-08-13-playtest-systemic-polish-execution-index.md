# Playtest Systemic Polish Execution Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Implement one linked plan at a time; `src/ui/gameView.ts` and `src/styles.css` ownership must never overlap between implementers.

**Goal:** 승인된 15개 플레이테스트 피드백을 네 개의 충돌 없는 구현 묶음으로 실행하고, 각 묶음을 구현자와 독립 검토자가 닫은 뒤 전체 5분 플레이를 검증한다.

**Architecture:** 현재 UI에서 음성·오디오 신뢰성을 먼저 고친 뒤, 공통 UI 안전영역, 시나리오 beat, 변신·전투·엔딩 순차 연출을 차례로 쌓는다. 고정 순서는 **A Audio/Voice → B UI Foundation → C Narrative → D Transformation/Battle/Ending**이다. 각 묶음은 `RED → 최소 구현 → targeted GREEN → 독립 spec review → 독립 quality review → full verification → commit` 순서를 지킨다.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 4, CSS Grid/animation, Web Audio, JSON scenario data

---

## Approved source

- Design: [`../specs/2026-08-13-playtest-systemic-polish-design.md`](../specs/2026-08-13-playtest-systemic-polish-design.md)
- Desktop targets: 1280×720 and 1920×1080
- Mobile: excluded
- Mandatory worktree: `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline`
- Remote push, main merge, public deployment, branch change, reset, revert, and amend: prohibited
- New task commits on the existing branch are allowed

## Execution order

### Wave 1 — Audio and voice reliability

Execute [`2026-08-13-audio-voice-reliability.md`](./2026-08-13-audio-voice-reliability.md).

Why first: restore input/error/BGM behavior against the current UI before the later structural renderer migration. This keeps functional recovery changes separate from layout refactoring.

Exit gate:

- fresh/corrupt BGM preference 20%, valid saved preference preserved;
- short fade-through-silence and one live audible channel;
- title button starts game/BGM inside the original user gesture;
- first same-turn voice failure retries, second exposes current-turn click, fifth failed turn changes global mode;
- raw network/provider/HTML text never reaches production DOM;
- meter colors and copy match the actual judgement state.

Audio binary gate: do not edit BGM loops or adopt regenerated impact/Juno WAV files in this wave. Bar-boundary loop repair, new impact variants, service-plan rights, and headphone selection require a later comparison plus user approval.

### Wave 2 — Shared UI foundation

Execute [`2026-08-13-ui-foundation.md`](./2026-08-13-ui-foundation.md).

Why second: every later scene needs the same `SceneFrame`, typography, surface, safe-zone, and z-index contract. It migrates the already-corrected audio/voice title and input UI without mixing behavior changes into the refactor.

Exit gate:

- repository-served Pretendard with license/provenance;
- one token owner and one final owner per shared selector;
- `hud / stage / dialogue / actions / audio` slots available;
- title and non-battle story/ending screens migrated;
- 1280×720 and 1920×1080 overflow/overlap checks pass.

### Wave 3 — Narrative and scene beats

Execute [`2026-08-13-narrative-scene-beats.md`](./2026-08-13-narrative-scene-beats.md).

Why third: it reuses the shared slots and safe voice path, while keeping game branches and affinity rules unchanged.

Exit gate:

- exact title hook and N1/N2 question reactions;
- `엥? 내가?` and `마법소녀는 뭐 하는 거야?` route to existing intents;
- one wraith-only entrance cutscene before the three-character scene;
- active speaker focus and first-entry cues replay correctly after a new game;
- N5 badge float starts startled and then returns to shy presentation;
- scenario/runtime script/loader counts remain synchronized.

### Wave 4 — Transformation, battle, and ending

Execute [`2026-08-13-transformation-battle-ending.md`](./2026-08-13-transformation-battle-ending.md).

Why last: it depends on `SceneFrame`, shared speaker focus, stable BGM/SFX triggering, and the new wraith entrance continuity.

Exit gate:

- transform ordinary cast/complete/result beats show one full-bleed layer; only the labelled 420ms crossfade overlaps outgoing cast and incoming complete layers, then returns to one;
- wraith attack/hit are adopted only after explicit service-plan/reference/public-distribution rights confirmation, with source/runtime identity and provenance; otherwise existing normal/weakened + CSS motion remains the completed fallback; `death` stays excluded;
- p1/p2 keep the same frozen late-night office;
- Doyun/Juno left, wraith right, both sides facing inward, Juno/wand overlap 0;
- prepare/action/hit/dialogue/outro beats are serial and cancellable;
- purification explanation precedes convergence;
- all three endings keep one card per beat in safe zones.

Visual binary gate: do not generate a Juno pose or edit `bg_battle_wide.webp`. If CSS/anchor/sequence work still leaves the blue barrier or Juno pose unacceptable, stop and present a separate comparison for approval.

## Subagent ownership contract

For every task inside a wave:

1. Spawn one implementation agent with only that task's files and exact RED/GREEN/commit instructions.
2. After implementation, spawn a spec-review agent against the task's acceptance contract.
3. After spec approval, spawn a quality-review agent for regressions, cleanup, accessibility, and maintainability.
4. Return findings to the same implementation agent; do not let reviewers edit.
5. Do not run two implementation agents that both touch `src/ui/gameView.ts`, `src/styles.css`, `src/main.ts`, `public/scenario/scenario.json`, or shared asset documents.

Independent read-only reviews may run in parallel. Implementation of the four waves is sequential.

## Final verification checkpoint

After all four waves and before claiming completion:

```powershell
npm run check
npm test
npm run build
git diff --check
git status --short
```

Then start a fresh F: worktree development server and perform one full desktop play per GOOD/NORMAL/BAD path. At both 1280×720 and 1920×1080 record:

- exact route and beat checked;
- horizontal and vertical overflow;
- BGM/HUD, dialogue/actions, card/character overlap;
- console warn/error;
- raw production error text search;
- one real microphone pass for both approved utterances;
- each BGM loop heard three times on headphones.

Record implementation/test/build/browser facts only in `IMPLEMENTATION_LOG.md`; decisions in `DECISIONS.md`; beginner explanation in `LEARNING_LOG.md`; stable completion gates in `MILESTONES.md`. Do not duplicate execution evidence across SSOT documents.

## Expected cost reduction

- One shared frame replaces screen-by-screen positioning fixes.
- One voice recovery policy replaces three divergent dialogue/incantation/battle paths.
- One beat/timer owner replaces independent ad-hoc timers.
- Existing sprites and CSS mirroring avoid mandatory new image generation; the two ready wraith candidates save work only if the rights gate later permits adoption.
- Binary audio/image edits remain gated until code/layout QA proves they are still necessary.
