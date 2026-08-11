# Transform Cast Pose Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only `transform.cast` with the approved A-balanced incantation image: Doyun presents one blank employee ID toward camera while speaking, and Juno prays around the star wand.

**Architecture:** Keep the existing logical ID, catalog, scenario, and `cast → complete` runtime sequence unchanged. Generate and review a candidate outside tracked paths, normalize the selected candidate to the existing WebP contract, then place identical bytes in source and runtime so the current resolver adopts it automatically.

**Tech Stack:** Codex built-in OpenAI image editing, `view_image`, FFmpeg/ffprobe, Node.js/Vitest, Vite, in-app Browser, Git.

---

## File map

| Responsibility | Path | Action |
|---|---|---|
| Approved design | `docs/superpowers/specs/2026-08-11-transform-cast-pose-revision-design.md` | Read only |
| Revision guard and asset contract | `tests/m5Assets.test.ts` | Modify |
| Traceable adopted source | `assets/source/p0-required-images/delivery/cut_transform_01.webp` | Replace |
| Game-loaded image | `assets/runtime/cut/cut_transform_01.webp` | Replace with identical bytes |
| Current asset state | `docs/assets/ASSET_MANIFEST.md` | Modify |
| Scene composition contract | `docs/assets/SCENE_ASSET_MAPPING.md` | Modify |
| Production request/status | `docs/assets/IMAGE_REWORK_REQUEST.md` | Modify |
| Tool, references, hash, discarded candidates | `docs/assets/PROVENANCE.md` | Modify |
| AI production evidence | `docs/assets/AI_PRODUCTION_LOG.md` | Modify |
| Exact implementation and QA facts | `docs/dev/IMPLEMENTATION_LOG.md` | Modify |
| Beginner-only explanation | `docs/dev/LEARNING_LOG.md` | Modify |

`cut_transform_02.webp`, source character references, code, catalog, scenario JSON, DECISIONS, and MILESTONES are out of scope.

### Task 1: Lock the replacement contract with a RED test

**Files:**
- Modify: `tests/m5Assets.test.ts:1-3,65-75,241-259`
- Test: `tests/m5Assets.test.ts`

- [ ] **Step 1: Import the SHA-256 helper and record the superseded file hash**

Add the import and constant:

```ts
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const previousTransformCastSha256 =
  "507CA55683BC50CCBB83B3196598DB4D2DCA1CF82B58A5AEF796CD007634140D";
```

- [ ] **Step 2: Extend the existing P0 image test with the revision guard**

Inside the `for (const filename of runtimeP0Cuts)` loop, after the existing size assertion, add:

```ts
if (filename === "cut_transform_01.webp") {
  const runtimeSha256 = createHash("sha256")
    .update(runtimeFile)
    .digest("hex")
    .toUpperCase();

  expect(runtimeSha256, "transform.cast must use the approved pose revision")
    .not.toBe(previousTransformCastSha256);
}
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected: one failure in `P0 필수 이미지 3종은 source와 같은 runtime 규격 파일이다`; actual hash equals `507CA556...634140D`. Other assertions pass.

### Task 2: Generate and select the A-balanced edit candidate

**Files:**
- Read: `assets/runtime/cut/cut_transform_01.webp`
- Read: `assets/runtime/char/char_doyun_normal_shy.png`
- Read: `assets/runtime/char/char_juno_surprised.png`
- Create ignored review artifact: `output/imagegen/transform-cast-pose-revision/candidate-a.png`

- [ ] **Step 1: Inspect all three local inputs before editing**

Use `view_image` with original detail on the current cut, Doyun reference, and Juno reference. Assign roles as follows:

- current cut: edit target and background/style invariant
- Doyun sprite: office clothing, hair, adult male character reference
- Juno sprite: yellow chick body, star necklace, star wand reference

- [ ] **Step 2: Run one built-in image edit with the approved prompt**

Call the built-in image generation tool with all three local paths in `referenced_image_paths` and this prompt:

```text
Use case: precise-object-edit
Asset type: 16:9 Korean visual novel transformation-incantation cutscene
Input image 1: edit target; preserve its blue-and-gold late-night office, circular magic sigil, lighting, particles, and polished anime game illustration style.
Input image 2: Doyun identity and office-clothing reference only.
Input image 3: Juno identity, yellow chick body, star necklace, and star wand reference only.

Primary request: revise the character action and framing to the approved A-balanced medium shot.

