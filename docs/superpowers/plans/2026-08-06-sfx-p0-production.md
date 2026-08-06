# P0 Sound Effects Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suno Sounds로 P0 효과음 11개를 생성·선정·정규화하고, 런타임 코드를 건드리지 않은 source 납품본과 증빙을 만든다.

**Architecture:** 효과음 색을 먼저 고정하는 3종 파일럿 뒤 나머지를 생성한다. 원본 후보는 저장소 밖 작업 폴더에 보관하고, 사용자 승인본만 `assets/source/sfx/delivery/`에 48kHz/24-bit WAV로 넣는다. 현재 Web Audio SFX와 `assets/runtime/`은 개발자가 별도 통합할 때까지 유지한다.

**Tech Stack:** Suno Sounds One Shot, Chrome 기존 로그인 세션, FFmpeg/FFprobe 8.1.1, PowerShell, Git

---

## 파일 구조

- 저장소 밖 원본 후보: `C:\Users\user\Downloads\judge_magical_girl_sfx_work\raw\`
- 저장소 밖 사용자 선정본: `C:\Users\user\Downloads\judge_magical_girl_sfx_work\selected\`
- 생성: `assets/source/sfx/delivery/sfx_time_stop.wav`
- 생성: `assets/source/sfx/delivery/sfx_wraith_enter.wav`
- 생성: `assets/source/sfx/delivery/sfx_cast.wav`
- 생성: `assets/source/sfx/delivery/sfx_transform_complete.wav`
- 생성: `assets/source/sfx/delivery/sfx_barrier.wav`
- 생성: `assets/source/sfx/delivery/sfx_impact_01.wav`
- 생성: `assets/source/sfx/delivery/sfx_impact_02.wav`
- 생성: `assets/source/sfx/delivery/sfx_impact_03.wav`
- 생성: `assets/source/sfx/delivery/sfx_star_attack.wav`
- 생성: `assets/source/sfx/delivery/sfx_critical.wav`
- 생성: `assets/source/sfx/delivery/sfx_final_beam.wav`
- 생성: `docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md`
- 수정: `docs/assets/provenance/SFX_PRODUCTION_PLAN.md`
- 수정: `docs/assets/README.md`
- 수정: `docs/assets/PROVENANCE.md`
- 수정: `docs/assets/AI_PRODUCTION_LOG.md`
- 변경 금지: `src/`, `public/scenario/`, `assets/runtime/`, `docs/assets/ASSET_MANIFEST.md`

### Task 1: 격리 작업공간과 Suno 제작 세션 준비

- [ ] **Step 1: 최신 제작 기준 확인**

Run:

```powershell
git fetch origin codex/bgm-asset-handoff-m5
git rev-parse HEAD
git ls-remote origin refs/heads/codex/bgm-asset-handoff-m5
git status --short --branch
```

Expected: 로컬·원격 SHA가 `387dd9044450c43a9ce6e8bee1a694f0477a5790`이고 작업공간이 clean.

- [ ] **Step 2: 격리 브랜치와 worktree 생성**

`using-git-worktrees` 지침으로 `codex/sfx-p0-production` 브랜치를 `codex/bgm-asset-handoff-m5`에서 만든다. `main`과 기존 M5 브랜치는 전환·수정하지 않는다.

- [ ] **Step 3: 저장소 밖 작업 폴더 생성**

Run:

```powershell
$sfxWorkRoot = 'C:\Users\user\Downloads\judge_magical_girl_sfx_work'
New-Item -ItemType Directory -Force -Path (Join-Path $sfxWorkRoot 'raw') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $sfxWorkRoot 'selected') | Out-Null
Get-ChildItem -LiteralPath $sfxWorkRoot
```

Expected: `raw`, `selected` 디렉터리 2개.

- [ ] **Step 4: Chrome 기존 로그인 세션으로 Suno Sounds 열기**

`chrome:control-chrome` 지침을 사용한다. 로그인 비밀번호·쿠키·결제정보를 읽거나 저장하지 않는다. 화면에서 Pro 상태와 Sounds/One Shot 모드를 확인한다.

- [ ] **Step 5: 생성 증빙 시작**

`docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md`를 다음 구조로 만든다. 브라우저에 모델명이 표시되면 `미노출`만 실제 표시값으로 바꾸고 추정하지 않는다.

```markdown
# SFX 제작·편집 증빙

## 생성 환경

- 생성일: 2026-08-06
- 생성 서비스: Suno Sounds, One Shot
- 현재 플랜: Pro — 사용자 확인
- 생성 당시 플랜: 브라우저 계정 화면 확인값을 최종 생성 전에 기록
- 모델/버전: 미노출
- 후처리: FFmpeg/FFprobe 8.1.1
- runtime 연결: 없음

