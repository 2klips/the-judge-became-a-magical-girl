# SFX 5종 Source Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 채택 WAV 5종만 개발자용 이름으로 source 에셋에 보존하고 장면·트리거 계약을 문서화한 뒤 `codex/m5-asset-handoff-docs`에 fast-forward push한다.

**Architecture:** WAV는 `assets/source/sfx/delivery/`에 원본 바이트 그대로 보존하고 runtime과 코드는 건드리지 않는다. `SFX_HANDOFF.md`가 파일별 통합 계약을 소유하며 manifest, scene mapping, provenance, AI log, ADR은 같은 사실을 각 문서 책임에 맞게 동기화한다.

**Tech Stack:** Git, WAV PCM, FFprobe/FFmpeg 8.1.1, Markdown, npm/Vite/Vitest

---

## 파일 구조

**Create**

- `assets/source/sfx/delivery/sfx_transform_complete.wav`: 변신 결과 one-shot 원본.
- `assets/source/sfx/delivery/sfx_critical.wav`: battle critical 결과 원본.
- `assets/source/sfx/delivery/sfx_barrier.wav`: p1 방어막 신버전 원본.
- `assets/source/sfx/delivery/sfx_star_attack.wav`: p2 별빛 투사체 원본.
- `assets/source/sfx/delivery/sfx_juno_appear.wav`: N2 주노 등장 원본.
- `docs/assets/provenance/SFX_HANDOFF.md`: 파일·해시·장면·트리거·통합 경계.

**Modify**

- `docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md`: 사용자 채택 5종과 미반영 4종의 저장소 경로 추가.
- `docs/assets/README.md`: source SFX 디렉터리와 인계 문서 링크 추가.
- `docs/assets/ASSET_MANIFEST.md`: source-only SFX 5종 `ready` 기록.
- `docs/assets/SCENE_ASSET_MAPPING.md`: N2/N5/p1/p2/critical 사용 시점과 runtime 대기 상태 기록.
- `docs/assets/PROVENANCE.md`: Suno 사용자 확인, 원본명 정규화, SHA-256 기록.
- `docs/assets/AI_PRODUCTION_LOG.md`: Suno 생성·사람 선택·무후처리·source 인계 기록.
- `docs/dev/DECISIONS.md`: `DEC-059` source-only file SFX 예외와 개발자 통합 경계 기록.

**Must not modify**

- `src/`
- `public/scenario/`
- `assets/runtime/`
- `main` branch

### Task 1: Freeze Remote and Commit Plan

- [ ] **Step 1: Fetch the exact target branch**

Run:

```powershell
git fetch origin codex/m5-asset-handoff-docs
```

Expected: fetch succeeds without changing the worktree.

- [ ] **Step 2: Prove current history can fast-forward the target**

Run:

```powershell
git merge-base --is-ancestor origin/codex/m5-asset-handoff-docs HEAD
git rev-list --left-right --count origin/codex/m5-asset-handoff-docs...HEAD
```

Expected: first command exits `0`; second command has `0` in the left column.

- [ ] **Step 3: Stage only this plan and verify scope**

Run:

```powershell
git add -- docs/superpowers/plans/2026-08-06-sfx-handoff-publish.md
git diff --cached --check
git diff --cached --stat
```

Expected: only the plan file is staged.

- [ ] **Step 4: Commit plan**

```powershell
git commit -m "docs(sfx): plan source handoff"
```

### Task 2: Add the Five Selected WAV Sources

- [ ] **Step 1: Verify the selected local files before copying**

Expected hashes:

```text
sfx_transform_complete.wav CCF478921EF8B3BE124FC3A0F21568850378D624ACCD93D46E97A224F1F1E318
sfx_critical.wav           BB5880185585B1FB2AE2BEDA50D8EDBE0AED9B2CE4AD7B1AB89859D31420ECA2
sfx_barrier.wav            52BCF2011D5815AE4B0D06534113CA2B7BACBB0D47400347B48CF2265ACE70F9
sfx_star_attack.wav        C4DE29A13BA813D76724D0DC0464813E4410D00C580AD68A838FED52999AD6FE
sfx_juno_appear.wav        C2A0B50743E1FC9C99D86F5A818438ED361AAB494A875EB16777F3CBABEE70EF
```

Run `Get-FileHash -Algorithm SHA256` for the five files in `C:/Users/user/Downloads/judge_magical_girl_sfx_work/selected/`. Expected: all hashes match exactly.

- [ ] **Step 2: Copy without overwriting**

Create `assets/source/sfx/delivery/` only if absent. For each destination, fail if it already exists, then use `Copy-Item -LiteralPath` from the selected folder. Do not use `-Force`.

- [ ] **Step 3: Verify WAV metadata**

Run FFprobe for all five repository files with:

```powershell
ffprobe -v error -show_entries format=duration,size:stream=codec_name,sample_rate,channels,bits_per_sample -of json -- <file>
```

Expected: `pcm_s16le`, `48000`, stereo `2`, `16` bits. Expected durations are 2.440, 2.000, 5.000, 2.000, and 2.000 seconds respectively.

- [ ] **Step 4: Create `SFX_HANDOFF.md`**

The document must contain this exact integration map:

| File | Runtime event | Playback contract |
|---|---|---|
| `sfx_transform_complete.wav` | `n5_transform`, after successful incantation and when transformation result renders | one-shot once per result render; may layer under `bgm_transform` |
| `sfx_critical.wav` | `battle_wraith`, spell result `delta >= 25` | replace the current `SfxPlayer.play("critical")` oscillator after runtime adoption |
| `sfx_barrier.wav` | `p1_defend`, successful barrier deployment | one-shot at barrier visual activation |
| `sfx_star_attack.wav` | `p2_attack`, successful wand swing/projectile launch | one-shot at star projectile launch, not at later impact |
| `sfx_juno_appear.wav` | first entry to `n2_juno_intro` when Juno appears from the monitor | one-shot once per scene entry |

Also state: source-only, no runtime integration, no trimming/normalization, file-load fallback must preserve current Web Audio or silence, and STT capture must not include these SFX.

- [ ] **Step 5: Update production evidence paths**

Change the five selected rows from local-only preservation paths to include repository delivery paths. Keep gray invasion, old shield deployment, normal contact hit, and beam charging explicitly unreflected.

- [ ] **Step 6: Stage only the five WAVs and two evidence documents**

Run:

```powershell
git add -- assets/source/sfx/delivery docs/assets/provenance/SFX_HANDOFF.md docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md
git diff --cached --check
git diff --cached --stat
```

Expected: five WAVs and two Markdown files only.

- [ ] **Step 7: Commit source delivery**

```powershell
git commit -m "assets(sfx): add selected source files"
```

### Task 3: Synchronize Developer Contracts

- [ ] **Step 1: Update the asset README**

Add this directory contract below `assets/source/bgm/`:

```text
sfx/
  delivery/            # 사용자 채택 WAV; runtime 미연결
```

Add `SFX_HANDOFF.md` to the audio handoff links.

- [ ] **Step 2: Add source-only manifest rows**

Add a `파일 SFX source 인계` subsection after the code SFX table. Record five `sfx.*` handoff IDs, exact filenames, WAV 48kHz stereo 16-bit PCM, `ready`, Suno Sounds, user-confirmed Pro, exact scene references, and `runtime 미연결·청감 QA 대기`.

- [ ] **Step 3: Add scene usage contract**

Add `3.5 효과음 source 인계` with the five files and exact events from Task 2 Step 4. Replace the old “파일 SFX를 제작하지 않는다” statement with “선택 5종은 source-ready, runtime integration pending.” Add developer checklist items for one-shot deduplication, STT isolation, and Web Audio/silence fallback.

- [ ] **Step 4: Record provenance and AI production**

In `PROVENANCE.md`, add a Suno SFX section with the five hashes, source/delivery relation, user-confirmed Pro plan, and unverified external terms evidence gate. In `AI_PRODUCTION_LOG.md`, add one row: Suno Sounds One Shot generation, user auditory selection of five, no trim/normalization, source-only handoff, runtime deferred.

- [ ] **Step 5: Add `DEC-059`**

Use this decision:

```text
DEC-059 accepted: 사용자 채택 Suno Sounds WAV 5종을 source-only 파일 SFX로 인계한다. 기존 Web Audio SFX는 runtime 채택 전까지 유지한다. 이번 변경은 파일명 정규화·장면 매핑·증빙만 수행하며 src, scenario, assets/runtime은 수정하지 않는다. 최신 사용자 결정이 별첨2의 code-only SFX 기본 방침을 이 인계 범위에서 대체한다.
```

- [ ] **Step 6: Verify document consistency**

Run searches for all five filenames across the handoff, manifest, scene mapping, provenance, and evidence documents. Expected: each filename appears in the handoff and required owner documents; excluded effects do not appear as delivered files.

- [ ] **Step 7: Stage only contract documents**

Run `git add --` with the six modified contract files, then `git diff --cached --check` and `git diff --cached --stat`.

- [ ] **Step 8: Commit mappings**

```powershell
git commit -m "docs(sfx): map source files to scenes"
```

### Task 4: Validate and Fast-Forward Push

- [ ] **Step 1: Prove file integrity and scope**

Verify all five SHA-256 values again. Run:

```powershell
git status --short
git diff origin/codex/m5-asset-handoff-docs...HEAD --name-only
```

Expected: clean worktree; no new paths under `src/`, `public/scenario/`, or `assets/runtime/`; exactly five delivered SFX files.

- [ ] **Step 2: Run repository checks**

```powershell
npm run check
npm test
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 3: Re-fetch and guard against concurrent remote updates**

```powershell
git fetch origin codex/m5-asset-handoff-docs
git merge-base --is-ancestor origin/codex/m5-asset-handoff-docs HEAD
```

Expected: exit `0`. If it fails, stop before push, inspect the new remote commits, and integrate without force push.

- [ ] **Step 4: Push only the target branch**

```powershell
git push origin HEAD:refs/heads/codex/m5-asset-handoff-docs
```

Expected: fast-forward update; no `--force`; `main` unchanged.

- [ ] **Step 5: Verify the remote commit**

```powershell
git ls-remote --heads origin refs/heads/codex/m5-asset-handoff-docs
git rev-parse HEAD
```

Expected: both commit hashes are identical.