Doyun: adult Korean man in the same white rolled-sleeve office shirt, loosened black tie, black trousers, and black wavy hair. Frame him from mid-thigh upward at center. He extends exactly one blank employee ID card toward the camera with one hand. The ID occupies about 25 percent of the frame in the left foreground with clear foreshortening. His fingers visibly and naturally grip the card edge or clip; the card must not float. His other hand stays near his chest and never covers his face. His mouth is clearly visible and moderately open as he speaks an incantation, serious with slight embarrassment, not shouting.

Juno: on the right, eyes closed, praying. Bring both small wings together at chest height around the star wand, with the wand upright between them. Keep Juno fully readable and separate from Doyun and the ID.

Composition: balanced triangular eye flow between foreground ID, Doyun's speaking mouth, and praying Juno. Keep all three safe for a centered vertical mobile crop.

Constraints: Doyun remains in ordinary office clothes; exactly one employee ID; blank card with no photo, name, company, logo, letters, numbers, or UI; exactly one Doyun and one Juno; natural hands and fingers; preserve night office and magic circle.
Avoid: magical-girl outfit on Doyun, hand covering mouth, floating ID, neck lanyard duplicate, extra cards, extra limbs, deformed fingers, Juno holding the wand one-handed, open Juno eyes, text, speech bubbles, watermark, logo, baked game UI.
```

- [ ] **Step 3: Copy the generated candidate to the ignored review directory**

Create the directory with PowerShell `New-Item -ItemType Directory -Force`. Copy the concrete output path reported by the built-in tool to:

```text
output/imagegen/transform-cast-pose-revision/candidate-a.png
```

Do not copy it into source or runtime yet.

- [ ] **Step 4: Inspect the candidate against the visual checklist**

Use `view_image` at original detail and check, in order:

1. one Doyun, one Juno, one employee ID;
2. Doyun wears office clothes and grips the foreground ID;
3. the mouth is visible, moderately open, and not covered;
4. Juno's eyes are closed and both wings meet around an upright wand;
5. no text/logo/UI and no malformed hands;
6. ID, mouth, and Juno remain inside the centered mobile-safe region.

- [ ] **Step 5: If one checklist item fails, perform one targeted edit**

Use the candidate as the edit target and state only the failed item plus these invariants: preserve every other pixel-level composition choice, office clothing, one blank ID, speaking mouth, praying Juno, and existing background. Copy the edited output reported by the tool over the ignored review path `output/imagegen/transform-cast-pose-revision/candidate-a.png`, then reinspect it before proceeding. Do not accept a candidate that is less coherent than the current runtime image.

### Task 3: Normalize, adopt, and turn the contract GREEN

**Files:**
- Create ignored artifact: `output/imagegen/transform-cast-pose-revision/cut_transform_01-revised.webp`
- Replace: `assets/source/p0-required-images/delivery/cut_transform_01.webp`
- Replace: `assets/runtime/cut/cut_transform_01.webp`
- Modify: `tests/m5Assets.test.ts`

- [ ] **Step 1: Normalize the selected PNG to the runtime contract**

Run:

```powershell
ffmpeg -y -i output/imagegen/transform-cast-pose-revision/candidate-a.png -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" -frames:v 1 -c:v libwebp -quality 80 -compression_level 6 output/imagegen/transform-cast-pose-revision/cut_transform_01-revised.webp
```

If the result exceeds 716,800 bytes, rerun exactly once at `-quality 76`; if it still exceeds the limit, rerun at `-quality 72`.

- [ ] **Step 2: Verify format, size, and normalized composition**

Run:

```powershell
ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt -show_entries format=size -of json output/imagegen/transform-cast-pose-revision/cut_transform_01-revised.webp
```

Expected: `codec_name=webp`, `width=1920`, `height=1080`, `size<=716800`. Inspect the normalized WebP with `view_image` and confirm the crop did not remove the ID, speaking mouth, Juno, wings, or wand.

- [ ] **Step 3: Adopt identical bytes in source and runtime**

Copy the normalized WebP to both exact destinations:

```powershell
Copy-Item -LiteralPath 'output\imagegen\transform-cast-pose-revision\cut_transform_01-revised.webp' -Destination 'assets\source\p0-required-images\delivery\cut_transform_01.webp' -Force
Copy-Item -LiteralPath 'output\imagegen\transform-cast-pose-revision\cut_transform_01-revised.webp' -Destination 'assets\runtime\cut\cut_transform_01.webp' -Force
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected: all `m5Assets.test.ts` tests pass; source/runtime equality, 1920×1080, ≤700KB, and new-hash guard all pass.

- [ ] **Step 5: Verify hashes and stage only the intended asset/test files**

Run `Get-FileHash -Algorithm SHA256` for both adopted paths and confirm identical hashes that differ from `507CA556...634140D`. Confirm `git status --short` lists only the two WebP files and `tests/m5Assets.test.ts`.

