# Submission Voice, Dialogue, and Asset Cleanup Design

Date: 2026-08-25  
Status: User-approved design  
Starting HEAD: `bc8726d7f97769bd716ed24abc26abd661707442`

## Objective

Close the release-blocking issues found in the latest human QA without redesigning the frozen Battle, Ending frame, or OpenAI TITLE presentation.

The work has five outcomes:

1. Remove the HIDDEN ending from the current submission runtime.
2. Expose safe voice evidence in QA debug mode.
3. Separate transport failures and reduce false `too-loud` decisions.
4. Prevent evasive, meta, or malformed Juno replies.
5. Remove the purple fringe from two Doyun sprites with deterministic pixel editing.

## 1. HIDDEN Ending Removal

The submission runtime will contain GOOD, NORMAL, and BAD endings only.

- Remove the `ending_hidden` scenario node and its exit condition.
- A run that previously satisfied the HIDDEN condition now falls through to GOOD because it also satisfies `n7_believe && final_spell_success`.
- Remove HIDDEN-only runtime presentation hooks, preview entries, current-state tests, and current SSOT requirements.
- Keep historical implementation and provenance records, adding a superseding submission decision instead of rewriting history.
- Migrate legacy saves whose current node is `ending_hidden` to `ending_good` so old QA saves do not become invalid.
- Keep the `perfect_transform` mechanic. It still controls the perfect transformation result and battle initial momentum of 60, but no longer selects a unique ending.
- Keep the transformation incantation gate and its click fallback.

## 2. QA Voice Evidence

Add an in-memory voice evidence record that is rendered only when both conditions are true:

- QA preview build
- `?debug=1`

The panel shows the last completed or failed voice turn:

- exact transcript
- selected STT model
- transformation keyword list with matched/unmatched state
- match count such as `3/4`
- RMS dBFS
- peak dBFS
- clipping ratio
- typed failure kind
- HTTP status when present
- safe timing fields already available from the voice result

The panel must not show secrets, authorization headers, upstream response bodies, stack traces, or provider raw errors. It must not persist to save data or local storage. Production/debug-off presentation remains unchanged.

## 3. Voice Failure Classification and Level Policy

User-facing failures become distinct:

- `network`: the browser could not reach the voice service.
- `http`: the voice service returned an unsuccessful HTTP status.
- Existing permission, timeout, schema, no-speech, and recording messages remain typed.

QA debug evidence may show the safe HTTP status code. Normal UI shows only the Korean recovery message.

The battle volume policy stops treating a single near-zero peak as sufficient proof of excessive volume. `too-loud` requires sustained evidence from RMS and/or a meaningful clipping ratio. A brief isolated peak remains observable in QA but does not reject the turn by itself.

Existing contracts remain:

- first level failure retries without consuming battle progress
- repeated level failure may consume a battle action
- successful capture clears same-turn failure state
- click fallback and global five-failure recovery remain available
- technical failures never become narrative refusal

Thresholds will be selected through RED fixtures covering calibrated headset speech, sustained loud speech, and real clipping rather than by changing several constants blindly.

## 4. Juno Reply Quality

Keep LLM free dialogue and structured intent/flag validation. Do not replace dialogue with a fixed-response system.

Improve both grounding and output defense:

- Provide the model with the scene facts needed to answer common `who`, `where`, `why`, and `how` questions directly.
- Require the first sentence to answer the player's actual question before adding character flavor.
- Reject meta-classification language such as describing the user's intent or saying that the question is being categorized.
- Reject known evasive patterns when the supplied scene context already contains the answer.
- Reject known malformed Korean regression patterns.
- On rejection, use the existing retry/fallback boundary; do not apply unvalidated flags or advance state.

The regression matrix covers at least:

- N2: `내가 왜 그래야 돼?`, identity, destination, method, refusal, employment-condition questions
- N3: wraith origin, danger, protection, method, withdrawal
- N6: defend first, attack first, dual intent, and short colloquial variants

Automated tests use accepted and rejected reply fixtures. A local canonical Worker/OpenAI QA run exercises varied real utterances after implementation. Live provider output is evidence, not a nondeterministic unit-test dependency.

## 5. Doyun Sprite Fringe Cleanup

Edit targets:

- `char_doyun_normal_suspicious.png`
- `char_doyun_employee_id_surprised.png`

Use deterministic pixel processing, not generative image editing.

- Detect purple-dominant pixels connected to the transparent silhouette boundary.
- Remove only the boundary fringe pixels.
- Preserve canvas size, pose, face, clothing, internal colors, and logical IDs.
- Apply identical normalized bytes to source delivery and runtime copies.
- Do not touch other Doyun sprites.

The verifier asserts:

- canonical dimensions unchanged
- source/runtime bytes identical
- transparent PNG preserved
- targeted boundary-purple count is zero
- non-target interior pixels unchanged
- file size remains within the existing runtime budget

Asset manifest and provenance/production records will state that this is a deterministic cleanup of user-approved source art, not new AI generation.

## Architecture and Data Flow

- Voice ports continue to return typed observations and failures.
- `main.ts` converts them into ephemeral QA evidence and domain actions.
- `GameView` receives QA evidence only through a debug-only rendering contract.
- Incantation evaluation remains in `src/judge/incantation.ts`.
- Dialogue response validation remains at the Worker/domain boundary before state application.
- Ending selection remains declarative in scenario data with legacy save migration at the save boundary.
- Sprite cleanup is performed by a repository tool and verified independently from runtime CSS.

No new dependency, GameState field, logical asset ID, binary asset, route, or screen is introduced.

## Testing and Validation

RED tests precede each implementation unit:

1. Three-ending route and legacy HIDDEN-save migration.
2. QA evidence visibility and production invisibility.
3. `network`/`http` copy separation and safe HTTP status evidence.
4. headset spike acceptance, sustained loud rejection, clipping rejection.
5. Juno reply matrix and reply-quality rejection.
6. zero purple boundary pixels for both sprites.

Then run:

- focused suites for ending, voice, dialogue, and assets
- `npm run check`
- `npm test`
- `npm run build`
- `npm run build:qa`
- `git diff --check`

Manual QA uses production/debug-off for regression and QA `?debug=1` for evidence. It checks voice retry, transcript/keyword metrics, representative Juno utterances, the two Doyun poses, GOOD convergence after the former HIDDEN route, console, broken assets, and scroll.

## Freeze and Scope

Preserved unless required by the explicit changes above:

- HQ-10 Battle geometry and actor composition
- HQ-11 Result Frame geometry, title scale, anchors, and CTA
- OpenAI TITLE
- GOOD/NORMAL/BAD copy and conditions
- save schema version
- BGM and voice/click fallback behavior
- user-owned screenplay v2

No push, deploy, AR-10, new asset production, or unrelated visual polish is part of this work.
