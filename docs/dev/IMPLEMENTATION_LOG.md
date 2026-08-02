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

## M2 — STT와 로컬 판정

- 실행일: 2026-07-31
- 작업 모드: `MILESTONE_IMPLEMENTATION` + TDD
- 상태: 구현·자동 검증·Chrome 무음/강등/클릭 완주 검증 통과. 사용자 실제 발화 A/B/C 비교와 2026-08-02의 명시적 `M3 진행` 지시로 M2 게이트 통과. Web Speech 정확도·release 종료 한계의 교체 구현은 DEC-028에 따라 M3가 소유
- 환경: Windows, Node.js `v24.14.0`, npm `11.9.0`, Chrome `150.0.0.0`, Web Speech API 지원, 로컬 마이크 endpoint 확인

### 구현 내용

- `SpeechRecognition` 어댑터: `ko-KR`, `continuous: false`, `interimResults: true`, start/stop/cancel, 오류 코드 보존, 늦은 콜백 무시.
- PTT hold UI와 대기/청취/처리/재시도 표시, interim/final transcript 자막.
- NFC·소문자·공백/문장부호/기호 제거 정규화와 고유 키워드 점수 기반 로컬 intent 판정.
- DEC-012에 따라 유일 최고점만 채택. 0점·동점은 같은 턴 클릭 선택으로 전환.
- 같은 턴 STT 1회 실패는 재시도, 2회 실패는 해당 턴 클릭, 실패 턴 누적 5회는 `inputMode=click` 강등.
- 미지원·권한 거부 시 재요청 루프 없이 클릭 전환. 지원 환경에서 명시적 음성 복귀.
- `?debug=1` transcript 텍스트 주입을 실제 transcript와 같은 engine 공개 API에 연결.
- transcript 판정·입력 모드·실패 카운터 변경을 `GameEngine`/`state.ts` 중앙 경계로 적용하고 스냅샷에 저장.

### 자동 검증

| 명령 | 결과 | 세부 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 8 files, 37 tests |
| `npm run build` | PASS | Vite `8.2.0`, production bundle 생성 |

자동 테스트 범위: 정규화·유일 최고점·동점·0점, transcript→intent→단일 상태 적용, 음성/클릭 전환, 5회 강등, SpeechPort 지원·interim·final·no-speech·network error·cancel·늦은 콜백, 같은 턴 2회 실패, 권한 거부.

### Chrome 수동 QA

| ID/경로 | 결과 | 관찰 |
|---|---|---|
| QJ-01 | PASS | Asset 요청 없이 CSS 배경·하단 대화창·`주노`·M2 입력 상태 표시 |
| QJ-02 | PASS | M1 클릭 경로 회귀 없음. M2 실행 중 긍정·중립 응답이 상태·턴에 한 번씩 반영 |
| QJ-03 | PARTIAL | debug 명확 transcript→로컬 응답, 동점→클릭, 실제 PTT 무음→재시도/클릭 통과. 실제 사람 발화의 interim/final은 미실측 |
| QP-01 | PASS | 사용자 PTT 동작 뒤 Chrome Web Speech 시작, 자동 재요청 루프 없음 |
| QP-02 | PARTIAL | 권한 거부는 자동 테스트 통과. Chrome 실제 권한 거부 조작은 미실측 |
| QS-01 | PENDING | 실제 사람의 명확한 `ko-KR` 발화 필요 |
| QS-02 | PARTIAL | SpeechPort mock·UI 자막 경로 통과. 실제 발화 interim은 미실측 |
| QS-03 | PASS | Chrome 실제 무음 2회→해당 턴 클릭 선택지 |
| QS-04 | PASS | Chrome 실제 실패 턴 5회→`inputMode=click`, 이후 NORMAL ending 완주 |
| QS-05 | PASS | cancel·늦은 콜백 자동 테스트, 모드/노드 전환 뒤 상태 중복 없음 |
| 콘솔·요청 | PASS | Chrome console 오류/경고 0, HTML/TS/CSS/JSON 요청 200, 404·외부 요청 없음 |