## 생성 후보 기록

| 그룹 | 후보명 | 작업 ID 또는 URL | 원본 SHA-256 | 상태 |
|---|---|---|---|---|

## 최종 납품 기록

| 최종 파일 | 선택 후보 | 길이 | 채널 | True Peak | 최종 SHA-256 | 사용자 승인 |
|---|---|---:|---:|---:|---|---|
```

- [ ] **Step 6: 준비 문서 커밋**

```powershell
git add -- docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md
git commit -m "docs: start P0 SFX production evidence"
```

Expected: 증빙 문서 1개만 포함한 커밋.

### Task 2: 사운드 팔레트 파일럿 3종 생성·선정

- [ ] **Step 1: 시간 정지 후보 3개 생성**

Suno Sounds One Shot prompt:

```text
1.0-second one-shot game sound effect, a clock tick abruptly freezes, airy vacuum pull and thin glass resonance, late-night office atmosphere, immediate transient, short clean tail, no voice, no music, no bass boom, no long reverb
```

다운로드 파일을 생성 순서대로 `raw_time_stop_a`, `raw_time_stop_b`, `raw_time_stop_c` 이름으로 `raw` 폴더에 보존한다. 원래 확장자는 유지한다. 각 작업 ID/URL을 증빙 표에 기록한다.

- [ ] **Step 2: 주문·변신 시작 후보 3개 생성**

```text
1.1-second one-shot magical-girl game sound effect, rapid airy whoosh rising into celesta sparkle, subtle office approval chime, sincere and compact, no voice, no music bed, no long reverb
```

`raw_cast_a`, `raw_cast_b`, `raw_cast_c`로 보존하고 작업 ID/URL을 기록한다.

- [ ] **Step 3: 일반 타격 후보 5개 생성**

```text
0.45-second one-shot restrained magical impact, soft electric crack with a small glass sparkle, punchy but dialogue-friendly, no bass boom, no voice, no music, create a clean isolated hit
```

`raw_impact_a`부터 `raw_impact_e`까지 보존하고 작업 ID/URL을 기록한다.

- [ ] **Step 4: 후보 무결성 검사**

Run:

```powershell
$rawRoot = 'C:\Users\user\Downloads\judge_magical_girl_sfx_work\raw'
Get-ChildItem -LiteralPath $rawRoot -File | Sort-Object Name | ForEach-Object {
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash
  $probe = ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -show_entries format=duration,size -of default=noprint_wrappers=1 $_.FullName
  [PSCustomObject]@{ Name = $_.Name; SHA256 = $hash; Probe = ($probe -join '; ') }
} | Format-List
```

Expected: 11개 후보 모두 오디오 스트림 존재, duration 0초 초과, SHA-256 기록 가능.

- [ ] **Step 5: 사용자 청취 선택 게이트**

각 후보를 대화에 재생 가능한 로컬 오디오 링크로 제시한다. 사용자는 시간 정지 1개, 주문 시작 1개, 타격 3개를 선택한다. 선택된 원본을 FFmpeg 무손실 PCM으로 디코딩해 `selected/sfx_time_stop.wav`, `selected/sfx_cast.wav`, `selected/sfx_impact_01.wav`, `selected/sfx_impact_02.wav`, `selected/sfx_impact_03.wav`로 저장한다. 이 단계에서는 trim·fade·limiter를 적용하지 않는다. 선택 전 나머지 P0 생성 금지.

### Task 3: 고정된 팔레트로 나머지 P0 생성·선정

- [ ] **Step 1: 회색 망령 등장 후보 3개 생성**

```text
1.5-second one-shot game sound effect, gray fog sweep with paper and digital fragments, restrained uncanny low rumble, compact cinematic texture matching a thin-glass magical palette, no jump scare, no voice, no music, no long drone
```

- [ ] **Step 2: 변신 완료 후보 3개 생성**

```text
0.8-second one-shot magical transformation completion sound, bright crystalline confirmation and compact star shimmer matching a celesta-and-glass magical palette, confident clean ending, no voice, no music bed, no trailer impact
```

- [ ] **Step 3: 방벽 후보 3개 생성**

```text
1.0-second one-shot magical shield sound effect, translucent bubble barrier expands and locks, soft magical pulse and small crystalline seal matching a thin-glass magical palette, no explosion, no voice, no music
```

- [ ] **Step 4: 별빛 공격 후보 3개 생성**

```text
0.8-second one-shot magical wand attack, quick wand-swing whoosh into a compact bright starburst matching a celesta-and-glass magical palette, energetic but not harsh, no explosion boom, no voice, no music
```

- [ ] **Step 5: 강한 타격 후보 3개 생성**

```text
0.8-second one-shot critical magical hit, sharp crystalline transient, controlled impact body and pink-white sparkle matching the approved impact palette, exciting but compact, no huge explosion, no trailer boom, no voice, no music
```

- [ ] **Step 6: 최종 빔 후보 3개 생성**

```text
2.0-second one-shot magical final attack sequence, very short charge, focused beam release, gray crystal core fracture and compact sparkling tail matching a thin-glass magical palette, no voice, no music bed, no long rumble
```

각 그룹은 `raw_wraith_enter_a~c`, `raw_transform_complete_a~c`, `raw_barrier_a~c`, `raw_star_attack_a~c`, `raw_critical_a~c`, `raw_final_beam_a~c`로 저장한다. 작업 ID/URL과 SHA-256을 기록한다.

- [ ] **Step 7: 사용자 청취 선택 게이트**

그룹별 후보를 재생 가능한 로컬 링크로 제시한다. 사용자가 그룹당 1개를 선택하면 FFmpeg 무손실 PCM으로 디코딩해 `selected/sfx_wraith_enter.wav`, `selected/sfx_transform_complete.wav`, `selected/sfx_barrier.wav`, `selected/sfx_star_attack.wav`, `selected/sfx_critical.wav`, `selected/sfx_final_beam.wav`에 저장한다. 이 단계에서는 trim·fade·limiter를 적용하지 않는다. 노래, 음성, 과한 저음, 0.3초 넘는 불필요한 시작 무음이 들리는 후보는 선택 대상에서 제외한다.

### Task 4: 승인본 11개 WAV 정규화

- [ ] **Step 1: source delivery 디렉터리 생성**

```powershell
$deliveryRoot = 'assets\source\sfx\delivery'
New-Item -ItemType Directory -Force -Path $deliveryRoot | Out-Null
```

- [ ] **Step 2: 전환형 stereo 파일 변환**

아래 계약명으로 변환한다.

```powershell
ffmpeg -y -i 'C:\Users\user\Downloads\judge_magical_girl_sfx_work\selected\sfx_time_stop.wav' -af "silenceremove=start_periods=1:start_duration=0.005:start_threshold=-55dB,atrim=0:1.00,afade=t=in:st=0:d=0.005,afade=t=out:st=0.95:d=0.05,alimiter=limit=0.85" -ar 48000 -ac 2 -c:a pcm_s24le 'assets\source\sfx\delivery\sfx_time_stop.wav'
ffmpeg -y -i 'C:\Users\user\Downloads\judge_magical_girl_sfx_work\selected\sfx_wraith_enter.wav' -af "silenceremove=start_periods=1:start_duration=0.005:start_threshold=-55dB,atrim=0:1.50,afade=t=in:st=0:d=0.005,afade=t=out:st=1.40:d=0.10,alimiter=limit=0.85" -ar 48000 -ac 2 -c:a pcm_s24le 'assets\source\sfx\delivery\sfx_wraith_enter.wav'
ffmpeg -y -i 'C:\Users\user\Downloads\judge_magical_girl_sfx_work\selected\sfx_final_beam.wav' -af "silenceremove=start_periods=1:start_duration=0.005:start_threshold=-55dB,atrim=0:2.00,afade=t=in:st=0:d=0.005,afade=t=out:st=1.90:d=0.10,alimiter=limit=0.85" -ar 48000 -ac 2 -c:a pcm_s24le 'assets\source\sfx\delivery\sfx_final_beam.wav'
```

Expected: 48kHz, stereo, 24-bit PCM WAV 3개.

- [ ] **Step 3: 동작형 mono 파일 변환**

같은 filter 순서로 다음 최대 길이와 fade-out 시작점을 사용한다.

| 파일 | 최대 길이 | fade-out 시작 |
|---|---:|---:|
| `sfx_cast.wav` | 1.10초 | 1.05초 |
| `sfx_transform_complete.wav` | 0.80초 | 0.75초 |
| `sfx_barrier.wav` | 1.00초 | 0.95초 |
| `sfx_impact_01.wav` | 0.45초 | 0.42초 |
| `sfx_impact_02.wav` | 0.45초 | 0.42초 |
| `sfx_impact_03.wav` | 0.45초 | 0.42초 |
| `sfx_star_attack.wav` | 0.80초 | 0.75초 |
| `sfx_critical.wav` | 0.80초 | 0.75초 |

FFmpeg 출력 옵션은 `-ar 48000 -ac 1 -c:a pcm_s24le`, limiter는 `alimiter=limit=0.85`를 사용한다.

- [ ] **Step 4: 규격·피크·해시 검사**

```powershell
$deliveryRoot = 'assets\source\sfx\delivery'
Get-ChildItem -LiteralPath $deliveryRoot -Filter '*.wav' | Sort-Object Name | ForEach-Object {
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bits_per_sample -show_entries format=duration,size -of default=noprint_wrappers=1 $_.FullName
  Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
  ffmpeg -hide_banner -nostats -i $_.FullName -filter_complex ebur128=peak=true -f null NUL 2>&1 | Select-String 'I:|Peak:' | Select-Object -Last 2
}
```

Expected: 11개, `pcm_s24le`, 48kHz, 지정 채널, 최대 -1 dBTP 이하, 개별 SHA-256.

### Task 5: 사람 청각 QA와 source 납품 승인

- [ ] **Step 1: 효과음 단독 청취**

헤드폰과 노트북 스피커에서 파일별로 재생한다. 클릭, 잘린 attack, 긴 잔향, 음성·음악 혼입, 과한 저음이 하나라도 있으면 원본 후보 재선정 또는 재생성한다.

- [ ] **Step 2: BGM 위 모의 청취**

`bgm_daily`, `bgm_crisis`, `bgm_transform`, `bgm_battle`, `bgm_ending`을 약 -17 LUFS 기준으로 재생하고 해당 SFX를 겹쳐 듣는다. 대사를 가릴 정도로 1~4kHz가 튀는 파일은 gain을 2dB 낮춰 다시 export한다.

- [ ] **Step 3: 반복 피로 QA**

`sfx_impact_01~03`을 `01, 02, 03, 01, 02, 03` 순서로 재생한다. 음량 차이가 확연하면 더 큰 파일을 1dB 단위로 낮춰 맞춘다.

- [ ] **Step 4: 사용자 최종 승인 게이트**

11개 납품 WAV를 재생 가능한 로컬 링크로 제시한다. 사용자 승인 전 Git stage·commit·push 금지.

### Task 6: 증빙·인계 문서 완료

- [ ] **Step 1: 제작 증빙 완성**

`SFX_PRODUCTION_EVIDENCE.md`에 최종 파일별 원본 후보명, 생성 작업 ID/URL, 생성일, 모델 표시값, 원본 SHA-256, 최종 SHA-256, duration, channel, True Peak, 사용자 승인일을 기록한다.

- [ ] **Step 2: 기존 문서 상태 갱신**

- `SFX_PRODUCTION_PLAN.md`: P0 생성·청각 QA 체크 상태만 사실에 맞게 갱신.
- `README.md`: `assets/source/sfx/delivery/` source-only 경로 추가.
- `PROVENANCE.md`: 현재 Pro와 생성 시점 브라우저 증빙을 구분해 기록.
- `AI_PRODUCTION_LOG.md`: 생성·선정·FFmpeg 편집·사람 QA 기록.
- `ASSET_MANIFEST.md`: 변경하지 않음. runtime 미통합 상태 유지.

- [ ] **Step 3: 문서·변경 범위 검사**

```powershell
git diff --check
git status --short
git diff --name-only -- src public/scenario assets/runtime docs/assets/ASSET_MANIFEST.md
```

Expected: whitespace 오류 없음. 마지막 명령 출력 없음.

### Task 7: 검증·비-main 브랜치 push

- [ ] **Step 1: 저장소 회귀 검사**

```powershell
npm run check
npm test
npm run build
```

Expected: TypeScript PASS, 38 test files/164 tests PASS 이상, Vite production build PASS. 기존 chunk size 경고는 실패로 간주하지 않는다.

- [ ] **Step 2: 의도한 파일만 stage**

```powershell
git add -- assets/source/sfx/delivery docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md docs/assets/provenance/SFX_PRODUCTION_PLAN.md docs/assets/README.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md
git diff --cached --check
git diff --cached --name-status
```

Expected: SFX WAV 11개와 문서 5개만 stage. runtime·code·scenario 없음.

- [ ] **Step 3: commit**

```powershell
git commit -m "assets: add approved P0 SFX source delivery"
```

- [ ] **Step 4: push**

```powershell
git push -u origin codex/sfx-p0-production
```

Expected: 새 비-main 원격 브랜치 생성. PR·병합 없음.

- [ ] **Step 5: 원격 재검증**

```powershell
$local = git rev-parse HEAD
$remote = ((git ls-remote origin refs/heads/codex/sfx-p0-production) -split '\s+')[0]
if ($local -ne $remote) { throw 'remote head mismatch' }
git status --porcelain
```

Expected: local/remote SHA 일치, worktree clean.
