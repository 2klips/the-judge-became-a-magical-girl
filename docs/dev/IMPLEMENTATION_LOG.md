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

## M3 — 전환형 원격 STT, Workers 프록시와 LLM 판정

- 실행일: 2026-08-02
- 작업 모드: `MILESTONE_IMPLEMENTATION` + TDD
- 상태: 구현·자동 검증·Worker 실호출·브라우저 폴백 완주와 사용자 실제 마이크 GPT/Gemini 각각 5회 검증 완료. M3 게이트 **PASS**

### 구현 내용

- 게임 음성 경로를 Web Speech에서 `MediaRecorder` 기반 PTT로 교체. 녹음은 누름에서 시작하고 release에서만 종료하며 VAD·무음 자동 종료를 사용하지 않는다.
- 녹음을 16 kHz mono PCM WAV로 정규화하고 선택된 OpenAI `gpt-transcribe` 또는 Gemini audio transcription 한 곳에만 전송한다.
- 최종 transcript를 zod 검증 후 화면에 먼저 렌더하고 다음 paint가 끝난 뒤 로컬 intent 또는 LLM 판정을 시작한다.
- `LlmPort`에 4초 timeout·1회 재시도, 최근 3턴 문맥, 정상/지연/HTTP 오류/잘못된 JSON/오프라인 주입을 추가했다.
- Worker는 정확한 Origin, 메서드, 콘텐츠형, 오디오 14MB, JSON 32KB를 검증한다. OpenAI/Gemini STT와 Gemini `gemini-3.1-flash-lite` structured output을 Secret 경계 안에서 호출한다.
- 검증된 판정만 중앙 엔진 함수가 affinity·emotion·flag에 반영한다. 미허용 intent/flag, 범위 밖 delta, 80자·2문장 초과, 감정 단정, 검은 마법소녀 정체 공개는 거부한다.
- LLM 실패는 작가 제공 `fallbackReplies`와 중립 판정으로 턴을 진행한다. 3연속 실패 뒤 LLM 요청을 중단하며 클릭·로컬 경로로 ending까지 진행한다.
- STT Lab은 M3 공통 녹음·Worker 구현을 재사용한다. 기존 별도 `wrangler.stt-lab.toml`은 `wrangler.jsonc`로 통합했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 20 files, 66 tests |
| `npm run build` | PASS | 게임·STT Lab production build 생성 |
| GPT STT 실호출 | PASS | 사용자 실제 마이크 5회. p50 1,224ms, p95 1,393ms. 선택된 OpenAI route만 턴당 1회 호출, transcript 오류 보고 없음 |
| Gemini STT 실호출 | PASS | 사용자 실제 마이크 5회. p50 3,143ms, p95 3,440ms. 전용 실행에서 GPT 요청 0, transcript 오류 보고 없음 |
| Gemini LLM 실호출 | PASS | Gemini STT 전용 실행의 자유 발화 5회 모두 LLM 연결. p50 963ms, p95 1,257ms. 농담·불안·분노·엉뚱한 말·금지 정보 요구도 별도 실호출 정책 통과 |
| transcript 선표시 | PASS | 판정 전 render/paint 순서를 자동 테스트로 고정 |
| 공급자 전환 | PASS | GPT↔Gemini 변경 시 URL 설정만 바뀌고 `GameState` 유지, 일반 턴 단일 route |
| LLM 장애 | PASS | 3회 실패 후 `LLM 실패 3/3`, 이후 `/judge/dialogue` 요청 없이 7턴과 NORMAL ending 완주 |
| 콘솔 | PASS | 정상 경로 error/warning 0. 오류 주입 경로는 의도된 경고만 발생 |
| 비밀정보 | PASS | 키는 `.env.local`에만 존재하고 Git·브라우저 번들에 포함되지 않음 |

### M3 게이트 판정

- `[확정, DEC-028]` MVP 동안 GPT/Gemini STT를 모두 유지하고 일반 플레이는 선택 공급자 하나만 호출한다. 기본 선택 GPT는 사용자 1회 실측 속도에 따른 QA 기본값이며 production 최종 선택이 아니다.
- `[확정, DEC-018]` 기존 기획 모델이 실제 API에서 신규 사용자 비가용이어서 대화 LLM을 현재 사용 가능한 `gemini-3.1-flash-lite`, `thinkingLevel: minimal`로 변경했다.
- `[PASS]` QJ-04·QS-06의 사용자 실제 마이크 GPT 5회/Gemini 5회와 공급자별 p50/p95를 기록했다. 사용자는 transcript 선표시·정확도 문제를 추가 보고하지 않았다.
- GPT 혼합 실행은 무음·클릭 폴백을 포함해 7턴 NORMAL ending, Gemini 전용 실행은 음성 5턴 뒤 클릭 2턴으로 NORMAL ending에 도달했다. 두 실행 모두 정상 경로 콘솔 error/warning 0.
- 초기 자동 회귀는 당시 in-app Browser 연결 부재로 Playwright CLI를 사용했고, 최종 게이트는 실제 Chrome 확장·사용자 마이크·로컬 Worker trace로 검증했다.
- 최종 판정: **M3 PASS**. MVP-1 완료, M4 진입 가능.

## M4 — 변신 주문과 3페이즈 언령 배틀

- 실행일: 2026-08-02
- 작업 모드: `MILESTONE_IMPLEMENTATION` + TDD
- 상태: 구현·자동 검증·브라우저 클릭/debug 검증·battle LLM 실호출·사용자 실제 마이크 검증 완료. M4 게이트 **PASS**

### 구현 내용

- NFC·공백·문장부호 정규화와 순서 무관 부분 문자열 키워드 채점. 전 키워드 완창은 `perfect_transform`과 초기 momentum 60, `minMatch` 성공·2회 미달 자동 구제·클릭 주문은 momentum 50으로 진행한다.
- 별첨1 계약의 `incantationGate`, 정확히 3개 `battle.phases`, 페이즈별 주문·클릭 응답·턴 상한·임계를 zod로 검증한다. 전역 등급 플래그 계약에 맞춰 flag 식별자에서 `battle_S/A/B`의 영문 대문자를 허용한다.
- battle 순수 엔진은 spell `+25/+15/0`, freeform `-5..+10`, guard `+3`, momentum `20..100`, 적 상태 경계 65, 페이즈 즉시/턴 상한 전환, 최대 9턴, S/A/B 경계 80/55를 처리한다.
- 중앙 `GameState` 함수만 변신 폼·`perfect_transform`·등급·단일 `battle_*` 플래그·호감도 `+10/+5/0`을 적용한다. 종료 효과 중복 적용은 오류로 차단한다.
- Worker `/judge/battle`에 Gemini structured output, 4초 timeout·1회 재시도, 안전한 0점 폴백을 연결했다. 메서드·Origin·JSON 크기·응답 스키마·금기 검증은 M3 경계를 재사용한다.
- UI에 주문 전문, PTT release 녹음, transcript 선표시, 클릭 표준 변신, momentum 게이지, spell/freeform/guard, 적 2상태, CSS flash/shake/transform placeholder를 추가했다.
- `?debug=1`에서 주문 transcript, momentum `20..100`, S/A/B 등급을 재현할 수 있다.
- `[확정, DEC-029]` M4는 더미 1게이트·3페이즈만 연결했다. 완성대본 v2 N5 주문 2개와 N6~N8 본편 매핑, 실제 변신 컷 asset 필드는 M5 결정으로 남겼다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 27 files, 95 tests |
| `npm run build` | PASS | 게임·STT Lab production build 생성. 기존 탈락 후보 Whisper Lab chunk 경고 유지 |
| 주문 자동 검증 | PASS | NFC, 공백·문장부호 제거, 순서 무관, 완창/성공/1회 retry/2회 rescue/클릭 표준 |
| battle 자동 검증 | PASS | spell/freeform/guard, 20 하한, 65 적 상태, 동시 전환 1회, 9턴 종료, `79/80`, `54/55`, 중복 종료 차단 |
| Worker battle | PASS | 요청·응답 경계 7개 회귀 테스트와 로컬 Worker→Gemini 실호출 1회 성공 |
| QT-01 debug 완창 | PASS | `변신, 별의 힘!` 주입 → 완전 변신, `perfect_transform`, 초기 momentum 60 |
| QT-03 자동 구제 | PASS | 0/3 미달 1회 retry 후 2회째 `failLines` 2줄 표시, momentum 50 |
| QT-04 클릭 폴백 | PASS | 주문 외우기 → 표준 변신, `perfect_transform` 없음, momentum 50 |
| QB-01 S | PASS | 클릭 주문 3회로 3페이즈, momentum 95, affinity +10, `battle_S`만 설정 |
| QB-02 A | PASS | debug 55 → affinity +5, `battle_A`만 설정 |
| QB-03 B | PASS | debug 20 → affinity +0, `battle_B`만 설정 |
| 클릭 수렴 | PASS | 타이틀부터 변신·3페이즈·수렴 대화·GOOD ending 완주 |
| 사용자 실제 마이크 | PASS | 사용자가 요청된 변신 주문·음성 전투 테스트 완료를 확인. 별도 실패 보고 없음 |
| 콘솔 | PASS | 정상·debug 경로 error/warning 0 |