시각 증거는 Git 제외 경로 `output/playwright/m2-ending.png`에 보관한다.

### 오류와 수정

| 발견 단계 | 오류 | 수정 | 재검증 |
|---|---|---|---|
| 첫 TypeScript 검증 | `SetIterator.reduce`가 ES2022 lib 계약에 없음 | 배열 기반 고유 키워드 필터로 변경 | check PASS |
| Chrome `계속 대화` | 클릭 이벤트가 선택적 notice 인자로 전달돼 `[object PointerEvent]` 표시 | 무인자 콜백 래퍼 적용 | 이어하기 후 표시 제거 |
| Chrome 무음 2회 | 실패 state는 저장됐지만 같은 턴 클릭 폴백 화면이 이전 `sttFailCount` 표시 | 실패 적용 후 최신 state로 재렌더, 해당 턴만 클릭 UI 강제 | 2/5·5/5 표시와 저장 복구 PASS |
| debug 엔딩 시각 검수 | debug 패널이 엔딩 제목과 겹침 | 엔딩에서 패널 위치·최대 높이 제한 | screenshot 시각 확인 |

### 확정·가정·다음 단계

- `[확정, DEC-012]` 유일 최고 키워드 intent만 로컬 채택. 동점·0점은 M2 클릭, M3 LLM 판정.
- 실제 시나리오·스키마·에셋·LLM·Workers·변신·전투는 변경하지 않았다.
- Chrome에서 설치된 한국어 TTS를 재생했으나 출력이 선택된 마이크로 loopback되지 않아 실제 명확 발화 증거를 만들지 못했다.
- `[당시 HOLD]` 실제 사람의 `ko-KR` 명확 발화·interim과 주변 소음, 실제 권한 거부를 기록하기 전에는 M2 완료 게이트와 M3 진입을 보류했다.

### STT A/B/C 비교 Lab — 공급자 선택 전 실험

- 실행일: 2026-08-02
- 작업 모드: `MILESTONE_IMPLEMENTATION` + TDD, DEC-027의 격리 실험
- 상태: 구현·자동 검증 통과. 초기 Codex 검증은 A/C 통과·B 키 미설정이었고, 이후 사용자 A/B/C 실제 발화 실측으로 DEC-028 결정 완료. A/B 최종 단일 선택과 M2 완료 여부는 미결정

#### 구현 내용

- 별도 `/stt-lab.html` 멀티페이지. 기존 게임 `main.ts`, `GameState`, FSM, Web Speech 입력 경로와 분리.
- PTT는 `pointerdown`/키 누름에서 `MediaRecorder` 시작, `pointerup`/키 뗌에서만 `stop`. VAD·무음 타이머 없음. 마이크 준비 전에 release가 와도 준비 직후 한 번만 종료하는 상태 경합 처리.
- 녹음·업로드 음성을 16 kHz mono PCM16 WAV와 동일 `Float32Array`로 정규화. 같은 객체를 세 엔진에 전달.
- A/B 로컬 Worker는 키를 `.env.local`에서만 읽고 정확한 로컬 Origin만 허용. OpenAI multipart와 Gemini inline WAV 응답을 zod로 검증.
- C는 Transformers.js + quantized `onnx-community/whisper-small`; WebGPU 우선, WASM 폴백. 최초 모델 로드와 추론 시간을 분리 표시.
- A/B 결과를 먼저 개별 표시한 뒤 C를 실행. 정답 문장 입력 시 공백·문장부호·기호를 제외한 CER 표시. LLM 답변 단계는 의도적으로 없음.
- `npm run dev:stt-lab` 한 명령으로 Vite UI와 로컬 Wrangler Worker 실행. `.env.example`에는 자리표시자만 기록.

#### 자동 검증

| 명령 | 결과 | 세부 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 14 files, 47 tests |
| `npm run build` | PASS | 게임·STT Lab 멀티페이지와 Transformers.js 분리 chunk 생성 |
| `npm audit` | PASS | `sharp 0.35.3`, `adm-zip 0.6.0` 보안 override 후 취약점 0 |

