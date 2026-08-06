# SFX Prompt Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 승인 설계에 맞춰 마법 방어막·별빛 공격·최종 빔·결정 파괴·주노 등장 Suno Sounds 생성폼을 완성한다.

**Architecture:** 게임 코드와 runtime 에셋은 수정하지 않는다. 제작자가 직접 사용할 단일 생성폼 문서에서 네 기존 항목을 교체하고, 최종 결정 파괴를 독립 계약 파일로 추가한다. 문서 검증은 프롬프트 길이, 계약명, 공통 Sounds 설정과 금지 요소를 자동 확인한다.

**Tech Stack:** Markdown, Suno Sounds v5.5, PowerShell 검증, Git

---

## 파일 구조

- Modify: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md` — 실제 Suno 입력문, 장면·의도, 목표 길이, 선택 규칙
- Reference: `docs/superpowers/specs/2026-08-06-sfx-prompt-revision-design.md` — 사용자 승인 음향 설계
- No change: `assets/runtime/`, 게임 소스 — 개발자 통합 범위

### Task 1: 마법 방어막·별빛 공격 폼 교체

**Files:**
- Modify: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md:50`
- Reference: `docs/superpowers/specs/2026-08-06-sfx-prompt-revision-design.md`

- [ ] **Step 1: 마법 방어막 의도와 길이를 승인 설계로 교체**

`sfx_barrier.wav`의 목표 길이를 `0.8–1.1초`로 바꾼다. 설명에 LoL Barrier는 기능적 구조만 참고하며 원본을 복제·재사용하지 않는다고 명시한다.

- [ ] **Step 2: 마법 방어막 입력문 교체**

```text
Single isolated magical shield activation sound effect with the fast, decisive readability of a competitive-game defensive spell, using original sound design: immediate bright protective snap, compact white-pink energy surge expanding around the heroine, dense magical membrane resonance, short confident decay. Strong and clearly defensive on laptop speakers. No copied game audio, glass breaking, explosion, weapon hit, voice, music, deep bass boom, repetition, or long ambience.
```

- [ ] **Step 3: 별빛 공격 의도와 길이를 승인 설계로 교체**

`sfx_star_attack.wav` 목표 길이를 `0.65–0.9초`로 바꾼다. 휘두름은 유지하고, 발사부는 둔탁한 에너지 버스트 대신 높고 귀여운 비보컬 `뿅`으로 지정한다.

- [ ] **Step 4: 별빛 공격 입력문 교체**

```text
Single isolated magical wand attack sound effect: keep a fast clean wand-swing whoosh, then launch one tiny cute star-shaped projectile with a high-pitched springy electronic pyong, bubbly twinkle and light sparkling trail. The projectile must sound bright, playful, weightless and non-vocal, never blunt. No dull thud, heavy energy burst, bass punch, explosion, gunshot, human voice, music, repeated shots, or long reverb.
```

- [ ] **Step 5: 변경 범위 확인**

Run:

```powershell
git diff -- docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md
```

Expected: `sfx_barrier.wav`, `sfx_star_attack.wav` 항목만 우선 변경되고 다른 계약명은 유지된다.

### Task 2: 최종 빔·결정 파괴 분리

**Files:**
- Modify: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md:122`
- Reference: `docs/superpowers/specs/2026-08-06-sfx-prompt-revision-design.md`

- [ ] **Step 1: 최종 빔 역할과 길이 수정**

`sfx_final_beam.wav`은 충전·발사·에너지 코어만 담당한다. 목표 길이는 `1.2–1.8초`이며 결정 파괴 레이어를 포함하지 않는다.

- [ ] **Step 2: 최종 빔 입력문 교체**

```text
Single isolated final magical beam sound effect: near-instant rising charge, focused pink-white beam launch, brilliant sustained energy core, then a clean impact handoff with no destruction layer. Powerful, precise and readable, compact game scale. No crystal breaking, explosion, debris, voice, chant, music, huge bass boom, repeated shots, long charge, or rumble.
```

- [ ] **Step 3: 최종 결정 파괴 독립 항목 추가**

P0 마지막에 아래 계약과 입력문을 추가한다.

- 계약명: `sfx_final_crystal_break.wav`
- 사용 장면: B3, 최종 빔이 회색 결정에 닿아 결정이 깨지는 정확한 프레임
- 의도: 한 번의 큰 균열과 여러 밝은 파편을 별도 레이어로 확보해 빔 위에서도 파괴음을 보장한다.
- 생성: 2회, 후보 4개. 파쇄 트랜지언트가 약하면 같은 폼으로 1회 추가
- 목표 사용 길이: `0.6–0.9초`

```text
Single isolated large magic-crystal destruction sound effect: immediate razor-sharp primary crack through one large gray crystal, bright layered crystalline fracture, many hard shards bursting outward, then a very short fine-fragment scatter. The main break must be loud and unmistakable over combat audio. No lead-in whoosh, beam, bottle or wine-glass clink, stone collapse, explosion, voice, music, repeated breaks, or long reverb.
```

- [ ] **Step 4: 항목 번호 정리**

새 결정 파괴를 `8. 최종 결정 파괴`로 배치한다. 기존 P1 번호 `8–13`을 `9–14`로 순차 변경한다.

- [ ] **Step 5: 레이어 사용법 명시**

결정이 깨지는 프레임에서 `sfx_final_crystal_break.wav`를 `sfx_final_beam.wav` 끝부분에 겹친다고 문서에 적는다. 실제 코드 연결은 하지 않는다.

### Task 3: 주노 CRT `뺩!` 폼 교체

**Files:**
- Modify: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md:152`
- Reference: `docs/superpowers/specs/2026-08-06-sfx-prompt-revision-design.md`

