# M5 연출 폴리시 지시서 — BGM·SFX·대화 애니메이션·전투 무대 개편

- 발행일: 2026-08-06
- 발행 근거: 사용자 지시(해커톤 제출 전 연출 품질 개선). 이 문서의 방향 결정은 사용자 2026-08-06 결정으로 취급한다.
- 대상: 후속 AI 에이전트. 이 문서만으로 방향을 잃지 않고 작업할 수 있도록 현재 상태 진단과 작업 계약을 모두 담았다.

---

## 0. 작업 모드와 대원칙

이 작업은 **M5 연출 폴리시**다. 게임 로직·시나리오 구조·판정 규칙은 완성되어 있고 동작한다. 바꾸는 것은 **보이는 것과 들리는 것**뿐이다.

사용자가 지적한 5가지 문제를 해결한다:

1. 전투 장면이 매우 어색하다. (→ WP4)
2. UI가 일반적인 미연시(비주얼 노벨) 느낌이 나지 않는다. (→ WP3-A)
3. 장면 전환·대화 진행이 어색하다. (→ WP3-B/C)
4. AI가 만든 티가 나는 어색한 부분이 있다. (→ WP3-D + 전반)
5. 장면별 캐릭터 이미지(표정·포즈)가 대화 내용과 맞지 않는 곳이 있다. (→ WP6, 작업 필요 이미지는 `docs/assets/IMAGE_REWORK_REQUEST.md`에 기록)

대원칙:

- **로직과 연출을 분리한다.** `GameEngine`, `BattleState`, 판정(judge)·분기(branch) 코드는 수정 금지. 연출은 `src/ui/`, `src/audio/`, `src/assets/presentation*.ts`, CSS에서만 한다.
- **작가 소유 JSON을 함부로 바꾸지 않는다.** 예외는 §WP1-2의 `scene.bgm` 값 정렬 하나뿐이며 DEC 기록을 남긴다.
- **스키마를 확장하지 않는다.** 노드/라인별 연출 지정은 기존 승인 패턴(DEC-036)대로 presentation 계층의 고정 매핑 모듈로 구현한다. `src/data/schema.ts`의 zod 스키마는 전부 `.strict()`라서 JSON에 임의 필드를 넣으면 게임이 부팅되지 않는다.
- **실패해도 완주된다.** 모든 새 연출은 에셋 누락·오디오 차단·reduced-motion 환경에서 조용히 강등되고, 클릭·오프라인 완주를 절대 막지 않는다(DEC-040).
- 각 WP는 독립 커밋 단위로 완료하고, 매 커밋마다 `npm run check`, `npm test`, `npm run build`를 통과시킨다.

---

## 1. 먼저 읽을 문서 (순서대로)

1. `AGENTS.md` — 영구 행동 규칙. 특히 §2 불변 계약, §5 보안·데이터.
2. `docs/dev/PROJECT_MAP.md` — 문서 우선순위와 충돌 처리.
3. `docs/assets/SCENE_ASSET_MAPPING.md` — **장면→배경·인물·표정·음악 계약의 단일 진실 공급원.** §4 장면별 런타임 매핑, §5 런타임 매핑 규칙, §6 현재 구현 상태.
4. `docs/assets/M5_UI_BGM_REQUEST_MAPPING.md` — BGM 재생 계약(§6 장면별 재생, §7 청감 인수 기준)과 SFX 계약(§3: Web Audio 코드 생성, 파일 SFX 금지).
5. `docs/dev/DECISIONS.md` — DEC-036(배경 고정 매핑), DEC-045(420ms crossfade), DEC-047/049(도윤 배치), DEC-053/054/055/056(미연시 UI·화자 색·PTT·1.5초 잠금). 새 결정은 **DEC-059부터** 번호를 잇는다.
6. `docs/심사역은_마법소녀가_되었다_완성대본_v2.md` — §3 공통 연출 원칙, N6~N8(전투 연출 서사).
7. 이 지시서 §2의 현재 상태 진단. **§2는 2026-08-06 실코드 조사 결과이므로 재조사 없이 신뢰하되, 줄 번호는 이후 커밋으로 밀렸을 수 있으니 수정 전 해당 파일만 확인한다.**

---

## 2. 현재 구현 상태 진단 (2026-08-06 실측)

### 2.1 최상위 구조 문제 — 전 영역에 영향

`GameView.commit()`(`src/ui/gameView.ts:1367-1374`)이 매 턴 `<main class="game-shell">` 전체를 새로 만들어 `replaceChildren()`으로 교체한다. 지속되는 DOM 노드가 없으므로:

- 스프라이트가 표정이 안 바뀌어도 **매 턴 360ms 페이드인을 다시 재생**한다(깜빡임). CSS `.asset-image { animation: asset-fade-in ... }`(`styles.css:181`).
- 게이지·대사창·캐릭터에 상태 간 트랜지션이 원천적으로 불가능하다.
- 배경만 예외로 `currentBackgroundId` 추적으로 420ms crossfade가 동작한다(유일하게 제대로 된 전환 연출). 단, 떠나는 배경 `<img>`가 애니메이션 후에도 DOM에 남는 버그가 있다.

### 2.2 오디오

- **BGM은 현재 100% 무음이다.** `assets/runtime/bgm/` 디렉터리 자체가 없다. 납품 원본 5곡은 `assets/source/bgm/delivery/`에 전부 있다(`bgm_daily/battle/transform/crisis/ending.mp3`, 각 3MB 이하). **런타임 위치로 복사만 하면 즉시 동작한다.**
- `BgmController`(`src/audio/bgm.ts`)는 이미 crossfade(600ms 선형, `setInterval` 12스텝)·duck(`setDucked`, 0.18배)·동일 ID 조기 return(페이즈 전환 시 재시작 방지 충족)을 갖추고 있다. 결함: 404 시 화면 전환마다 새 `Audio()`를 만들어 무한 재요청(이미지의 `isAssetPathUnavailable` 같은 가드 없음), `stop()` 미사용, 페이드가 이퀄파워가 아닌 선형.
- BGM 재생 훅은 두 곳뿐: `src/main.ts:478`(`renderCurrent` 진입 시 `node.scene.bgm` 재생), `src/main.ts:188`(변신 성공 시 `bgm_transform` one-shot).
- `scenario.json`은 `bgm_daily/battle/transform` 3종만 참조한다. **납품 완료된 `bgm_crisis`·`bgm_ending`을 어느 노드도 쓰지 않는다** — `SCENE_ASSET_MAPPING.md` §3.4·§4와 불일치.
- **SFX는 오디오 파일이 아니라 Web Audio 오실레이터 비프 5종**(`src/audio/sfx.ts`: confirm/cast/critical/impact/recognition_fail)이며, 이는 **확정 계약이다**(파일 SFX 교체 금지 — `SCENE_ASSET_MAPPING.md` §7, `M5_UI_BGM_REQUEST_MAPPING.md` §3). 트리거는 `src/main.ts`의 7곳(변신 성공, 전투 델타, 음량 실패, 주문 성공, STT 실패, 클릭 선택).

