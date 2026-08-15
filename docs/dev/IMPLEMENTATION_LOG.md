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

## M5 연출 폴리시 WP1-2·WP1-4 — 선호 BGM·weakened 파생 폴백

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)` + `SCENARIO_VALIDATION` + `ASSET_VALIDATION`
- 상태: 코드·자동 검증 PASS, 브라우저 장면·청각 QA 대기

### 처리 내용

- DEC-059에 따라 `n3_wraith_choice`, `n5_transform`을 `bgm_crisis`로, `ch3_gray_answer`와 3엔딩을 `bgm_ending`으로 정렬했다. N4는 필드 없이 crisis를 이어받는다.
- 22개 dev 프리뷰 중 위기 6개와 수렴·엔딩 6개의 BGM 표시를 같은 계약으로 정렬했다.
- DEC-060에 따라 `gray_wraith.weakened` 물리 파일이 없으면 normal + CSS 파생, normal도 실패하면 검은 presentation으로 강등한다.
- 납품된 `attack/hit/death`는 신규 논리 ID로 등록하지 않았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| targeted tests | PASS | loader·asset·dev preview 3 files·23 tests |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files·168 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| 시나리오 범위 | PASS | `scene.bgm` 6개 외 대사·분기·스키마 변경 없음 |
| 사람 장면·청각 QA | 대기 | weakened 파생 합성, N3 crisis crossfade, N5 one-shot, 수렴·3엔딩 ending곡 확인 필요 |

## M5 연출 폴리시 WP1-3 — BGM controller 견고화

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·자동 검증 PASS, 사람 청감 QA 대기

### 처리 내용

- 재생 실패로 catalog가 unavailable 처리한 BGM 경로는 같은 세션에서 새 `Audio()`를 만들지 않는다.
- `NotAllowedError`는 오류로 승격하지 않고 다음 `pointerdown`에서 최신 요청을 한 번 재시도한다. 새 장면이 이미 재생되면 대기 요청을 취소한다.
- 기본 음량을 `0.62`, PTT duck을 기본 음량의 `0.18배`로 분리했다.
- 동일 `bgm_transform` one-shot 요청은 결과 재렌더에서 다시 만들거나 재생하지 않는다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| audio targeted tests | PASS | play rejection·error event·autoplay retry·duck·one-shot 5 tests |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files·171 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| 사람 청감 | 대기 | 헤드폰·노트북 스피커의 대사 명료도, 3회 loop, PTT duck 복귀 필요 |

## M5 연출 폴리시 WP6 — 캐릭터 이미지-대화 정합 전수 점검

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)` + `ASSET_VALIDATION`
- 상태: 코드·문서 매트릭스 완료, 브라우저 최종 합성 QA 대기

### 처리 내용

- `scenario.json` 14개 노드의 모든 라인·intent, battle p1~p3 행동·65 전이, GOOD/NORMAL/BAD 모든 라인을 계약과 실제 resolver에 대조했다.
- A형 1건: N5 주문 게이트에서 사라지던 주노를 직전 N4 `npcEmotion`으로 유지하도록 수정했다.
- B형 1건: `n2_juno_intro.npc.startEmotion=happy`는 대본의 `surprised → happy`와 어긋나지만 작가 JSON이므로 수정하지 않았다.
- C형은 기존 요청 3종(`gray_wraith.weakened`, 변신 컷 2장)뿐이며 신규 표정 논리 ID 제안은 없다.
- 전체 결과는 `docs/assets/CHARACTER_IMAGE_DIALOGUE_AUDIT.md`에 고정했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| 14개 노드 전수 매트릭스 | PASS | N0~N5, battle, 수렴, 3엔딩 전 라인·비트 기록 |
| A형 코드 수정 | PASS | N5 gate 주노 표정 연속성 resolver·unit test 추가 |
| 작가 JSON 보호 | PASS | `public/scenario/scenario.json` 변경 없음 |
| 신규 C형 | PASS | 신규 제안 0건; 기존 미납품 3종 문서 연결 |
| 22개 프리뷰·N4-A/B/C 실플레이 | 대기 | WP3/WP4 최종 레이아웃 완료 뒤 브라우저 전수 QA |

## M5 연출 폴리시 WP4-1 — 단일 전투 무대

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 구조·자동 검증 PASS, 브라우저 데스크톱/모바일 QA 대기

### 처리 내용

- 전투 대기 화면의 썸네일 그리드와 행동 결과의 float 카드를 폐기하고 둘 다 `battle-stage` 공통 구조로 렌더한다.
- 망령 좌측 대형 전신, 도윤 우측 확대 상반신, 주노 도윤 곁 소형 보조 슬롯을 p1~p3에서 고정했다.
- 상단 HUD를 `기세` 게이지와 3단계 점 표시로 축소했다.
- 적 도발·판정 결과는 같은 망령 대화창에 표시하고, 입력·결과 버튼은 하단 dock에서만 교체한다.
- 버튼의 `+15`, `+3`, `S/A/B 등급으로 수렴` 수치 문구를 제거했다. 전투 FSM·수치·대사 원문은 변경하지 않았다.
- desktop과 390×844 전용 무대 배치 CSS를 추가하고 `.battle-screen` 전체 스크롤을 차단했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TypeScript | PASS | `npm run check` 오류 0 |
| 전투 presentation unit | PASS | p1/p2/p3 도윤·주노·phase index 계약 추가 |
| 게임 로직 변경 | PASS | `src/battle/`, judge, branch, scenario JSON 변경 없음 |
| 브라우저 합성 | 대기 | WP4-2 액션 연출 결합 뒤 1280×720·390×844 확인 |

## M5 연출 폴리시 WP4-2/3 — 행동·페이즈·정화 연출

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·자동 검증 PASS, 브라우저 모션·청각 QA 대기

### 처리 내용

- battle→battle 렌더에서는 `<main>`과 `battle-stage` DOM을 유지하고 배경·인물·대화·입력 하위 상태만 갱신한다.
- 게이지 fill을 이전 momentum으로 먼저 렌더한 뒤 2프레임 뒤 현재 값으로 이동시켜 260ms transition을 복구했다.
- 주문 성공은 도윤 발광→망령 hit→망령 위치 파티클, 실패는 도윤 미세 흔들림, 버티기는 방어막, 자유 대응은 축소 시퀀스로 분리했다.
- momentum 65 상·하향에서 망령 weakened/recover를 800ms로 전이한다. 실파일이 없으면 DEC-060 CSS 파생을 유지한다.
- 페이즈 전환에 주노 callout·인물 crossfade를 추가하고, 완료 시 대량 파티클·정화광·세계관식 S/A/B 문구를 같은 무대에서 표시한다.
- 버티기 행동 순간에만 `doyun.magical_defend`, 나머지는 phase pose를 쓰는 DEC-063을 기록했다.
- particle burst에 origin·count 옵션을 추가해 변신 기본 연출은 유지하고 battle 타격점만 망령 쪽으로 옮겼다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 38 files·174 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| battle 로직 회귀 | PASS | `src/battle/`, momentum·phase·grade 산식 변경 없음 |
| reduced-motion | PASS(코드) | 신규 animation 비활성 CSS, 파티클 기존 matchMedia gate 유지 |
| 실제 모션·SFX 순서 | 대기 | WP2 cue 연결 뒤 브라우저/헤드폰 QA |

## M5 연출 폴리시 WP3-A/B — 표준 미연시 대화창·타이프라이터

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·자동 검증 PASS, 브라우저 연속 10턴·모바일 QA 대기

### 처리 내용

- 화자별 좌/우/중앙 대화창 이동을 폐기하고 전 화자를 하단 중앙 `min(920px, 92vw)`에 고정했다.
- 주노 yellow·도윤 rose·망령 violet·voice amber는 이름표와 테두리 accent로 유지하고, 실제 화자 스프라이트만 밝게 강조한다.
- 24ms/글자, 쉼표 48ms, 문장부호 92ms 타이프라이터를 추가했다. 대화창 클릭·Space·Enter는 현재 문장을 즉시 완성한다.
- 텍스트 완성 및 기존 1.5초 타이머가 모두 끝나야 진행 버튼이 활성화되고, 준비되면 대화창 우하단에 `▼`가 나타난다.
- reduced-motion은 본문을 즉시 완성하며 next indicator·sprite crossfade 애니메이션을 끈다.
- 도윤/주노/망령 슬롯별 마지막 논리 ID를 기억해 동일 ID 재렌더 fade를 생략하고, 표정·상태 변경 시에만 180ms crossfade한다.
- 타이프라이터 중 `aria-live=off`, 완성 시 전체 문장 `polite` 전환으로 글자 단위 스크린리더 낭독을 막았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TypeScript | PASS | `npm run check` 오류 0 |
| presentation unit | PASS | 하단 중앙 5화자, sprite slot, 24/48/92ms 속도 계약 |
| 1.5초 잠금 | 유지 | `DelayedActionGate` 수치 무변경, text/timer 이중 gate |
| 브라우저 10턴·390×844 | 대기 | WP3-C 전환까지 결합 후 확인 |

## M5 연출 폴리시 WP3-C·WP5-1/2/3 — 장면 전환·등장·effect 수명

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·자동 검증 PASS, 브라우저 타이밍 QA 대기

