# 「심사역은 마법소녀가 되었다」 개발 진행 종합 보고서

## 프로젝트 인계 기준 상태 → 현재 v3.1 Runtime Composition 단계

> 기준일: 2026-08-17  
> 인계 기준: `2a5821d8429d88208cb415b06992e7f6fe4dfabf`  
> 공개 배포 기준: `2a6d9e43911e55f0c4ddaa19377ec12cbae33cdb`  
> 최신 로컬 구현 기준: `a36057397be8c139a2a7c3b86d04733de5512800`  
> 작성 원칙: Git tracked evidence, 현재 source/test/scenario, asset SSOT를 우선한다. `ready`와 `approved`, 문서 계약과 런타임 구현, 공개 배포와 최신 로컬 작업을 구분한다.

## 1. Executive Summary

인계 시점의 프로젝트는 Vanilla TypeScript/Vite 기반 비주얼노벨 런타임, Cloudflare Worker STT/LLM 경로, PTT 음성 입력, 클릭 폴백, 로컬 저장, BGM, 3개 엔딩까지 이미 갖춘 실행 가능한 프로토타입이었다. 다만 마이크가 TITLE 진입을 사실상 막는 구조였고, 음성 실패를 플레이어 경험 관점에서 다루는 정책, 실제 입력 크기를 보여 주는 PTT 피드백, PC 메인 메뉴의 제품 수준 UI, 권리·출처 SSOT, v3 스토리의 분기 의미, 장면별 배우 배치 규칙이 닫히지 않았다.

그 후 진행된 작업의 핵심은 다음과 같다.

- **Voice 안정화:** 7종 typed failure, 같은 턴 1회 재시도 후 클릭 전환, 누적 5회 실패 시 전역 클릭 모드, 저장/이어하기·새 게임 reset 의미를 확정했다.
- **Optional microphone:** TITLE 마이크를 필수 게이트에서 선택 기능으로 바꾸고 `UNKNOWN`부터 `ERROR`까지 9-state FSM, voice/click 새 게임·이어하기, 접근 가능한 no-save Continue를 구현했다.
- **PTT live meter:** capture 1회에서 얻은 같은 `MediaStream`을 `MediaRecorder`와 analyser가 공유하며, dialogue/incantation/battle spell/freeform PTT 내부에 quiet/good/loud fill을 표시한다. meter 실패는 녹음을 중단하지 않는다.
- **PC TITLE 전면 개편:** 중앙 진단 패널을 제거하고 왼쪽 제목·메뉴, 오른쪽 NHN/HACKATHON 배경, Settings modal, BGM 20% HUD, local MaruBuri/Pretendard를 적용했다. 1920×1080, 1600×900, 1366×768에서 no-scroll을 확인했다.
- **TITLE `NO_DEVICE` blocker 수정:** placeholder `<option>`의 문구가 암묵적 value가 되어 `deviceId.exact`로 전달되던 caller regression을 explicit `value=""`와 session-selected ID 사용으로 고쳤다.
- **통합·배포:** 승인된 TITLE tip을 local `main`에 fast-forward한 뒤 일반 fast-forward push했다. GitHub Actions와 Pages는 공개 SHA `2a6d9e4`에서 성공했다. production dependency audit는 0건이다.
- **권리·출처 정리:** OpenAI 생성 이미지의 internal project lineage와 Suno 생성 당시 Pro 상태를 `USER ATTESTED`로 기록했다. 이는 법률 자문이나 공식 상표 허가가 아니다. NHN/HACKATHON baked branding은 제출 맥락의 `ACCEPTED SUBMISSION RISK`다.
- **Scenario v2 → v3 → v3.1:** 핵심 주제를 “비슷하다고 판단하는 것과, 보기 전에 의미 없다고 단정하는 것은 다르다”로 고정했다. 도윤·주노·회색 망령의 성장축을 재정의하고, N6 조건부 두 번째 주문, N7 BELIEVE/POSSIBILITY/CYNIC, N8 서사적 거절과 기술 실패의 분리, 4엔딩과 canonical post-credit 계약을 닫았다.
- **Runtime v3.1 재구축:** 현재 로컬 브랜치는 v3.1 data/FSM을 실제 `scenario.json`과 engine에 반영했다. 18개 노드, 관계 상태, conditional battle, N7/N8, GOOD/NORMAL/BAD/HIDDEN, GOOD/HIDDEN post-credit, schema v1 save 호환 및 legacy node alias가 구현돼 있다.
- **Composition 기반:** `conversation`, `confrontation`, `protect`, `battle`, `solo-cut`, `ending` preset, 배우 safe zone, no-overlap, CUT/SPRITE exclusivity를 도입했다. N3·N5·battle·post-credit preview 문제를 수정했다.

현재 최신 로컬 검증은 **58 test files / 394 tests PASS**, `check`, production build, QA build PASS다. runtime 물리 자산은 **44 files / 14,176,389 bytes / 13.52 MiB**로 30 MiB 상한 이하다. 그러나 프로젝트는 아직 공개 제출 완료 상태가 아니다. AR-01 사람 장면·청각 QA, AR-02 전역 스타일·연속성 QA, AR-10 실제 Pages cold-load 3초 실측, 최소 신규 Juno 행동 포즈와 final/post-credit cut, 전체 voice/click playthrough가 남아 있다.

## 2. 감사 범위와 현재 Git 상태

### 2.1 직접 대조한 증거

- Git history, refs, reflog, worktree 목록, commit별 stat/name-status
- [ASSET_MANIFEST](../assets/ASSET_MANIFEST.md), [PROVENANCE](../assets/PROVENANCE.md), [AI_PRODUCTION_LOG](../assets/AI_PRODUCTION_LOG.md), [SCENE_ASSET_MAPPING](../assets/SCENE_ASSET_MAPPING.md)
- [DECISIONS](../dev/DECISIONS.md), [MILESTONES](../dev/MILESTONES.md), [QA_AND_DEMO](../dev/QA_AND_DEMO.md), [IMPLEMENTATION_LOG](../dev/IMPLEMENTATION_LOG.md)
- [PC TITLE 계획](../superpowers/plans/2026-08-14-pc-title-ui-ux.md), [v3.1 Runtime Phase 1 계획](../dev/plans/2026-08-17-scenario-v31-runtime-composition-phase1.md)
- [완성대본 v2](../심사역은_마법소녀가_되었다_완성대본_v2.md), [완성대본 v3.1](../심사역은_마법소녀가_되었다_완성대본_v3.md)
- [현재 scenario](../../public/scenario/scenario.json), [config](../../public/scenario/config.json), `src/**`, `tests/**`, `worker/**`, `package.json`, lockfile
- GitHub Actions public run과 GitHub Pages HTTP 응답