- [ ] **Step 6: Commit the asset revision**

```powershell
git add -- tests/m5Assets.test.ts assets/source/p0-required-images/delivery/cut_transform_01.webp assets/runtime/cut/cut_transform_01.webp
git commit -m "feat(assets): revise transform cast pose"
```

### Task 4: Update current-state, provenance, and learning documents

**Files:**
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/assets/IMAGE_REWORK_REQUEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Update the current-state documents without changing SSOT priority**

Use `apply_patch` to make these exact semantic updates:

- `ASSET_MANIFEST.md`: replace the old `transform.cast` size and “평상복 영창 구성” QA text with the new byte size, handheld foreground ID, visible speaking mouth, praying Juno, and automatic-test status.
- `SCENE_ASSET_MAPPING.md`: change “사원증이 떠오르고” to “도윤이 무문자 사원증을 전경으로 내밀고”; retain N5 first-cut use and DEC-016 order.
- `IMAGE_REWORK_REQUEST.md`: preserve the original request history but add a 2026-08-11 pose-revision completion note; remove no historical row.
- `PROVENANCE.md`: preserve the previous hash as superseded history, add the revised hash/size, exact input references, built-in edit tool limitation, prompt intent, and any discarded candidate reason.
- `AI_PRODUCTION_LOG.md`: add a new revision row with user choices `입 모양 1번` and `A 균형형`, tool, references, human checks, and `ready`/rights-pending status.
- `IMPLEMENTATION_LOG.md`: append changed files, RED/GREEN evidence, normalization values, commit, and pending full/browser QA.
- `LEARNING_LOG.md`: explain only the beginner concept—why a pretty image can still fail an action relationship, and why source/runtime/hash protect replacement integrity. Refer exact numbers to `IMPLEMENTATION_LOG.md`.

- [ ] **Step 2: Verify document links and expected scope**

Run `git diff --check`, scan changed Markdown links by resolving relative paths, and run `git status --short`. Expected: only the seven listed documents are changed.

- [ ] **Step 3: Commit the documentation update**

```powershell
git add -- docs/assets/ASSET_MANIFEST.md docs/assets/SCENE_ASSET_MAPPING.md docs/assets/IMAGE_REWORK_REQUEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git commit -m "docs(assets): record transform cast pose revision"
```

### Task 5: Run full verification and browser QA

**Files:**
- Verify: `dist/assets/cut/cut_transform_01.webp`
- Modify after QA: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify after QA: `docs/dev/IMPLEMENTATION_LOG.md`

- [ ] **Step 1: Run the full automated gate**

Run in order:

```powershell
npm run check
npm test
npm run build
```

Expected: TypeScript exit 0, all Vitest files/tests pass, Vite build exit 0. Record any existing nonblocking chunk warning separately; do not describe it as a new failure.

- [ ] **Step 2: Verify production-copy integrity**

Confirm `dist/assets/cut/cut_transform_01.webp` exists exactly once and its SHA-256 equals `assets/runtime/cut/cut_transform_01.webp`.

- [ ] **Step 3: Start or reuse the fixed local game URL**

Run:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Use:

```text
http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-transformation
```

- [ ] **Step 4: Perform desktop and mobile browser QA**

Using the in-app Browser, verify at 1280×720 and 390×844:

- `cut_transform_01.webp` loads at natural 1920×1080 and does not use a black fallback;
- one handheld ID, Doyun's speaking mouth, and praying Juno remain visible;
- Doyun is in office clothes in cast and magical clothes only in complete;
- no horizontal overflow and no console errors;
- the composition remains readable beside the existing debug overlays.

- [ ] **Step 5: Record final evidence and commit**

Use `apply_patch` to replace the pending QA language in `AI_PRODUCTION_LOG.md` and `IMPLEMENTATION_LOG.md` with the actual full-test counts, browser sizes, console/overflow results, and any nonblocking visual follow-up. Then run `git diff --check`, verify only those two docs changed, and commit:

```powershell
git add -- docs/assets/AI_PRODUCTION_LOG.md docs/dev/IMPLEMENTATION_LOG.md
git commit -m "docs(qa): verify transform cast pose revision"
```

- [ ] **Step 6: Perform the final clean-state audit**

Run:

```powershell
git diff --check
git diff --stat
git diff --cached --stat
git status --short
git rev-parse HEAD
git log --oneline -5
```

Expected: no unstaged/staged diff and empty short status. Report every new commit SHA and final HEAD. Do not push, create a PR, merge `main`, or remove the worktree.