### 2.3 이미지 에셋

- 배경 16장(`assets/runtime/bg/`)·도윤 11장·주노 5장(`assets/runtime/char/`)은 통합 완료.
- **회색 망령은 현재 검은 사각형이다.** `char_gray_wraith_normal.png`는 `docs/gray-wraith-action-v2/delivery/char/`에 납품되어 있으나 런타임 미통합. `char_gray_wraith_weakened.png`는 **어디에도 없다**(delivery에는 대신 `attack`/`hit`/`death` 액션 스프라이트가 있음 — 코드는 이 3종의 존재를 모른다).
- 변신 컷 2장(`cut_transform_01/02.webp`)과 `assets/runtime/cut/` 디렉터리도 없음 → 변신 연출도 검은 플레이스홀더.

### 2.4 대화·장면 연출

- 타이프라이터 없음. 문장 전체가 240ms 페이드인(`dialogue-reveal`).
- 대화창이 화자에 따라 좌(주노·망령)/우(도윤)/중앙(내레이션)으로 **이동**한다(DEC-053). 이름표는 박스 상단 절대배치. 진행은 "계속" 버튼 클릭만 가능하고 1.5초 잠금(`DelayedActionGate`, DEC-056)이 걸린다. next 인디케이터(▼) 없음.
- 이펙트 재고: `flash`/`shake`/`transform` 3종(`src/ui/effects.ts` — 클래스를 붙이기만 하고 제거하지 않음), 파티클 1모듈(`src/ui/particles.ts` — **변신 결과 화면 1곳에서만 사용**). `shake`는 사실상 죽은 코드(발동 조건이 거의 성립 안 함). 앰비언트·그리드 오버레이는 `display:none`으로 무력화됨.
- `src/styles.css`(2391줄)는 3개 레이어가 덧씌워져 같은 셀렉터가 최대 3번 정의된다. **최종 승자는 L1924 이후의 `/* M5 visual-novel UI pass — DEC-053 */` 블록이다. 수정은 반드시 이 마지막 블록에서 한다.**

### 2.5 전투 (가장 어색한 영역 — 원인 진단)

1. **두 개의 서로 다른 화면을 왕복한다.** 대기 화면 `renderBattle()`(`gameView.ts:797-911`)은 반투명 패널 안에 세 캐릭터를 210~270px 썸네일 그리드로 배치하고, 행동하면 `renderBattleReply()`(`gameView.ts:913-965`)라는 **완전히 다른 float 카드 레이아웃**으로 전체 화면이 교체된다. 같은 무대에서 사건이 일어나는 느낌이 없다.
2. 적 스프라이트가 검은 사각형이다(§2.3).
3. 도윤 포즈가 `phaseId`에만 종속된다(`presentationDoyun.ts:20-24`). 주문을 외쳐도, 맞아도 그림이 그대로다.
4. 게이지가 애니메이션되지 않는다. `createGauge()`(`ui/gauge.ts:26`)가 매번 새 DOM에 최종값을 대입해 `transition: width 260ms`(`styles.css:1258`)가 절대 발동하지 않는다.
5. 적 피격 연출 전무. momentum 65 통과 시 `enemy-weakened` 클래스가 즉시 스냅(transition 없음).
6. 파티클·빔·충격파 등 시전 연출이 전투에 없다.
7. "적 턴"은 없다 — 적 반격은 `main.ts:340, 411, 418, 421`의 하드코딩 문자열 대사다(이 구조는 유지한다. 연출로 감싸는 것이 이번 작업이다).
8. 매 행동 후 1.5초 버튼 잠금이 전투 템포를 끊는다.
9. `MOMENTUM`, `페이즈 주문`, `주문 시전 · 성공 +15` 같은 콘솔풍·수치 노출 라벨이 몰입을 깬다(AI스러움의 주요 원인).
10. `.battle-screen { overflow-y: auto; }`로 요소가 많으면 무대가 세로 스크롤된다.

### 2.6 연출 훅 위치

오디오·이펙트 훅은 전부 `src/main.ts`의 `renderCurrent`(L470-643)와 그 하위 콜백에 있다. 노드/라인 단위 연출 데이터 훅은 스키마에 없고, 배경(`presentationBackground.ts`)·도윤 포즈(`presentationDoyun.ts`)처럼 **presentation 고정 매핑 모듈**이 승인된 패턴이다.

---

## 3. 불변 계약 — 절대 위반 금지

1. TypeScript + Vite + **Vanilla DOM/CSS**. UI 프레임워크·애니메이션 라이브러리·전역 이벤트 버스 추가 금지.
2. `GameEngine`·`BattleState`·FSM·judge·branch 로직, momentum 수치·등급 기준·페이즈 구조(3페이즈, 패배 없음) 변경 금지.
3. 시나리오 zod 스키마(`src/data/schema.ts`) 필드 추가 금지. 연출은 presentation 고정 매핑으로.
4. **SFX는 Web Audio 코드 생성 유지. 오디오 파일 SFX로 교체 금지**(확정 계약). BGM만 파일이다.
5. BGM 재생 계약(`M5_UI_BGM_REQUEST_MAPPING.md` §6): 타이틀 무음·사용자 입력 전 autoplay 금지 / PTT 청취 중 duck / 장면 진입 crossfade / `bgm_transform`은 one-shot·반복 금지 / battle p1→p2→p3에서 재시작 금지 / 로드 실패 시 무음 진행·console exception 없음.
6. 배경 전환: 같은 논리 ID면 무전환, 다른 ID만 420ms crossfade, `prefers-reduced-motion: reduce`면 즉시 전환(DEC-045). 모든 신규 애니메이션도 reduced-motion에서 비활성화한다.
7. 도윤 우측·확대·상반신 crop, 주노는 도윤 곁 소형 보조(DEC-047/049). 원본 PNG 물리 crop 금지.
8. 화자 색 계약(DEC-053/054): 주노 yellow, 도윤 rose, 망령 violet, 익명 voice amber. 내레이션은 이름표 없이 괄호.
9. PTT 동작(포인터·Space/Enter·전역 T 홀드/릴리스), 클릭·로컬·오프라인 완주 폴백, 타이틀 마이크 게이트 유지.
10. 에셋 통합은 DEC-034 절차: 원본 보존 → 규격 검사 → 계약명으로 `assets/runtime/`에 복사 → `ASSET_MANIFEST.md` 상태 갱신(라이선스 확인 전 `approved` 금지) → 출처는 `PROVENANCE.md`, 제작 증빙은 `AI_PRODUCTION_LOG.md`. 증빙이 없으면 추측하지 말고 `미확인`으로 기록.
11. 실제 API 키·토큰을 코드·문서·로그에 기록하지 않는다.