### 처리 내용

- presentation context를 분리해 네 막 경계만 500ms 암전하도록 DEC-062를 적용했다.
- 배경 논리 ID가 같으면 계속 무전환, 다르면 기존 420ms crossfade를 유지한다.
- 떠나는 background image는 `animationend`에서 제거하고 reduced-motion/이벤트 누락 대비 520ms 안전 제거를 추가했다.
- N2 첫 등장 주노에 400ms 낙하와 착지 빛 번짐을 한 세션 1회만 적용했다.
- `applySceneEffect()`에 `fade`를 추가하고 자기 animation 종료 시 `effect-*` class를 제거한다.
- N5 주문의 줄바꿈이 보이도록 `.incantation-copy { white-space: pre-line; }`을 적용했다.
- 모든 신규 전환·등장 모션은 reduced-motion에서 비활성화된다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 39 files·179 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| act boundary unit | PASS | 지정 4경계 true, 일반 노드·battle 내부 false |
| effect lifecycle unit | PASS | fade class 자기 animationend 제거, none 무동작 |
| 브라우저 전환 | 대기 | 420/500ms 체감·N2 1회·reduced-motion 확인 |

## M5 연출 폴리시 WP3-D — Production 표시 문구 정리

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·문서·자동 검증 PASS, 실제 화면 문맥 QA 대기

### 처리 내용

- 변신·battle·ending에서 `MOMENTUM`, `+N`, 정확한 battle dBFS, 영어 console풍 eyebrow, 페이지 수를 제거했다.
- 결과 문구를 빛·안개·목소리 중심의 서사 표현으로 바꾸되 scenario JSON과 판정 결과는 변경하지 않았다.
- 타이틀 마이크 세팅은 한국어화했으며, 사용자가 요청한 dBFS 그래프·수치는 그 화면에서만 유지했다.
- cutscene의 미사용 `progress` 필드와 전달 코드를 제거했다.
- `?debug=1`의 scene/STT/transcript/latency/momentum/grade 재현과 부팅 데이터 오류 상세는 QA 계약으로 유지했다.
- 전수 목록과 유지 이유를 `docs/dev/PRESENTATION_LABEL_AUDIT.md`에 기록했다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| TypeScript | PASS | `npm run check` 오류 0 |
| scenario 보호 | PASS | `public/scenario/scenario.json` 변경 없음 |
| production 잔여 검색 | PASS | 내부 `momentum`은 변수·debug에만 남고, battle 표시 수치는 제거 |
| 실제 화면 문맥 | 대기 | full path 브라우저 QA에서 잘림·중복·타이밍 확인 |

## M5 연출 폴리시 WP2 — Web Audio SFX 확충

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·자동 검증 PASS, 헤드폰·노트북 청감 QA 대기

### 처리 내용

- 기존 confirm/cast/critical/impact/recognition_fail을 cue별 2~3층 tone으로 교체했다.
- advance/guard/wraith_shift/ending 4 cue를 추가하고 진행·버티기·65 전이·ending 진입에 연결했다.
- 주문은 성공 `cast`, 완창 `critical`, 불발 `recognition_fail`; 자유 대응은 성공 `impact`, 무변화 `confirm`으로 구분했다.
- 마스터 gain과 layer별 gain을 분리하고 전 cue를 0.4초 이하로 제한했다.
- 같은 cue 40ms 이내 중복을 막고 PTT press~release 동안 전 SFX를 억제한다.
- AudioContext 생성·resume·oscillator 실패는 exception 없이 무음으로 강등한다.
- 외부 SFX 파일·의존성·이벤트 버스는 추가하지 않았다.

### 검증 결과

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 40 files·182 tests |
| `npm run build` | PASS | production build 성공. 기존 transformers chunk 경고만 유지 |
| SFX unit | PASS | 40ms throttle, PTT suppression, Context 실패 무음 |
| 실제 청감 | 대기 | 헤드폰·노트북 스피커에서 BGM/대사 대비 크기·피로도 확인 |

## M5 연출 폴리시 통합 브라우저 QA·Production 상태 노출 수정

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 클릭 GOOD 완주·22프리셋·반응형·reduced-motion PASS, 사람 음성/청각·9회 완주 매트릭스 대기

### 확인·수정 내용

- 실제 Logitech G733 마이크 권한을 허용하고 입력 장치 목록, dBFS 미터 변화, 테스트 완료, `시작` 활성화를 확인했다.
- 실제 플레이를 타이틀→N0~N5→3페이즈 battle→수렴→GOOD 마지막 페이지까지 클릭 경로로 완주했다.
- battle 첫 주문 전후 같은 `.battle-stage` DOM 인스턴스가 유지되고 momentum 50→65, p1→p2→p3, S 등급, weakened CSS 파생이 정상 반영됐다.
- 22개 debug 프리셋을 1280×720과 390×844에서 전수 검사했다. 깨진 실이미지와 가로·세로 overflow는 0이었다. 검은 placeholder는 계약된 변신 컷 2장과 선택 GOOD 후속 컷만 남았다.
- reduced-motion에서 N2·battle·GOOD preview의 animation이 `none`, overflow가 0임을 브라우저에서 확인했다.
- 실제 GOOD 마지막 페이지에서 문서 원칙에 어긋난 `호감도/플래그` production 상태 요약을 발견해 제거했다. 관련 dead CSS와 QA 문서의 과거 좌우 대화창·누락 망령/BGM 문구도 현재 계약으로 정리했다.
- console error는 0이다. warning 3건은 문서화된 `transform.cast`, `transform.complete`, `gray_wraith.weakened` 누락 handoff뿐이다.
- 병합 전 작업 브랜치만 감시하던 임시 QA Pages workflow의 push 대상을 `main`으로 교체해 최신 QA 커밋이 자동 배포되도록 복구했다.
- 첫 `main` 배포는 source 검증·QA build·artifact upload가 모두 PASS했지만 Pages backend가 10분 동안 `deployment_queued`에 머물러 timeout됐다. `deploy-pages@v4`의 timeout 상한도 10분이라 15분 설정은 적용할 수 없어 제거했다. 이후 기존 deployment를 명시적으로 취소했고, SFX 작업 브랜치의 동시 실행이 최신 `main` 배포를 취소한 문제도 해당 실행 취소와 branch 병합으로 정리했다.
- 병합된 `main` SHA `f45f076`의 run `31108793141`도 build·artifact 단계는 PASS했다. Pages backend가 약 4분 `deployment_queued`, 이후 약 6분 `deployment_in_progress`에 머물러 10분 상한으로 취소됐다. 공개 URL은 HTTP 200·`noindex,nofollow`지만 이전 QA SHA `ba38d7a`를 계속 제공한다. GitHub 공식 상태는 Actions·Pages 정상으로 표시되므로 저장소 Pages site 재생성 또는 GitHub 지원 문의가 다음 외부 조치 후보이며, site 재생성은 사용자 승인 전 수행하지 않는다.

### 남은 수동 게이트

- 실제 사람 음성 GOOD/NORMAL/BAD, DevTools Offline GOOD/NORMAL/BAD, 최신 연출 기준 클릭 NORMAL/BAD 재완주.
- BGM 5곡 3회 loop·N3 crisis crossfade·N5 transform one-shot·수렴 ending곡과 Web Audio SFX를 헤드폰/노트북에서 청감 확인.
- `gray_wraith.weakened`, 변신 컷 2장, 선택 GOOD 검은 마법소녀 컷 납품 뒤 사람 합성 QA.
- N2 첫 표정 `happy`를 대본의 `surprised → happy`로 바꿀지는 사용자 승인 전까지 변경하지 않는다.
- `[미결정]` 최신 QA Pages 배포가 반복 timeout된다. 기존 공개본을 일시 중단할 수 있는 Pages site 재생성 여부를 사용자에게 확인한다.

## M5 음성 기본 모델 Realtime 전환·BGM 사용자 제어

- 실행일: 2026-08-06
- 작업 모드: `MILESTONE_IMPLEMENTATION(M5)`
- 상태: 코드·자동 검증 PASS, 공개 QA 배포·다중 화자 실측 대기

### 구현 내용