자동 테스트 범위: CER 정규화/편집거리, 동일 오디오 3엔진 전달·부분 실패 격리, 16 kHz mono WAV 헤더/샘플, PTT release 전 미종료·준비 중 release 경합, Worker A/B 요청/응답 계약, 원격 오류 전달, 로컬 모델 로드/추론 분리.

#### 실제 브라우저 비교

| 경로 | 결과 | 관찰 |
|---|---|---|
| Worker health | PARTIAL | A 키 설정, B 키 없음. 모델명·키 존재 여부만 노출하고 비밀값 미노출 |
| WAV 업로드 | PASS | `m2-ko-clear.wav` 8.35초를 16 kHz mono 261.1KB WAV로 정규화, 비교 버튼 활성 |
| A OpenAI | PASS | 1,836ms, `마법소녀가 직업이야? 이겁 수당은 나와? 조건부터 설명해줘.` |
| B Gemini | BLOCKED | 36ms에 `Gemini API 키가 설정되지 않았습니다.`를 B 카드에 격리. A/C 계속 실행 |
| C 로컬 Whisper | PASS | 최초 모델 로드 12,623ms + 추론 2,241ms, `마법소녀가 직업이야. 이겁 수당은 나와. 조건부터 설명해져.` |
| CER UI | PASS | 테스트 정답 문장 기준 A 4.2%, C 8.3%. 문장부호는 계산에서 제외 |
| 콘솔 | PASS | error/warning 0 |
| 자동 PTT 클릭 | ENV BLOCKED | in-app 브라우저의 마이크 권한 응답이 없어 `getUserMedia` 준비에서 대기. 탭 reload로 요청 정리. release 호출 계약은 자동 테스트 2건 PASS |

#### 확정·미결정·다음 단계

- `[확정, DEC-027]` 비교 Lab만 승인. A/B/C 중 production 채택은 승인되지 않았다.
- `[당시 미결정, 이후 DEC-028로 해결]` B 실호출과 사용자 실제 발화 비교가 필요했다.
- `[비교 직후 HOLD]` Lab 자동 성공만으로는 M2 완료 또는 M3 진입으로 판정하지 않았다.

#### 사용자 후속 실측과 공급자 결정

- 기록일: 2026-08-02
- 사용자가 실제 발화로 A/B/C를 비교했다. 개인 발화 원문은 기록하지 않는다.

| 공급자 | 사용자 판정 | 관찰 |
|---|---|---|
| OpenAI `gpt-transcribe` | MVP 후보 유지 | Gemini와 정확도 비슷함, 응답 약 1,116ms |
| Gemini audio transcription | MVP 후보 유지 | GPT와 정확도 비슷함, 응답 약 3,220ms |
| 로컬 Whisper | 후보 탈락 | 정확도가 기준 미달 |

- `[확정, DEC-028]` M3/MVP-1은 GPT/Gemini STT를 같은 인터페이스 뒤에서 전환 가능하게 유지한다. 일반 플레이 한 턴에는 하나만 호출한다.
- 최종 production STT 공급자와 전용 API key는 MVP-1 이후, M6 진입 전에 사용자가 선택한다.
- 비교 Lab의 C 결과와 구현은 결정 근거로 남아 있으나 게임 경로에는 연결하지 않는다. M6 production build 전 Lab과 Transformers.js bundle을 제거한다.
- `[DEC-028 반영 시점]` M2 완료 판정은 별도였고 M3 최종 transcript 경로만 확정했다.

#### M2 최종 게이트

- 승인일: 2026-08-02
- 승인 근거: 사용자의 실제 발화 A/B/C 비교 결과와 `지금까지의 작업을 GIT 에 커밋, 푸쉬 후, m3 진행` 지시.
- 판정: **PASS**. M3 진입 가능.
- 이 PASS는 Web Speech를 최종 STT로 채택한다는 뜻이 아니다. M3에서 버튼 release 녹음과 GPT/Gemini 전환형 final transcript 경로로 교체한다.