---

## 4. 작업 패키지

권장 실행 순서: **WP1 → WP6 → WP4 → WP3 → WP2 → WP5**(WP5의 개별 버그는 관련 WP에 편입해 처리해도 된다). WP1이 가장 싸고 체감이 가장 크다. WP6 점검을 WP4·WP3보다 먼저 하는 이유: 점검 결과(표정 오매핑·이미지 부족)가 WP3/WP4의 연출 구현에 입력이 되기 때문이다. WP4가 사용자 최우선 지적 사항이다.

---

### WP1. BGM·누락 에셋 런타임 통합 [P0]

**목표: 무음·검은 화면 상태를 끝낸다. 코드보다 에셋 배치가 먼저다.**

#### WP1-1. BGM 5곡 통합

1. `assets/runtime/bgm/`을 만들고 `assets/source/bgm/delivery/`의 5개 mp3를 **동일 바이트로** 복사한다(파일명이 이미 계약명이다). Vite 플러그인(`vite.config.ts:16-66`)이 `assets/runtime/`을 `/{base}assets/`로 서빙하므로 `catalog.ts`의 `assets/bgm/*.mp3` 경로와 즉시 연결된다.
2. 각 곡을 3회 이상 루프 청취해 경계 클릭·무음·박자 점프를 확인한다(`bgm_transform`은 one-shot이므로 제외).
3. `ASSET_MANIFEST.md`에서 5곡을 `missing → ready`로 갱신. 납품 증빙(생성 도구·프롬프트·라이선스)은 `assets/source/bgm/` 주변과 `docs/assets/` 인계 문서에서 찾아 `AI_PRODUCTION_LOG.md`·`PROVENANCE.md`에 연결하고, 없으면 `미확인`으로 남긴다. `approved` 승격은 하지 않는다(사람 라이선스 확인 게이트).

#### WP1-2. `scene.bgm` 데이터 정렬 (유일하게 허용된 시나리오 JSON 수정)

`SCENE_ASSET_MAPPING.md` §4의 음악 열과 현재 `public/scenario/scenario.json`을 일치시킨다:

| 노드 | 현재 | 변경 후 | 근거 |
|---|---|---|---|
| `n3_wraith_choice` | `bgm_battle` | `bgm_crisis` | §4.1: N3~N5는 crisis 선호(폴백 battle) — 실파일이 도착했으므로 선호안 적용 |
| `n5_transform` | `bgm_battle` | `bgm_crisis` | §4.2: N5 도입은 crisis 유지. (새로고침 복구 시 무음 방지를 위해 명시 지정) |
| `ch3_gray_answer` | `bgm_daily` | `bgm_ending` | §4.3: 수렴은 ending 선호(폴백 daily) |
| `ending_good/normal/bad` | `bgm_daily` | `bgm_ending` | §4.3 |

`n4_*` 노드는 `bgm` 필드가 없어 crisis가 이어지므로 그대로 둔다. `battle_wraith`는 `bgm_battle` 유지. 로더가 논리 ID를 검증하므로 오타 시 부팅이 거부된다 — 변경 후 반드시 부팅 확인. **이 변경을 DEC-059로 기록한다**(crisis/ending 실파일 도착에 따른 선호안 적용, 폴백 계약은 유지).

#### WP1-3. `BgmController` 견고화 (`src/audio/bgm.ts`)

1. **404 무한 재요청 가드**: 로드 실패(`error` 이벤트)한 논리 ID를 세션 내 기억하고 재시도하지 않는다(이미지의 `isAssetPathUnavailable`/`reportAssetLoadFailure` 패턴 참조). 실패 시 무음 유지, exception 없음.
2. **autoplay 정책**: `NotAllowedError` 시 1회성 `pointerdown` 리스너로 다음 사용자 제스처에서 현재 곡을 재시도한다. 타이틀은 원래 무음이므로 게임 진입(버튼 클릭) 후에는 사실상 항상 재생 가능하다.
3. **기본 음량**: 대사·STT 명료성이 계약이다. 기본 볼륨을 1.0에서 0.55~0.7 사이 상수로 낮추고(듣고 정하되 상수에 근거 주석), duck 배율은 유지한다. 실제 스피커·헤드폰으로 청감한다.
4. (선택) 선형 페이드를 이퀄파워(cos/sin) 커브로 교체. 청감상 개선이 없으면 유지.
5. `bgm_transform` one-shot이 결과 화면 재렌더에서 중복 재생되지 않는지 확인한다(현재 `play()`의 동일 ID 조기 return이 loop=false 종료 후에도 유효한지 검증. 필요하면 one-shot 재생 이력 가드 추가).

#### WP1-4. 회색 망령 통합

1. `docs/gray-wraith-action-v2/delivery/char/char_gray_wraith_normal.png`를 규격 검사(1200×2000 투명 PNG ≤800KB — `SCENE_ASSET_MAPPING.md` §8) 후 `assets/runtime/char/`에 복사. manifest `ready` 갱신, 증빙 연결(delivery 폴더의 문서 확인).
2. `char_gray_wraith_weakened.png`는 **존재하지 않는다.** 다음 순서로 처리한다:
   - 기본: `gray_wraith.weakened` resolver를 normal 파일 + CSS 파생(예: `filter: saturate(0.6) brightness(1.25) + 갈라진 빛 오버레이`)으로 강등하는 fallback을 구현한다(DEC-019의 `physical → derived → placeholder` 사다리 패턴). DEC-060으로 기록한다. 제작 요청은 `docs/assets/IMAGE_REWORK_REQUEST.md` §1에 이미 등재되어 있다.
   - delivery의 `attack`/`hit`/`death`를 weakened 대용으로 **쓰지 않는다**(장면 계약 불일치: weakened는 "안개가 갈라지고 내부 게임 캐릭터 빛이 비침"이다).