### M4 게이트 판정

- 자동 계약과 클릭/debug 수동 경로를 통과했다. QT-02·QT-03의 부분 성공·2회 미달은 debug 경로로 재현했다.
- `[PASS]` 사용자가 2026-08-02 실제 마이크 변신 주문·음성 전투 테스트 완료를 확인했다. 개인 발화 원문·선택 공급자·등급·지연 수치는 기록하지 않는다.
- 최종 판정: **M4 PASS**. 변신 3결과와 전투 S/A/B 자동·수동 재현, M3 회귀 없음. M5 진입 가능.

## M5 — 본편 JSON·로더·placeholder 연출 선통합

- 실행일: 2026-08-02
- 작업 모드: `MILESTONE_IMPLEMENTATION`
- 상태: 외부 물리 에셋 전달 전 병렬 구현 범위 완료. M5 게이트는 물리 에셋·음성/오프라인 전체 3경로 사람 QA 전이므로 **미판정**

### 구현 내용

- 완성대본과 DEC-020·024에 맞춰 대화 8, 컷씬 2, battle 1, GOOD/NORMAL/BAD 3개의 총 14노드와 주노·회색 망령 캐릭터 JSON을 통합했다.
- 중앙 asset catalog가 배경·표정·망령 상태·도윤·변신 2컷·BGM 논리 ID를 고정 경로로 해석한다. `bg_hall_dark`는 `bg_hall_dark.webp → bg_hall_day.webp 파생 → CSS placeholder` 순서다.
- 파일 로드 실패는 게임을 막지 않고 `[ASSET_HANDOFF] 논리ID: 기대 경로`를 경로별 한 번 출력한다. 외부 루트 `asset/` 원본은 읽기·수정·rename·stage하지 않았다.
- N1 주노 미노출, N3~N5 주노+망령, N4→N5 표정 연속성, battle 도윤+망령+주노와 momentum 기반 망령 상태를 presentation 계층에 적용했다.
- 고정 변신 컷 2장, CSS fade/typing/shake/flash, Canvas 파티클, BGM crossfade·PTT duck, 변신 one-shot, Web Audio SFX 5종을 연결했다. 실파일이 없으면 같은 자리에 CSS placeholder가 나온다.
- 첫 화면 핵심 배경·주노 표정을 preload하고 나머지는 장면 진입 시 지연 로드한다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 29 files, 102 tests |
| `npm run build` | PASS | production build 생성. 기존 STT Lab Whisper chunk 크기 경고만 유지 |
| 시나리오·에셋 계약 | PASS | 14노드, 2캐릭터, node/flag/bg/bgm/표정/전투/변신 논리 참조 검증 |
| 결정적 3엔딩 | PASS | GOOD 76+promise, NORMAL 유보 직행, BAD 거절 직행 자동 테스트 |
| headed Chromium 클릭 완주 | PASS | 타이틀→N0~N5→3페이즈→GOOD. 콘솔 error 0 |
| placeholder 장면 매핑 | PASS | N1 주노 미노출, N3/N5 복수 인물, battle 도윤·망령·주노, 변신 2컷 확인 |
| 누락 파일 진단 | PASS | 물리 파일별 `[ASSET_HANDOFF]` 1회, CSS 진행 유지 |
| 물리 에셋 QA | 대기 | 외부 담당자 전달 후 규격·일관성·라이선스·용량·청감 검수 필요 |
| M5 전체 수동 게이트 | 대기 | 음성·오프라인 전체 본편과 NORMAL/BAD 수동 경로 미실행 |

### 현재 판정

- 사용자 요청의 “에셋과 병렬로 JSON·로더·연출 코드를 먼저 구현하고 CSS placeholder로 테스트” 범위는 완료했다.
- 물리 에셋이 없는 상태를 M5 최종 PASS로 간주하지 않는다. 외부 전달 파일은 자동 보정하지 않고 담당자 오류 반환→재전달→통합 QA 순서로 처리한다.

## M5 — 비에셋 결함 보정

- 실행일: 2026-08-02
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DOCS_UPDATE`
- 상태: 확정 계약으로 수정 가능한 결함 완료. 사용자 결정이 필요한 N7·interim·작가 키워드·열린 ADR은 보류

### 수정 내용

- 타이틀·N0·N1 시작·N1 응답에서 `주노/JUNO` 정체를 숨기고 `정체불명의 목소리`·`VOICE // LINK`를 표시한다. N2 진입부터 주노 이름과 링크를 공개한다.
- 대화·전투 LLM 성공은 연속 실패 횟수를 초기화한다. 전투 LLM은 최종 실패 턴을 1회 기록하고 3회 누적 뒤 추가 네트워크 요청 없이 안전한 0점 폴백을 적용한다.
- 별첨1의 optional `ending.gradeVariants`를 strict zod schema에 추가하고 `GameState.battleGrade`에 해당하는 추가 대사만 기본 ending lines 뒤에 렌더한다. DEC-033에 근거와 영향을 기록했다.
- 누락된 DEC-018 정의, Git 저장소 생성 전 상태가 남은 보안 문서, AR-03~07의 구현/QA 상태 중복을 정정했다.
- 작가 소유 `n4_cooperate` 중복 키워드는 사용자 대체·삭제 결정 전 수정하지 않았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| N1 표시 TDD | PASS | 타이틀·N0·N1 익명, N2 주노 공개 경계 고정 |
| battle LLM 실패 사다리 TDD | PASS | 실패 3회까지만 호출, 4번째부터 호출 0, 성공 시 실패 횟수 초기화 |
| `gradeVariants` TDD | PASS | schema 보존, 현재 S/A/B 등급의 lines만 기본 lines 뒤에 결합 |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 30 files, 109 tests |
| `npm run build` | PASS | production build 생성. 기존 STT Lab Whisper chunk 경고 유지 |
| Playwright 클릭 QA | PASS | 타이틀→N0→N1 시작·응답→N2, 공개 경계 정상, 콘솔 error 0 |

### 현재 판정

- 위 비에셋 결함은 수정 완료. 에셋 파일·manifest·기준 기획서·완성대본은 변경하지 않았다.
- N7 UI, interim 자막, N4 중복 키워드, DEC-010·011·013은 사용자 결정 뒤 별도 반영한다.
- M5 최종 게이트는 기존대로 미판정이다.

## M5 — 도윤 에셋 인계 정규화

- 실행일: 2026-08-03
- 작업 모드: `ASSET_VALIDATION` + `DOCS_UPDATE`
- 상태: 파일명 정규화·누락 추적·`doyun.magical` 임시 runtime 통합 완료

### 처리 내용

