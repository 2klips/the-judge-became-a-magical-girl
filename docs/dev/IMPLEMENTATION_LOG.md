# 마일스톤 구현 기록

다음 단계에서 회귀·미결정을 확인하기 위한 실행 기록이다. 제품 계약은 다른 문서가 단일 진실 공급원이며, 이 문서는 수행 사실과 오류 수정만 기록한다.

## M1 — 클릭 완주 가능한 데이터 기반 엔진

- 실행일: 2026-07-31
- 작업 모드: `MILESTONE_IMPLEMENTATION`
- 상태: 자동·Chrome 수동 검증 통과. 이 기록을 포함한 게시 결과는 Git history와 M1 최종 보고에서 확인
- 환경: Windows, Node.js `v24.14.0`, npm `11.9.0`, Chrome `150.0.0.0`
- 원격 목표: private `2klips/the-judge-became-a-magical-girl`
- commit 목표: `feat: bootstrap playable M1`

### 구현 내용

- Vite + TypeScript + Vanilla DOM/CSS 앱과 npm/Vitest 검증 스크립트 구성.
- `TITLE → PROLOGUE → DIALOGUE → CUTSCENE → ENDING` 직렬 FSM 구현.
- 단일 `GameState`, 중앙 대화 판정 적용, affinity 클램프, 플래그 화이트리스트 구현.
- `eval` 없는 affinity·flag·`&&` 분기 파서와 intent `next` 우선순위 구현.
- `scenario.json`, `characters.json`, `config.json` zod 검증과 node/character/ending 참조 무결성 검사 구현.
- `schemaVersion: 1` 저장·복구, 손상 스냅샷 안전 거부, 새 게임 초기화 구현.
- 실제 Asset 요청 없는 CSS 배경, 하단 대화창, `주노` 이름표, 클릭 의도 3종 구현.
- 긍정 7턴→GOOD 71/`promise`, 중립 7턴→NORMAL 50, 부정 7턴→BAD 29 더미 경로 구현.
- M2가 클릭 입력을 STT 입력으로 교체·병행할 수 있도록 `InputPort` 경계 분리.

### 자동 검증

| 명령 | 결과 | 세부 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 5 files, 23 tests |
| `npm run build` | PASS | Vite `8.2.0`, production bundle 생성 |
| `npm audit` | PASS | 취약점 0 |

자동 테스트 범위: affinity 상·하한, 허용/비허용 flag, 조건 파서, 분기 순서, intent `next`, maxTurns, 실제 JSON 검증, 잘못된 next·character·flag, 저장 왕복·손상 처리, 새 게임 초기화, GOOD/NORMAL/BAD 경로.

### Chrome 수동 QA

| ID/경로 | 결과 | 관찰 |
|---|---|---|
| QD-01 | PASS | 타이틀→프롤로그→대화→컷씬→ending 완주, 콘솔 오류 0 |
| QJ-01 | PASS | Asset 디렉터리 없이 CSS 배경·하단 대화창·`주노`·입력 상태 표시 |
| QJ-02 | PASS | 클릭 intent 3종, `offlineReply`, 상태·턴 1회 반영 |
| QR-01 | PASS | 대화 노드 저장 후 새로고침→이어하기, node/state/flags 동일 |
| GOOD | PASS | affinity 71, `promise`, `ending_good` |
| NORMAL | PASS | affinity 50, flag 없음, `ending_normal` |
| BAD | PASS | affinity 29, flag 없음, `ending_bad` |
| 정적 요청 | PASS | HTML/JS/CSS/JSON 200 또는 캐시 304, 404 없음, 외부 요청 없음 |

시각 증거는 Git 제외 경로 `output/playwright/`에 보관한다.

### 오류와 수정

| 발견 단계 | 오류 | 수정 | 재검증 |
|---|---|---|---|
| 첫 `npm run check` | `Intent` 미사용 import로 TS6196 | import 제거 | check PASS |
| 첫 `npm test` | 위험 조건 fixture가 유효 임계값 `100`을 잘못 사용 | 실제 범위 밖 `101`로 교정, 오류 종류와 무관하게 거부 검증 | 23 tests PASS |
| 첫 Chromium smoke | 자동 `favicon.ico` 요청 404 | inline SVG data favicon 추가 | 정적 요청 404 없음 |
| QR-01 | 복구 상태에 저장 메타 `schemaVersion` 잔류 | 역직렬화 시 `GameState` 필드만 명시 매핑, 회귀 assertion 추가 | check/test/build·Chrome 복구 PASS |
| 브라우저 기준 점검 | 첫 시각 검수가 기본 Chromium 세션 | `--browser chrome`으로 전체 3경로·복구 재실행 | Chrome 150 PASS |

### 가정·제외·다음 단계

- `[가정, DEC-026]` M1 더미 `config.json`·`characters.json` 필드는 본편 작가 JSON의 확정 확장이 아니다. M2/M3에서 전역 턴 프리셋과 persona 주입 계약을 확정한다.
- 실제 이미지·오디오 Asset, STT, 마이크 권한, LLM, Workers, battle, 배포는 만들지 않았다.
- `files.zip`, `prompt/`, Playwright 내부 로그·스크린샷, `node_modules/`, `dist/`는 초기 commit에서 제외한다.
- M2 진입 전 이 기록의 GitHub 게시·HEAD 일치·최종 clean 상태를 확인한다.