3. (제안 — §6-2 참조) `gray_wraith.attack`/`gray_wraith.hit`를 **전투 액션 피드백 전용** presentation 논리 ID로 신규 등록하면 WP4의 타격 연출 품질이 크게 오른다. 채택 시 DEC 기록 + `SCENE_ASSET_MAPPING.md`·`ASSET_MANIFEST.md` 동시 갱신이 필수다.

#### WP1-5. 변신 컷 2장

`cut_transform_01/02.webp`는 미납품이다. 이번 작업 범위에서 **만들지 않는다**(외부 제작자 소유 — DEC-030). 기존 CSS 폴백(배경+도윤+플래시/파티클)이 동작하는지만 확인한다. 제작 요청은 `docs/assets/IMAGE_REWORK_REQUEST.md` §1에 등재되어 있다.

#### WP1 완료 기준

- 게임 진입 후 N0에서 `bgm_daily`가 들리고, N3 진입 시 crisis로 crossfade, 변신 성공 시 징글 1회, battle 3페이즈 내내 `bgm_battle`이 끊기지 않고, 수렴~엔딩에서 ending곡이 나온다.
- PTT를 누르면 BGM이 즉시 낮아지고 놓으면 복귀한다.
- 망령이 검은 사각형이 아니라 실루엣으로 보인다.
- BGM 파일을 지운 상태에서도 무음으로 완주되고 console exception이 없다.
- `M5_UI_BGM_REQUEST_MAPPING.md` §7 청감 인수 기준 7항목 전부 통과.

---

### WP2. SFX 확충 [P2 — WP4 이후]

**목표: 비프음의 품질을 올리고, 비어 있는 이벤트에 소리를 채운다. 파일 SFX 금지 계약은 유지한다.**

#### WP2-1. 기존 5종 사운드 디자인 개선 (`src/audio/sfx.ts`)

- 단일 오실레이터 → 큐별 2~3 레이어(예: `impact`는 square + 노이즈 버스트 + 로우패스, `critical`은 상승 아르페지오 3음, `recognition_fail`은 하강 2음 부드럽게). 전체 길이는 0.15~0.4s 유지, 마스터 게인 상수 분리.
- 볼륨 하드코딩(0.12)을 큐별 상수 테이블로. 실제 스피커로 피로도 청감(계약 §3).

#### WP2-2. 신규 큐 추가 (과하지 않게 — 총 4종 이내)

| 신규 큐 | 트리거 위치 | 성격 |
|---|---|---|
| `advance` | 컷씬/대사 "계속" 진행 클릭 (`renderCutscene`, 대사 진행 버튼) | 짧고 아주 작은 페이지 넘김 톤. 매 클릭이라 절대 크지 않게 |
| `guard` | 전투 버티기 (`main.ts` `applyAction`의 guard 분기) | 낮고 둥근 방어 톤 (confirm 재사용 금지) |
| `wraith_shift` | momentum 65 최초 통과로 `enemy-weakened` 전이 시 1회 | 안개 갈라지는 상승 셔이머 |
| `ending` | 엔딩 노드 진입 시 1회 | 부드러운 확정 톤 |

- **PTT 청취 중(press~release 사이)에는 어떤 SFX도 재생하지 않는다**(마이크 오염 방지).
- 같은 큐 연타 시 40ms 이내 중복 재생을 막는 스로틀을 넣는다.
- 트리거는 전부 `src/main.ts`의 기존 훅 지점과 WP4의 연출 시퀀스에 배선한다. 새 이벤트 버스를 만들지 않는다.

#### WP2 완료 기준

- 진행·선택·주문·타격·실패·전이·엔딩이 소리로 구분된다.
- 헤드폰과 노트북 스피커에서 대사(BGM 위 발화)보다 SFX가 크지 않다.
- reduced-motion과 무관하게 SFX는 동작하되, `AudioContext` 생성 실패 시 조용히 무음.

---

### WP3. 대화·장면 연출 — 미연시 표준 문법 [P1]

**목표: "일반적인 미연시처럼" 보이게 한다. 하단 고정 대화창 + 타이프라이터 + 스프라이트 연속성 + 자연스러운 전환.**

#### WP3-A. 대화창을 미연시 표준으로 (DEC-053 일부 supersede — DEC-061로 기록)

현재 대화창은 화자마다 좌/우/중앙으로 **이동**한다. 이를 폐지하고:

1. **대화창은 항상 하단 중앙 고정.** 폭 `min(920px, 92vw)`, 화면 하단에서 일정 거리, 배경 위 반투명(기존 `--vn-*` 변수 재사용). 말꼬리(`::after`) 제거.
2. **이름표는 박스 좌상단에 붙는 탭** 형태. 화자 색 계약(주노 yellow·도윤 rose·망령 violet·voice amber)은 이름표 탭 배경/테두리 액센트로 유지한다. 내레이션은 이름표 없음 + 괄호 유지(DEC-054).
3. **next 인디케이터**: 진행 가능 상태(`data-advance-state="ready"`)가 되면 대화창 우하단에 ▼가 부드럽게 깜빡인다. 1.5초 잠금 자체는 유지(DEC-056 — 변경은 §6-1 사용자 결정).
4. 화자 방향성은 대화창 위치가 아니라 **스프라이트 강조**로 표현한다(WP3-B의 화자 하이라이트).
5. 선택지(`choice-list`)는 대화창 위쪽 중앙에 세로 스택. 기존 스타일 다듬기 수준으로.

수정 위치: `gameView.ts`의 `dialoguePanel()`/`resolveDialoguePresentation()`(L66-79), `styles.css` **L1924 이후 마지막 블록**. side 이동 관련 CSS(`.dialogue-side-*`)는 정리한다.

#### WP3-B. 타이프라이터 + 스프라이트 연속성