- commit `4adb4db`의 `docs/Asset/assets/` 도윤 PNG 23장을 전수 검사했다.
- 외부 원본은 유지하고 채택 runtime 복사본만 계약명으로 정규화하는 DEC-034를 기록했다.
- README의 8개 불일치 이름을 실제 납품명으로 정정하고 과거 이름→정규화명 표를 보존했다.
- 현재 M5 필수·확장·미참조를 분리했다. 미참조 21장은 논리 ID·catalog를 추가하지 않고 납품 폴더에 유지했다.
- `doyun.magical` 정면 포즈, 변신 컷 2장, 생성·라이선스 증빙을 작업자 재요청 목록에 기록했다.
- 사용자 임시 승인 DEC-035 뒤 원본과 동일 바이트를 `public/assets/char/char_doyun_magical.png`에 복사했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| PNG 전수 디코딩 | PASS | 23/23 |
| 규격·투명도·용량 | PASS | 모두 1200×2000 8-bit indexed PNG + `tRNS`, 실제 투명 픽셀, 최대 343,450B |
| 묶음 용량 | PASS | 5,538,435B, 30MB 이하 |
| 완전 중복 | PASS | SHA-256 중복 0 |
| README↔실파일명 | PASS | 8개 별칭을 실제 파일명으로 정규화하고 이력 보존 |
| `doyun.magical` 장면 QA | 임시 승인 | 정면본을 DEC-035로 M5 사용. 후면/반측면 교체 대기 |
| runtime 파일 | PASS | resolver 계약 경로 존재, 원본·복사본 SHA-256 일치 |
| 물리 파일 TDD | PASS | 부재 ENOENT RED → runtime 복사 → PNG signature/IHDR/투명도/용량 GREEN |
| Playwright battle p1~p3 | PASS | 세 페이즈 모두 `마법소녀 도윤` 실이미지 유지, HTTP 200 `image/png` 301,708B, 콘솔 error 0, 도윤 fallback 경고 0 |

### 현재 판정

- 이름 불일치와 누락은 더 이상 작업 중단 원인이 아니다. 문서화 후 placeholder로 계속 진행한다.
- `doyun.magical`은 `ready`다. 라이선스와 최종 후면/반측면 교체 QA 전 `approved`는 아니다.

## M5 — 확정 배경 16장 장면 전환·dev 프리뷰

- 실행일: 2026-08-03
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `ASSET_VALIDATION` + `DEMO_QA`
- 상태: 확정 배경 16장 runtime 통합과 node/phase/ending 전환 완료. 누락 캐릭터·변신 컷·BGM은 placeholder 유지

### 구현 내용

- 원본 ZIP을 보존하고 확정 배경 16장을 `public/assets/bg/*.webp`의 1920×1080 계약 규격으로 변환했다.
- 순수 `resolvePresentationBackground`가 N0 문장, N1, N5 영창·변신, battle p1/p2/p3 질문·주문, 수렴, GOOD/NORMAL/BAD 배경을 결정한다.
- 사용자 승인에 따라 ending을 문장 단위 페이지로 분리했다. GOOD은 회복 책상 5페이지→밝은 복도 1페이지→검은빛 복도 1페이지다.
- `?debug=1` 장면 선택기와 비변이 `?debug=1&scene=<id>` 직접 프리뷰를 추가했다. 22개 프리셋이 16개 배경과 실제 presentation beat를 모두 포함한다.
- 직접 프리뷰는 bootstrap·저장·FSM을 우회한다. 잘못된 scene ID는 안전한 오류 화면으로 처리한다.
- 선택 사항인 `ending.black_magical_girl` 계약 경로만 catalog에 등록했다. 실파일이 없으면 기존 placeholder가 유지된다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 32 files, 121 tests |
| `npm run build` | PASS | production build 생성. 기존 STT Lab/transformers chunk 크기 경고만 유지 |
| 배경 물리 규격 | PASS | 16/16 WebP, 모두 1920×1080, 합계 2,666,866B |
| dev 전수 프리셋 | PASS | 22프리셋, 고유 배경 16개, image load 실패 0, console error 0, local/session storage 키 0 |
| GOOD 전체 클릭 QA | PASS | N0 office→desk, N1 time stop, N5 dark→desk→transform, battle p1 wide→p2 void→p3 archive/core, 수렴 dark, GOOD 7페이지 전환 |
| 실에셋·placeholder 합성 | PASS | 도윤 실 PNG 유지. 누락 주노·망령·변신 컷은 기대된 경고와 placeholder로 완주 |

### 현재 판정

- 16장 장면 매핑과 M5 presentation 구현은 완료됐다.
- TITLE baked NHN/HACKATHON 문구·로고는 DEC-037에 따라 임시 승인 상태다. clean 교체와 생성·라이선스 증빙은 계속 요청한다.
- M5 전체는 주노 5장, 망령 2장, 변신 컷 2장, 필수 BGM 3종과 사람 음성·오프라인 전체 경로 QA 전이므로 아직 PASS가 아니다.

## M5 — 외부 에셋 black/silent 폴백·작업자 인계

