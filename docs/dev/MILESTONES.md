# M1~M6 구현 계약

공통 규칙:

- 제품 범위는 [메인 기획서 §8.4, §10](../음성_미연시_기획서_v2_A안확정.md)을 따른다.
- 각 단계 시작 시 [마일스톤 프롬프트 템플릿](../../prompts/MILESTONE_TASK_TEMPLATE.md)을 채운다.
- 각 단계 종료물은 로컬에서 실행 가능하고, 그 단계까지 제공된 폴백으로 완주 가능해야 한다.
- 공통 자동 검증은 `npm run check`, `npm test`, `npm run build`다.
- 이전 단계 회귀 시 다음 단계로 가지 않는다. 범위 밖 기능은 별도 제안으로 돌린다.

## 최우선 제품 게이트 — MVP-1 주노 음성 자유대화

`[확정, DEC-023]` Asset 제작·본편 통합보다 먼저, 기본 미연시 화면에서 플레이어가 마이크로 주노와 자유롭게 대화하는 vertical slice를 검증한다.

| 누적 단계 | 주노 Test 화면 결과 |
|---|---|
| M1 | CSS 배경·하단 대화창·`주노` 이름표, 클릭·고정 응답으로 실행 |
| M2 | 같은 화면에 PTT·실시간 자막·로컬 intent 판정 연결 |
| M3 | GPT/Gemini 전환형 STT·Cloudflare Workers·LLM 연결, 주노 persona 기반 다중 턴 자유대화와 오프라인 폴백 완성 |

M1→M3 순서는 유지한다. M3의 MVP-1 검증이 끝나기 전 M4 변신·전투로 넘어가지 않는다. 실제 캐릭터·배경 Asset은 M5 전까지 요구하지 않는다.

MVP-1 완료 기준:

- 실제 Asset 없이 배경과 하단 대화창이 깨짐·404 없이 렌더된다.
- 마이크 발화와 interim/final transcript가 한 턴으로 처리된다.
- 주노가 반말, 최대 두 문장·80자 이내, 스토리 금기 준수 응답을 생성한다.
- LLM 정상·지연·오류·오프라인에서 테스트 대화를 계속할 수 있다.
- GPT/Gemini STT를 각각 선택해 같은 MVP-1 대화 경로를 통과하며, 최종 transcript가 LLM 요청·응답보다 먼저 보인다.
- 클라이언트 번들에 API 키가 없다.
- [QA QJ-01~QJ-08](QA_AND_DEMO.md)이 통과한다.

## M1 — 클릭 완주 가능한 데이터 기반 엔진

### 목표

주노 Test 대화 노드를 포함한 더미 시나리오로 `TITLE → PROLOGUE → DIALOGUE/CUTSCENE → ENDING`을 클릭만으로 완주하고, 검증된 M1을 새 GitHub 저장소의 초기 commit으로 push한다.

### 선행조건

- Git, Node.js, npm, GitHub CLI `gh` 사용 가능.
- `gh auth status` 성공. commit 작성자 정보가 없으면 전역값을 임의 변경하지 않고 사용자에게 저장소 로컬 설정값을 요청.
- `[제안]` npm + Vitest. 결정은 [DEC-010, DEC-011](DECISIONS.md) 참조.
- `[확정, DEC-025]` GitHub 소유자는 `2klips`, 저장소명은 `the-judge-became-a-magical-girl`, 공개범위는 `private`, Vite base는 `/the-judge-became-a-magical-girl/`.
- 동일 이름 저장소, 기존 `.git`, 기존 remote가 있으면 덮어쓰지 않고 현재 상태를 보고한 뒤 중단.
- 별첨1과 구현 계약의 M1 관련 부분 확인.

### 구현 범위