### 2.2 공개 상태와 최신 로컬 상태

| 구분 | branch/ref | SHA | 상태 | 의미 |
|---|---|---:|---|---|
| Public remote | `origin/main`, actual remote `main` | `2a6d9e4` | clean/deployed | TITLE Phase E와 SSOT sync까지 공개 Pages에 배포된 기준 |
| Local main | `main` | `e21a1b9` | 해당 worktree에 사용자 소유 v2 대본 수정 존재 | rights attestation와 release docs alignment까지 포함. 공개 remote보다 2 commits 앞섬 |
| Story baseline | `codex/scenario-v3-rewrite` | `e039095` | clean | 승인된 v3.1 스토리/분기 문서 기준 |
| Latest implementation | `codex/scenario-v31-runtime-composition-p1` | `a360573` | 보고서 작성 전 clean | v3.1 runtime Phase 1과 composition polish 포함. 아직 main/Pages 미통합 |

`2a5821d → 2a6d9e4`는 67 commits, `2a6d9e4 → e21a1b9`는 2 commits, `e21a1b9 → a360573`은 6 commits다. 모든 주요 anchor는 이 순서로 ancestor 관계를 통과했다. 따라서 **최신 로컬 v3.1 구현이 이미 public Pages에 배포되었다고 볼 수 없다.**

## 3. 프로젝트 인계 당시 상태

초기 public baseline `2a5821d`의 실제 tree를 기준으로 확인했다.

| 영역 | 인계 당시 보유 상태 | 당시 한계 |
|---|---|---|
| 기술 스택 | Vanilla TypeScript, Vite 8, Vitest, Zod, Transformers.js, Cloudflare Worker/Wrangler | 제품 흐름과 에셋 QA가 여러 문서/코드에 분산 |
| 런타임 | data-driven `GameEngine`, `GameState`, DOM 기반 `GameView` | v2 분기와 presentation에 강하게 결합 |
| GameState/save | schema v1, node/history/flags/affinity/emotion/inputMode/STT·LLM failure count, localStorage save | 후속 voice failure 의미와 v3.1 flag 사전 미확정 |
| Voice | PTT 녹음, browser mic tester, Worker STT/LLM, click fallback | 실패 사유와 같은 턴 UX가 충분히 분리되지 않음 |
| TITLE | 중앙 대형 mic calibration/diagnostic panel, dBFS, 장치 UI | 마이크 성공 전 Start/Resume을 막아 선택 기능처럼 보이지 않음 |
| BGM | controller, 저장 volume/mute, 장면 BGM | TITLE first meaningful gesture와 Settings 단일 상태 계약 미완성 |
| Scenario | 14 runtime nodes: N0~N5, 3-phase battle, `ch3_gray_answer`, GOOD/NORMAL/BAD | HIDDEN과 독립 post-credit runtime 없음; v3.1 의미 계약 없음 |
| Battle | 방어/공격/수렴 중심 3 phase | “둘 다”가 사실상 최적 정답으로 읽히는 구조 |
| Debug | 장면 preview와 debug route 보유 | 전역 actor safe zone/no-overlap/CUT exclusivity 없음 |
| Asset SSOT | manifest, provenance, scene mapping 골격과 runtime 자산 다수 존재 | `ready`/권리/사람 QA가 섞이거나 미확인 출처가 남음 |
| 자동 QA | 41 test files / 187 tests 기록, check/build PASS | 실제 microphone, PC TITLE, v3.1, composition 계약 미포함 |

즉 인계 대상은 “무에서 시작한 프로젝트”가 아니라 완주 가능한 기술 프로토타입이었다. 이후 작업은 기존 FSM·save·Worker를 유지하면서 실패 정책, TITLE, 스토리 의미, 장면 구성과 SSOT를 제품 수준으로 닫는 작업이었다.

## 4. 주요 개발 이력

| 단계 | 대표 SHA | 핵심 결과 |
|---|---:|---|
| 초기 public baseline | `2a5821d` | realtime voice와 BGM controls가 있는 v2 런타임 |
| Phase A Voice | `651781c` | five-failure policy와 실제 Chrome gate 문서화 완료 |
| Phase B PTT | `2addc0e` | one-stream live meter와 CORSAIR 실제 QA 완료 |
| TITLE visual | `2d614b2` | PC TITLE visual skeleton, local fonts |
| TITLE interaction | `f549281` | 9-state mic, Settings, start/resume, BGM gesture |
| TITLE blocker fix | `2aaf7bb` | placeholder device ID regression 수정 |
| TITLE approved/deployed baseline | `2a6d9e4` | Phase E QA 및 asset SSOT sync |
| Rights attestation | `8279a8d` | OpenAI/Suno/NHN 제출 맥락 증거 정리 |
| Release docs alignment | `e21a1b9` | AR-09 재분류, AR-01/02/10 closure path |
| Scenario v3 | `87f3f43` | v2 → v3 완성대본 rewrite |
| Scenario v3.1 | `e039095` | N6/N7/N8와 ending logic closure |
| Runtime Phase 1 | `4e7f4bc` | v3.1 data/FSM/composition 기반 구현 |
| Runtime QA docs | `bd0623d` | Phase 1 실제 검증 기록 |
| Scenario normalization | `1d950d8` | 테스트/데이터 정합화 |
| Composition polish | `a360573` | N3 center-low, transform full-stage 개선 |

## 5. Voice / Microphone 변경

### 5.1 Phase 0 계약

PC TITLE 계획과 DEC-071에서 마이크를 선택 기능으로 정의했다. voice-capable 상태는 `READY`, `TEST_SUCCESS` 두 개뿐이다. TITLE의 공식 상태는 다음 9개다.

`UNKNOWN` → `REQUESTING_PERMISSION` → `READY` → `TESTING` → `TEST_SUCCESS`, 그리고 실패/환경 상태 `DENIED`, `NO_DEVICE`, `UNSUPPORTED`, `ERROR`.

페이지 진입만으로 permission을 요청하지 않으며, 마이크가 없어도 click-only로 완주할 수 있다. `TEST_SUCCESS`는 자동으로 `READY`로 돌아가지 않는다.