- 일반 플레이 기본 음성을 OpenAI `gpt-realtime-2.1-mini`로 변경했다. PTT 종료 뒤 24kHz mono WAV를 Worker `/voice/realtime`에 한 번 보내고, Worker 서버 측 Realtime WebSocket이 transcript와 대화·전투 판정을 필수 function call로 함께 반환한다.
- 변신·전투 주문은 같은 모델의 transcript-only mode를 사용하고 기존 키워드·dBFS 게이트를 유지한다. 대화 로컬 intent가 일치하면 로컬 결과를 우선한다.
- `gpt-transcribe`·`gpt-live-transcribe`는 `?debug=1`의 단일 모델 비교용으로 유지했다. 일반 UI에는 모델명·transcript 원문을 노출하지 않는다.
- 모델·prompt·function schema·reasoning effort·출력 상한은 Worker가 고정한다. Worker와 클라이언트가 응답을 zod·intent/flag whitelist·delta clamp로 다시 검증하며, 실패 시 기존 클릭·로컬 완주 경로를 유지한다.
- 현재 미연시 glass/rose HUD로 BGM 음소거 버튼, 0~100 슬라이더, 현재 퍼센트를 추가했다. 사용자 볼륨·음소거는 전용 `localStorage` 키에 저장하며 PTT duck과 합성된다.
- 브라우저 QA에서 debug selector가 BGM HUD를 덮어 음소거 클릭을 막는 문제를 발견했다. 데스크톱 debug에서는 HUD를 좌상단, 모바일 debug에서는 selector 아래 safe area로 분리했다. 1280×720·390×844 모두 overflow 0, selector 비겹침, 28%·음소거 새로고침 복구, 접근성 이름·상태, 콘솔 오류 0을 확인했다.
- 로컬 실제 OpenAI smoke에서 transcript-only upstream 약 1.33초, 대화 전사+판정 upstream 약 1.95초를 확인했다. 한 번의 schema reject 뒤 안전한 502가 반환됐고 재호출은 정상 통과했다. 발화 원문·함수 인수는 로그에 남기지 않는다.

### 자동 검증

| 항목 | 결과 | 관찰 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| targeted Vitest | PASS | Realtime request/WebSocket/schema, 모델 sample rate, BGM 저장·mute·duck |
| `npm test` | PASS | 41 files·187 tests |
| `npm run build` | PASS | production build 성공, 기존 transformers chunk 경고만 유지 |
| Browser UI | PASS | 1280×720·390×844, 볼륨·mute·reload·debug 모델 selector·overflow·console |

### 남은 수동 게이트

- 공개 QA Worker 재배포 뒤 Pages Origin에서 Realtime 대화·전투 실제 발화와 지역 403 부재 확인.
- 사람 3명 이상·조용한 환경/현장 소음에서 정확도, p50/p95, schema reject율 측정.
- 헤드폰·노트북에서 0/28/62/100% 청감과 PTT duck 복귀 확인. 키보드 실제 조작은 추가 접근성 QA에서 확인.

## 프로젝트 인수 기준점 — 원본 보관·학습 기록 체계

- 실행일: 2026-08-10
- 작업 모드: `PROJECT_TAKEOVER_BASELINE`
- 브랜치: `codex/project-takeover-baseline`
- 상태: 원본 archive·체크섬·기준선 검증 PASS, 게임 코드 변경 없음

### 사용자 지시

- 현재 버전을 원본 파일로 별도 저장해 최종 버전 비교용으로 보존한다.
- 기존 실행 기록과 별도로 초보자용 변경 이유·개념·비용·위험을 계속 기록한다.
- `main`을 직접 수정하지 않고 코드가 꼬이지 않게 별도 브랜치에서 작업한다.

### 기준점과 보관 결과

| 항목 | 결과 |
|---|---|
| 기준 저장소 | `2klips/the-judge-became-a-magical-girl` |
| 기준 브랜치 | `main` |
| 기준 커밋 | `2a5821d8429d88208cb415b06992e7f6fe4dfabf` |
| 원본 ZIP | `baseline-archives/the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip` 저장소 밖 보관 |
| ZIP 크기 | `82,730,214 bytes` |
| SHA-256 | `AB4C1ACA6CDDF9DC8E7A09C4C40240BD4F70D9B88AB1BBD88F6E35EBBF877EDC` |
| 파일 목록 검증 | Git 262개·ZIP 262개·차이 0 |
| 제외 확인 | `.git`, `node_modules`, `dist`, Git 비추적 로컬 Secret 파일 없음 |

`.env.example`은 실제 Secret이 아닌 자리표시자 계약 파일이므로 Git 원본과 함께 보관했다.

### 문서 처리

- `docs/dev/LEARNING_LOG.md`를 새로 만들어 구조·비용 절감 선택·작업별 학습 형식을 설명했다.
- `docs/dev/PROJECT_MAP.md`에 학습 기록을 SSOT가 아닌 보조 문서로 등록하고 읽기 세트·갱신 규칙을 추가했다.
- 수행 사실은 이 문서, 제품 계약은 기존 기준 문서, 학습 설명은 `LEARNING_LOG.md`로 분리했다.
- `DECISIONS.md`와 `MILESTONES.md`는 수정하지 않았다.

### 자동 검증

| 명령 | 결과 | 세부 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 41 files·187 tests |
| `npm run build` | PASS | production build 성공, 기존 Transformers chunk 경고 유지 |
| ZIP SHA-256 | PASS | 체크섬 파일과 재계산 값 일치 |
| ZIP 파일 목록 | PASS | 기준 커밋 추적 파일과 차이 0 |

### 변경 경계와 다음 단계

- 게임 코드, 시나리오, 에셋, Worker, 배포 설정은 변경하지 않았다.
- 원본 `main`은 `2a5821d`에 유지한다.
- 인수 기록 검토 뒤 후속 기능은 별도 설계와 `codex/` 브랜치에서 진행한다.
- 원격 push·PR·merge는 사용자 요청 전 수행하지 않는다.

## P0 필수 누락 이미지 3종 제작·runtime 채택

- 실행일: 2026-08-11
- 작업 모드: `MILESTONE_IMPLEMENTATION(P0-1)`
- 브랜치: `codex/p0-required-image-assets`
- 시작 커밋: `58e8164`
- 상태: 당시 이미지·전체 회귀·브라우저 QA PASS. 이 절의 `transform.cast` 채택본은 아래 데스크톱 포즈 수정으로 superseded; 사람 미술·권리 QA 대기

### 사용자 지시와 장면 정합 수정

- P0-1 필수 누락 이미지 해결은 C형(기존 캐릭터·배경을 참조해 새 장면 컷 생성)으로 진행했다.
- 최초 `transform.cast` 후보가 영창 중 이미 마법소녀 복장을 입어 N5 순서와 모순된다는 사용자 피드백을 반영했다.
- 당시 채택한 영창 컷은 평상복 도윤, 떠 있는 무문자 사원증, 주노, 막 시작되는 변신광으로 수정했다. 목걸이형 사원증 중복도 제거했다. 이 구성은 아래 포즈 수정으로 대체됐다.
- 회색 망령 약화본은 게임 합성을 위해 투명 배경으로 확정했다.

### 변경 파일과 이유

| 구분 | 파일 | 변경 이유 |
|---|---|---|
| source 납품 | `assets/source/p0-required-images/delivery/char_gray_wraith_weakened.png` | 생성·정규화한 채택본 보존 |
| source 납품 | `assets/source/p0-required-images/delivery/cut_transform_01.webp` | N5 영창 1번 컷 보존 |
| source 납품 | `assets/source/p0-required-images/delivery/cut_transform_02.webp` | N5 변신 완료 2번 컷 보존 |
| runtime | `assets/runtime/char/char_gray_wraith_weakened.png` | momentum 65 이상에서 물리 약화 상태 우선 사용 |
| runtime | `assets/runtime/cut/cut_transform_01.webp` | DEC-016 영창 1번 컷 연결 |
| runtime | `assets/runtime/cut/cut_transform_02.webp` | DEC-016 완료 2번 컷 연결 |
| test | `tests/m5Assets.test.ts` | 세 source/runtime 파일의 동일 바이트·규격·용량 계약 회귀 방지 |

코드, 시나리오, catalog, runtime 동작은 수정하지 않았다. 기존 논리 ID와 경로가 이미 연결돼 있어 계약 파일을 채우는 방식으로 통합했다.

### TDD·정규화 결과

| 항목 | 결과 |
|---|---|
| RED | 실파일 추가 전 targeted test 1 fail·11 pass; `char_gray_wraith_weakened.png` ENOENT로 예상 실패 |
| GREEN | 실파일 추가 후 targeted test 12 pass |
| 망령 약화본 | 1200×2000 투명 indexed PNG + `tRNS`, 205,779B |
| 당시 변신 영창 컷(superseded) | 1920×1080 WebP, 177,098B |
| 변신 완료 컷 | 1920×1080 WebP, 205,400B |
| source/runtime | 세 쌍 모두 SHA-256 동일 |

초기 망령 RGBA PNG는 800KB 상한을 넘었다. 캔버스와 투명도를 유지한 indexed palette PNG로 압축해 계약을 통과시켰다. 정확한 해시와 제작 도구·권리 한계는 [PROVENANCE.md](../assets/PROVENANCE.md)에 기록했다.

### 커밋과 후속 검증

- 설계 문서: `9fd85cc`
- 실행 계획: `58e8164`
- 이미지·계약 테스트: `438f2f7`
- 문서 링크·전체 회귀·N5·battle 브라우저 합성 QA를 완료했다.
- 원격 push·PR·main merge는 수행하지 않는다.

### 최종 검증

| 항목 | 결과 | 세부 |
|---|---|---|
| 문서 상대 링크 | PASS | 변경 문서의 로컬 Markdown 링크가 실제 저장소 경로와 일치 |
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 41 files·188 tests |
| `npm run build` | PASS | production build 성공, 기존 Transformers 대형 chunk 경고만 유지 |
| `dist` 에셋 | PASS | 3종 각각 1개, runtime과 크기·SHA-256 일치 |
| Browser desktop | PASS | 1280×720, N5 incantation/transformation·battle p2, overflow 0·console error 0 |
| Browser mobile | PASS | 390×844, transformation·battle p2, overflow 0·console error 0 |