1. **타이프라이터**: `dialogue-text` 주입 지점(`gameView.ts:1341`)에 글자 단위 표시를 구현한다. 속도 24ms/char 내외, 문장부호 뒤 짧은 추가 지연. **대화창 영역 클릭(또는 Space/Enter) 1회 = 즉시 전체 표시**, 표시 완료 후에만 진행 버튼 게이트가 의미를 갖는다. `prefers-reduced-motion`이면 즉시 전체 표시. `aria-live`는 완성 텍스트 기준으로 유지(글자 단위로 스크린리더가 읽지 않게 `aria-live`는 완료 시점에 채운다).
2. **스프라이트 재페이드 제거**: `commit()` 전면 교체 구조에서 최소 침습으로 해결한다 — 직전 렌더의 슬롯별 논리 ID(`도윤/NPC/망령` × 논리 ID)를 GameView 필드로 기억하고, 같은 슬롯·같은 ID면 entrance 애니메이션 클래스를 붙이지 않는다(`animation: none`). **ID가 바뀐 슬롯만** 180ms 크로스페이드(새 img fade-in; 가능하면 이전 img를 잠깐 유지해 fade-out).
3. **화자 하이라이트**: 현재 말하는 화자의 스프라이트는 밝기 100% + 미세한 pop(2~4px translateY, 200ms), 나머지는 `brightness(0.72)`로 감광. 내레이션 중에는 전원 균등.
4. (여유 시) 대기 중 캐릭터에 아주 느린 호흡 모션(scale 1.000→1.006, 4s alternate). reduced-motion 제외.

#### WP3-C. 장면 전환

1. 배경 420ms crossfade는 유지(DEC-045). **떠나는 배경 `<img>`를 `animationend`에서 제거**하는 버그 픽스 포함.
2. **막 전환 암전**: 다음 4개 경계에만 500ms fade-through-black을 추가한다 — ① 변신 결과 → 전투 진입, ② 전투 종료 → 수렴(`ch3_gray_answer`), ③ 수렴 → 엔딩, ④ 타이틀 → N0. 그 외 노드 전환에는 넣지 않는다(과용 금지). reduced-motion이면 즉시. DEC-062로 기록.
3. **주노 첫 등장 연출**(N2, `SCENE_ASSET_MAPPING.md` §4.1 "등장 순간 짧은 CSS 빛·낙하"): `n2_juno_intro` 첫 렌더에서 주노 스프라이트에 위→아래 낙하 400ms + 착지 빛 번짐 1회. presentation 고정 매핑으로 노드 진입 1회만.
4. `effect-*` 클래스를 `animationend`에서 제거하도록 `applySceneEffect`(`src/ui/effects.ts`)를 보강하고, `fade` 이펙트 타입을 추가한다.

#### WP3-D. AI스러움 제거 — 라벨·문구 정리

1. `MOMENTUM` → **`기세`**(기획 문서 용어, `M5_UI_BGM_REQUEST_MAPPING.md` §2의 "기세 게이지"). 게이지 헤딩의 영문 콘솔풍 표기를 제거한다.
2. 버튼에서 기계적 수치 노출 제거: `주문 시전 · 성공 +15` → `주문을 외친다`, `버티기 +3` → `버티기`, `{S|A|B} 등급으로 수렴` → 등급 문구는 연출로 보여 주고 버튼은 `계속`. 수치 피드백은 게이지 애니메이션(WP4-3)이 담당한다.
3. `eyebrow`("회색 망령" 소제목), `prompt-label`("페이즈 주문") 같은 관리자 화면풍 캡션을 제거하거나 세계관 문구로 교체한다. 적 대사는 WP4에서 대화창으로 이동하므로 `enemy-card` 자체가 사라진다.
4. 컷씬 `progress`("3/5") dead field는 사용하지 않기로 확정하고 생성 코드를 제거한다.
5. 전 화면을 훑으며 디버그·개발 티가 나는 잔여 문구를 목록화해 보고한다(임의 삭제하지 말고 목록 먼저).

#### WP3 완료 기준

- 임의의 연속 대사 10턴에서 스프라이트 깜빡임이 없다(표정 변화 시에만 크로스페이드).
- 대화창이 화면 하단에 고정되고, 화자는 이름표 색과 스프라이트 하이라이트로 구분된다.
- 타이프라이터 → 클릭 즉시 완성 → ▼ 표시 → 진행의 리듬이 성립한다.
- 4개 막 경계에서만 암전 전환이 발생한다.
- reduced-motion 환경에서 모든 신규 모션이 꺼지고 진행은 동일하다.
- 390×844(모바일)에서 대화창·스프라이트·버튼이 겹치지 않는다.

---

### WP4. 전투 무대 개편 [P0 — 사용자 최우선 지적]

**목표: 전투를 "화면 왕복"에서 "한 무대 위의 연출"로 바꾼다. 로직은 그대로, 화면만 다시 만든다.**

#### WP4-1. 단일 무대 레이아웃 (이중 레이아웃 폐지)

`renderBattle()`과 `renderBattleReply()`가 만들던 두 화면을 **하나의 지속 무대**로 통합한다:

```
┌─────────────────────────────────────────────┐
│ [기세 게이지 + 페이즈 표시(●●○)]  ← 상단 HUD, 소형    │
│                                             │
│      [회색 망령: 중앙~좌측, 대형 전신,          │
│       무대 높이의 60~75%, 하단 정렬]            │
│                          [도윤: 우측, 기존      │
│                           DEC-047/049 구도]   │
│                          [주노: 도윤 곁 소형]    │
│ ┌─────────────────────────────────────┐     │
│ │ 이름표 탭 [회색 망령]                    │     │
│ │ 적 대사/판정 결과/주노 지시 → 표준 대화창    │     │
│ └─────────────────────────────────────┘     │
│ [주문 전문 카드] [PTT 주문] [자유 대응] [버티기]   │
└─────────────────────────────────────────────┘
```

- `battle-visual-stage` 그리드 카드·`battle-arena` 패널·`enemy-card`·`battle-result-card`·`battle-reply-*` CSS를 제거하고, 대화 씬과 같은 absolute 배치 문법으로 세 인물을 배경 위에 세운다. 망령은 썸네일이 아니라 **전신 대형**이다.
- 적 대사(`enemyPrompt`, 반격 대사, `narration`)는 전부 WP3-A의 표준 대화창(톤 wraith/juno)으로 흐른다. 행동 결과도 같은 무대에서 대화창 내용 교체 + 연출로 표현한다. **화면 전체 교체 없음.**
- 페이즈 전환 시 세 인물의 화면 좌표가 튀지 않는다(AR-06). 페이즈가 바뀌어도 같은 슬롯·같은 크기를 유지하고 배경만 crossfade된다.
- `.battle-screen`의 세로 스크롤을 제거하고 무대가 뷰포트에 맞게 한다.
- 행동 버튼 영역은 대화창 아래(또는 우측) 고정. 음성/클릭 모드 전환, PTT (T) 표기, 음량 실패 재시도 규칙 UI는 기존 동작 그대로 옮긴다.