### 5.2 Phase A — 음성 실패 정책

오류를 permission, recording, no-speech, timeout, HTTP, schema, network의 7개 typed failure로 분리했다. 플레이어가 실제로 음성을 시도한 실패만 누적한다.

- 같은 턴 첫 실패: 재시도 제공
- 같은 턴 두 번째 실패: 해당 턴 click fallback
- 전체 실제 음성 실패 다섯 번째: global `inputMode="click"`
- 저장/이어하기: 누적 실패 상태 유지
- 새 게임: 새 세션 의미로 reset
- cancel, 수동 click 전환, 지원 불가 사전 판정, debug 동작은 실제 음성 실패로 계수하지 않음

TITLE mic permission/test failure도 gameplay `sttFailCount`에 섞지 않는다.

### 5.3 Phase B — one-stream PTT live meter

PTT capture 1회마다 `getUserMedia`로 얻은 같은 stream을 다음 두 소비자가 공유한다.

```text
MediaStream
├─ MediaRecorder
└─ AudioContext → AnalyserNode → PTT decorative fill
```

dialogue, incantation, battle spell, battle freeform에 같은 계약을 적용했다. 별도 meter panel이나 두 번째 microphone stream은 없다. quiet/good/loud는 기존 threshold presentation을 재사용하고, analyser/meter 실패는 no-fill로 강등될 뿐 녹음은 계속된다. release/terminal cleanup과 meter cleanup을 분리했다.

실제 Chrome/CORSAIR에서는 네 surface live fill, pointer/T, release 즉시 0%, console warning/error 0을 확인했다. focused Space/Enter, physical loud, 강제 scene replacement, 정확한 `getUserMedia` 횟수 계측은 manual PENDING이다.

### 5.4 TITLE `NO_DEVICE` blocker

Phase D에서 장치 placeholder `<option>`에 explicit empty value가 없어 문구 `마이크 설정 후 장치를 선택할 수 있어요`가 DOM value가 됐다. mic action이 이를 `deviceId: { exact: ... }`로 넘겨 실제 장치가 있어도 constraint failure를 `NO_DEVICE`로 표시할 수 있었다.

수정은 caller 범위에 한정했다.

- placeholder는 `value=""`
- mic action은 DOM placeholder가 아니라 session snapshot의 `selectedDeviceId` 또는 `undefined` 사용
- Settings dropdown change만 실제 selected option의 device ID 사용
- stale exact-device fallback/general retry 정책은 별도 hardening으로 보류

수정 후 CORSAIR `READY → TESTING → TEST_SUCCESS`, QHD Webcam 전환·CORSAIR 복귀, `TEST_SUCCESS → voice N0`, TITLE tester 종료 후 gameplay PTT ownership을 실제 Chrome에서 확인했다.

### 5.5 Voice 변경 전/후

| 항목 | BEFORE | CURRENT | 영향 |
|---|---|---|---|
| 마이크 역할 | TITLE 시작의 사실상 필수 gate | optional; click-only 완주 가능 | 권한/장치가 게임 접근을 막지 않음 |
| 실패 모델 | 실패 횟수와 UI 의미가 충분히 분리되지 않음 | 7 typed failures, same-turn retry/click, total 5 global click | 기술 실패에 예측 가능한 복구 경로 제공 |
| meter | 녹음 여부 중심 | PTT 버튼 내부 live fill | 실제 입력 반응을 즉시 확인 |
| stream | recorder 중심 | recorder/analyser same stream | 중복 권한·동시 stream 방지 |
| TITLE 상태 | calibration 성공 중심 | 9-state FSM | permission/device/test/error 의미 분리 |
| `NO_DEVICE` | placeholder 문구가 exact ID가 될 수 있음 | empty placeholder + session ID | 실제 장치 오판 blocker 제거 |

## 6. PC TITLE UI/UX 변경

TITLE은 “마이크 설정 프로그램”에서 “비주얼노벨의 첫 장면”으로 개편됐다.

- 공식 desktop viewport: 1920×1080, 1600×900, 1366×768
- 세 viewport 모두 `scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`
- 기존 `bg_title.webp` 유지, 전체 dark overlay 대신 왼쪽 local navy gradient
- 왼쪽 MaruBuri 2줄 제목과 Game Start/Continue/Settings, 오른쪽 NHN 건물·배너 노출
- Game Start default는 투명 text menu, hover/focus에서만 soft pink panel
- no-save Continue는 항상 DOM에 있고 `aria-disabled="true"`; Tab 접근과 설명은 유지하되 action 차단
- compact microphone shell과 Settings modal, device select/test, focus trap, Shift+Tab, ESC/X/닫기, focus restore
- TITLE HUD와 Settings는 동일 BGM controller/state 사용; 기본 20%, 저장 volume/mute 우선
- page load autoplay 없음; 첫 meaningful pointer/Enter/Space gesture 이후 `bgm_daily`, 중복 restart 없음
- MaruBuri SemiBold official OTF, Pretendard 1.3.9 Regular/SemiBold official WOFF2를 local 제공; CDN 0, `font-display: swap`

폰트 포함 runtime은 44 files, 14,176,389 bytes(13.52 MiB)로 30 MiB gate를 통과한다. 실제 Chrome `151.0.7922.138`, `127.0.0.1:5174`, CORSAIR/QHD 장치에서 TITLE·Settings·voice start와 no-scroll을 검증했다.

## 7. Main 통합과 공개 배포

승인된 source tip `2a6d9e4`는 local main 기준 `2a5821d`의 직계 후손이었다. main worktree에서 `git merge --ff-only 2a6d9e4...`로 통합해 merge commit 없이 source와 main tree identity를 보존한 뒤, `git push origin main:main` 일반 fast-forward push를 수행했다. force/rebase/squash는 사용하지 않았다.

| 검증 | 결과 |
|---|---|
| GitHub Actions | `Deploy temporary QA Pages`, run SHA `2a6d9e4`, completed/success |
| Pages | `https://2klips.github.io/the-judge-became-a-magical-girl/`, HTTP 200 |
| Deployed bundle | JS/CSS HTTP 200, bundle에 full deployed SHA 확인 |
| Fonts | MaruBuri/Pretendard local request 성공, CSS reference 확인 |
| Production smoke | TITLE, Start, N0, Continue/save, Settings, BGM HUD 확인 |
| Production dependency audit | 0 vulnerabilities |