N5 주문 게이트의 `doyun.normal_shy` 평상복 → 평상복 영창 컷 → 마법 복장 완료 컷 순서를 확인했다. 약화 망령은 투명 배경으로 합성됐고 크로마·흰 배경·검은 폴백이 나타나지 않았다. debug 프리뷰에서 기존 기본 스프라이트와 인물 일부가 정보 카드·다른 인물에 가려지는 현상은 새 파일 결함이 아닌 기존 합성 레이아웃 후속 개선 후보로 남긴다.

로컬 실제 플레이 주소는 `http://127.0.0.1:5173/the-judge-became-a-magical-girl/`이며, 사용자 마이크 권한·사람 미술 합성·생성물 권리 확인은 자동 QA 범위 밖이다.

## `transform.cast` 데스크톱 포즈 수정 채택

- 실행일: 2026-08-11
- 작업 모드: `ASSET_REVISION(transform.cast)`
- 브랜치: `codex/p0-required-image-assets`
- 상태: 포즈 에셋·focused 계약 GREEN, 독립 Unit 1 검토와 Unit 3 fresh 전체 자동·production 복사본·데스크톱 Browser QA PASS. 사람 미술·권리 QA 대기

### 사용자 지시와 범위 변경

- 도윤이 사원증을 카메라 쪽으로 직접 내밀고, 가리지 않은 입으로 실제 말하는 모습이 보이며, 주노가 기도하는 자세를 취하도록 수정했다.
- 사용자는 입 모양 1번(중간 크기로 분명한 발화, 진지하고 약간 부끄러움)과 A 균형형을 선택했다.
- 첫 수정 후보의 모바일 crop 피드백 뒤 사용자가 모바일을 이번 수정 범위에서 제외했다. 데스크톱 16:9만 최종 기준이며 `390×844` 대응과 CSS·코드 변경은 수행하지 않는다.

### 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `tests/m5Assets.test.ts` | 교체 전 `transform.cast` hash를 거부하는 회귀 guard 추가 |
| `assets/source/p0-required-images/delivery/cut_transform_01.webp` | 추적용 최종 채택 WebP로 교체 |
| `assets/runtime/cut/cut_transform_01.webp` | source와 동일 바이트인 게임 로드용 WebP로 교체 |

게임 production 코드, catalog, 시나리오 JSON, CSS, 논리 ID, `transform.cast → transform.complete` 순서는 변경하지 않았다.

### TDD·후보·채택 증거

| 단계 | 결과 |
|---|---|
| 교체 전 원본 | 177,098B, SHA-256 `507CA55683BC50CCBB83B3196598DB4D2DCA1CF82B58A5AEF796CD007634140D`; 최종본에서 superseded |
| RED | focused `m5Assets` 11 pass·1 expected fail. 새 guard가 교체 전 hash를 감지 |
| GREEN | focused `m5Assets` 12/12 pass |
| 첫 수정 commit | `2b99e2327c1a752751a614bc6003456dbb5f816e`; 186,428B, SHA-256 `038E554CFCAAB243C230C25316B62F3048602B7B67747AB4F8BFFCE6C30C6A54`. 데스크톱 전체는 통과했지만 당시 요구한 정확한 중앙 모바일 crop 실패로 최종 제외, Git 이력 보존 |
| 최종 채택 commit | `67dbf9f1a25e81dcc49e4cbfd56b22a6106bd28f`; 200,470B, SHA-256 `A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152` |
| source/runtime | 두 경로 동일 바이트, 1920×1080 WebP. runtime 합계 41 files·12,122,847B(기존 12,099,475B 대비 +23,372B) |

현재 컷을 편집 대상으로 사용하고 `char_doyun_normal_shy.png`의 사무복·정체성과 `char_juno_surprised.png`의 몸·별 지팡이를 참조했다. Codex 내장 OpenAI 이미지 편집과 FFmpeg 정규화를 사용했으며 정확한 모델명·버전·작업 ID는 도구가 노출하지 않는다. 최종 화면은 평상복 도윤 한 명, 자연스럽게 손에 잡힌 전경의 무문자 사원증 하나, 보이는 중간 크기 발화 입, 눈 감고 세운 지팡이 주위로 두 날개를 모은 주노 한 명, 청색·금색 야간 사무실과 마법진으로 구성된다. 텍스트·UI·로고는 없다.

### 독립 검토·Unit 3 최종 QA와 남은 게이트

- 독립 Unit 1 요구사항 검토에서 사용자 포즈·데스크톱 범위·동일 바이트 계약과 변경 파일 경계를 확인했다.
- 독립 Unit 1 품질 검토는 TypeScript 검사와 전체 188/188 tests를 통과했다.
- Unit 3 fresh 검증에서 `npm run check` exit 0, `npm test` 41 files·188 tests PASS, `npm run build` exit 0을 순서대로 확인했다. build에는 기존 Transformers 516.22kB 대형 chunk 경고만 있었고 비차단으로 유지했다.
- production `dist/assets/cut/cut_transform_01.webp`는 정확히 1개이며 source/runtime과 동일 바이트다. 세 경로 모두 200,470B, SHA-256 `A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152`다.
- 1280×720 in-app Browser에서 `?debug=1&scene=n5-incantation`은 결과 전 `doyun.normal_shy` 평상복을, `?debug=1&scene=n5-transformation`은 visible한 `cut_transform_01.webp` natural 1920×1080과 `beat=cast → complete`를 표시했다. 검은 화면·fallback은 없었다.
- 영창 컷은 자연스럽게 손에 잡힌 전경의 무문자 사원증 정확히 하나, 평상복 도윤, 중간 크기로 열린 발화 입, 눈 감고 세운 별 지팡이 주위로 두 날개를 모은 주노를 보였다. baked text·UI·logo는 없었다. 후속 `cut_transform_02.webp`는 natural 1920×1080의 마법 복장 완료 컷으로 유지돼 asset replacement 없이 영창 뒤를 이었다.
- 두 N5 화면의 가로 overflow는 0, Browser console error는 0이었다. debug overlay가 프리뷰 일부를 가리는 기존 현상은 재현됐지만 에셋·순서 판정에는 영향 없는 비차단 관찰이다.
- 로컬 실제 플레이 주소는 `http://127.0.0.1:5173/the-judge-became-a-magical-girl/`, 직접 QA 주소는 `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation`과 `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-transformation`이다. 모바일 `390×844` crop은 사용자 지시에 따라 이번 수정 범위에서 제외했고 CSS·코드는 변경하지 않았다.
- 상태는 `ready`이며 `approved`가 아니다. 사람 미술 품질, 참조 이미지 권한, 생성 서비스 플랜과 공개 배포 허용 확인이 남아 있다. 세부 출처와 최종 hash는 [PROVENANCE.md](../assets/PROVENANCE.md)를 따른다.

## 야근 스토리·장면 에셋 연속성 정렬

- 작업일: 2026-08-13 KST
- 상태: 스토리·자동 규격·회귀·데스크톱 16:9 브라우저 QA PASS, 사용자 에셋 7종 시각 승인과 기존 검토 caveat 수용. 권리·서비스 플랜·공개 배포 게이트 대기

### 스토리 변경

- commit `9a70392e8a6ff8a41d9e08146d71eb33586c7073`에서 `docs/심사역은_마법소녀가_되었다_완성대본_v2.md`, `public/scenario/scenario.json`, `tests/scenarioContinuity.test.ts`를 야근 연속성에 맞춰 변경했다.
- commits `9443a93f136d8e311580185eb854abc64d87ab5a`·`caa7fc5267007dc35596139cc23ae50322c694f6`에서 `tests/scenarioContinuity.test.ts`의 야근 가드를 강화하고 의도한 범위로 한정했다.
- 핵심 팀은 심야 야근 장소에 남고, 마법이 동료의 시간·인식을 멈춰 위험에서 보호한다. GOOD은 `멈췄던 시간이 다시 흐른다. 긴 밤 끝에 아침빛...`으로 야간에서 아침으로 연결한다.

### 에셋 변경

- commit `92ef1e267aeb547dfba6033c35433f5c08b14ef5` `feat(assets): align late-night overtime scenes`.
- `assets/runtime/bg/`의 `bg_office_wide.webp`, `bg_hall_dark.webp`, `bg_transform_space.webp`, `bg_battle_wide.webp`, `bg_battle_core.webp`를 교체하고, 동일 바이트 source를 `assets/source/background/delivery/`에 추가했다.
- `assets/runtime/cut/`와 `assets/source/p0-required-images/delivery/`의 `cut_transform_01.webp`, `cut_transform_02.webp`를 교체했다. `tests/m5Assets.test.ts`는 7종 최종 hash·source/runtime 동일성·이전 리비전 거부를 검증하도록 갱신했다.
- 논리 ID, catalog, CSS, 런타임 코드, 모바일은 변경하지 않았다. 해시·크기·source lineage는 [PROVENANCE.md](../assets/PROVENANCE.md)와 [ASSET_MANIFEST.md](../assets/ASSET_MANIFEST.md)를 따른다.