#### WP4-2. 액션 연출 시퀀스

행동 종류별로 고정 시퀀스를 구현한다(각 단계는 CSS 애니메이션 + `animationend` 체이닝, 총 1.2초 이내):

- **주문 성공(delta ≥ 15)**: `sfx.cast`(delta≥25면 `critical`) → 도윤 스프라이트 200ms 발광 pop → 망령 위치에 파티클 버스트(`mountParticleBurst` 재사용 — 현재 변신에서만 쓰는 모듈을 전투에 연결) + 망령 히트 연출(200ms 백색 필터 플래시 + translateX 12px 넉백 후 복귀; §6-2 승인 시 `gray_wraith.hit` 스프라이트 스왑) → **게이지 fill이 이전 값→새 값으로 260ms 차오름** → 적 반격 대사가 타이프라이터로 대화창에 표시 + 대사 톤이 위협이면 약한 화면 shake 1회.
- **주문 실패(음량/키워드 미달, delta 0)**: `recognition_fail` → 도윤 스프라이트 미세 흔들림 → 대화창에 실패 안내. 화면 전체 shake는 쓰지 않는다.
- **버티기**: `guard` SFX → 도윤 앞 반투명 방어막 원형 오버레이 500ms → 게이지 +3 차오름.
- **자유 대응(LLM)**: 판정 대기 중 도윤 하이라이트 유지, 결과 delta 부호에 따라 성공/실패 시퀀스 축소판.
- **게이지 애니메이션 필수 수리**: `createGauge()`가 이전 값으로 렌더 후 다음 프레임(`requestAnimationFrame`)에 새 값을 대입해 `transition: width 260ms`를 발동시키거나, 게이지 DOM을 무대에 지속시켜 width만 갱신한다.

#### WP4-3. 상태 전이 연출

- **momentum 65 최초 통과**: `wraith_shift` SFX + 망령이 800ms에 걸쳐 weakened 상태(스프라이트 교체 또는 CSS 파생)로 부드럽게 전이. 즉시 스냅 금지. 65 아래로 내려가도 다시 normal로 돌아가는 기존 로직은 유지하되 전이는 항상 부드럽게.
- **페이즈 전환(p1→p2→p3)**: 배경 crossfade(기존 `presentationBackground` 매핑 유지: `bg_battle_wide → bg_hall_void → bg_mind_archive/bg_battle_core`) + 도윤 포즈 crossfade(`defend → attack → finish`) + 주노 지시 대사를 대화창에 한 줄. **BGM은 절대 재시작하지 않는다.** 페이즈 표시 HUD(●●○) 갱신.
- **p3 beat**(질문 `bg_mind_archive` ↔ 주문 `bg_battle_core`) 배경 전환은 기존 로직 유지.
- **전투 종료(등급 확정)**: 무대 위에서 정화 연출(파티클 대량 + 화면 서서히 밝아짐) → 등급(S/A/B)을 세계관 문구로 표시(예: "완전한 언령" / 대본 §N8 정화 결과 어휘 참조) → `계속` 버튼 → WP3-C의 암전으로 수렴 진입. 별도 결과 카드 화면을 만들지 않는다.

#### WP4-4. 유지해야 하는 것 (전투)

- `BattleState`·`actionDelta`·`advanceAt`/`maxTurns`·등급 산식·`enemyStateFor` 임계값 65 — 수정 금지.
- 하드코딩 반격 대사(`main.ts:340, 411, 418, 421`)는 문자열 위치만 유지하고 표시 방식만 대화창으로 바꾼다. 대사 내용 수정은 대본 소유 영역이므로 하지 않는다.
- 음량 판정(too-quiet/too-loud 무료 1회 재시도, 2회째 턴 소모), 클릭 폴백 완주, debug 주입 기능.
- 관련 기존 테스트: `tests/m4Battle.test.ts`, `tests/m5Presentation.test.ts`, `tests/advanceGate.test.ts` — 깨지면 연출 코드를 고칠 것, 로직 테스트를 고치지 말 것(렌더 구조 변경으로 셀렉터 단언이 깨지는 경우에만 테스트의 DOM 단언을 새 구조로 갱신).

#### WP4 완료 기준

- p1 진입부터 등급 수렴까지 화면 전체 교체(레이아웃 스위치)가 한 번도 없다.
- 주문 성공 시 소리→시전→타격→게이지→적 반응의 시퀀스가 읽힌다.
- 페이즈 전환에서 인물 위치가 튀지 않고 BGM이 이어진다.
- 망령이 weakened로 부드럽게 전이한다.
- 클릭 전용·오프라인으로도 전투가 완주된다.
- 뷰포트 내에 무대가 들어가고 스크롤이 생기지 않는다(데스크톱 1280×720 이상, 390×844 모바일).

---

### WP5. 소규모 버그 픽스 모음 [관련 WP에 편입 가능]

| # | 버그 | 위치 | 수리 |
|---|---|---|---|
| 1 | 변신 주문 `displayText`의 `\n`이 렌더되지 않음 | `styles.css` `.incantation-copy`(L1016-1026) | `white-space: pre-line` 추가 — 두 문장이 계약대로 두 줄로 보여야 한다 |
| 2 | 떠나는 배경 img가 DOM에 잔류 | `gameView.ts` `appendBackground` | `animationend`에서 제거 (WP3-C-1) |
| 3 | `effect-*` 클래스 미제거 | `src/ui/effects.ts` | `animationend` 후 클래스 제거 (WP3-C-4) |
| 4 | BGM 404 무한 재요청 | `src/audio/bgm.ts` | 실패 ID 기억 가드 (WP1-3) |
| 5 | 게이지 transition 사문화 | `src/ui/gauge.ts:26` | 2프레임 대입 또는 DOM 지속 (WP4-2) |
| 6 | `shake` 죽은 코드 | `main.ts` 전투 delta 분기 | WP4-2 시퀀스에 재배선(적 위협 대사·실패 연출) |
| 7 | 컷씬 `progress` dead field | `gameView.ts:610-674` | 제거 (WP3-D-4) |
| 8 | `.battle-screen` 세로 스크롤 | `styles.css:996` | 무대 뷰포트 맞춤 (WP4-1) |