이후 rights docs와 v3.1 runtime 작업은 local branches에만 있다. 현재 public Pages에는 Scenario v3.1 runtime composition Phase 1 및 최신 polish가 포함되지 않는다.

## 8. Rights / Provenance 현황

SSOT의 상태어는 다음처럼 해석한다.

- `ready`: 파일·기본 규격·기술 통합 근거가 준비됨
- `approved`: 사람 시각/청각 QA와 필요한 권리 확인까지 완료
- `USER ATTESTED`: 사용자가 사실관계를 명시적으로 확인함; 법률 자문 아님
- `INTERNAL PROJECT LINEAGE`: team/project-owned input만 사용했다는 계보
- `ACCEPTED SUBMISSION RISK`: 제출 맥락에서 위험을 인지하고 수용; 공식 허가 아님

| Family | 현재 증거 | 현재 판정 | 남은 일 |
|---|---|---|---|
| Backgrounds | 팀이 Codex/ChatGPT(OpenAI), 유료 Pro 이상 계정으로 직접 생성; 외부 third-party image 미사용 `USER ATTESTED`; internal lineage | rights PASS 후보, runtime `ready` | exact model/work ID는 UNKNOWN; 사람 장면 QA |
| Doyun | OpenAI 직접 생성, 외부 reference 없음, internal project lineage | rights PASS 후보, `ready` | 일부 포즈·연속성 사람 QA |
| Juno | team-owned/OpenAI project asset lineage, 외부 reference 없음 | rights PASS 후보, `ready` | 행동 variation과 사람 합성 QA |
| Gray Wraith | internal/OpenAI project lineage, 외부 reference 없음 | rights PASS 후보, `ready` | presentation·장면 QA |
| Transform cuts/continuity edits | internal source + OpenAI edit lineage, source/runtime hash 기록 | rights PASS 후보, `ready` | 전체 continuity·crop QA |
| BGM 5곡 | Suno Pro at creation/current `USER ATTESTED`, FFmpeg 편집, third-party lyrics/audio 흔적 없음 | rights PASS 후보, `ready` | 3회 loop, masking, ducking, scene 청각 QA 후에만 `approved` |
| Source SFX 5종 | Suno Pro at creation `USER ATTESTED`, repository distribution rights PASS 후보 | source `ready` | runtime 통합은 optional; 청감 QA 미실시 |
| Fonts | NAVER MaruBuri/OFL 1.1, Pretendard/OFL 1.1, license와 hash·runtime file tracked, CDN 0 | 권리/재배포 evidence CLOSED 후보, file status `ready` | 일반 UI 사람 QA 외 권리 blocker 없음 |
| NHN/HACKATHON TITLE | NHN 해커톤 제출 맥락의 baked branding 위험을 사용자가 수용 | `ACCEPTED SUBMISSION RISK` | trademark permission/official authorization confirmed 아님. 범용·개인 상업판은 clean TITLE 또는 별도 허가 필요 |

AR-09는 이전의 “제작 도구·생성 당시 플랜·upstream reference 전체 미확인” 상태에서 크게 해소됐다. 현재 외부 third-party input blocker는 발견되지 않았으며 release 비차단/PASS 후보로 재분류됐다. 다만 exact model/work ID 부족은 provenance quality gap으로 남고, 사용자 확인을 법률 승인으로 표현하지 않는다. 어떤 이미지/BGM도 이 확인만으로 `ready → approved` 승격하지 않았다.

## 9. Scenario v2 → v3 비교

| 대상 | v2 / BEFORE | v3·v3.1 / AFTER | 변경 이유 |
|---|---|---|---|
| Core theme | 새로움·즐거움을 회복하는 메시지가 중심 | “비슷하다고 판단하는 것과, 보기 전에 의미 없다고 단정하는 것은 다르다” | 비판 자체가 아니라 성급한 체념을 문제로 고정 |
| Doyun growth | 냉소에서 긍정으로 이동하는 인상 | 심사 기준은 유지하되 끝까지 확인하고 판단하는 심사역 | 무조건 호평으로 오해되는 결말 방지 |
| Juno growth | 정답과 주문을 알려 주는 안내자 | 도윤의 답을 기다리고 그대로 받아들이는 안내자 | N7/N8 감정적 payoff 강화 |
| Gray Wraith | 기대·실망 또는 부정 평가의 집합체로 읽힐 여지 | 실망하기 싫어 더 기대하지 않으려는 체념 | 비평/심사를 악으로 만들지 않음 |
| N0 | 야근·이상한 제출 게임·음성 사건 시작 | 동일 골격 + 바탕화면 `happy_break` 무언 복선 | N7 reveal을 설명 없이 선행 배치 |
| N2 | 주노 등장과 망령 세계관 설명이 집중 | 도윤을 고른 이유를 “투덜대도 끝까지 직접 플레이하는 행동”으로 설명; exposition 축소 | 초반 냉소 발화와 선택 논리 정합화 |
| N3 | 망령 설명 후 대응 | 평가 문장→안개→실루엣→망령 대사→설명; 사람/방법/도망/동조 분기 | show-before-explain과 체념 테마 강화 |
| N4 | 관계를 재설명하는 긴 노드 | team/cooperate/awkward recover/distance를 변신 직전 짧은 확인 beat로 압축 | 중복 설명 제거, 관계 상태 유지 |
| N5 | 관계별 변신 설명 | 큰 구조 보존, 동일 행동을 관계별 톤으로 수행 | 관계를 다시 설명하지 않고 연기 차이로 표현 |
| N6 | 방어/공격/둘 다가 나란한 선택; 둘 다가 최적처럼 보임 | 첫 행동은 defend OR attack; 성공 후 조건부 second spell opportunity | 두 주문을 획득형 추가 기회로 변경 |
| N7 | 선택지 중심으로 흐를 수 있는 reveal | 작품의 핵심 voice freeform; 관계별 1줄 callback; BELIEVE/POSSIBILITY/CYNIC | 과거 프로젝트와 현재 판단을 플레이어 자기 말로 회수 |
| N8 | 최종 주문 성공/실패 중심 | default/own spell/narrative refusal; 기술 실패는 retry/click fallback | 기술 장애가 서사 grade를 낮추지 않음 |
| GOOD | 사건 후 긍정 평가로 읽힐 여지 | 완성도·차별성 부족은 유지하고, 실제 즐거움을 끝까지 확인한 뒤 판단 | 심사 기준과 성장의 양립 |
| NORMAL | 확신 부족/판단 보류 | POSSIBILITY 또는 CYNIC의 late recovery; “포기한 게 아니라 기다림” | 행동했지만 믿음까지 도달하지 못한 결말 |
| BAD | 실패/냉소의 결과 | fallback까지 제공된 최종 서사적 거절, 체념에 머무름 | 기술 오류·악인화와 분리 |
| HIDDEN | 마법 사건이 심사 결과를 왜곡하는 “만장일치 통과” 개그 | GOOD 기반 사내 변신 영상 viral 개그; 엄격한 5조건 | 본 심사와 보상 개그 분리 |
| Post-credit | GOOD 직후 1,024개 잔향 등 후속 정보가 길게 연결 | GOOD을 완전히 닫은 뒤 canonical stinger; 검은 지팡이·오래된 주문·로그아웃 주문만 유지 | 후속 훅을 간결하게 하고 정체 누출 방지 |