### TDD·검증

| 검증 | 결과 | 근거 |
|---|---|---|
| 채택 전 RED | 의도한 FAIL | focused 20 tests 중 6 cases 실패, 교체 필요 7 signals |
| 채택 후 focused GREEN | PASS | 2 files, 20/20 tests |
| `npm run check` | PASS | 최종 코드 HEAD `eae590a61f5db01c3a5fff9efcc5fb79a41a5d7e`에서 `tsc --noEmit`, exit 0 |
| `npm test` | PASS | 42 files, 196 tests, duration 3.47s, exit 0 |
| `npm run build` | PASS | Vite 8.2.0, 147 modules, built 2.60s, exit 0. 기존 `transformers.web-UeFc_ACU.js` 516.22 kB(gzip 148.38 kB) chunk >500 kB 경고만 비차단으로 유지 |
| diff check | PASS | 공백·patch 문제 없음 |
| 교체 후 desktop browser | PASS | 1280×720 debug 프리뷰 7 routes·8 visual beats, 양축 overflow 0, route별 console warning/error 0. 모바일은 제품 범위 제외 |

### 2026-08-13 최종 데스크톱 브라우저 QA

- 최종 문서 commit 전 코드 HEAD `eae590a61f5db01c3a5fff9efcc5fb79a41a5d7e`의 로컬 dev server `http://127.0.0.1:5173/the-judge-became-a-magical-girl/`에서 1280×720 debug 프리뷰를 검사했다.
- 확인한 scene ID는 `n0-office`, `n3-wraith`, `n5-incantation`, `n5-transformation`, `battle-p1`, `battle-p3-spell`, `ending-good`이다. 7개 preview route이며 `n5-transformation`의 cast·complete 두 cut을 따로 확인해 시각 beat는 8개다.
- 모든 route에서 `overflowX 0`, `overflowY 0`, route 확인 중 console warning/error `[]`였다. 관련 background·cut 이미지는 모두 complete·visible이었고 natural size는 1920×1080이었다. 기존 character sprite는 1200×2000을 유지했다.
- `n0-office`는 불 켜진 모니터 책상에 동료가 남아 있는 심야 사무실, `n3-wraith`는 같은 야근 사무실 안의 회색 오염으로 보였다. `n5-incantation`은 `doyun.normal_shy` 평상복과 사원증 close-up을 유지했다.
- `n5-transformation` 배경은 심야로 이어졌다. cast의 `cut_transform_01.webp`는 파란 테두리 사원증 안쪽에서 은은한 빛이 나고, complete의 `cut_transform_02.webp`는 깊은 밤의 변신 완료를 보여 두 cut 모두 순서대로 visible이었다.
- `battle-p1`과 `battle-p3-spell`은 같은 심야 사무실을 유지했다. 멈춘 동료의 존재와 보호 의도가 읽히면서 중앙 전투 가독성도 유지됐다.
- `ending-good`에서만 따뜻한 아침으로 바뀌어 밤에서 아침으로 넘어가는 payoff가 의도적으로 읽혔다.
- 모바일은 검사하지 않았고 이번 범위 밖이다. 사용자는 2026-08-13 에셋 7종을 모두 시각 승인하고 기존 검토자의 caveat를 수용했다.

자동 검증·데스크톱 QA·사용자 시각 승인은 에셋을 `ready`로 쓸 근거지만 참조 이미지 권한·생성 서비스 플랜·공개 배포 허용 확인을 대체하지 않는다. `approved`로 올리지 않으며 M5 또는 프로젝트 전체 완료로 판정하지 않는다.

## Wave 1 — 오디오·음성 신뢰성

- 작업일: 2026-08-14 KST
- 코드 기준 HEAD: `97b8da29b72cdc1e2595a4e2d8604800c40d6e66`
- 상태: 코드·자동 검증·제한된 데스크톱 브라우저 점검 PASS. 실제 마이크·Worker·헤드폰 수동 QA는 `PENDING`이며 Wave 1 전체 수동 완료로 판정하지 않음

### 구현 범위

- commits `5e6351f`·`2bac286`: 신규·손상 BGM 설정 20%, 유효 설정 보존, 무음 경유 fade, 중단·오류·stale 재생 채널 정리.
- commits `ad2d6a3`·`a171d1a`: Start·Resume 클릭 스택에서 게임 진입을 비동기 마이크 정리보다 먼저 실행하고 정리 실패 Promise를 UI 밖에서 흡수.
- commits `a34c6fd`·`9abdd7b`: 음성 오류 7종 typed failure, HTTP 상태 진단 보존, raw 네트워크·HTML·공급자 문구를 숨긴 한국어 안내.
- commit `511d4c7`: dialogue·incantation·battle 공통 턴 키와 복구 정책. 첫 실패는 같은 턴 한 번 재시도, 두 번째는 현재 턴 클릭·실패 턴 1회 누적, 누적 다섯 번째만 전역 클릭. 새 게임·Resume·엔딩 재시작에서 세션 실패 상태 초기화.
- commits `5d7f2b9`·`97b8da2`: meter의 quiet/good/loud를 실제 dBFS 판정과 연결하고 고정 빨간 선 제거. 재연결·장치 변경 시작 즉시 0%·`-∞ dBFS`·quiet로 초기화.
- 시나리오·게임 분기·이미지·오디오 binary·Worker route·공개 배포는 변경하지 않았다.

### 자동 검증

| 검증 | 결과 | 근거 |
|---|---|---|
| `npm run check` | PASS | TypeScript `tsc --noEmit`, exit 0 |
| focused 음성 복구 | PASS | 8 files, 76 tests |
| `npm test` | PASS | 47 files, 256 tests |
| `npm run build` | PASS | Vite build 완료. 기존 Transformers 516.22 kB chunk 경고만 유지 |
| `git diff --check` | PASS | 공백·patch 오류 없음 |
| 최종 코드 status | clean | Task 6 문서 작업 전 코드 HEAD에서 변경 없음 |

### 2026-08-14 데스크톱 브라우저 점검

- URL: `http://127.0.0.1:5173/the-judge-became-a-magical-girl/`, viewport `1280×720`.
- clean profile의 BGM HUD는 20%였다. 타이틀에서 `<audio>` 요소는 0개였고 자동 BGM 시작은 관찰되지 않았다.
- 37% 설정은 reload 뒤 유지됐고 mute도 reload 뒤 유지됐다.
- 타이틀의 가로·세로 overflow는 각각 0, console warning/error는 각각 0이었다.
- meter 초기값은 `aria-valuenow=0`, `-∞ dBFS`, 고정 `::after` content `none`이었다. 재연결 시도 직후 quiet·0%·`-∞ dBFS`로 초기화됐다.
- production 형태 URL `?voiceFailure=network&voiceFailureCount=2`에서 debug UI와 raw 기술 용어 노출은 각각 0이었다.
- debug 시각 preview `n1-first-voice`, `n5-incantation`, `battle-p1`은 각각 로드됐고 양축 overflow와 console warning/error가 0이었다. 단, 이 preview는 `SAVE/FSM ISOLATED` 시각 프리뷰이며 음성 capture 버튼이 없다. injected failure를 실제 capture로 소비하는 수동 matrix는 실행하지 못했다. 복구 정책 결과는 focused 8 files/76 tests 근거만 PASS로 기록한다.
- Worker는 `npm run dev:m3:worker` 실행 시 `.env.local: not found`로 exit 1이었다. `127.0.0.1:8787`은 기동하지 않았다.

### 실패 주입 예정 URL(PENDING · 정적 preview에서는 소비 불가)

아래 각 URL은 query와 화면 조합을 정리한 예정 matrix일 뿐 실제 재현 주소가 아니다. `scene=`는 capture가 없는 `SAVE/FSM ISOLATED` 정적 preview를 열기 때문에 실패 주입을 소비할 수 없으며, 실제 game-mode full URL·사전 상태·조작 절차는 아직 미확정이다. `recording`은 device-open/recording-start 계열 typed branch의 예정 항목이다.

> **PENDING · visual preview only:** 아래 42개 URL은 계획의 full URL 목록을 보존한 것이며, 실제 game session capture 실행 또는 PASS 증거가 아니다.

#### dialogue — `n1-first-voice`

| kind | 첫 실패 1회 | 같은 턴 2회 |
|---|---|---|
| permission | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=permission&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=permission&voiceFailureCount=2` |
| recording | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=recording&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=recording&voiceFailureCount=2` |
| no-speech | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=no-speech&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=no-speech&voiceFailureCount=2` |
| timeout | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=timeout&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=timeout&voiceFailureCount=2` |
| http | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=http&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=http&voiceFailureCount=2` |
| schema | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=schema&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=schema&voiceFailureCount=2` |
| network | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=network&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n1-first-voice&voiceFailure=network&voiceFailureCount=2` |

#### incantation — `n5-incantation`

| kind | 첫 실패 1회 | 같은 턴 2회 |
|---|---|---|
| permission | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=permission&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=permission&voiceFailureCount=2` |
| recording | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=recording&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=recording&voiceFailureCount=2` |
| no-speech | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=no-speech&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=no-speech&voiceFailureCount=2` |
| timeout | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=timeout&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=timeout&voiceFailureCount=2` |
| http | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=http&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=http&voiceFailureCount=2` |
| schema | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=schema&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=schema&voiceFailureCount=2` |
| network | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=network&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation&voiceFailure=network&voiceFailureCount=2` |