---

### WP6. 장면별 캐릭터 이미지-대화 정합 점검 [P0 — WP1 직후 실행]

**목표: 모든 노드·라인·페이즈에서 화면에 뜨는 캐릭터 이미지(표정·포즈·상태)가 그 순간의 대사·감정과 일치하는지 전수 점검하고, 코드로 고칠 것과 이미지 제작이 필요한 것을 분리한다.**

사용자가 "장면별 캐릭터 이미지 사용이 대화와 맞지 않는 부분이 몇 개 있다"고 확인했다. 어디인지는 특정되지 않았으므로 **전수 점검이 필수다.** 추측으로 몇 곳만 고치고 끝내지 않는다.

#### WP6-1. 정합 기준 (이 3개가 '정답' 소스다)

1. `docs/assets/SCENE_ASSET_MAPPING.md` §4 — 장면별 화면 인물·표정 표와 §4.1 하단의 "대화 응답 직후 도윤 감정 매핑"(intentId→도윤 표정) 표.
2. `docs/심사역은_마법소녀가_되었다_완성대본_v2.md` §3 "도윤 이미지 사용 매핑" 표 + 각 N절 본문의 표정 지시(예: N2 주노 `surprised → happy`, N4-C 회복 시 `shy`).
3. `public/scenario/scenario.json`의 라인별 `emotion`, intent별 `npcEmotion` 필드 — 단 이 값 자체가 대본과 어긋날 수 있다(아래 B형).

#### WP6-2. 실제 렌더 소스 (점검 대상 코드)

- `src/assets/presentationDoyun.ts` — 도윤 표정/포즈 resolver (node·lineIndex·intentId·stage·phaseId·endingId 매핑).
- `src/ui/gameView.ts`의 `appendDialogueVisuals()`(L1250-1293), `createCharacterVisual()`(L1233-1248) — 주노·망령 표시 규칙. 특히 `createCharacterVisual`이 `gray_wraith`를 항상 `.normal`로 강제하는 부분이 각 장면 계약과 맞는지.
- `GameState.npcEmotion` 연속성 — N4의 마지막 주노 표정이 N5 도입까지 이어지는 계약(`SCENE_ASSET_MAPPING.md` §6 `[구현]` 항목, AR-04).
- battle의 `enemyStateFor(momentum)` 65 임계 및 주노 보조 표정(p1 `neutral`, p2 `happy`, p3 `neutral` — §4.2 표).

#### WP6-3. 점검 방법

1. **매트릭스 작성**: 모든 노드(14개)의 모든 라인·비트·intent 분기에 대해 다음 열로 표를 만든다 — `노드 / 라인·비트 / 화자·대사 요지 / 계약상 이미지(근거 문서·행) / 실제 렌더 이미지(근거 코드 위치) / 판정(OK·불일치·이미지 부족)`. battle은 p1~p3 × (대기/성공/실패/버티기/65전이), 엔딩은 GOOD/NORMAL/BAD × 라인 비트까지 포함한다.
2. **육안 확인**: `?debug=1&scene=` 22개 장면 프리뷰 전부 + 실플레이 최소 1경로(N4 세 분기 각각 진입 포함)로 매트릭스를 검증한다. 코드만 읽고 판정하지 않는다.
3. **불일치 분류와 처리**:

| 유형 | 정의 | 처리 |
|---|---|---|
| A형 — presentation 오매핑 | 계약(§WP6-1)이 요구하는 이미지가 있는데 코드가 다른 것을 보여줌 | `presentationDoyun.ts`·`gameView.ts`에서 수정. 매핑 표의 의미가 바뀌면 DEC 기록 |
| B형 — 시나리오 JSON 값 오류 | `emotion`/`npcEmotion` 값 자체가 대본 지시와 어긋남 | **작가 소유 필드이므로 임의 수정 금지**(AGENTS.md §5). 위치·현재값·대본 근거·제안값을 최종 보고서에 한국어로 목록화하고, 사용자 승인 후에만 수정 |
| C형 — 이미지 부족 | 대사의 감정을 기존 이미지 세트(도윤 11종·주노 5종·망령 2상태·변신 컷 2장)로 표현할 수 없음 | 임시로 가장 가까운 기존 이미지를 매핑하고, **`docs/assets/IMAGE_REWORK_REQUEST.md`에 제작 요청으로 추가** (WP6-4) |

#### WP6-4. 작업 필요 이미지 문서 — `docs/assets/IMAGE_REWORK_REQUEST.md`

**이미 시드 문서가 만들어져 있다**(2026-08-06, 검증된 미납품·교체 요청 항목 포함). 점검에서 나온 C형 항목을 같은 표 형식으로 **추가**한다. 규칙:

- 형식은 문서 안의 표 계약을 따른다(논리 ID / 파일명 / 구분 / 현재 상태 / 문제·요청 내용 / 사용 장면 / 우선순위 / 근거).
- 이 문서는 **외부 이미지 제작자 인계용**이다. 제작자는 `assets/runtime/`·`src/`를 만지지 않으므로(DEC-030), 요청 내용에 코드 얘기를 쓰지 말고 장면·감정·구도를 대본 언어로 쓴다.
- 새 논리 ID가 필요한 요청(기존 세트에 없는 표정 추가 등)은 `[제안]`으로 표기한다 — 논리 ID 추가는 DEC 기록 + `SCENE_ASSET_MAPPING.md`·`ASSET_MANIFEST.md` 동시 갱신이 필요하고, 제작 착수는 사용자 승인 후다.
- 문서에 항목을 추가·변경하면 커밋 메시지에 명시한다.

#### WP6 완료 기준

- 14개 노드 × 전 라인·비트 매트릭스가 완성되어 최종 보고에 첨부된다(불일치 0이어도 표는 남긴다).
- A형은 전부 수정되고 관련 테스트(`m5DoyunPresentation.test.ts`, `m5Presentation.test.ts`)가 통과한다.
- B형 목록이 보고서에 있고, 시나리오 JSON은 수정되지 않았다.
- C형이 `IMAGE_REWORK_REQUEST.md`에 반영되어 있고, 각 항목에 임시 대체 이미지가 지정되어 게임은 완주 가능하다.

---

## 5. 커밋 단위