검은 마법소녀의 이름과 정체는 공개하지 않으며, 주노도 확신하지 않는다. GOOD과 HIDDEN은 같은 canonical post-credit를 사용한다.

## 10. Scenario v3.1 Logic Contract

### 10.1 N6 전투

첫 주문은 defend 또는 attack 중 하나다. `FIRST SPELL SUCCESS == true`가 second spell opportunity의 선행조건이다. 성공 후 다음 중 하나면 반대 주문 기회를 연다.

- 관계 `죽이 맞는 콤비`
- 관계 `마지못한 협력`
- 관계 `서먹함 회복`
- 관계 `서먹함 유지`이지만 사람을 지키며 망령에도 맞서겠다는 명시적 dual intent

첫 주문 실패면 관계와 무관하게 두 번째 기회가 없다. 기회가 열려도 사용은 플레이어 선택이며 강제하지 않는다.

### 10.2 N7 판단 분류

- **BELIEVE:** 부족함/비슷함을 인정하면서도 끝까지 확인해 **내가 판단하겠다**는 명시적 commitment와 향후 실망 가능성의 감수를 포함한다.
- **POSSIBILITY:** 아직 확신하지 못하고 망령의 주장도 일부 이해하지만, 지금 포기하지 않고 **한 번 더 볼 의향**이 있다. 끝까지 판단하겠다는 강한 commitment는 없다.
- **CYNIC:** 더 기대하고 싶지 않다는 체념에 남아 있다.

따라서 “비슷할 수도 있어. 그래도 끝까지 보고 내가 판단할래”는 BELIEVE, “비슷할 수도 있어. 그래도 한 번 더 봐볼래”는 POSSIBILITY다.

### 10.3 N8와 엔딩

- N8 행동: 주노 기본 주문, 플레이어 own spell, narrative refusal
- STT no-speech/timeout/network/HTTP/schema/recording failure는 narrative refusal이 아니며 기존 retry/click fallback 적용
- `BELIEVE + final spell success` → GOOD 또는 HIDDEN
- `POSSIBILITY + final spell success` → NORMAL
- `CYNIC + final spell success` → NORMAL late recovery
- fallback까지 제시된 상태의 명시적 final narrative refusal → BAD

HIDDEN의 정확한 다섯 조건은 다음과 같다.

1. perfect transform
2. second spell opportunity 획득
3. defense와 attack을 실제로 모두 사용
4. N7 BELIEVE
5. N8 final spell success

관계 상태 자체는 HIDDEN의 direct gate가 아니다. 서먹함 유지도 dual intent로 기회를 얻고 나머지를 만족하면 HIDDEN에 도달할 수 있다.

## 11. Scenario v3.1 Runtime 구현 상태

문서 baseline은 `e039095`, 현재 실제 runtime은 `a360573` tree다. v3.1 문서가 자동으로 runtime에 반영된 것이 아니라 Phase 1에서 data와 engine을 별도로 변경했다.

### 11.1 현재 data/FSM

- runtime node: **18개**
- 흐름: N0, N1, N2 intro/followup, N3, N4 team/cooperate/awkward, N5, N6 first choice, conditional battle, N7, N8, GOOD/NORMAL/BAD/HIDDEN, post-credit
- 관계 flag: team/cooperate/awkward/recovered/distant
- 행동 flag: first defend/attack, dual intent, second opportunity, defense/attack used
- 판단/결말 flag: N7 believe/possibility/cynic, final spell success
- ending type: good/normal/bad/hidden/post_credit
- GOOD/HIDDEN은 post-credit로 이동; NORMAL/BAD는 terminal

### 11.2 호환성

GameState schema는 v1을 유지한다. 기존 save의 `ch3_gray_answer` current node/history는 `n7_gray_answer` alias로 복구한다. 신규 v3.1 flag가 없는 old save도 기본값으로 load되며, 진행 snapshot을 불필요하게 덮어쓰지 않는다.

### 11.3 반영 완료와 잔여

| 계약 | 현재 runtime |
|---|---|
| N2 action-based selection reason | DATA 반영 및 test 보호 |
| N3 4방향 관계 결정 | DATA/FSM 반영 |
| N4 recovery/distance | dialogue/action과 관계 flag 반영 |
| N6 defend/attack first + conditional second | `storyFlow`와 engine condition 반영 |
| N7 3분류와 관계 callback | data/classification/visual presentation 반영 |
| N8 default/own/refusal | action과 engine ending route 반영 |
| technical failure != refusal | engine tests로 보호 |
| CYNIC success → NORMAL | engine tests로 보호 |
| HIDDEN five conditions | exact flag gate test로 보호 |
| canonical post-credit | GOOD/HIDDEN next route 반영 |
| 세부 대사·연출 polish | AR-01/02와 실제 playthrough에서 추가 검수 필요 |

## 12. Visual / Asset Gap Audit 결과

### 12.1 Doyun

현재 11종(`normal_tired`, `normal_startled`, `normal`, `normal_smile`, `normal_shy`, `normal_empty`, `magical`, `magical_defend`, `magical_attack`, `magical_finish`, `magical_pose`)으로 v3.1 필수 beat를 표현할 수 있다. crop/position/preset으로 해결 가능한 장면은 신규 pose로 올리지 않는다. 필수 신규 Doyun binary는 현재 **0**이며, `magical` 대표 포즈와 장면 연속성은 EDIT/REPLACE 재판정 후보다.

### 12.2 Juno

현재 expression은 `neutral`, `happy`, `shy`, `upset`, `surprised` 5종이다. 얼굴만 바꾸는 방식으로 부족한 행동 실루엣을 최소 3종으로 압축했다.