#### battle — `battle-p1`

| kind | 첫 실패 1회 | 같은 턴 2회 |
|---|---|---|
| permission | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=permission&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=permission&voiceFailureCount=2` |
| recording | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=recording&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=recording&voiceFailureCount=2` |
| no-speech | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=no-speech&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=no-speech&voiceFailureCount=2` |
| timeout | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=timeout&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=timeout&voiceFailureCount=2` |
| http | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=http&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=http&voiceFailureCount=2` |
| schema | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=schema&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=schema&voiceFailureCount=2` |
| network | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=network&voiceFailureCount=1` | `http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p1&voiceFailure=network&voiceFailureCount=2` |

### 남은 수동 게이트

- actual game-mode full URLs/procedure 확정 후 matrix를 실행한다.
- 실제 마이크에서 permission, device-open/recording-start, no-speech와 `recordingSupported=false`를 확인한다.
- `.env.local`을 갖춘 실제 Worker로 HTTP, schema, network 실패와 raw 정보 비노출을 확인한다.
- 마이크 보정 뒤 Start 한 번으로 `bgm_daily`가 시작되는 user gesture를 청감 확인한다.
- 헤드폰으로 `bgm_daily`, `bgm_crisis`, `bgm_battle`, `bgm_ending`을 각각 3회 loop하고 click·의도하지 않은 무음·beat jump를 계수한다.
- `bgm_transform`을 끝까지 1회, 중간 이탈 1회 실행해 surprise restart·orphan channel이 없는지 확인한다.

위 항목은 장치·Secret·실제 음원이 필요한 사람 QA다. 수행 전에는 PASS 또는 Wave 1 완료로 올리지 않는다.

## Phase A — 실제 음성 입력 실패 5회 정책

- 작업일: 2026-08-14 KST
- 브랜치: `codex/voice-five-failure-policy`
- 코드 검증 기준 HEAD: `c156ea49bfdb018bc9268bfa45ea0508ccf95734`
- 상태: 구현·자동 검증·일반 Google Chrome 실제 game-mode 7종 matrix·실제 마이크 smoke·독립 검토 PASS. 실제 재현이 불가능한 일부 제외 경로는 자동 테스트 PASS와 수동 `PENDING`을 분리해 기록하며, Phase A 전체 Gate 판정은 사용자 승인 대기

### 구현 결과

- `permission`, `recording`, `no-speech`, `timeout`, `http`, `schema`, `network` 실제 음성 입력 실패는 발생할 때마다 `sttFailCount`를 즉시 1 올린다.
- 전체 다섯 번째 실패는 같은 턴 재시도보다 우선해 전역 click mode로 전환한다. 전체 1~4회 구간에서는 같은 턴 첫 실패에 재시도하고, 같은 턴 두 번째 실패에 현재 턴만 클릭으로 진행한다.
- 브라우저 녹음 API 미지원은 실패 횟수에 포함하지 않고 바로 click mode로 전환한다. 취소, 사용자의 수동 클릭 전환, LLM fallback, battle dBFS quiet/loud 판정도 음성 입력 실패 횟수에서 제외한다.
- 같은 턴 시도 횟수는 임시 세션 기억이다. Resume은 이 임시 기억만 비우고 save의 전체 `sttFailCount`는 보존한다. New Game과 ending 재시작은 전체 횟수와 임시 기억을 모두 초기화한다.
- 기존 `GameState.sttFailCount`와 저장 경로를 재사용했다. 신규 상태 필드나 저장 schema는 추가하지 않았다.

### 코드 커밋

| 커밋 | 역할 |
|---|---|
| `9f2b6d973104e7a61919f968c05158ea6fa5f448` `fix(voice): count every failed input` | 실제 실패 입력 단위 누적, lifecycle·주입·엔진 회귀 테스트 추가 |
| `65afd503d1000f2a2b1085562ddf1d6667e2d344` `fix(voice): record failures before recovery` | 다섯 번째 실패 우선순위와 공통 handler 순서 보정 |
| `c156ea49bfdb018bc9268bfa45ea0508ccf95734` `test(voice): guard failure exclusions` | 취소·수동 클릭·LLM fallback·battle dBFS 제외 계약 강화 |

### fresh 자동 검증과 독립 검토

| 검증 | 결과 | 근거 |
|---|---|---|
| `npm run check` | PASS | TypeScript 오류 0 |
| `npm test` | PASS | 48 files·289 tests |
| `npm run build` | PASS | production build 성공. 기존 `transformers.web` 516.22 kB chunk·plugin timing 경고만 유지 |
| `git diff --check` | PASS | Phase A 누적 diff에 공백·patch 오류 없음 |
| 독립 요구사항 검토 | APPROVED | Phase A 계약과 Phase B·TITLE 비착수 경계 확인 |
| 독립 품질 검토 | APPROVED | 공통 실패 handler, 저장·초기화, 제외 경로 테스트 확인 |

문서 기록 직전 worktree는 clean이었다. 위 검증은 코드 HEAD `c156ea4`에서 fresh 실행했으며, docs-only 기록 뒤 코드 테스트는 재실행하지 않는다.

### 데스크톱 브라우저 smoke와 남은 수동 게이트

- Codex in-app browser에서 `http://127.0.0.1:5174/the-judge-became-a-magical-girl/?debug=1&voiceFailure=network&voiceFailureCount=5`를 열었다. TITLE DOM이 정상 표시됐고 Vite overlay와 console warning/error는 0, BGM 기본 표시는 20%, debug 모드는 `실제 플레이` 선택 상태였다.
- `마이크 연결` 클릭 뒤 `연결 중` 상태와 입력·시작 disabled를 확인했다. 브라우저 마이크 권한 요청이 완료되지 않아 실제 capture와 game-mode 실패 주입 소비는 확인하지 못했다.
- 따라서 실제 마이크 capture, dialogue·incantation·battle의 실패 7종 end-to-end matrix, 실제 unsupported 브라우저, save 전체 4회→Resume→5회 UI 흐름은 `PENDING`이다.
- 취소·수동 클릭·LLM fallback·battle dBFS 제외는 자동 테스트로 보호되지만 실제 브라우저 수동 확인은 `PENDING`이다. 자동 테스트를 실제 장치 QA의 대체 근거로 사용하지 않는다.

### 2026-08-15 일반 Chrome 실제 game-mode 수동 Gate

#### 환경과 절차

- 브랜치 `codex/voice-five-failure-policy`, 시작 HEAD `acd1320412c3b425e41459d744da73cf8876a9b0`, 시작 status clean을 확인한 뒤 기능 코드를 수정하지 않고 검증했다.
- 브라우저는 Google Chrome `151.0.7922.138`, OS는 Windows `10.0.19045.0`이다. Codex in-app browser의 `연결 중` 정지는 검증 환경 제한으로 분리하고 제품 실패로 계수하지 않았다.
- 실제 game-mode URL은 `http://127.0.0.1:5174/the-judge-became-a-magical-girl/?debug=1&voiceFailure=<kind>` 형식이다. `scene=`이 없는 `실제 플레이` 상태에서 TITLE 마이크 테스트를 통과한 뒤 Start 또는 Resume으로 실제 FSM을 진행했다.
- debug 주입기는 한 페이지 로드에서 1회 또는 2회만 소비한다. `voiceFailureCount=5`를 5회 주입으로 간주하지 않았고, 5회 누적은 단일 주입·실제 짧은 녹음 실패·reload/Resume을 조합해 확인했다.

#### 7종 typed failure matrix

| 실패 종류 | 실제 game-mode surface | 플레이어 안내 | 결과 |
|---|---|---|---|
| `permission` | dialogue N1 | `마이크 권한을 사용할 수 없어.` | PASS |
| `recording` | dialogue N1 | `마이크 녹음을 처리하지 못했어.` | PASS |
| `no-speech` | dialogue N1 | `녹음에서 목소리를 찾지 못했어.` | PASS |
| `timeout` | dialogue N1 | `음성 처리가 예상보다 오래 걸렸어.` | PASS |
| `http` | incantation N5 | 안전한 누적 5회 전역 click 안내 | PASS |
| `schema` | battle p1 | `음성 서버 응답 형식을 확인하지 못했어.` | PASS |
| `network` | battle p1 | `음성 서버에 연결하지 못했어.` | PASS |

- 네 종류의 dialogue 실패를 실제 Start 이후 같은 저장 흐름에서 1회씩 소비해 persisted total 1→4를 만들었다. 그 사이 수동 click 전환을 수행한 뒤 incantation의 `http`가 정확히 다섯 번째가 되어 전역 click으로 전환됐으므로 각 typed failure가 1회만 누적되고 수동 click은 누적되지 않는 것을 함께 확인했다.
- 별도 New Game으로 total을 0으로 되돌린 뒤 battle에서 `schema`가 첫 실패 retry, reload/Resume 후 `network`가 두 번째 저장 실패이자 새 턴의 첫 retry로 표시됐다. battle 공통 handler와 persisted total 보존을 실제 FSM에서 확인했다.