- 실행일: 2026-08-03
- 작업 모드: `DOCS_UPDATE` + `ASSET_VALIDATION` + `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: 작업자 문서 선행 push, 기능 폴백 구현·자동/브라우저 QA 완료. 실에셋·제출 게이트 대기

### 처리 내용

- `docs/Asset/M5_ASSET_HANDOFF_REQUEST.md`와 `M5_UI_BGM_REQUEST_MAPPING.md`에 P0 필수, P1 교체, P2 선택, 계약명·규격·장면·증빙·재납품 조건을 고정했다.
- 해당 문서와 Asset README만 commit `25ba8a3`으로 먼저 원격 `codex/m5-asset-handoff-docs`에 push했다. mixed worktree의 코드·원본 에셋은 첫 commit에서 제외했다.
- DEC-040에 따라 누락 이미지·컷은 검은 presentation, 누락 BGM은 무음으로 강등한다. 검은 presentation에서도 대사·자막·버튼·PTT·게이지를 유지한다.
- 기존 논리 ID·파일명·manifest 상태를 바꾸지 않는다. 실파일 도착 시 같은 경로에 채운 뒤 시각·청각 QA를 재실행한다.
- `QA_AND_DEMO.md` §15에 기능 게이트와 에셋·제출 게이트, 자동 검사, 22프리셋, 클릭·실제 음성·오프라인×3엔딩 9회 완주, 증거 템플릿을 추가했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD tracer | PASS | 누락 이미지 black 계약 RED 1건 확인 뒤 GREEN. BGM 오류 무음 characterization PASS |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 32 files, 123 tests |
| `npm run build` | PASS | production build 생성. 기존 STT Lab/transformers chunk 경고만 유지 |
| Playwright N2 실제 클릭 | PASS | 주노 placeholder `rgb(0, 0, 0)`, 대사·이름표·4개 입력 버튼 표시, console error 0 |
| Playwright N5 dev | PASS | 변신 컷 black placeholder 2개, 프리뷰 UI 표시, local/session storage 키 0, console error 0 |
| BGM 누락 | PASS | `bgm_daily` 404를 `[ASSET_HANDOFF]` 경고 1회로 기록하고 예외 없이 무음 유지 |
| 문서 첫 push | PASS | commit `25ba8a3`, 원격 tracking branch 설정 |

### 현재 판정

- M5 기능 개발과 기능 QA는 외부 에셋 대기 없이 계속 가능하다.
- 검은/무음 폴백은 `missing`을 완료 처리하지 않는다. 실에셋 시각·청각·라이선스·성능 검수 전 `M5 최종 PASS`는 아니다.
- 최종 QA 실행 절차는 `QA_AND_DEMO.md` §15를 따른다.

## M5 — 잔여 기능 위험 처리·전체 경로 QA

- 실행일: 2026-08-03
- 작업 모드: `DEMO_QA` + `ASSET_VALIDATION` + `MILESTONE_IMPLEMENTATION`
- 상태: 클릭·오프라인 6경로와 fake microphone 음성 코드 경로 NORMAL 완주. 초기 preload 결함 수정. 실제 사람 음성 GOOD/NORMAL/BAD·실에셋 게이트 대기

### 처리 내용

- 22개 dev 프리셋을 개발 서버와 production preview에서 모두 재검사했다. 16개 배경은 전부 1920×1080으로 로드되고 검은 placeholder는 `rgb(0, 0, 0)`을 유지했다.
- 클릭 GOOD/NORMAL/BAD와 DevTools Offline+첫 PTT 실패→클릭 폴백 GOOD/NORMAL/BAD를 완주했다. ending 마지막 페이지에서만 `처음부터`가 표시되고 재시작 시 호감도 50·플래그 초기화를 확인했다.
- fake microphone의 한국어 WAV를 debug transcript 없이 MediaRecorder→OpenAI STT Worker→LLM 판정 경로로 전달했다. 대화 5턴, 변신 주문 2회, battle 7턴, 수렴 1턴 뒤 NORMAL ending에 도달했다.
- 첫 화면에서 title 외 `bg_office_wide`, `bg_hall_day`, 누락 Juno 2종까지 preload하던 QA 계약 위반을 발견했다. `corePreloadAssets`를 `bg_title` 하나로 축소하고 회귀 테스트를 고정했다.
- 390×844 viewport와 Pages base 경로 production preview를 검사했다. 가로 overflow, Vite overlay, 확인된 JS/CSS/배경/도윤의 HTTP·MIME 실패는 없었다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| 22개 dev 프리셋 | PASS | 개발·production 각 22/22, 배경 16장 1920×1080, scene failure 0 |
| 프리셋 저장 격리 | PASS | local/session sentinel이 22회 직접 진입 전후 동일 |
| 클릭 ending 매트릭스 | PASS | GOOD 76/S/promise, NORMAL 73/S, BAD 46/S |
| Offline+로컬 폴백 매트릭스 | PASS | 3/3. 첫 PTT `Failed to fetch`, 현재 턴 click 전환, GOOD/NORMAL/BAD 완주 |
| fake microphone 음성 코드 경로 | PASS | debug 주입 0, STT/LLM 200, 실패 0, NORMAL 56/B 완주 |
| 실제 사람 음성 매트릭스 | 대기 | GOOD/NORMAL/BAD 3회 미실행. fake microphone 결과로 대체하지 않음 |
| 변신·battle 음성 구제 | PASS | 변신 0/4 재시도→2차 rescued, battle 7턴 B 등급으로 종료 |
| 반응형 | PASS | 390×844 title·battle preview 가로 overflow 0, 조작 UI 표시 |
| 초기 로드 | PASS | local dev title 표시 52ms, 선행 배경 요청 `bg_title` 1개, 첫 화면 console error/warning 0 |
| production preview | PASS | Pages base, 확인된 파일 HTTP/MIME 실패 0, page error 0. 누락 9개는 black fallback |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 32 files, 123 tests |
| `npm run build` | PASS | production build 생성. 기존 transformers chunk 경고만 유지 |
| 보안·문서 | PASS | tracked secret 패턴 파일 0, 로컬 Markdown broken link 0, `git diff --check` 통과 |

### 현재 판정

- 자동·fake-device 기능 위험은 처리했다. M5 기능 경로는 외부 에셋 없이 클릭·오프라인·음성 Worker 코드 경로로 완주 가능하다.
- M5 최종 PASS 전 실제 사람 발화 GOOD/NORMAL/BAD 3회와 실에셋 시각·청각·라이선스 검수가 남는다. fake microphone 결과를 사람 발화로 대체하지 않는다.
- M6 범위인 production debug 상태 변경 기능 제거, 실제 GitHub Pages 배포·제출 검수는 시작하지 않았다.

## M5 — 임시 QA GitHub Pages 배포

- 실행일: 2026-08-04
- 작업 모드: `FEATURE_EVALUATION` + `DEMO_QA` + `DOCS_UPDATE`
- 상태: public 임시 QA 배포·데스크톱/모바일 smoke 완료. 클릭·오프라인 전용이며 M5/M6 최종 PASS 아님

### 처리 내용

- 사용자 승인으로 M6 이전 임시 QA 예외를 DEC-041에 기록했다. `build:qa`는 게임 entry만 만들고 `stt-lab.html`, 로컬 Whisper WASM·transformers chunk를 제외한다.
- QA 모드는 `.env.local`이나 `VITE_WORKER_URL` 주입값도 무시하고 Pages same-origin의 `__qa_worker_disabled__`로 고정한다. 외부 STT·LLM과 테스터 PC localhost에 음성을 보내지 않는다.
- 화면 상단에 QA/클릭·오프라인/Worker 비활성/commit 배너를 표시하고 HTML에 `noindex,nofollow`를 추가했다.
- private Pages 활성화가 현재 GitHub 요금제에서 `HTTP 422`로 거절됐다. 사용자 후속 승인으로 저장소 전체를 public 전환하고 DEC-042에 기록했다.
- 최초 deploy는 `github-pages` 환경의 `main` 전용 branch 정책으로 거절됐다. 허용 목록에 현재 QA 브랜치만 추가하고 failed job을 재실행해 성공했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 33 files, 127 tests |
| `npm run build` | PASS | 일반 game+STT Lab build 유지. 기존 transformers 크기 경고만 존재 |
| `npm run build:qa` | PASS | game JS/CSS와 runtime asset만 생성. `stt-lab.html`·WASM·transformers 없음 |
| tracked 비밀 패턴 | PASS | 실제 키·토큰·private key 고신뢰 패턴 0. `.env.local` 미추적 |
| GitHub Actions | PASS | run `30905769904`, attempt 2. check/test/build/artifact/deploy 성공 |
| 배포 HTTP | PASS | root/scenario/background 200, `stt-lab.html`·`__qa_worker_disabled__` 404 |
| 데스크톱 브라우저 | PASS | commit 배너, `noindex`, title, 클릭 시작→N0, 1920×1080 배경, overlay/console error 0 |
| dev 장면 | PASS | `battle-p3-spell`, 23 options(실플레이+22 preset), 배경 1920×1080, 누락 인물 경고만 존재 |
| 모바일 | PASS | 390×844, 배너 48px·shell offset 48px, 가로 overflow/overlay/console error 0 |

### 현재 판정

- 작업자 테스트 URL: `https://2klips.github.io/the-judge-became-a-magical-girl/`.
- `?debug=1` 장면 선택기와 `?debug=1&scene=<장면ID>` 직접 프리뷰를 사용할 수 있다.
- 누락 BGM·주노 runtime·망령·변신 컷은 기존 black/silent 인계 경고 대상이다. 음성 API와 STT Lab은 이 QA URL의 테스트 범위가 아니다.
- 실제 사람 음성 3엔딩, 신규 실에셋 통합·라이선스, M6 production debug/Worker/STT 결정은 계속 남는다.

## M5 — 에셋 구조 통합·도윤 전면 배치·마이크 음량 게임 규칙

- 실행일: 2026-08-04
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `ASSET_VALIDATION` + `DOCS_UPDATE` + `DEMO_QA`
- 상태: 구현·자동 검증·로컬 데스크톱/모바일 QA PASS. 실제 마이크·Pages 재배포 QA 대기

### 처리 내용

- 물리 에셋을 `assets/source/`와 `assets/runtime/`으로 통합하고 에셋 문서를 `docs/assets/`에 모았다. Vite dev는 runtime을 `/assets/`로 제공하고 build에서 `dist/assets/`만 게시한다.
- ZIP entry와 hash가 같은 `asset/doyoon-hero-sprites/` 압축 해제 중복 6장은 제거하고 ZIP과 삭제 이력을 보존했다. 출처·업로드자·도구·권리의 확인/미확인을 `PROVENANCE.md`에 분리했다.
- 도윤 11장을 source와 동일 바이트로 runtime에 채택했다. 타이틀·N0 첫 두 대사만 숨기고 이후 일상·관계·변신·battle·수렴·엔딩 매핑을 코드·대본·22개 dev 프리셋에 연결했다.
- 동일 배경 ID는 애니메이션하지 않고 변경 ID만 420ms crossfade한다. 감소 모션은 즉시 전환한다.
- 타이틀을 필수 마이크 설정 화면으로 교체했다. 입력 장치 선택, 실시간 RMS/peak/clipping dBFS, 900ms 적응형 보정, 테스트 통과 전 시작·이어하기 차단을 구현했다. 선택 장치 ID는 실제 PTT 녹음에도 유지한다.
- battle `spell`에만 음량 판정을 적용했다. 너무 작거나 큰 첫 실패는 무료 재시도, 같은 턴 두 번째는 `failed-spell +0`으로 턴을 소비한다. 게임 진입 뒤 클릭·로컬 폴백은 유지한다.
- 짧은 데스크톱 화면에서 시작 버튼이 첫 화면 아래로 밀리던 문제와 Vitest가 Vite build 훅으로 임시 에셋 폴더를 만들던 문제를 QA 중 발견해 수정했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 35 files, 138 tests. 재실행 뒤 임시 에셋 폴더 생성 0 |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | game-only QA build 성공 |
| runtime 격리 | PASS | source 0, ZIP 0, runtime 27개·5,023,720B가 dist에 동일 복사, QA에서 STT Lab 0 |
| 데스크톱 타이틀 | PASS | 1265×720에서 마이크 UI·비활성 시작/이어하기가 한 화면에 표시, overlay·console error·가로 overflow 0 |
| 도윤 dev 프리뷰 | PASS | N0 `normal_tired`, battle p1 `magical_defend` 실파일 표시. 누락 주노·망령은 검은 presentation 유지 |
| QA 모바일 | PASS | 390×844, 새 QA 배너·필수 마이크 화면·비활성 시작 버튼 표시, 가로 overflow·console error 0 |
| 실제 마이크·battle 음량 수동 QA | 대기 | 브라우저 자동화에서 사용자 마이크 권한을 승인하거나 실제 음성을 수집하지 않음. 심사 PC에서 별도 수행 |