- [ ] **Step 1: 장면·의도·길이 수정**

주노가 공중의 빛에서 나타나는 설명을 제거한다. 모니터 화면에서 작은 캐릭터가 튀어나오는 컷으로 바꾸고 목표 길이를 `0.35–0.55초`로 지정한다.

- [ ] **Step 2: 주노 등장 입력문 교체**

```text
Single isolated cute character pop-out sound effect from a CRT monitor: tiny raster-data zip, then one short springy electronic "bbyap!" pop, followed by a microscopic pixel sparkle. Fast, cheeky and clearly electronic, like a small mascot popping through the screen. The "bbyap" is a non-vocal synthesized pop, not speech. No human voice, mouth sound, spoken word, choir, harp, melody, heavy impact, long glitch, repetition, or reverb.
```

- [ ] **Step 3: 비보컬 조건 확인**

입력문에 `non-vocal synthesized pop`, `not speech`, `No human voice`, `mouth sound`, `spoken word`가 모두 남아 있는지 확인한다.

### Task 4: 문서 자동 검증과 커밋

**Files:**
- Test: `docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md`

- [ ] **Step 1: 문서 계약과 프롬프트 길이 검증**

Run:

```powershell
$ErrorActionPreference = 'Stop'
$path = 'docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md'
$doc = Get-Content -Raw -LiteralPath $path
$blocks = [regex]::Matches($doc, '(?s)```text\r?\n(.*?)\r?\n```')
if ($blocks.Count -ne 15) { throw "expected 15 prompt blocks, got $($blocks.Count)" }
if (@($blocks | Where-Object { $_.Groups[1].Value.Length -gt 500 }).Count -ne 0) { throw 'prompt exceeds 500 characters' }
$contracts = @('sfx_barrier.wav','sfx_star_attack.wav','sfx_final_beam.wav','sfx_final_crystal_break.wav','sfx_juno_appear.wav')
$missing = @($contracts | Where-Object { -not $doc.Contains($_) })
if ($missing.Count -ne 0) { throw "missing contracts: $($missing -join ', ')" }
if (-not ($doc.Contains('One-Shot') -and $doc.Contains('BPM Auto') -and $doc.Contains('Key Random'))) { throw 'Sounds settings missing' }
'PASS'
```

Expected: `PASS`

- [ ] **Step 2: 승인 핵심 표현 검증**

Run:

```powershell
$doc = Get-Content -Raw 'docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md'
@('competitive-game defensive spell','high-pitched springy electronic pyong','sfx_final_crystal_break.wav','non-vocal synthesized pop') | ForEach-Object { if (-not $doc.Contains($_)) { throw "missing: $_" } }
'PASS'
```

Expected: `PASS`

- [ ] **Step 3: Markdown diff 검사**

Run:

```powershell
git diff --check
```

Expected: 출력 없음, exit code `0`

- [ ] **Step 4: 문서 변경만 스테이징**

```powershell
git add -- 'docs/assets/provenance/SFX_SUNO_GENERATION_FORMS.md'
git diff --cached --check
git diff --cached --stat
```

Expected: 생성폼 문서 1개만 표시된다.

- [ ] **Step 5: 커밋**

```powershell
git commit -m "docs(sfx): refine revised generation forms"
```

- [ ] **Step 6: 최종 상태 확인**

```powershell
git status --short
git log -1 --oneline --decorate
```

Expected: worktree clean, 새 문서 커밋이 `codex/sfx-p0-production` HEAD다. 원격 push는 없다.