- Vite + TypeScript + Vanilla DOM/CSS 최소 스캐폴드.
- 단일 `GameState`, FSM, 중앙 상태 갱신.
- `dialogue`, 일반 `cutscene`, `ending` 실행.
- 클릭 intent, 호감도·플래그, 턴 상한, 분기 조건 평가.
- `scenario.json`, `characters.json`, `config.json` zod 검증.
- 모든 `next`, 캐릭터 ID, 엔딩 도달 가능성의 최소 참조 검증.
- 노드 이동 시 `localStorage` 스냅샷과 새로고침 복구.
- 실제 에셋 대신 CSS 단색·그라데이션 배경과 하단 대화창. 이름표 `주노`, 대화 본문, 입력 상태 영역을 렌더하고 임시 Asset 파일 요청은 만들지 않음.
- 완성대본 v2 N2를 축약한 주노 Test 노드와 클릭 intent·`offlineReply`. 자유 LLM 응답은 아직 연결하지 않음.
- `check`, `test`, `build` 스크립트와 핵심 도메인 단위 테스트.
- `.gitignore`에 dependency, build, coverage, 로그, IDE 임시 파일, `.env*`, `.dev.vars*`, `.wrangler/` 등 비밀·로컬 산출물 제외.
- 자동·수동 검증 통과 뒤 Git 초기화, `main` 기본 브랜치, 의도적인 초기 commit 생성.
- `2klips/the-judge-became-a-magical-girl` private 저장소 생성, `origin` 연결, `main` 최초 push와 upstream 설정.
- push 뒤 remote URL, commit hash, upstream, clean working tree, 원격 commit 존재를 확인.

### 비범위

- STT, LLM, Workers, 변신 주문, battle 실행.
- 실제 시나리오·에셋, BGM, 파티클, 배포.
- HIDDEN 엔딩 전용 구현.
- GitHub Pages·Workers 배포, GitHub Actions deploy workflow, API 키·Secret 등록.
- force push, 기존 remote 교체, 기존 저장소 삭제, Git 기록 재작성.

### 변경 예상 파일