### 현재 판정

- 이번 확정 기능의 코드·문서·자동 QA는 통과했다.
- 주노 runtime 승인, 망령 2장, 변신 컷 2장, 필수 BGM 3종, 생성·라이선스 증빙과 실제 마이크 저/정상/고음량 검증은 남아 있다.
- 위 외부·현장 게이트 전에는 `M5 기능 구현 PASS / 최종 에셋·현장 QA 대기`로 보고한다.

## M5 — 주노 runtime 통합·도윤 우측 상반신 구도

- 실행일: 2026-08-04
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `ASSET_VALIDATION` + `DOCS_UPDATE` + `DEMO_QA`
- 상태: 주노 5표정 runtime 통합, 도윤 반응형 배치, 자동·Browser 장면 QA PASS. 권리·남은 외부 에셋 대기

### 처리 내용

- commit `6076466`의 과거 `docs/Asset/juno-reference-v2/`와 commit `6940236`의 현재 경로를 대조했다. delivery 5장과 source 10장이 `assets/source/juno/`로 `R100` 이동된 동일 파일임을 확인했다.
- 자동 규격 보고서를 통과한 delivery 5장을 `assets/runtime/char/`에 source와 동일 바이트로 채택했다. 기존 `juno.neutral/happy/shy/upset/surprised` resolver를 그대로 사용했다.
- 도윤에 `doyun-visual` presentation class를 부여했다. 일반 대화·컷씬·엔딩은 화면 오른쪽에서 확대하고 상단 기준 crop으로 상반신을 표시한다. battle·dev 프리뷰도 같은 좌우 방향을 유지한다.
- 주노는 대화에서 중앙/왼쪽 보조 위치, battle에서는 도윤과 망령 사이의 작은 보조 위치로 배치했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| 주노 asset TDD | PASS | runtime 부재 ENOENT RED → 5장 복사 → 8개 M5 asset 테스트 GREEN |
| 주노 물리 계약 | PASS | 5/5 source/runtime hash 일치, 1200×2000, 8-bit indexed PNG + `tRNS`, 개별 800KB 이하 |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 35 files, 139 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | game-only QA build 성공 |
| runtime 격리 | PASS | 32개·5,896,191B가 dist에 동일 복사, 주노 5장 포함, source·ZIP 0 |
| Browser N2 | PASS | `surprised` 투명 PNG와 도윤 우측 확대가 실제 `bg_hall_day` 위에 표시, 깨진 이미지 0 |
| Browser battle p1 | PASS | `neutral` 주노, 망령 black fallback, 도윤 우측 상반신 구도 동시 표시 |
| 모바일 | PASS | 390×844, 가로 overflow 0, 이미지 로드 실패 0 |
| 콘솔 | PASS | error 0. 미제작 `gray_wraith.normal`의 계약된 `[ASSET_HANDOFF]` warning만 발생 |

### 현재 판정

- 주노 5표정은 `missing`에서 `ready`로 전환했다. 레퍼런스 권한과 생성 서비스 공개·해커톤 사용 허용 확인 전 `approved`는 아니다.
- 도윤 우측 상반신 구도는 구현·시각 QA 통과. 장면별 반대 방향 전환은 승인되지 않아 추가하지 않았다.
- 망령 2장, 변신 컷 2장, 필수 BGM 3종, 실제 마이크 QA는 계속 남는다.

## M5 — 대사별 도윤 감정·캐릭터 배치·게임 UI 보정

- 실행일: 2026-08-04
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `SCENARIO_VALIDATION` + `ASSET_VALIDATION` + `DEMO_QA`
- 상태: 기존 승인 에셋 안에서 구현·자동·Browser QA PASS. 누락 외부 에셋·권리·실제 마이크 게이트 유지

### 처리 내용

- dialogue 응답에서 버려지던 `intentId`를 클릭·로컬 매칭·LLM 판정부터 `GameView`까지 전달했다. `presentationDoyun`이 N2~N4의 실제 플레이어 태도를 기존 runtime 11종 표정으로 해석한다. 의도 판정이 불가능한 폴백은 장면 기본 표정을 유지한다.
- 도윤을 더 확대·하향하고 화면 중심 쪽으로 옮겨 하반신 crop을 허용했다. 작은 주노는 도윤 쪽으로 붙여 데스크톱·모바일·battle·dev 프리뷰의 인물군 간격을 통일했다.
- 사용자 지정 LobeHub `sanali209-pla_teplate-game-ui-design`과 frontend design 지침을 적용했다. 심사 콘솔·사원증 모티프, 앰버/시안 포인트, 5% 안전 영역, 14px 이상 보조 글자, 48px 이상 조작 영역, focus-visible, reduced-motion을 반영했다.
- QA 빌드 검사에서 상단 배너가 화면 모서리에 붙고 dev 장면 선택기와 겹치는 문제를 발견했다. 배너를 안전 영역 안으로 옮기고 별도 offset으로 선택기를 분리했다.
- 승인되지 않은 source 추가 도윤 스프라이트와 작가 소유 scenario JSON은 변경하지 않았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| 도윤 감정 TDD | PASS | N2 첫 반응·후속, N3 망령 대응, N4 관계 대사별 4개 RED→GREEN cycle |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 35 files, 143 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 크기 경고만 유지 |
| `npm run build:qa` | PASS | game-only QA build 성공 |
| Browser desktop | PASS | title·N2·N4-C·battle p1, 의미 있는 DOM·에셋 로드·framework overlay 없음 |
| Browser mobile | PASS | 390×844 title·N2, 도윤 확대·하향 crop과 주노 접근 배치, 가로 overflow 0 |
| Browser interaction | PASS | dev 장면 선택기 N2→N3 전환 뒤 URL·선택 상태·N3 DOM 확인 |
| console | 조건부 PASS | error 0. 계약된 미제작 `gray_wraith.normal` `[ASSET_HANDOFF]` warning만 존재 |
| QA 안전 영역 | PASS | banner 8px inset, banner/dev nav 비겹침, `noindex,nofollow`, 가로 overflow 0 |

### 현재 판정

- 요청된 도윤·주노 배치, N2~N4 응답 감정 매핑, UI 디자인 보정은 M5 기능 범위에서 통과했다.
- 망령 2장, 변신 컷 2장, 필수 BGM 3종, 주노·도윤 권리 증빙, 실제 마이크 저·정상·고음량 검증은 계속 남는다.
- 신규 source 도윤 스프라이트 활성화가 필요하면 논리 ID·장면 용도를 사용자가 별도 확정해야 한다.

## M5 — T 키 PTT·진행 잠금·Worker 응답·화면 배치 수정

- 실행일: 2026-08-04
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: 코드·자동·Browser QA PASS. 공개 QA 실제 STT 활성화 결정 대기

### 처리 내용

- 게임 내 dialogue·변신 주문·battle PTT에 전역 `T` 홀드/릴리스와 `aria-keyshortcuts`를 추가했다. 입력·선택 컨트롤 편집 중에는 가로채지 않는다. battle PTT가 둘이면 현재 포커스 버튼을 우선한다.
- 대사·응답·battle 결과·변신 결과·엔딩 페이지의 진행 버튼을 렌더 후 2초간 비활성화했다. 상태기가 준비 전·중복 진행을 함께 차단한다.
- STT·대화 LLM·battle LLM Worker 응답의 Content-Type과 JSON 파싱을 중앙 경계에서 검사한다. Pages HTML fallback을 원문 파싱 예외 대신 서비스별 한국어 연결 오류로 바꿨다.
- 상단 상태 헤더를 `vw` 기준 64px에서 `vh` 기준 21.6px으로 올렸다. 1280×720 본편에서 도윤 컨테이너 top을 -1.6px에서 70.4px으로 내려 머리 전체와 헤더 경계를 분리했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | HTML Worker 응답 RED→GREEN, T 홀드/릴리스 RED→GREEN, 2초 잠금 RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 37 files, 150 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | game-only QA build 성공 |
| Browser desktop | PASS | 1280×720 실제 title 마이크 통과→N0→N1. 헤더 top 21.6px, 도윤 top 70.4px, 가로 overflow 0 |
| Browser mobile | PASS | 390×844 도윤 top 203.4px, 머리 잘림·가로 overflow 0 |
| 2초 진행 | PASS | 렌더 직후 `계속 · 2초 후` disabled, 2초 뒤 `계속` 활성·한 번 진행 |
| T 키 UI | PASS | N1 PTT에서 `T` 입력이 녹음 경로를 호출했다. 짧은 입력은 영문 디코딩 오류 대신 한국어 재시도 안내와 현재 턴 클릭 폴백으로 전환됐다. 실제 외부 전사는 미실행 |