1. `assets: integrate delivered BGM and gray wraith into runtime` (WP1-1, WP1-4-1, manifest/증빙 문서 동반)
2. `feat: align scene.bgm with scene-asset mapping` (WP1-2 + DEC-059)
3. `feat: harden BgmController playback` (WP1-3 + `tests/m5Audio.test.ts` 보강)
4. `fix: align character presentation with scene contracts` (WP6 A형 수정 + 매트릭스·`IMAGE_REWORK_REQUEST.md` 갱신. B형은 코드 변경 없이 보고만)
5. `feat: rebuild battle stage as single persistent scene` (WP4-1, WP5-8)
6. `feat: add battle action and phase presentation` (WP4-2/3, WP5-5/6)
7. `feat: standard VN dialogue window and typewriter` (WP3-A/B, DEC-061)
8. `feat: scene transitions and entrance presentation` (WP3-C, WP5-1/2/3, DEC-062)
9. `feat: clean up presentation labels` (WP3-D)
10. `feat: expand Web Audio SFX cues` (WP2)

각 커밋 전 `git status --short`로 staging 범위를 확인하고 관련 없는 파일을 넣지 않는다. push 여부는 사용자 지시에 따른다.

---

## 6. 사용자 확인이 필요한 항목 — 구현 전 보고하고, 답이 없으면 기본값으로 진행

| # | 질문 | 기본값(답 없을 때) |
|---|---|---|
| 1 | 전투 행동 결과의 1.5초 진행 잠금(DEC-056)을 전투에 한해 0.6초로 단축할까? 전투 템포의 주요 병목이다 | **유지(1.5초)** — DEC-056은 사용자 승인 결정이므로 임의 변경 금지 |
| 2 | `gray_wraith.attack`/`gray_wraith.hit`(납품 파일 존재)를 전투 타격 연출용 신규 논리 ID로 등록할까? | **미등록** — CSS 히트 연출만. 등록 승인 시 DEC + 매핑 문서 동시 갱신 |
| 3 | 도윤 전투 포즈를 행동 순간에만 잠깐 attack/finish로 스왑하는 연출(포즈-액션 동기화)을 넣을까? phaseId 고정 매핑(`presentationDoyun.ts`)의 확장이다 | **넣는다** — 행동 시 200~600ms 포즈 강조는 presentation 계층 범위로 판단. 단 DEC 기록 |
| 4 | 엔딩·수렴 구간 BGM을 `bgm_ending`으로 바꾸는 WP1-2 표가 맞는가? | **진행** — `SCENE_ASSET_MAPPING.md` §4.3의 선호안 그대로 |

이 표 밖의 새로운 기획 판단이 필요해지면 임의 결정하지 말고 `DECISIONS.md` 열린 결정에 기록하고 보고한다.

---

## 7. 검증

자동 (매 커밋):

```
npm run check
npm test
npm run build
```

수동 플레이 (최종):

1. **완주 3경로**: 음성 / 클릭 전용 / 오프라인(Worker 차단)으로 GOOD·NORMAL·BAD 각 도달.
2. **BGM 청감**: `M5_UI_BGM_REQUEST_MAPPING.md` §7 체크리스트 전 항목 — 특히 PTT duck 복귀, p1→p2→p3 무재시작, 징글 1회, 파일 삭제 시 무음 진행.
3. **전투 연출**: 주문 성공/실패/버티기/자유 대응 각각의 시퀀스, 65 전이, 페이즈 전환 위치 고정, 등급 3종(S/A/B) 연출.
4. **대화 연속성**: N2~N4 연속 10턴 스프라이트 무깜빡임, 표정 변화 시에만 크로스페이드, 타이프라이터 클릭 완성.
5. **이미지-대화 정합**: WP6 매트릭스의 전 행이 OK이거나, 불일치가 B형(보고 대기)·C형(이미지 문서 등재 + 임시 대체) 중 하나로 처리 완료. N4 세 분기의 주노 표정이 N5 도입까지 이어지는지 실플레이 확인.
6. **환경**: `prefers-reduced-motion: reduce`에서 전 모션 비활성·진행 동일 / 390×844 모바일 겹침 없음 / `?debug=1&scene=` 22개 장면 프리뷰 정상.
7. **성능·용량**: `assets/runtime` 총합 30MB 이하(BGM 5곡 ≈ 5.1MB 추가 — 여유 확인), 첫 화면 3초 이내.

---

## 8. 문서 갱신 의무 (코드와 같은 변경에서)

- `docs/dev/DECISIONS.md` — DEC-059(scene.bgm 정렬), DEC-060(weakened CSS 파생), DEC-061(대화창 하단 고정, DEC-053 일부 supersede), DEC-062(막 전환 암전), 기타 신규 결정.
- `docs/assets/ASSET_MANIFEST.md` — BGM 5곡·망령 normal `missing → ready`. 라이선스 확인 전 `approved` 금지.
- `docs/assets/IMAGE_REWORK_REQUEST.md` — WP6 점검에서 나온 C형 이미지 요청 추가, 기존 항목 상태 갱신.
- `docs/assets/SCENE_ASSET_MAPPING.md` — §6 구현 상태에 통합 결과 추가, §10 위험 표(AR-01/05/06/07) 상태 갱신. WP6 A형 수정으로 매핑 의미가 바뀌면 해당 표도 갱신.
- `docs/assets/PROVENANCE.md` / `AI_PRODUCTION_LOG.md` — 에셋 이동 경로와 제작 증빙. 미확인 출처는 `미확인`으로.
- `docs/dev/IMPLEMENTATION_LOG.md` — 작업·테스트·잔여 위험 누적 기록.

---

## 9. 최종 보고 양식 (AGENTS.md §6)

1. 결과 — WP별 완료/부분/미착수.
2. 변경 파일.
3. 검증 명령과 결과(실패 포함 그대로).
4. 수동 플레이 결과 — §7의 7항목 각각.
5. WP6 점검 결과 — 정합 매트릭스 전체, A형 수정 목록, **B형(시나리오 JSON 오류) 목록은 위치·현재값·대본 근거·제안값 형식으로 사용자 승인 요청**, C형은 `IMAGE_REWORK_REQUEST.md` 링크.
6. 확정사항과 별도인 제안·가정 — §6 표의 선택 결과 포함.
7. 남은 위험·다음 단계 — 특히 미납품 에셋(weakened, 변신 컷 2장, clean TITLE)과 라이선스 게이트.