1. `barrier/protect`
2. `encourage/cast`
3. `point/explain`

`urgent/forward`는 우선 기존 sprite의 위치·scale·CSS transform과 expression 재사용으로 검토한다. expression × action 전체 조합은 만들지 않는다.

### 12.3 Gray Wraith와 배경

Wraith의 `normal`, `weakened` 2종에 fog, floating evaluation text, scale/opacity, hit/purification presentation을 결합하면 first reveal·dialogue looming·battle·weakened까지 처리할 수 있다. 신규 wraith binary는 현재 필수 0이다.

background 16종은 기본 위치·시간대를 대부분 커버한다. 현재 mandatory new background는 0이며 `bg_hall_dark`는 전역 continuity QA 결과에 따라 조건부 EDIT 후보로 남는다.

### 12.4 CUT 7 판정

| 후보 | 판정 | 근거/후속 |
|---|---|---|
| Gray Wraith first reveal | PRESENTATION | existing normal sprite + fog + evaluation text + scale/opacity |
| Juno barrier crack | PRESENTATION + NEW POSE | 신규 full cut보다 Juno protect pose + FX 우선 |
| Transformation first light | KEEP EXISTING | `cut_transform_01.webp`, CUT mode |
| Transformation complete | KEEP EXISTING | `cut_transform_02.webp`, CUT mode |
| N7 happy_break reveal | PRESENTATION | office/archive background + DOM monitor/folder/text overlay |
| Final purification | NEW CUT | 핵심 감정 reward 후보 |
| Black magical girl post-credit | NEW CUT | 현재 binary 없음; 최우선 신규 cut 후보 |

따라서 현재 최소 신규 binary 추정은 **Juno 3 + CUT 2 = 5개**, 조건부 `bg_hall_dark` edit 1개다. 대본의 `[CUT]` 태그 7개가 신규 이미지 7개 확정을 의미하지 않는다.

## 13. Global Scene Composition System

[sceneComposition.ts](../../src/ui/sceneComposition.ts)는 장면별 좌표 난립 대신 named preset과 actor slot을 제공한다.

| Preset | 용도 | 기본 배치 |
|---|---|---|
| `conversation` | 일반 대화 | support와 protagonist를 분리 |
| `confrontation` | N3 대치 | wraith left, Juno center-low, Doyun right |
| `protect` | barrier/보호 | 주요 보호 pose와 대상 실루엣 보존 |
| `battle` | 전투/joint casting | wraith left, Juno center-mid, Doyun right |
| `solo-cut` | baked full-frame cut | live actors 0 |
| `ending` | 엔딩 합성 | 텍스트/배경과 actor의 안전 영역 분리 |

1920×1080 logical viewport를 기준으로 left actor zone(대략 5~38%), center support(40~58%), right protagonist(60~90%)를 사용하되 responsive CSS variables로 세 viewport에 맞춘다. Doyun/Juno/Wraith의 face, hand, wand/staff, major silhouette, wraith core가 의도 없이 겹치지 않는 것이 기본 계약이다.

또한 frame은 다음 둘 중 하나다.

- **CUT MODE:** baked character cut만 표시, 같은 live character sprite 숨김
- **SPRITE MODE:** background + live Doyun/Juno/Wraith

이 exclusivity가 N5의 baked Doyun/Juno와 live sprite 중복을 제거한다.

## 14. 실제 Visual QA 수정 사례

| 장면 | 문제 / BEFORE | 수정 / CURRENT | 검증 |
|---|---|---|---|
| N3 | Wraith가 작고 Doyun/Juno 뒤에 끼임; Juno가 화면 중앙 위에 떠 icon처럼 보임 | Wraith LEFT 대형, Doyun RIGHT, Juno `center-low-support`로 하향 | 세 viewport actor overlap/offscreen 0 |
| N5 transform | baked CUT의 Doyun/Juno와 live sprite가 동시에 렌더 | CUT 01/02 frame에서 live actor 0, 이후 transformed-live에서만 복귀 | duplicate Doyun/Juno 0 |
| Transform reward | 작은 상단 wide frame, 하단 대형 검정 공간 | full-stage/near-full-stage `cover`; 핵심 피사체 보존 | CUT 01/02 distortion·large empty region 점검 PASS |
| Battle | Juno가 Doyun face/chest/staff를 가림; Wraith가 작음 | Wraith left combat, Juno center-mid 축소, Doyun right | face/staff/actor overlap 0 |
| Post-credit | missing black character가 opaque black rectangle처럼 노출 | debug는 `ASSET MISSING · 검은 마법소녀 선택 컷` label, production은 missing binary를 최종 연출로 표시하지 않음 | 신규 cut 전 안전한 missing behavior |

최신 composition visual matrix는 1920×1080, 1600×900, 1366×768에서 N3, CUT01, CUT02, transformed-live, battle을 확인했고 15/15 capture에서 duplicate actor, 의도하지 않은 overlap, face/staff occlusion, offscreen, viewport overflow가 0이었다.

## 15. Tests / QA 진행

| 단계 | Tests | 주요 검증 | 수동/브라우저 증거 |
|---|---:|---|---|
| 인계 baseline | 41 files / 187 tests | 기존 engine, voice, click, asset/runtime | 실행 가능한 public baseline |
| Phase A | 48 files / 289 tests | typed failures, 5-failure, save/reset | Chrome 151, retry/click/fifth-failure |
| Phase B | 51 files / 314 tests | one-stream meter, cleanup, 4 PTT surface | CORSAIR live fill, pointer/T, release |
| TITLE Phase E | 53 files / 362 tests | 9-state, start/resume, Settings, BGM, placeholder fix | CORSAIR/QHD, no-scroll 3 viewports, console 0 |
| Runtime Phase 1 | 58 files / 392 tests | v3.1 data, battle, endings, composition | Phase 1 preview matrix |
| Current polish | **58 files / 394 tests** | N3 center-low, full-stage CUT regression | 3 viewport composition polish |

2026-08-17 현재 worktree에서 다시 실행한 결과는 다음과 같다.

- `npm run check`: PASS
- `npm test -- --run`: 58 files / 394 tests PASS
- `npm run build`: PASS, 155 modules; Transformers.js/wasm 500 kB chunk known warning만 존재
- `npm run build:qa`: PASS, 125 modules
- production audit: 0 vulnerabilities
- full dev audit: 4 findings(2 moderate, 2 high) — transitive `nanoid`, `undici`, `miniflare`와 direct tooling `wrangler`; production browser runtime 영향은 없고 별도 dependency validation 필요