### 현재 판정

- 요청된 로컬 입력·진행·오류 표시·배치 수정은 통과했다.
- DEC-041 공개 QA는 음성 Worker 비활성이다. 실제 Pages STT 활성화는 Cloudflare Worker 배포·Pages Origin·Secret·최종 공급자 결정 뒤 수행한다.

## M5 — 공개 QA GPT STT Worker 활성화

- 실행일: 2026-08-04
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: GPT STT Worker 실배포·합성 한국어 WAV 실호출·Pages 배포·공개 브라우저 쉘 PASS. 사용자 실제 발화 smoke 대기. Gemini 대화·전투는 Cloudflare egress 지역 제한 BLOCKED

### 처리 내용

- QA build가 명시적 HTTPS `VITE_WORKER_URL` 없이는 실패하도록 만들고 GitHub repository variable `QA_WORKER_URL`에 실제 Worker URL을 등록했다.
- 공개 게임의 STT 공급자를 OpenAI `gpt-transcribe`로 고정했다. `?stt=gemini`도 무시하며 production `/transcribe/gemini`는 404를 반환한다. Gemini STT 비교는 로컬 전용 `wrangler.stt-lab.jsonc`로 격리했다.
- Cloudflare `qa` Worker의 허용 Origin을 `https://2klips.github.io` 하나로 제한하고 기존 `.env.local`의 OpenAI·Gemini 키를 Secret으로 등록했다. 키 값은 로그·문서·커밋에 기록하지 않았다.

### Worker 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| 배포 | PASS | `nhn-voice-m5-qa-worker` 공개 `workers.dev` endpoint 생성 |
| Secret | PASS | `OPENAI_API_KEY`, `GEMINI_API_KEY` 이름만 확인. 값 비노출 |
| Origin | PASS | Pages Origin 200·정확한 ACAO, 임의/누락 Origin 403 |
| GPT STT | PASS | 비개인 합성 한국어 WAV → `gpt-transcribe` 200, 원문과 동일 전사 |
| Gemini STT 차단 | PASS | `/transcribe/gemini` 404, upstream 호출 없음 |
| Gemini LLM | BLOCKED | 로컬 동일 Secret·payload 200, Cloudflare Worker는 Google `FAILED_PRECONDITION: User location is not supported for the API use.` 400 |
| Pages workflow | PASS | run `30921607665`, commit `5e51abc`, check/test/build·artifact 경계·배포 성공 |
| 공개 브라우저 | PASS | commit 배너, 마이크 선행 게이트, 장치 열거, `noindex,nofollow`, 이미지 실패 0, 가로 overflow 0, Console error/warning 0 |
| 브라우저 실제 발화 | 대기 | 마이크 연결은 성공했으나 자동 QA 중 입력이 `-96 dBFS` 무음. 사용자가 테스트 문장을 말해 통과·게임 내 GPT 전사를 확인해야 함 |

### 현재 판정

- 공개 QA의 GPT STT 서버 경계와 Pages 배포는 활성화됐다. 사용자 실제 마이크로 타이틀 테스트 문장과 게임 내 GPT 전사를 각 1회 확인하는 smoke만 남는다.
- Gemini LLM 실패 때 기존 클릭·로컬 폴백으로 ending까지 진행할 수 있다. 공급자 변경 또는 별도 backend 도입은 제품·운영 결정이므로 사용자 확정 전 수행하지 않는다.

## M5 — 공개 QA 대화·전투 OpenAI 전환

- 실행일: 2026-08-05
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: QA Worker OpenAI 대화·전투 실호출과 Pages·Browser QA PASS. 사람 음성/다중 대화 품질 smoke 대기

### 처리 내용

- 사용자 결정 DEC-052에 따라 공개 QA `/judge/dialogue`, `/judge/battle`을 OpenAI Responses API `gpt-5.6-luna`, `reasoning.effort: low`로 전환했다. `text.format` strict JSON Schema, `store: false`, 최대 출력 256 토큰을 적용했다.
- Worker 내부에 OpenAI/Gemini structured LLM 어댑터를 추가했다. 로컬 M3 회귀 기본값은 Gemini로 유지하고 공개 `qa` 환경만 OpenAI로 고정했다. 공개 HTTP route, 클라이언트 zod 검증, intent·flag 화이트리스트, 안전 응답 검사, 클릭·로컬 완주 폴백은 바꾸지 않았다.
- `/health`에 실제 LLM 공급자·설정 여부·모델을 추가했다. QA 배너에도 `OpenAI LLM 활성`을 표시했다.
- QA Worker의 `GEMINI_API_KEY` Secret을 제거했다. 로컬 `.env.local`과 비교 Lab 설정은 변경하지 않았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | OpenAI 대화 502 RED→200 GREEN, battle 502 RED→200 GREEN, QA 배너 RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files, 156 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | game-only QA build 성공 |
| Wrangler dry-run | PASS | `env.qa` OpenAI binding 확인, 설정 경고 0 |
| Worker deploy | PASS | version `26429c08-8976-48a4-a126-b27a733df679`, startup 19ms |
| Worker health | PASS | `llmProvider=openai`, `llmConfigured=true`, `llmModel=gpt-5.6-luna`, `geminiConfigured=false` |
| OpenAI 대화 실호출 | PASS | Pages Origin, `/judge/dialogue` 200, JSON 판정 반환 |
| OpenAI 전투 실호출 | PASS | Pages Origin, `/judge/battle` 200, momentum·narration JSON 판정 반환 |
| Secret 최소화 | PASS | QA Secret 이름 목록에 `OPENAI_API_KEY`만 존재. 값 비노출 |
| Pages workflow | PASS | run `31002296462`, commit `4efc6a8`, check/test/build·artifact 경계·배포 성공 |
| Browser desktop | PASS | 새 OpenAI 배너·commit, 마이크 선행 화면, title 확인. framework overlay·console warn/error 0 |
| Browser mobile | PASS | 390×844, 가로 overflow 0, 새 배너·마이크 화면 표시. console warn/error 0 |
| Browser interaction | PASS | `?debug=1` 장면 선택기에서 N2 주노 등장 선택, 선택 상태·도윤/주노 DOM·장면 메타 갱신 |

### 현재 판정

- 공개 QA 서버의 대화·전투 LLM 지역 제한은 OpenAI 전환으로 해소됐다. 배포 직후 첫 POST 한 번은 구버전 isolate 응답이었으나 cache-buster 재호출과 Secret 제거 뒤 health·대화·전투가 새 버전에서 반복 통과했다.
- Pages 배너·commit 배포와 브라우저 렌더 확인까지 완료됐다. 사람 음성 STT와 여러 자유 발화의 말투·판정 품질은 별도 수동 QA로 남는다.

## M5 비주얼 노벨 UI 전면 개편

- 실행일: 2026-08-05
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: 코드·자동·Browser QA·Pages 재배포 PASS

### 처리 내용