`.gitignore`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.ts`, `src/state.ts`, `src/fsm.ts`, `src/engine/*`, `src/data/*`, `src/ui/*`, `public/scenario/*`, `tests/*`, Git metadata와 GitHub remote.

### 완료 조건

- 클릭만으로 타이틀에서 최소 한 ending까지 도달.
- 긍정/중립/부정 더미 경로가 예상 affinity·flag·ending을 만든다.
- 잘못된 JSON과 없는 `next`가 한국어 진단으로 시작 전에 차단된다.
- 새로고침 후 마지막 노드와 상태가 복구된다.
- 브라우저 콘솔에 미처리 예외가 없다.
- 주노 Test 화면이 Asset 요청·404 없이 표시되고 클릭 응답이 하단 대화창에 렌더된다.
- GitHub private 저장소 `2klips/the-judge-became-a-magical-girl`이 생성되고 검증된 M1 초기 commit이 `main`에 push된다.
- `origin`과 upstream이 올바르며 로컬·원격 HEAD가 일치한다.
- 비밀정보, dependency, build 산출물, 로컬 설정이 commit에 포함되지 않는다.

### 자동 검증

- 공통 3명령 성공.
- 상태 클램프, flag 화이트리스트, 분기 우선순위, 조건 파서, 스키마·참조 검증, 스냅샷 왕복 테스트.
- `git diff --cached --check`, staged 파일·diff·비밀 패턴 검사 통과 후 commit.
- `git status --short`, `git remote -v`, 현재 브랜치/upstream, `gh repo view`, 원격 HEAD 조회 결과 확인.

### 수동 플레이 검증

- [QA QD-01](QA_AND_DEMO.md), [QJ-01~QJ-02](QA_AND_DEMO.md), [QR-01](QA_AND_DEMO.md), 클릭 경로 3회.
- 새 게임과 복구 선택이 서로 상태를 오염시키지 않는지 확인.

### 실패 시 롤백 또는 폴백

- 스키마/엔진 변경을 기능 단위로 되돌리고 마지막 성공 더미 시나리오 유지.
- 실제 에셋·스토리로 우회하지 않는다.
- 분기식 파서가 미완이면 허용 조건 문법 축소 후 오류를 명시한다. `eval`은 폴백이 아니다.
- GitHub 생성·push가 실패하면 force push나 기존 remote 교체로 우회하지 않는다. 로컬 검증 commit과 정확한 차단 원인을 보존한다.

### 다음 단계 진입 조건

M1 완료 조건과 자동·수동·Git/GitHub 검증 전부 통과. 주노 Test 화면의 입력 포트가 클릭 구현과 STT 구현을 교체 가능하게 분리되고, 원격 `main`이 검증된 M1 commit을 가리킴. MVP-1 자체는 M3까지 미완료 상태로 유지.

## M2 — STT와 로컬 판정

### 목표

PTT·실시간 자막·로컬 키워드 판정으로 M1의 주노 Test 화면과 더미 시나리오를 음성 완주한다.

`[확정, DEC-028]` 이 단계의 Web Speech transcript는 UI·로컬 판정 경계 검증용이다. 정확한 최종 transcript와 버튼 release 종료 녹음은 M3의 GPT/Gemini Worker STT로 교체·검증한다.

### 선행조건

- M1 통과.
- `[미결정]` 로컬 intent 동점 처리 [DEC-012](DECISIONS.md) 승인.
- Chromium 데스크톱과 마이크 테스트 장치.

### 구현 범위

- `SpeechRecognition`: `ko-KR`, `continuous: false`, `interimResults: true`.
- PTT start/stop, 대기/청취/처리 상태, interim 자막.
- 텍스트 정규화와 로컬 intent 키워드 판정.
- 같은 턴 2회 실패 → 클릭, 누적 5회 → 클릭 모드.
- 미지원·권한 거부 감지, 클릭 전환, 명시적 음성 복귀.
- 디버그용 텍스트 transcript 주입.
- 주노 Test 화면에서 음성 transcript와 로컬 `offlineReply`가 같은 대화창에 순서대로 렌더되도록 연결.

### 비범위

- LLM 의미 판정, Workers, 변신/전투.
- 음성 특징·감정 추정, Safari·모바일 최적화.

### 변경 예상 파일

`src/input/stt.ts`, `src/input/click.ts`, `src/judge/local.ts`, `src/ui/micIndicator.ts`, `src/ui/captions.ts`, `src/engine/nodeRunner.ts`, CSS, 테스트.

### 완료 조건

- STT 성공 발화가 로컬 intent와 상태 변경으로 이어짐.
- interim 자막이 최종 transcript 전에 보임.
- 권한 거부·미지원·2회/5회 실패 경로가 클릭 완주성을 유지.
- 클릭↔음성 전환 뒤 중복 콜백·중복 턴 증가 없음.
- Asset 없이 주노와 최소 3턴의 음성→로컬 응답 Test 대화 가능.

### 자동 검증

- 공통 3명령 성공.
- SpeechPort mock으로 성공, interim, timeout/error, cancel, 늦은 콜백 무시 테스트.
- 정규화·키워드·실패 카운터 테스트.

### 수동 플레이 검증

- [QJ-01~QJ-03](QA_AND_DEMO.md), [QS-01~QS-05](QA_AND_DEMO.md), [QP-01~QP-02](QA_AND_DEMO.md).
- 실제 `ko-KR` 발화와 주변 소음 조건 확인.

### 실패 시 롤백 또는 폴백

- Speech 어댑터만 비활성화하고 M1 클릭 엔진 유지.
- 권한 재요청 루프 금지. 사용자가 누르기 전 재요청하지 않는다.

### 다음 단계 진입 조건

음성 입력 UI·로컬 판정과 클릭 강등 경로 모두 완주. Web Speech 정확도 한계와 GPT/Gemini 비교 실측을 기록. M2 완료 판정은 별도 사용자 승인 후 확정하며, M3가 최종 STT 경로를 소유한다.

## M3 — 전환형 원격 STT, Workers 프록시와 LLM 판정

### 목표

주노 Test 화면에서 PTT release 녹음을 선택된 GPT/Gemini STT가 전사하고, 화면에 최종 transcript를 먼저 표시한 뒤 로컬 미매칭 발화를 LLM이 판정·응답한다. 네트워크 차단 상태에서도 대화와 시나리오를 완주한다. 이 단계 종료를 MVP-1 완료 게이트로 삼는다.

### 선행조건

- M2 통과.
- [보안·배포 계약](SECURITY_AND_DEPLOYMENT.md) 확인.
- OpenAI `gpt-transcribe`, Gemini audio transcription, 대화 LLM용 Gemini 모델 ID·현재 쿼터·배포 Origin 확인.

### 구현 범위

- Cloudflare Workers 프록시, Secret 기반 OpenAI/Gemini STT와 Gemini LLM 호출.
- PTT release에서만 녹음을 종료하고 16 kHz mono WAV로 정규화. VAD·무음 자동 종료 금지.
- 공통 `TranscriptionPort` 뒤 GPT/Gemini 어댑터와 개발·QA 전환 설정. 일반 플레이 한 턴에는 하나만 호출.
- 최종 transcript zod 검증·화면 선표시 완료 뒤에만 로컬/LLM 판정 시작.
- 정확한 Origin 허용 목록, 요청 크기·메서드·콘텐츠형 검증.
- 대화/전투 응답 zod 스키마. M3에서는 대화 경로만 UI에 연결.
- 4초 타임아웃 → 1회 재시도 → 고정 폴백 → 3연속 실패 로컬 모드.
- 최근 2~3턴, persona, objective/context, 허용 intent/flag만 전송.
- LLM 결과 클램프·화이트리스트.
- 정상/지연/오류/형식 오류/오프라인 디버그 주입.
- 완성대본 v2 §1 주노, N2, §4~§6을 압축한 persona prompt와 금기 적용.
- 주노 응답을 반말, 최대 두 문장·80자 이내로 검증하고 초과·금기 위반 응답을 안전 폴백으로 대체.

### 비범위

- 전투 UI·변신, 실제 시나리오·에셋, TTS.
- 클라이언트 API 키, 사용자 키 입력.
- 로컬 Whisper 게임 통합, 일반 플레이의 GPT/Gemini 동시 호출, M3에서 production 단일 공급자 확정.

### 변경 예상 파일

`worker/*`, `wrangler.toml` 또는 동등 설정, `src/input/recording.ts`, `src/input/transcription.ts`, `src/judge/llm.ts`, `src/judge/schema.ts`, `src/engine/nodeRunner.ts`, 네트워크 mock, 테스트, `.gitignore`, `.env.example`.

### 완료 조건

- 자유 발화가 검증된 응답·상태 갱신으로 연결.
- 허용 밖 flag/델타/emotion이 차단 또는 안전 변환.
- Workers 장애·GPT/Gemini STT 오류·Gemini LLM 오류·오프라인에서 고정 응답과 로컬 판정으로 완주.
- 브라우저 번들·Git 추적 파일에 키 없음.
- 실제 Asset 없이 마이크→GPT 또는 Gemini STT→transcript 선표시→LLM→주노 응답의 다중 턴 자유대화가 각 공급자에서 동작.
- 플레이어가 말하지 않은 감정을 단정하거나 검은 마법소녀 정체를 공개하는 응답이 차단됨.
- [QA QJ-01~QJ-08](QA_AND_DEMO.md) 전체 통과.

### 자동 검증

- 공통 3명령 성공.
- Workers 요청/Origin/오디오 제한/공급자 라우팅/스키마 테스트.
- GPT/Gemini 각각 동일 WAV 전사, 한 턴 단일 호출, transcript 렌더 전 LLM 미호출 테스트.
- 4초 timeout, 1회 재시도, 3연속 강등, 늦은 응답 무시 테스트.
- 비밀 패턴 검사. 절차는 보안 문서 §8.

### 수동 플레이 검증

- [QJ-01~QJ-08](QA_AND_DEMO.md), [QS-06](QA_AND_DEMO.md), [QL-01~QL-05](QA_AND_DEMO.md).
- DevTools Offline에서도 시작부터 ending까지 클릭/로컬 완주.

### 실패 시 롤백 또는 폴백

- `LlmPort`를 로컬 구현으로 교체. 프록시 실패가 엔진을 막지 않음.
- 모델 응답 형식 문제가 지속되면 고정 폴백 사용. 스키마 완화 금지.

### 다음 단계 진입 조건

GPT/Gemini STT 각각의 정상 경로, 정상 LLM, 완전 오프라인 경로 완주. 공급자별 키·Origin·쿼터·정확도·지연 기록 완료. 최종 공급자는 미결정 상태로 유지해도 되지만 MVP-1 완료 기준 통과 후에만 M4 진입.

## M4 — 변신 주문과 3페이즈 언령 배틀

### 목표

더미 콘텐츠로 변신 3결과와 전투 S/A/B를 재현한다.

### 선행조건

- M3 통과.
- 별첨1 §4.2~§4.3과 메인 §4~§5 확인.
- `[미결정]` 변신 후 컷 2장 참조 방식 [DEC-016](DECISIONS.md) 승인 또는 더미 CSS 연출로 한정.

### 구현 범위

- 주문 정규화·부분 문자열 채점.
- 완창/성공/자동 구제·클릭 표준 변신.
- battle 상태, spell/freeform/guard 3행동.
- 3페이즈 임계/턴 상한 전환, momentum `20..100`, 적 상태 전환.
- S/A/B 등급·호감도 보정·단일 등급 플래그.
- 공용 게이지 스킨, 최소 CSS 플래시/셰이크 placeholder.
- `?debug=1` transcript·momentum·등급 재현 제어.

### 비범위

- 실제 전투 에셋/BGM/파티클, 실제 스토리 밸런싱.
- 자모 유사도, HIDDEN 엔딩, TTS.

### 변경 예상 파일

`src/judge/incantation.ts`, `src/battle/*`, `src/engine/nodeRunner.ts`, `src/ui/gauge.ts`, `src/ui/effects.ts`, 더미 battle JSON, CSS, 테스트.

### 완료 조건

- 변신 완창은 `perfect_transform`과 초기 momentum 60.
- 성공·구제·클릭은 momentum 50이며 진행 중단 없음.
- 정확히 3페이즈, 최대 9턴, momentum 하한 20.
- S/A/B 각각 결정적으로 재현되고 등급 효과가 한 번만 반영.

### 자동 검증

- 공통 3명령 성공.
- Unicode 정규화, 키워드 순서 무관, 주문 경계값.
- 페이즈 임계/턴 상한, momentum·등급 경계 `79/80`, `54/55`, 중복 종료 방지.

### 수동 플레이 검증

- [QT-01~QT-04](QA_AND_DEMO.md), [QB-01~QB-04](QA_AND_DEMO.md).
- 음성·클릭 양쪽으로 전투 후 수렴 노드 진입.

### 실패 시 롤백 또는 폴백

- battle 자유 대응 LLM을 정의된 클릭 대사/guard로 대체.
- 연출 오류 시 CSS 효과를 끄되 상태·페이즈 엔진 유지.
- 주문 인식 문제는 최대 2회 뒤 자동 구제로 진행.

### 다음 단계 진입 조건

변신 3결과와 전투 S/A/B 자동·수동 재현. M3 오프라인 완주 회귀 없음.

## M5 — 실제 시나리오·에셋·연출 통합

### 목표

본편 시나리오와 승인 에셋으로 타이틀부터 엔딩까지 완주한다.

### 선행조건

- M4 통과.
- 실제 `scenario.json`, `characters.json`, 플래그 사전.
- 스타일 앵커 승인, 필수 에셋 생성·라이선스 확인.
- [ASSET_MANIFEST.md](ASSET_MANIFEST.md) 필수 항목 파일명 확정.
- [SCENE_ASSET_MAPPING.md](SCENE_ASSET_MAPPING.md)의 장면별 배경·인물·표정·음악 매핑 확정.

### 구현 범위

- 대화 8~10, 컷씬 2, battle 1, GOOD/NORMAL/BAD 본편 통합.
- NPC 표정 5종, 적 2상태, 플레이어/변신 컷, 필수 배경·BGM.
- N1 주노 미노출, N3 복수 인물, N4→N5 표정 연속성, battle phase별 인물 상태를 장면 매핑대로 적용.
- CSS 타이핑·페이드·셰이크·플래시, Canvas 2D 파티클 1모듈.
- BGM 크로스페이드, Web Audio SFX 약 5종.
- 기본 에셋 프리로드 + 나머지 지연 로드.
- 실제 수치·키워드·엔딩 도달 밸런스 QA.
- HIDDEN은 일정 여유와 승인 시만 포함.

### 비범위

- 컷 우선순위 항목: 자모 유사도, TTS, 추가 포즈/컷, 세이브 UI, 로그/스킵, 설정, 모바일/Safari, 캐릭터 추가.
- 전면 UI 프레임워크 도입.

### 변경 예상 파일

`public/scenario/*`, `public/assets/**/*`, `src/ui/*`, `src/audio/*`, `src/engine/*`, CSS, 에셋 로딩 테스트, `SCENE_ASSET_MAPPING.md`, `ASSET_MANIFEST.md`, `AI_PRODUCTION_LOG.md`.

### 완료 조건

- 실제 본편이 음성·클릭·오프라인 각 경로로 완주.
- GOOD/NORMAL/BAD 도달. 포함 시 HIDDEN도 도달.
- JSON 참조와 파일명이 일치, 필수 에셋 누락 없음.
- 모든 M5 node/phase의 화면 인물·표정·BGM이 장면별 에셋 매핑과 일치.
- 총 에셋 30MB 이하, 목표 환경 첫 화면 3초 이내.
- 표정 전환·배경 합성·BGM 루프/크로스페이드 QA 통과.

### 자동 검증

- 공통 3명령 성공.
- 모든 node/character/flag/asset 참조 무결성.
- 필수 엔딩 도달 가능성 탐색 또는 결정적 시나리오 테스트.
- 파일 크기·총합 검사.

### 수동 플레이 검증

- [QD-01~QD-04](QA_AND_DEMO.md), [QE-01~QE-03](QA_AND_DEMO.md), 전체 본편 3경로.
- 별첨1 §8, 별첨2 §6 체크리스트.

### 실패 시 롤백 또는 폴백

- `[확정, DEC-040]` 누락·불량 외부 이미지·컷은 검은 presentation, BGM은 무음으로 대체하고 manifest의 `missing` 상태와 재요청 기록을 유지한다.
- 선택 BGM/컷/HIDDEN부터 제거. 필수 완주 경로는 유지.
- 실제 시나리오 오류 시 마지막 검증 통과 버전으로 복귀.

### 다음 단계 진입 조건

실제 본편 필수 범위와 3엔딩 통과. 필수 에셋 라이선스·QA 상태 완료.

## M6 — 리허설·디버그·배포·제출

### 목표

현장 시연, 제출 링크, 완주 영상이 같은 검증된 빌드를 사용한다.

### 선행조건

- M5 통과.
- `[확정, DEC-028]` GPT/Gemini 중 production STT 공급자 사용자 선택 완료.
- GitHub 저장소·Pages base/Origin, Workers 배포 계정과 키 정책 확정.
- 현장 Chrome·마이크·네트워크 조건 확보.

### 구현 범위

- `?debug=1`: 상태 표시, 강제 노드/등급, 텍스트 입력, 장애 주입.
- 프로덕션에서 debug 접근 정책 확정·적용.
- GitHub Actions 빌드→Pages 배포.
- Workers production Origin·쿼터·예비 키 운영.
- 선택된 STT 공급자 하나만 production 라우트에 활성화하고 비선택 STT 라우트·전용 Secret·비교 Lab 번들을 제거.
- 전체 회귀, 현장 리허설, 제출 영상 녹화.
- AI 제작 로그·에셋 라이선스·비밀 검사 마감.

### 비범위

- 새 게임 기능, 컷 기능 복원, 대규모 리팩터링.
- 리허설 중 발견된 비차단 미관 개선.

### 변경 예상 파일

`src/debug/*`, `.github/workflows/deploy.yml`, 배포 설정, 운영 문서 상태, 테스트·스크립트, 제출 산출물 참조.

### 완료 조건

- Pages HTTPS URL에서 Chrome smoke test 통과.
- production Workers는 허용 Origin만 응답.
- production 일반 플레이에서 선택된 STT 공급자만 호출되고 비선택 공급자 요청은 0건.
- 정상/마이크 거부/네트워크 오프라인 현장 절차 각 1회 성공.
- 제출 영상에 타이틀→음성 인식→변신→전투→엔딩이 담김.
- 비밀·미승인 에셋·깨진 링크 없음.

### 자동 검증

- 공통 3명령 성공.
- CI 동일 명령 성공, 배포 산출물 base 경로 검사.
- 링크, 비밀 패턴, 에셋 총량 검사.

### 수동 플레이 검증

- [QG-01~QG-02](QA_AND_DEMO.md)와 현장·녹화 체크리스트 전부.
- 배포 URL에서 새 브라우저 프로필로 권한 흐름 확인.

### 실패 시 롤백 또는 폴백

- 마지막 검증된 Pages 배포를 유지. 실패 빌드로 교체하지 않는다.
- Workers 장애 시 로컬/클릭 비상 시연.
- 라이브 데모 불능 시 사전 녹화 영상과 링크 빌드 사용.

### 종료 조건

제출 링크·영상·현장 빌드 식별자가 기록되고 QA 책임자가 승인.