## 16. 현재 Release Gate

| Gate | 상태 | 근거 | 닫기 조건 |
|---|---|---|---|
| AR-01 Human visual/audio scene QA | **OPEN / release blocker** | 메인 메뉴는 PASS, 다른 scene의 awkward transition·continuity·audio presentation 미완료 | 전체 장면 composite, BGM/SFX loop·masking·ducking, voice/click human playthrough 승인 |
| AR-02 Style anchor/scene consistency | **OPEN / release blocker** | 일부 이미지 edit/replacement, 추가 scene, Juno variation 필요 | 신규 최소 5 binary와 전역 continuity/style-anchor 사람 QA |
| AR-09 Rights/provenance | **PASS 후보 / 비차단** | OpenAI internal lineage와 no third-party reference, Suno Pro at creation USER ATTESTED | 법률 승인으로 과장하지 않고 SSOT evidence 유지; `approved`는 사람 QA 후 별도 |
| AR-10 Public cold-load ≤3s | **OPEN / release blocker** | runtime size와 Pages 200은 확인했으나 공식 public cold run 없음 | 실제 Pages, cold cache, 5/5 first-screen ready ≤3000ms + asset/error/FOIT 0 |

Browser manual release risk는 실제 `DENIED`, 실제 `NO_DEVICE`, `UNSUPPORTED`, `ERROR`, OS reduced-motion, focused Space/Enter PTT다. 자동 테스트는 존재하지만 manual PASS로 승격하지 않는다. physical loud, forced scene replacement, exact `getUserMedia` count와 stale exact-device fallback은 optional hardening에 가깝다.

production dependency audit는 0이다. dev audit 2 moderate/2 high는 public browser bundle 취약점은 아니지만 build/Worker tooling hardening 대상으로 유지한다. `npm audit fix --force` 같은 무검증 변경은 하지 않는다.

## 17. AR-10 측정 계약