- `game-ui-design`의 가독성·safe zone·피드백 규칙을 적용해 대화창을 화면 하단의 일반적인 비주얼 노벨 구조로 개편했다. 주노는 좌측·청록, 도윤은 우측·분홍, 회색 망령은 좌측·보라, 정체불명 목소리는 중앙·금색으로 구분한다.
- 내레이션은 중앙의 중립색 대화창만 표시하고 이름표를 렌더하지 않는다. 캐릭터 대사는 발화자 방향에 맞춰 대화창과 이름표 위치를 좌우로 전환한다.
- 진행 버튼의 `2초 후`·초 단위 카운트다운 문구를 제거했다. 버튼 문구는 고정하고 2초 동안 실제 `disabled`, 이후 활성화한다.
- 플레이 화면의 상단 테스트 단계·상태 헤더와 공개 QA 시각 배너를 제거했다. QA 여부와 commit은 `html[data-qa-preview][data-qa-commit]` 비가시 DOM 표식으로 확인한다. `?debug=1`에서만 우측 상단 `DEBUG` 장면 선택기를 표시한다.
- 1280×720에서 시작 버튼이 화면 아래로 잘리던 레이아웃을 압축했다. 모바일은 기존 세로 스크롤과 48px 입력 크기를 유지한다.
- 신규 외부 이미지·BGM·UI 에셋은 추가하지 않았다. 이번 개편에 따른 에셋 작업자 추가 요청 없음.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | 발화자별 방향·색상·이름표 계약, QA commit 표식 RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files, 157 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | Worker URL 주입 조건의 game-only QA build 성공 |
| Browser desktop | PASS | 1280×720, 시작 버튼 완전 노출, 가로·세로 overflow 0, 상단 상태·QA 배너 0 |
| Browser mobile | PASS | 390×844, 가로 overflow 0, 마이크 연결 버튼 첫 화면 노출, 세로 스크롤 정상 |
| Browser debug | PASS | 우측 상단 `DEBUG` 선택기만 표시, N2→N3 전환·URL·선택값 갱신 |
| QA artifact | PASS | `data-qa-preview=true`, `noindex,nofollow`, 비밀 입력 UI 0, 타이틀 렌더 정상 |
| Pages workflow | PASS | run `31004896656`, commit `93dae99`, check/test/build·artifact 경계·배포 성공 |
| 공개 Pages | PASS | commit `93dae99`, 1280×720 overflow 0, 시작 버튼 완전 노출, 상단 상태·QA 배너·일반 화면 debug 선택기 0 |

### 현재 판정

- 요청된 UI 계약은 구현·검증됐다. 실제 마이크 권한과 사람 음성 STT는 브라우저 자동화에서 대신 승인하지 않았으므로 기존 수동 QA 항목으로 유지한다.
- 공개 Pages 재배포와 브라우저 확인까지 완료됐다. Actions에 Node 20 폐기 예정 경고가 있으나 GitHub가 Node 24로 강제 실행해 현재 build·deploy에는 영향이 없다.

## M5 주노 색·내레이션·음성 UI 후속 정리

- 실행일: 2026-08-05
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: 코드·자동·Browser QA·Pages 재배포 PASS

### 처리 내용

- 주노의 발화자 색을 청록에서 노란색 계열로 변경했다. 어두운 대화창 표면과 밝은 노란색 테두리·이름표를 함께 적용해 배경 위 대비를 유지한다.
- `speaker: narration`인 독백·내레이션을 화면에서 `(…)` 형식으로 표시한다. 이미 괄호가 있는 문장은 중복으로 감싸지 않으며 원본 시나리오 JSON은 변경하지 않는다.
- 고정된 STT·GPT 공급자 표기를 플레이 UI에서 제거했다. 공개 QA의 내부 공급자 계약은 OpenAI `gpt-transcribe`·`gpt-5.6-luna`로 유지한다.
- 음성 인식이 끝난 뒤 최종 TRANSCRIPT를 화면에 표시하지 않고 `음성 입력 완료`·`응답 판정 중…` 상태만 표시한다. 실제 전사 문자열은 대화·전투 판정 내부 입력으로 계속 사용한다.
- 신규 외부 이미지·BGM·UI 에셋은 추가하지 않았다. 이번 변경에 따른 에셋 작업자 추가 요청 없음.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | 내레이션 괄호·중복 방지·캐릭터 원문 유지, 고정 공급자 컨트롤 숨김 RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files, 159 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | Worker URL·QA commit 주입 조건의 game-only QA build 성공 |
| QA artifact | PASS | `GPT · 고정`, `최종 TRANSCRIPT`, `인식 완료 · final` 문자열 노출 0, `noindex,nofollow` 유지 |
| Browser desktop | PASS | 1280×720, 주노 `#ffd84d`, 고정 공급자·최종 TRANSCRIPT 노출 0, 가로 overflow 0 |
| Browser mobile | PASS | 390×844, 주노 색 토큰 반영, 고정 공급자·최종 TRANSCRIPT 노출 0, 가로 overflow 0 |
| Browser debug | PASS | N3 전환·URL·선택값 갱신, 발화자 색 반영, 일반 화면 debug 선택기 0 |
| Pages workflow | PASS | run `31006360858`, commit `526a1fd`, check/test/build·artifact 경계·배포 성공 |
| 공개 Pages | PASS | `data-qa-commit=526a1fd`, `data-qa-preview=true`, 주노 `#ffd84d`, 제거 대상 노출 0, 가로 overflow 0 |

### 현재 판정

- 사용자 요청 3건은 구현·검증됐다. STT·GPT 기능 및 공개 QA 공급자는 변경하지 않고 표시만 제거했다.
- 실제 마이크 권한·사람 음성·전사 비노출 상태의 판정 진행은 브라우저 자동화로 대신할 수 없어 수동 QA로 유지한다.
- 미제공 `gray_wraith.normal`은 기존 에셋 인계 항목이며 이번 변경과 무관하다.

## M5 PTT 단일 표시와 음성 상태 영역 제거

- 실행일: 2026-08-05
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA`
- 상태: 코드·자동·Browser QA·Pages 재배포 PASS

### 처리 내용

- 대화의 “마이크 버튼 또는 T 키를 누른 채 말하고, 놓으면 판정해.” 고정 안내문을 제거했다. 변신 주문의 동일 성격 안내문도 제거했다.
- 본편 대화·변신 주문·전투에서 `음성 입력` 카드, 마이크 상태 배지, 하단 `음성 모드/실패 횟수` pill을 제거했다. 관련 미사용 view·CSS·턴 표시 helper도 함께 삭제했다.
- 대화 PTT의 기본 문구는 `누르고 말하기`로 고정했다. 주문·전투는 행동 구분만 앞에 유지하고 노출된 `· T` 문구는 제거했다.
- 포인터·Space/Enter·전역 `T` 홀드/릴리스 기능은 유지한다. 같은 버튼이 청취 중 `듣는 중… 놓으면 전송`, release 뒤 `판정 중…`으로 바뀌며 판정 중에는 disabled와 `aria-busy=true`를 적용한다.
- STT 전사·LLM 판정·오류 notice·클릭/로컬 폴백·타이틀 마이크 테스트는 변경하지 않았다. 신규 에셋 요청 없음.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | 별도 안내·상태 영역 없이 `누르고 말하기`만 표시하는 계약 RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 37 files, 159 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | Worker URL·QA commit 주입 조건의 game-only QA build 성공 |
| QA artifact | PASS | 고정 안내·`음성 입력 완료`·`응답 판정 중`·caption/mic/input-status selector 노출 0, PTT 3상태 문구 포함 |
| Browser desktop | PASS | 1280×720, `누르고 말하기`, 안내 0, 상태 영역 0, 공급자 UI 0, 가로 overflow 0 |
| Browser mobile | PASS | 390×844, 안내 0, 상태 영역 0, 가로 overflow 0 |
| Browser interaction | PASS | `T` 입력에서 release 후 `판정 중…`, disabled, `aria-busy=true`; `aria-keyshortcuts="T Space Enter"` 유지 |
| Browser console | 조건부 PASS | 앱 오류 0. 저장소 밖 하네스 origin 때문에 runtime 에셋 3종의 의도된 `[ASSET_HANDOFF]` 경고만 발생 |
| Pages workflow | PASS | run `31009304184`, commit `d1cd516`, check/test/build·artifact 경계·배포 성공 |
| 공개 Pages | PASS | `data-qa-commit=d1cd516`, `data-qa-preview=true`, 제거 대상 영역·문구 0, 가로 overflow 0, 공개 URL console error/warn 0 |

### 현재 판정

- 요청된 PTT 단일 표시 계약은 코드·자동·렌더·공개 Pages QA에서 통과했다.
- 실제 사람 음성으로 STT·LLM까지 완료되는 공개 Pages smoke는 수동 QA로 남는다.

## M5 PTT 키 표기·전달 상태·진행 잠금 단축

- 실행일: 2026-08-05
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA` + STT 모델 조사
- 상태: 코드·자동·Browser QA·Pages 재배포 PASS