#### 누적 1~5·저장·초기화

- Failure #1은 같은 턴 retry, #2는 같은 턴 두 번째 실패에서 현재 턴 click, #3은 다음 턴 첫 retry, #4는 그 턴 두 번째 current-turn click으로 나타났다.
- 별도 1~5 우선순위 run에서 total 4 상태로 reload하고 Resume했다. persisted total은 유지되고 transient same-turn attempt는 초기화됐다. 다음 `network` 실패는 그 턴 첫 시도였지만 retry/current-turn UI보다 먼저 `음성 입력 실패가 5회 누적돼 클릭 모드로 전환했어.`가 표시됐다.
- New Game은 이전 total 5 뒤 첫 `permission` 실패를 retry로 표시해 total 0 초기화를 확인했다.
- GOOD ending을 실제 클릭 전투로 완료하고 `처음부터`를 실행한 뒤 첫 `timeout` 실패가 retry로 표시돼 ending restart의 total·transient 초기화를 확인했다.

#### 제외·raw 정보·실제 장치

| 항목 | 수동 결과 | 자동 근거/제약 |
|---|---|---|
| 사용자의 수동 click 전환 | PASS | total 4 뒤 실행해도 다음 `http`가 정확히 다섯 번째였음 |
| cancelled recording | `PENDING` | 외부 Chrome 자동 조작에서 실제 pointer cancel을 안정적으로 만들 수 없어 기존 cancellation 회귀 테스트만 PASS |
| `recordingSupported=false` / UNSUPPORTED | `PENDING` | 사용한 Chrome은 녹음 API 지원 환경이므로 실제 재현 불가. 7종 capability early-return 자동 테스트 PASS |
| LLM local fallback | `PENDING` | 실제 공급자 장애를 의도적으로 만들지 않아 main 경계 자동 테스트만 PASS |
| battle dBFS quiet/loud | `PENDING` | 물리 입력 레벨을 재현 가능한 값으로 고정할 수 없어 경계 자동 테스트만 PASS |

- `http`, `schema`, `network` 화면에 `Failed to fetch`, HTTP status, HTML response, provider 내부 문구는 노출되지 않았다. 각 검증 시 Chrome console warning/error는 0이었다.
- 실제 마이크 권한을 허용하고 `헤드셋 마이크(CORSAIR VOID WIRELESS v2 Gaming Headset)`과 `마이크(QHD Webcam)`을 확인했다. 입력 meter가 실제 dBFS 변화에 반응하고 TITLE `테스트 완료`에 도달했으며, 실제 PTT의 짧은 녹음은 raw 예외가 아니라 typed `recording` 안내로 수렴했다.
- 따라서 실제 장치·7종 handler·1~5 우선순위·save/Resume·New Game·ending restart·raw 정보 비노출은 PASS다. 위 표의 네 제외 항목은 실제 수동 PASS로 올리지 않고 자동 검증 PASS와 재현 제약을 분리한다.

#### 수동 Gate 뒤 fresh 자동 검증

| 검증 | 결과 | 근거 |
|---|---|---|
| `npm run check` | PASS | `tsc --noEmit`, exit 0 |
| `npm test` | PASS | 48 files·289 tests, exit 0 |
| `npm run build` | PASS | Vite 8.2.0, 150 modules, built 4.78s. 기존 Transformers 516.22 kB chunk 경고만 유지 |
| `git diff --check` | PASS | 문서 patch 공백 오류 없음 |

기능 코드·테스트·시나리오·에셋은 변경하지 않았고, 수동 Gate 근거만 이 문서에 추가했다.

## Phase B — PTT 버튼 내부 Live Meter

- 작업일: 2026-08-15 KST
- 브랜치: `codex/ptt-live-meter`
- 시작 기준: Phase A 승인 tip `651781c103c669fc6592b5349c65c1b5197454df`
- 기능 커밋: `f77baa3` `feat(voice): show live level in ptt`
- 상태: 구현·자동 검증·승인 origin 실제 장치 PTT 핵심 시각 QA PASS. Space/Enter·loud·강제 장면 교체·정확한 `getUserMedia()` 호출 수 실측은 아래와 같이 `PENDING`

### 구현 결과

- 한 capture의 단일 `getUserMedia()` stream을 `MediaRecorder`와 Web Audio analyser가 함께 사용한다. 두 번째 stream, TITLE tester, Settings tester, 별도 meter panel은 추가하지 않았다.
- 기존 microphone meter의 percent·`quiet`/`good`/`loud` 정책을 `resolvePttLiveLevelPresentation()`으로 재사용한다.
- dialogue, incantation, battle spell, battle freeform은 같은 PTT 내부 fill·label helper를 사용한다. fill은 `aria-hidden` 장식 layer이며 dBFS 숫자나 frame별 screen-reader 알림을 추가하지 않았다.
- finish, abort, cancel, recorder error, recorder construct/start 실패, render replacement에서 RAF·source·analyser·AudioContext·observer·track을 분리 소유하고 멱등 정리한다.
- AudioContext, source, analyser, connect, RAF, sample, observer 오류는 meter만 no-fill로 강등한다. recording, BGM duck, SFX suppression, STT 실패 횟수에는 영향을 주지 않는다.
- pointer hold/release, global `T`, focused `Space`/`Enter`, battle focused button 우선 규칙은 기존 binding을 유지한다.

### 자동 검증

| 검증 | 결과 | 근거 |
|---|---|---|
| Phase B focused | PASS | 7 files·61 tests |
| `npm run check` | PASS | `tsc --noEmit`, 오류 0 |
| `npm test` | PASS | 51 files·314 tests |
| `npm run build` | PASS | Vite 8.2.0, 150 modules. 기존 Transformers 516.22 kB warning만 유지 |
| `npm run build:qa` | PASS | QA build 120 modules·183.92 kB JS |
| `git diff --check` | PASS | feature staged diff와 worktree diff 공백 오류 0 |

자동 테스트는 quiet/good/loud percent, 단일 stream 공유, meter 7종 fail-soft, finish/abort/error/setup/render cleanup, controller/main observer forwarding, 4개 PTT surface, keyboard 계약을 보호한다.

### 일반 Chrome QA와 PENDING

- 일반 Google Chrome에서 `http://127.0.0.1:5176/the-judge-became-a-magical-girl/?debug=1`을 사용했다. Phase A와 같은 설치 Chrome profile이며, 당시 기록된 버전은 `151.0.7922.138`이다.
- 새 5176 origin에서 `마이크 연결`을 누른 뒤 permission·device 요청이 `연결 중`에서 반환되지 않았다. 10초 이상 기다린 뒤에도 장치 목록, TITLE meter, Start가 활성화되지 않았고 console warning/error는 0이었다.
- 이를 Phase B 제품 결함 PASS/FAIL로 단정하지 않는다. 실제 dialogue/incantation/battle PTT에 도달하지 못했으므로 CORSAIR/QHD Webcam의 내부 fill 반응, pointer/T/Space/Enter 실제 hold, release/cancel/error/scene replacement 시각 reset은 `PENDING`이다. 자동 테스트 PASS를 실제 장치 PASS로 바꾸지 않는다.
- viewport 관찰: 1920×1080은 `scrollHeight=1080`, 1366×768은 `scrollHeight=768`; 1600×900 TITLE은 기존 `scrollHeight=931`이었다. 후자는 승인된 Phase C TITLE no-scroll 과제로 남기며 Phase B PTT 코드에서 수정하지 않았다.
- Phase C/TITLE worktree와 코드는 시작하지 않았다. 실제 Chrome microphone 호출이 정상 반환되는 환경에서 네 surface의 live fill QA를 다시 실행해야 Phase B manual gate를 닫을 수 있다.

### 승인 origin 재사용 실제 장치 Manual Gate

- 실행 환경: Google Chrome `151.0.7922.138`, `http://127.0.0.1:5174/the-judge-became-a-magical-girl/?debug=1`, `헤드셋 마이크(CORSAIR VOID WIRELESS v2 Gaming Headset)`.
- Chrome의 `사이트에 있는 동안 허용` 뒤 TITLE 장치 목록과 실제 입력 meter가 활성화됐다. 무입력 `-96.0 dBFS`, 실제 발화 `-27.4 dBFS`, `테스트 완료`를 관찰했다. 5174 서버가 한 번 종료된 뒤 같은 origin으로 재시작했으며 기존 권한이 유지되어 추가 permission prompt 없이 다시 연결됐다.
- 장면 selector의 격리 preview를 사용하지 않았다. `?debug=1`의 `실제 플레이`에서 N0부터 진행하고 debug transcript는 장면 선택만 단축하는 데 사용했다.