[QA_AND_DEMO §15.8](../dev/QA_AND_DEMO.md#158-성능배포-전-조건)의 실제 계약은 다음과 같다.

1. 실제 공개 URL, Chrome stable/Windows, 1920×1080·100% zoom, Incognito 또는 동등한 fresh profile을 기록한다.
2. 매 run 전에 site data/cache를 지우고 DevTools cache를 disable한다. localhost, preview server, warm navigation은 근거로 쓰지 않는다.
3. network/CPU 설정과 commit SHA를 고정하고 **cold run 5회** 수행한다.
4. `navigationStart → first-screen ready`를 기록한다. ready는 `bg_title`, 두 줄 TITLE, Start/Continue/Settings, compact mic, BGM HUD가 보이고 Start가 입력 가능한 최초 시점이다.
5. FCP, LCP, DOMContentLoaded, load, transferred bytes, request count, required asset 실패, console error, font blank/FOIT 여부도 함께 기록한다.
6. 5회 모두 first-screen ready `≤ 3,000ms`, required asset 실패 0, console error 0, font blank/FOIT 0일 때만 PASS다.

현재 13.52 MiB runtime, public Pages HTTP 200, local 약 1.3초 관찰은 참고 증거일 뿐 AR-10 closure 증거가 아니다.

## 18. 현재 남은 제작·구현 작업

### 18.1 최소 신규/조건부 asset

1. Juno `barrier/protect`
2. Juno `encourage/cast`
3. Juno `point/explain`
4. Final purification CUT
5. Black magical girl CUT
6. 조건부 `bg_hall_dark` continuity edit

### 18.2 Presentation-only 중심 작업

- N0: `happy_break` desktop folder/icon foreshadow
- N3: fog, floating evaluations, Wraith reveal timing
- N5: transform CUT02 → live transition, relation-tone polish
- N6: first/second spell opportunity 피드백, barrier/attack FX
- N7: archive/monitor overlays, current developer/past Doyun text, desaturation, staff-lowering, voice prompt
- N8: gray core, default/own spell, purification, late recovery/refusal 구분
- GOOD/NORMAL/BAD/HIDDEN: review/messenger/gray-circle overlays와 감정 pacing
- Post-credit: 실제 black magical girl cut handoff 후 canonical stinger

source SFX 5종 runtime 연결은 현재 필수 release blocker가 아니라 optional enhancement다. 연결한다면 기존 oscillator와 cue 중복, BGM masking, 장면당 1회 재생을 별도 QA해야 한다.

## 19. 권장 마무리 순서

1. **Composition Final Closure:** CUT02 → transformed-live hard cut을 짧은 magical flash + live fade-in으로 완화하되 현재 preset/no-overlap baseline 유지
2. Juno `barrier/protect` 제작·합성 QA
3. Juno `encourage/cast` 제작·합성 QA
4. Juno `point/explain` 제작·합성 QA
5. Final purification CUT 제작·N8 연출 통합
6. Black magical girl CUT 제작·post-credit 통합
7. 실제 장면을 기준으로 `bg_hall_dark` edit 필요 여부 재판정
8. N0/N3/N5/N6/N7/N8/ending presentation timing·FX polish
9. click/voice 전체 playthrough와 save/resume/fallback 회귀
10. 실제 voice/click playtime 측정(현재 5~9분은 추정)
11. AR-01 visual/audio 및 AR-02 style-anchor 사람 QA
12. asset hash/provenance/status freeze; 사람 QA와 권리 조건을 만족한 항목만 `approved`
13. AR-10 public Pages cold-load 5회 측정
14. dev dependency hardening을 별도 branch에서 검증
15. manifest, scene mapping, QA, release gate 최종 SSOT sync
16. 승인된 tip을 main에 ff-only 통합·일반 push·Pages deploy
17. 실제 공개 URL submission smoke

이 순서는 layout baseline을 먼저 고정해야 신규 pose/cut의 crop과 합성을 다시 만들지 않을 수 있다는 점, AR-10은 최종 asset/bundle freeze 뒤 측정해야 재측정을 피할 수 있다는 점 때문에 적절하다.

## 20. 인계 전 / 현재 종합 비교

| AREA | HANDOFF / BEFORE (`2a5821d`) | CURRENT (`a360573` local) | IMPACT |
|---|---|---|---|
| Voice | PTT/Worker/click fallback 존재 | 7 typed failures, same-turn retry/click, fifth global click | 실패가 완주를 막지 않고 의미가 일관됨 |
| PTT | 녹음 상태 중심 | same-stream live fill, 4 surfaces, fail-soft | 실제 mic 반응 가시화 |
| Mic | TITLE calibration 사실상 필수 | optional 9-state FSM, click-only 가능 | 장치/권한이 진입 장벽이 아님 |
| TITLE | 중앙 대형 diagnostic panel | PC visual-novel title, compact mic/BGM, Settings | 첫 장면의 제품 인상과 접근성 개선 |
| BGM | controller와 저장값 존재 | TITLE 20%, Settings sync, first gesture, no restart | autoplay/중복 상태 제거 |
| Fonts | system/fallback 중심 | local MaruBuri/Pretendard + licenses | 의도한 한글 typography, CDN 0 |
| Rights | 여러 family의 tool/plan/reference 미확인 | OpenAI/Suno USER ATTESTED, internal lineage, NHN risk 분리 | AR-09 대부분 비차단으로 재분류 |
| Story | v2 즐거움/새로움 중심 | v3.1 성급한 체념 vs 끝까지 판단 | 심사역 직업과 성장 주제 정합화 |
| Wraith | 부정 평가의 집합체로 읽힐 여지 | 기대를 접어 실망을 피하는 체념 | 악당 의미가 작품 주제와 결합 |
| Doyun | 냉소 → 긍정 인상 | 기준을 버리지 않고 확인 후 판단 | 무조건 호평 결말 방지 |
| Juno | 정답 제공자 | 기다리고 받아들이는 안내자 | N7/N8 관계 payoff 강화 |
| Battle | 방어/공격/둘 다 선택 | first defend/attack + conditional optional second | “둘 다” 자동 정답 제거 |
| N7 | 단일 회색 답/선택 중심 | relation callback + BELIEVE/POSSIBILITY/CYNIC voice | 핵심 판단을 플레이어 말로 수행 |
| N8 | 주문 성공/실패 중심 | default/own/refusal, tech failure 분리 | 시스템 오류로 BAD 방지 |
| BAD | 실패·냉소 route | 명시적 narrative refusal만 | 서사 책임과 기술 안정성 분리 |
| HIDDEN | runtime 없음/심사 왜곡 개그 | exact 5 conditions + viral video | 보상은 유지하고 심사 판단 보존 |
| Post-credit | GOOD 뒤 결합된 긴 hook | GOOD/HIDDEN canonical independent node | 본편 감정 종료와 sequel hook 분리 |
| Composition | scene별 배치, overlap 가능 | 6 presets, safe zones, no-overlap | face/staff/actor 판독성 확보 |
| Transform | baked CUT + live actor 중복 가능 | full-stage CUT mode exclusive | duplicate actor 0, reward 강화 |
| Tests | 41 files / 187 tests | 58 files / 394 tests | voice/title/v3.1/composition 회귀 보호 확대 |
| Public deployment | baseline public state | Pages는 TITLE baseline `2a6d9e4` 성공 | 공개 전달 경로 검증 |
| Latest local development | 없음 | rights docs + v3/v3.1 + runtime composition `a360573` | 아직 public에 없는 다음 release candidate 작업 |

## 21. Git SHA Appendix

| SHA | 목적 | 대표 branch/ref | main 포함 | remote/Pages |
|---:|---|---|---|---|
| `2a5821d` | 초기 public baseline | historical `main` | 예 | 이전 배포 기준 |
| `651781c` | Phase A actual-device QA tip | `codex/voice-five-failure-policy` | `2a6`의 ancestor | `2a6`에 포함 |
| `2addc0e` | Phase B PTT meter approved tip | `codex/ptt-live-meter` | `2a6`의 ancestor | `2a6`에 포함 |
| `2a6d9e4` | TITLE Phase C/D/E + SSOT approved tip | `main`, `origin/main`, `codex/pc-title-ui-ux` | 예 | **현재 deployed SHA** |
| `8279a8d` | rights attestation docs | local `main` | local main만 | 미배포 |
| `e21a1b9` | release gate/docs alignment | local `main` | local main HEAD | 미배포 |
| `87f3f43` | Scenario v3 rewrite | scenario branch history | local latest의 ancestor | 미배포 |
| `e039095` | Scenario v3.1 logic closure | `codex/scenario-v3-rewrite` | local latest의 ancestor | 미배포 |
| `4e7f4bc` | v3.1 runtime/composition Phase 1 feature | runtime composition branch | 아니오 | 미배포 |
| `1d950d8` | Phase 1 normalization/approved planning tip | runtime composition branch | 아니오 | 미배포 |
| `a360573` | latest composition polish | `codex/scenario-v31-runtime-composition-p1` | 아니오 | 미배포 |

현재 SHA chain은 `2a5821d → 651781c → 2addc0e → 2a6d9e4 → 8279a8d → e21a1b9 → 87f3f43 → e039095 → … → 1d950d8 → a360573` 순으로 ancestry가 확인됐다. `main` worktree의 별도 v2 대본 수정은 사용자 소유 dirty change로 보고서 작업에서 건드리지 않았다.

## 22. Appendix — 현재 Pending Codex 작업

**Task name:** `Scenario v3.1 Composition Final Closure`

**현재 목적:** Transform CUT02에서 transformed-live로 전환되는 hard cut을 `short magical flash + live fade-in`으로 완화한다. 현재 N3/N5/battle composition baseline, no-overlap, CUT/SPRITE exclusivity는 보존한다.

저장소 전체에서 task name과 `CUT02`, `magical flash`, `live fade-in`을 검색했으나 정확한 전체 작업 prompt는 tracked repository evidence에서 발견되지 않았다. 따라서 전체 prompt는 추측해 재작성하지 않으며 **“full prompt unavailable in repository evidence”**로 보존한다.

## 23. 결론

프로젝트는 인계 당시의 실행 가능한 v2 음성 프로토타입에서, optional microphone과 안정적인 실패 복구, 실제 PTT meter, 접근 가능한 PC TITLE, 권리·출처 SSOT, v3.1 분기 runtime, actor-safe composition을 갖춘 로컬 release-candidate 단계로 발전했다. 다만 공개 Pages는 TITLE baseline `2a6d9e4`에 머물러 있고 최신 v3.1 구현은 `a360573` 로컬 브랜치에만 있으며, 신규 Juno 3포즈·2컷, AR-01/02 사람 QA, AR-10 cold-load 실측을 닫기 전에는 public submission ready로 판정하지 않는다.