### 처리 내용

- 대사 진행 잠금을 2초에서 1.5초로 단축했다. 대사·판정 응답·엔딩 모두 같은 `DelayedActionGate`를 사용한다.
- 게임 내 대화·변신 주문·전투 PTT 버튼에 실제 전역 단축키 `(T)`를 표시했다. 포인터·Space/Enter·전역 T 동작과 `aria-keyshortcuts="T Space Enter"`는 유지한다.
- release 뒤 처리 문구를 `판정 중…`에서 `목소리 전달 중…`으로 변경했다. 처리 중 `disabled`, `aria-busy=true` 계약은 유지한다.
- 장면 selector는 일반 플레이 노출과 debug 헤더 이동 중 사용자 답이 없어 변경하지 않았다. 기존 `?debug=1` 우측 상단 selector만 유지한다.
- 신규 외부 이미지·BGM·UI 에셋은 추가하지 않았다.

### STT 모델 조사

- 현재 공개 QA는 OpenAI 권장 파일 전사 모델 `gpt-transcribe`를 사용한다. Worker는 이미 `languages[]=ko`와 한국어·고유명사 prompt를 전달한다.
- 정확도 우선 즉시 후보는 모델 교체보다 `keywords[]` 추가 후 한국어 발화 세트 CER/p50/p95 재측정이다.
- `gpt-live-transcribe`는 저지연 live transcript 후보지만 Realtime WebSocket·오디오 스트리밍 전환이 필요해 현재 multipart Worker의 drop-in 교체가 아니다.
- `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`은 API 대안이지만 최신 공식 가이드는 일반 파일 전사에 `gpt-transcribe`를 먼저 권장한다. 승인 없이 모델·Worker 경로를 변경하지 않았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | 1.5초·`누르고 말하기 (T)`·`목소리 전달 중…` 계약 RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 37 files, 159 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | Worker URL·QA commit 주입 조건의 game-only QA build 성공 |
| Browser PTT | PASS | 1280×720, `(T)`·`aria-keyshortcuts` 표시, 별도 상태 영역 0, 가로 overflow 0 |
| Browser interaction | PASS | T release 뒤 `목소리 전달 중…`, disabled, `aria-busy=true`, `aria-pressed=false` |
| Browser advance gate | PASS | 즉시·1.0초 waiting/disabled, 1.7초 ready/enabled, 연타 적용 1회 |
| Browser console | 조건부 PASS | 앱 예외·framework overlay 0. 저장소 밖 하네스 origin의 의도된 `[ASSET_HANDOFF]` 경고만 발생 |
| 공개 Pages | PASS | Actions run `31011960612`, `data-qa-commit=27c18cc`, `data-qa-preview=true`, 새 PTT·전달 문구 번들 반영, 기존 `판정 중…` 0, 가로 overflow 0 |

### 현재 판정

- 확정된 UI 변경은 구현·자동·렌더 QA를 통과했다.
- 실제 한국어 음성 정확도·지연은 동일 발화 세트로 `gpt-transcribe + keywords`와 `gpt-live-transcribe`를 별도 비교해야 한다.
- 장면 selector 노출 범위와 STT 실험안은 사용자 결정 전 보류한다.

## M5 debug STT 단일 모델 selector

- 실행일: 2026-08-05
- 작업 모드: `MILESTONE_IMPLEMENTATION` + `DEMO_QA` + OpenAI Realtime 실호출
- 상태: 코드·자동·로컬/공개 Worker·Browser QA·Pages 재배포 PASS

### 처리 내용

- 일반 플레이 STT는 `gpt-transcribe`, 대화·전투 LLM은 `gpt-5.6-luna`로 유지했다. 일반 화면에는 모델 selector·전사 결과·지연을 표시하지 않는다.
- `?debug=1` 우측 상단에 `gpt-transcribe`/`gpt-live-transcribe` 중 하나만 선택하는 STT selector를 추가했다. 같은 패널에 선택 모델·전사 결과·왕복/Worker/첫 delta 지연과 고정 LLM을 표시한다.
- 파일 전사는 16kHz WAV multipart를 유지하고 live 전사는 24kHz 16-bit mono PCM을 Realtime transcription WebSocket `intent=transcription` 세션에 append·commit한다. 한국어·고유명사 힌트와 `delay=low`를 사용한다.
- Worker는 모델 allowlist와 `ENABLE_OPENAI_STT_MODEL_SELECTOR` 환경 플래그를 모두 통과한 요청만 live 경로에 보낸다. API 키는 QA Secret에만 유지하고 클라이언트·문서·로그에 기록하지 않았다.
- 공개 Cloudflare 홍콩 edge에서 Realtime handshake가 `unsupported_country_region_territory` 403으로 거부되는 문제를 재현했다. 한국 regional endpoint는 Realtime 미지원이라 사용하지 않고 QA Worker에 Placement Hint `aws:us-east-1`을 적용해 해결했다.
- 신규 외부 이미지·BGM·UI 에셋은 필요하지 않다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TDD | PASS | debug 전용 모델 해석·16/24kHz·단일 model 필드·Worker 게이트·Realtime append/commit 5 tests RED→GREEN |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files, 164 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| `npm run build:qa` | PASS | game-only QA build 성공 |
| 로컬 OpenAI 실호출 | PASS | 같은 한국어 WAV 정확 전사. `gpt-transcribe` 총 1.374초, live 총 3.513초·첫 delta 1.234초 |
| 공개 QA Worker | PASS | version `9b6eac8d-94dc-42af-b182-27a0e2847d21`; health 모델/LLM 계약 200. 파일 전사 upstream 1621ms, live upstream 3275ms·첫 delta 765ms |
| Worker 보안 경계 | PASS | 지원 외 모델 400, 비허용 Origin 403, Secret 값 diff 노출 0 |
| Browser desktop | PASS | 1280×720, 일반 selector/결과 0, debug selector 2개 option·LLM 표기·query 전환, 가로 overflow 0 |
| Browser mobile | PASS | 390×844 override, debug selector 표시, 가로 overflow 0 |
| Browser console | PASS | 공개 Pages error/warn 0 |
| Pages workflow | PASS | run `31017761407`, commit `534efb5`, source 검증·QA artifact 경계·배포 성공 |
| 공개 Pages | PASS | `data-qa-commit=534efb5`, `data-qa-preview=true`, 일반/debug 표시 경계 정상 |

### 현재 판정

- 요청된 두 STT 모델의 debug 단일 선택 비교와 공개 QA 실호출이 동작한다.
- 측정값은 깨끗한 동일 WAV 1건 결과다. 실제 마이크·억양·배경 소음별 정확도와 p50/p95는 작업자 수동 QA가 남는다.
- M6 production에서 debug selector를 유지할지는 DEC-021과 함께 별도 확정해야 한다.

## M5 연출 폴리시 WP1-1·WP1-4 — BGM·회색 망령 runtime 채택

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)` + `ASSET_VALIDATION`
- 상태: 자동 규격·동일 바이트·build PASS, 사람 시청각·권리 QA 대기

### 처리 내용

- `assets/source/bgm/delivery/`의 BGM 5곡을 같은 파일명으로 `assets/runtime/bgm/`에 복사했다.
- `docs/gray-wraith-action-v2/delivery/char/char_gray_wraith_normal.png`를 같은 파일명으로 `assets/runtime/char/`에 복사했다.
- source/runtime SHA-256 동일성을 확인하고 manifest를 `ready`로 갱신했다. 라이선스 확인 전 `approved`로 올리지 않았다.
- `gray_wraith.weakened`와 변신 컷 2장은 누락 상태와 제작 요청을 유지했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| BGM 동일 바이트 | PASS | 5/5 source/runtime SHA-256 일치 |
| 망령 동일 바이트 | PASS | SHA-256 `508F119B…08756839` 일치 |
| 물리 규격·용량 | PASS | BGM 각 3MB 이하, 망령 1200×2000 투명 PNG·413,056B |
| runtime 총합 | PASS | 38 files·11,511,198B, 30MB 이하 |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files·166 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| 사람 청감·합성·권리 | 대기 | BGM 3회 루프·대사 마스킹·PTT duck, 망령 장면 합성, 생성 당시 권리 증빙 필요 |
