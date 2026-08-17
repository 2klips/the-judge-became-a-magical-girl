# Scenario v3.1 Runtime Composition Phase 1

**Baseline:** `e0390957d59f01796b616dcf0bca775d0edcf311`

## Constraints

- Treat `docs/심사역은_마법소녀가_되었다_완성대본_v3.md` as immutable story truth.
- Preserve schema-version-1 saves; store new durable story facts only in the existing flag set.
- Keep one serial `GameEngine` flow and one transient battle state.
- Do not add, edit, or copy image binaries.
- Do not push.

## Architecture

1. Extend scenario data only where v3.1 needs variable intent counts, conditional presentation lines, ending continuation, and one-to-three battle phases.
2. Add v3.1 flags for relation, first action, dual intent, spell use, N7 meaning, final action, and second-spell opportunity. Old saves remain valid because omitted flags need no migration.
3. Extend the existing battle reducer with an ordered phase plan and an explicit second-spell decision. A successful first spell is required before the decision can appear.
4. Express N7 and N8 through normal dialogue nodes so typed STT failures continue to use the existing retry/click fallback and never select narrative refusal.
5. Route GOOD and HIDDEN into one independent canonical `post_credit` ending node.
6. Add a pure scene-composition contract with named presets, actor zones, and exclusive `sprite`/`cut` render modes. GameView and dev previews consume the same contract.

## TDD order

### 1. Story and data RED

- Assert N2/N3/N4/N5 v3.1 text and relation flags.
- Assert N6 first choice and conditional second-spell contract.
- Assert N7 BELIEVE/POSSIBILITY/CYNIC boundaries.
- Assert N8 refusal versus successful actions and four ending routes.
- Assert GOOD/HIDDEN share the same independent post-credit node.
- Assert a schema-v1 pre-v3.1 save still loads.

### 2. Battle RED

- Defend-first and attack-first order.
- Failed first spell cannot open the second spell.
- Eligible relation or explicit dual intent can open it after success.
- Player can accept or decline without consuming another battle turn.
- Only successfully used defend/attack phases count toward HIDDEN.

### 3. Composition RED

- Every preset assigns Doyun, Juno, and Wraith to distinct zones.
- N3 uses confrontation: large left Wraith, center Juno, right Doyun.
- Battle uses left Wraith, center support Juno, right Doyun.
- Cut mode rejects live actor visuals.
- Transform previews are before/cut-01/cut-02/live with zero duplicates.
- Missing post-credit art is a labeled debug placeholder and hidden in production.

### 4. GREEN implementation

- Update schema, loader, state helpers, battle reducer, engine, and scenario JSON.
- Update presentation resolvers, GameView, preview matrix, and minimal CSS.
- Update directly affected contracts/decision notes without changing the approved script.

### 5. Verification

- Targeted tests after each RED/GREEN cycle.
- Full `npm run check`, `npm test`, `npm run build`, `npm run build:qa`, `git diff --check`.
- Chrome screenshots for N3, transform frames, battle, and post-credit placeholder at 1920×1080, 1600×900, and 1366×768.
- Confirm no actor overlap, no duplicate actors, no offscreen actor, and no hidden face/staff/core.
