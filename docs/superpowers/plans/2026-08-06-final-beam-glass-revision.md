# Final Beam and Glass Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 최종 빔을 충전·발사로 분리하고 결정 파괴폼을 실제 대형 유리 파쇄 중심으로 보정한다.

**Architecture:** `SFX_SUNO_GENERATION_FORMS.md` 안에서 기존 `sfx_final_beam.wav` 단일 계약을 두 독립 One-Shot 계약으로 교체한다. 결정 파괴는 세 번째 독립 레이어로 유지하되 물리 유리 파쇄가 주음, 크리스탈 공명이 보조가 되도록 입력문을 바꾼다. 코드와 runtime 에셋은 수정하지 않는다.

**Tech Stack:** Markdown, Suno Sounds v5.5, PowerShell validation, Git

---

### Task 1: 최종 빔을 충전·발사로 분리

**Files:**
- Modify: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md:122`
- Reference: `docs/superpowers/specs/2026-08-06-final-beam-glass-revision-design.md`

- [ ] **Step 1: 기존 최종 빔 항목을 충전 항목으로 교체**

- 제목: `7. 최종 빔 충전`
- 계약명: `sfx_final_beam_charge.wav`
- 사용 장면: B3, 최종 공격 직전 에너지가 두 번 맥동하며 모이는 컷
- 목표 길이: `0.9–1.2초`
- 생성: 2회, 후보 4개

```text
Single isolated sci-fi magical beam charging sound effect, no firing: two clearly separated synthetic energy pulses, "woong... woong," first low and broad, second higher, faster and more intense, rising pitch and accelerating amplitude modulation, particles pulling inward, compact power-lock at the end. The woong pulses are non-vocal synthesized hums, not speech. No laser shot, impact, explosion, voice, chant, music, melody, long drone, or fade-out.
```

- [ ] **Step 2: 최종 빔 발사 항목 추가**

- 제목: `8. 최종 빔 발사`
- 계약명: `sfx_final_beam_fire.wav`
- 사용 장면: B3, 충전 직후 레이저가 발사되어 결정에 닿기 직전까지
- 목표 길이: `0.6–0.9초`
- 생성: 2회, 후보 4개

```text
Single isolated magical laser firing sound effect, no charging: immediate bright energy-release snap, powerful focused pink-white laser launch, fast downward pitch sweep, crisp high-frequency bite, compact sustained beam body and short clean tail. Strong and readable but not an explosion or gunshot. No charge-up, woong hum, impact, crystal break, debris, voice, chant, music, huge sub-bass, repeated shots, or long reverb.
```

- [ ] **Step 3: 사용 순서 명시**

충전 파일 끝에 발사 파일을 바로 이어 재생하고, 충돌 프레임에는 결정 파괴 파일을 겹친다고 두 항목의 의도에 명시한다.

### Task 2: 결정 파괴를 실제 유리 중심으로 보정

**Files:**
- Modify: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md:136`
- Reference: `docs/superpowers/specs/2026-08-06-final-beam-glass-revision-design.md`

- [ ] **Step 1: 항목 번호와 규격 수정**

- 제목: `9. 최종 결정 파괴`
- 계약명: `sfx_final_crystal_break.wav`
- 목표 길이: `0.7–1.0초`
- P1 기존 번호 `9–14`를 `10–15`로 이동

- [ ] **Step 2: 결정 파괴 입력문 교체**

```text
Single isolated realistic physical shatter of one large thick glass crystal: immediate loud sharp primary crack, dense irregular high-frequency glass shards bursting outward, multiple brittle fragments bouncing and falling onto a hard surface, then a short clear crystalline harmonic ring. Big and unmistakably glass, with slight magical clarity. No lead-in whoosh, beam, explosion, stone collapse, ice crack, bottle or wine-glass clink, voice, music, repeated breaks, or long reverb.
```

- [ ] **Step 3: 의도 수정**

실제 대형 유리 파쇄를 주음으로 지정한다. 큰 최초 균열, 불규칙한 다중 파편, 바닥 낙하를 필수로 하고 크리스탈 공명은 짧은 보조 레이어로 제한한다.

### Task 3: 문서 검증과 커밋

**Files:**
- Test: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md`

- [ ] **Step 1: 입력문·계약·번호 검증**

Run:

```powershell
$ErrorActionPreference = 'Stop'
$path = 'docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md'
$doc = Get-Content -Raw -LiteralPath $path
$blocks = [regex]::Matches($doc, '(?s)```text\r?\n(.*?)\r?\n```')
if ($blocks.Count -ne 16) { throw "expected 16 prompt blocks, got $($blocks.Count)" }
if (@($blocks | Where-Object { $_.Groups[1].Value.Length -gt 500 }).Count -ne 0) { throw 'prompt exceeds 500 characters' }
$required = @('sfx_final_beam_charge.wav','sfx_final_beam_fire.wav','sfx_final_crystal_break.wav','non-vocal synthesized hums','fast downward pitch sweep','realistic physical shatter')
$missing = @($required | Where-Object { -not $doc.Contains($_) })
if ($missing.Count -ne 0) { throw "missing: $($missing -join ', ')" }
if ($doc.Contains('`sfx_final_beam.wav`')) { throw 'obsolete final beam contract remains' }
$headings = @([regex]::Matches($doc, '(?m)^### (\d+)\. ') | ForEach-Object { [int]$_.Groups[1].Value })
if (($headings -join ',') -ne ((1..15) -join ',')) { throw "heading sequence invalid: $($headings -join ',')" }
'PASS'
```

Expected: `PASS`

- [ ] **Step 2: Markdown 검사**

```powershell
git diff --check
```

Expected: 출력 없음, exit code `0`

- [ ] **Step 3: 프로젝트 테스트**

```powershell
npm test
```

Expected: 38 test files, 164 tests passed

- [ ] **Step 4: 생성폼 문서만 커밋**

```powershell
git add -- 'docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md'
git diff --cached --check
git commit -m "docs(sfx): split final beam layers"
```

- [ ] **Step 5: 브랜치 상태 확인**

```powershell
git status --short
git log -1 --oneline --decorate
```

Expected: worktree clean, `codex/sfx-p0-production` 유지, 원격 push 없음.