| 항목 | 결과 | 실제 관찰 |
|---|---|---|
| dialogue PTT | PASS | pointer hold 중 실제 발화에 따라 버튼 내부 fill이 움직였다. 다른 panel은 생기지 않았다 |
| incantation PTT | PASS | global `T` hold 중 실제 발화에 따라 `누르고 주문 읽기 (T)` 내부 fill이 움직였다 |
| battle spell PTT | PASS | spell 버튼만 fill이 움직이고 같은 화면의 freeform 버튼은 idle 상태를 유지했다 |
| battle freeform PTT | PASS | freeform 버튼만 fill이 움직이고 같은 화면의 spell 버튼은 idle 상태를 유지했다 |
| release/reset | PASS | dialogue·incantation은 release 뒤 `--ptt-live-level: 0%`, `aria-pressed=false`를 확인했다. battle은 처리/현재 턴 click 재렌더 뒤 이전 active fill이 남지 않았다 |
| pointer | PASS | dialogue와 두 battle PTT에서 실제 hold/release를 확인했다 |
| global `T` | PASS | incantation에서 hold→live fill→release 처리 경로를 확인했다 |
| 실제 음량 반응 | PARTIAL | 무입력 0/낮은 상태와 평상 발화의 가변 fill은 확인했다. 물리 loud threshold의 안정 재현은 하지 않아 자동 테스트 PASS와 수동 `PENDING`을 분리한다 |
| recording/processing | PASS | meter가 움직이는 동안 녹음이 유지됐고 release 뒤 기존 processing·typed failure 경로로 수렴했다. meter 때문에 capture가 중단된 증거는 없었다 |
| AudioContext/analyser | PASS | 실제 발화에 따라 4개 surface fill이 실시간 변했으므로 analyser가 0에 고정된 suspended 상태는 아니었다 |
| 추가 permission | PASS | TITLE 연결 뒤 각 PTT capture에서 추가 permission prompt가 나타나지 않았다 |
| console | PASS | 전체 실제 game-mode 진행 중 Chrome console warning/error 0 |
| 화면 안정성 | PASS | 실제 Chrome `1841×1215` game viewport에서 meter로 인한 scroll·버튼 크기 점프·별도 meter panel을 관찰하지 않았다 |

#### 보존한 수동 PENDING

- focused `Space`/`Enter` hold는 실제 키 입력으로 재현하지 않았다. 자동 keyboard 회귀 테스트 PASS를 수동 PASS로 올리지 않는다.
- 물리 loud threshold는 안정적으로 재현하지 않았다. `quiet`/`good`/`loud` 분류와 percent는 순수 정책 자동 테스트가 보호한다.
- capture 중 강제 scene replacement는 실제 게임에서 만들지 않았다. render replacement cleanup 자동 테스트 PASS를 수동 PASS로 올리지 않는다.
- 한 capture의 정확한 `getUserMedia()` 호출 수는 DevTools instrumentation으로 실측하지 않았다. 단일 stream 공유와 호출 1회 자동 테스트 PASS를 실제 수동 횟수 증거로 바꾸지 않는다.
- battle screenshot을 찍는 동안 Chrome focus가 이동해 key/pointer release 이벤트가 늦어진 경우에는 같은 active PTT를 release해 종료했다. 종료 뒤 processing 또는 현재 턴 click 재렌더로 이동했고 late fill은 남지 않았다.

#### Manual Gate 뒤 fresh 자동 검증

| 검증 | 결과 | 근거 |
|---|---|---|
| `npm run check` | PASS | `tsc --noEmit`, exit 0 |
| `npm test` | PASS | 51 files·314 tests, exit 0 |
| `npm run build` | PASS | Vite 8.2.0, 150 modules, built 4.22s. 기존 Transformers 516.22 kB chunk·plugin timing 경고만 유지 |
| `git diff --check` | PASS | 문서 patch 공백 오류 없음 |

기능 코드·테스트·TITLE·DECISIONS·LEARNING_LOG는 변경하지 않았다. Phase C/TITLE worktree도 생성하지 않았다.

## Phase C — PC TITLE Visual Skeleton

- 작업일: 2026-08-15 KST
- 브랜치: `codex/pc-title-ui-ux`
- 시작 기준: Phase B 승인 tip `2addc0ec0b1a37ec1a5f1e89f9e80566e5bfa2cf`
- 기능 커밋: `2d614b2` `feat(ui): rebuild pc title screen`
- 상태: visual skeleton·local font·자동 검증·일반 Chrome 3-viewport QA PASS. Phase D interaction은 시작하지 않음

### 구현 결과

- `GameView.renderTitle()`의 인라인 TITLE DOM을 `src/ui/titleView.ts`로 위임하고 TITLE 전용 `src/ui/title.css`를 추가했다. gameplay·PTT·scenario·GameState·Worker는 변경하지 않았다.
- 전체 중앙 microphone diagnostics panel과 상시 dBFS를 기본 TITLE에서 제거했다. 기존 calibration 연결은 compact mic shell 안에서 compatibility 방식으로 유지했으며 optional 9-state FSM은 Phase D로 남겼다.
- Game Start 기본은 투명, hover/focus에서만 soft pink panel·설명·sparkle을 표시한다. Continue는 항상 DOM에 있고 save 없음은 native disabled 대신 `aria-disabled=true`와 차단 handler를 사용한다.
- Settings는 Phase D용 실제 button/dialog hook만 준비했고 modal open/close나 설정 정책을 구현하지 않았다.
- TITLE BGM은 기존 controller의 20% 기본값·저장값·mute/slider를 compact HUD로 표시한다. `bgm_daily` first-gesture 정책은 Phase D 소유로 유지했다.
- 오른쪽 NHN 건물·HACKATHON banner를 남기고 왼쪽만 dark navy→transparent gradient로 처리했다.

### 폰트·runtime

- 공식 MaruBuri archive에는 SemiBold WOFF2가 없다. 사용자 예외 승인에 따라 `MaruBuri-SemiBold.otf` 공식 원본을 변환·subset·rename 없이 사용했다.
- Pretendard 1.3.9 공식 static WOFF2는 Regular·SemiBold만 사용했다. CDN과 외부 font request는 0이다.
- font HTTP: MaruBuri 742,176B `200 font/otf`; Pretendard 765,892B·785,856B 각각 `200 font/woff2`. Chrome font decode warning/error 0.
- runtime 전 11,882,465B → 폰트 2,293,924B 추가 → 후 14,176,389B(13.52MiB). 30MiB 상한 PASS.
- `font-display: swap`과 serif/system-ui fallback으로 font 완료가 bootstrap을 막지 않는다. 새 origin load 뒤 fallback 포함 DOM이 먼저 생성되고 400ms entry transition 후 실제 font가 적용됨을 확인했다.

### 실제 Chrome visual QA

- 브라우저: Phase B와 같은 일반 Google Chrome profile(직전 확인 버전 `151.0.7922.138`). origin `http://127.0.0.1:5174/the-judge-became-a-magical-girl/`.
- 승인 시안과 구현을 1680×946, Game Start hover 상태의 같은 비교 출력에서 대조했다. 최초 h1 최소 46px를 발견해 52px로 보정한 뒤 재검수했다. 상세 판정은 `design-qa.md`.

| viewport | scrollWidth | scrollHeight | 결과 |
|---|---:|---:|---|
| 1920×1080 | 1920 | 1080 | TITLE·menu·mic·BGM 겹침 없음, 건물/banner 보존 |
| 1600×900 | 1600 | 900 | 기존 `scrollHeight=931` 해소, 전체 핵심 UI viewport 안 |
| 1366×768 | 1366 | 768 | MaruBuri h1 52px, mic bottom 629.56px, focus outline 잘림 없음 |

- Game Start default→hover→exit: hover만 pink gradient, 설명 표시, exit 뒤 background `none`·설명 opacity 0·glow 잔존 없음.
- Tab focus: start·continue에 `:focus-visible`과 설명 표시. save 없는 별도 `localhost` origin에서 Continue `aria-disabled=true`, `tabIndex=0`, `아직 저장된 이야기가 없습니다.`를 확인하고 Enter/Space action을 차단했다.
- 127 origin의 기존 save에서는 Continue 설명이 `마지막으로 저장된 장면부터 이야기를 이어갑니다.`로 표시됐다.
- Chrome console warning/error 0. MaruBuri·Pretendard `document.fonts.check()` PASS. 외부 font URL 0.
- reduced-motion은 CSS·semantic 자동 계약으로 보호한다. OS preference를 바꾸는 수동 QA는 하지 않았다.

### fresh 자동 검증

| 검증 | 결과 | 근거 |
|---|---|---|
| Phase C focused | PASS | 4 files·54 tests |
| `npm run check` | PASS | `tsc --noEmit`, exit 0 |
| `npm test` | PASS | 52 files·320 tests |
| `npm run build` | PASS | Vite 8.2.0, 152 modules. local font 3종 emit, 기존 Transformers 516.22kB warning만 유지 |
| `npm run build:qa` | PASS | QA build 122 modules·186.35kB JS, local font 3종 emit |
| `git diff --check` | PASS | feature staged diff 공백 오류 0 |

### 남은 범위

- Phase D: optional microphone 9-state FSM, Settings modal interaction, voice/click start·resume 선택, TITLE BGM first-gesture.
- Phase E에서 실제 OS reduced-motion, Phase B에서 보존한 Space/Enter·loud/강제 scene replacement PENDING을 다시 확인한다.
- Phase D 코드는 이번 커밋에 포함하지 않았다.
