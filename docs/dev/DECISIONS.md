# 결정 기록

## ADR-lite 양식

```md
## DEC-XXX — 제목

- 날짜: YYYY-MM-DD
- 상태: proposed | accepted | rejected | superseded
- 결정:
- 이유:
- 영향:
- 대안:
- 관련 문서와 코드:
- 재검토 조건:
```

`accepted` 변경은 승인 근거를 남긴다. 상위 기준 문서를 바꾸는 결정은 사용자 승인 없이 accepted로 만들 수 없다.

## 확정 결정

| ID | 날짜 | 상태 | 결정 | 이유 | 영향 | 대안 | 관련 문서와 코드 | 재검토 조건 |
|---|---|---|---|---|---|---|---|---|
| DEC-001 | 2026-07-28 | accepted | A안: LLM 자유 대화 + 스탯 수렴 | 음성 차별점과 서사 수렴 결합 | 대화 노드·판정·상태 모델 | B안 감정 특징 추정 rejected | 메인 §서문, §2~§3 | 기획 방향 공식 변경 |
| DEC-002 | 2026-07-28 | accepted | STT 우선, 클릭·로컬 완주 폴백 | 현장 실패가 완주를 막지 않음 | 모든 입력 노드에 대체 경로 | STT 전용 rejected | 메인 §3, §10 | 시연 요구 변경 |
| DEC-003 | 2026-07-28 | accepted | 음성 변신 주문 게이트 | 시그니처 음성 장면 | 완창/성공/자동 구제 | 실패 관문 rejected | 메인 §4, 별첨1 §4.2 | 기획 변경 |
| DEC-004 | 2026-07-28 | accepted | 3페이즈 momentum 언령 배틀, S/A/B, 패배 없음 | 대화 엔진 재사용·데모 안정성 | battle 러너·등급 | JRPG식 전투 rejected | 메인 §5, 별첨1 §4.3 | 기획 변경 |
| DEC-005 | 2026-07-28 | accepted | TypeScript + Vite + Vanilla DOM/CSS | 정적 배포·낮은 복잡도 | UI 프레임워크 금지 | 프레임워크 기반 rejected | 메인 §8.1 | 기술 제약 공식 변경 |
| DEC-006 | 2026-07-28 | accepted | JSON + zod 런타임·참조 검증 | 작가 협업 안전망 | loader가 시작 전 진단 | 타입만 사용 rejected | 메인 §8.1~§8.2, 별첨1 | 데이터 포맷 변경 |
| DEC-007 | 2026-07-28 | accepted | Gemini 호출은 Cloudflare Workers 프록시 | 클라이언트 키 비노출 | 별도 worker 배포·Origin 통제 | 클라이언트 키/사용자 키 rejected | 메인 §8.1, §9 | 승인된 백엔드 전략 변경 |
| DEC-008 | 2026-07-28 | accepted | GitHub Actions→GitHub Pages | HTTPS 정적 배포 | Vite base·CI 필요 | 별도 호스팅 rejected | 메인 §8.1 | 제출 플랫폼 변경 |
| DEC-009 | 2026-07-28 | accepted | M1→M6, 각 단계 실행 가능 | 회귀·통합 위험 축소 | 단계 게이트 필수 | 일괄 구현 rejected | 메인 §8.4, §10 | 일정 공식 변경 |
| DEC-012 | 2026-07-31 | accepted | dialogue 로컬 판정은 정규화된 고유 키워드 매칭 수가 유일하게 가장 높은 intent만 채택한다. 0점·동점은 M2에서 클릭 선택을 요구하고 M3에서는 LLM 판정으로 넘긴다 | 임의 배열 순서 선택을 막고 오프라인 완주성을 유지. 사용자의 M2 진행 지시를 이 제안 규칙 적용 승인으로 해석한다고 작업 시작 시 고지 | `src/judge/local.ts`, transcript 판정, M2 클릭 폴백 | 첫 매칭·배열 순서 우선 rejected | `IMPLEMENTATION_SPEC.md` §4, `MILESTONES.md` M2, `tests/localJudge.test.ts` | 실제 작가 키워드에서 겹침·오판정 실측 |
| DEC-017 | 2026-07-28 | accepted | 에셋: GPT Image/미드저니/Suno/Codex, 30MB 이하 | 100% AI 제작·역할 적합성 | manifest·AI 로그 필요 | 혼합 수작업 rejected | 별첨2 §1~§6 | 대회 규정/툴 약관 불허 |
| DEC-018 | 2026-08-02 | accepted | Gemini 대화·전투 판정 모델은 `gemini-3.1-flash-lite`, `thinkingLevel: minimal`을 Worker에서 고정한다 | 기존 기획 모델이 신규 사용자 API에서 사용 불가해 M3 실호출 가능한 모델로 교체했다 | `worker/index.ts`, `wrangler.jsonc`, `.env.example`, M3/M4 Worker 테스트. 클라이언트는 모델·thinking 설정을 변경할 수 없음 | 사용 불가 모델 유지, 클라이언트 모델 선택 rejected | `IMPLEMENTATION_LOG.md` M3, `SECURITY_AND_DEPLOYMENT.md` §4~§5, `worker/index.ts` | 모델 제공 종료, 가격·쿼터·structured output 지원 변경 |
| DEC-022 | 2026-07-28 | accepted | M1 완료 범위에 로컬 Git 초기화, GitHub 저장소 생성, 검증된 초기 commit의 `main` push를 포함하고 Pages 배포는 M6에 유지 | M1부터 원격 이력·복구 지점을 확보하되 배포 위험은 분리 | M1 선행조건·완료·검증에 Git/GitHub 게이트 추가 | pre-M1 별도 저장소 준비 또는 M6까지 로컬 유지 rejected | `MILESTONES.md` M1, `SECURITY_AND_DEPLOYMENT.md` §7~§8, M1 프롬프트 | 사용자가 저장소 게시 시점을 다시 지정 |
| DEC-023 | 2026-07-31 | accepted | 에셋 통합 전 최우선 MVP-1을 `주노 음성 자유대화` 수직 슬라이스로 정하고 M1→M3에서 누적 구현한다. M3 통과를 M4 진입 게이트로 삼는다 | 실제 에셋 없이 STT·LLM·로컬 폴백의 핵심 재미와 현장 안정성을 먼저 검증 | M1은 CSS 배경·대화창·클릭, M2는 STT·로컬 판정, M3은 Workers·LLM 자유대화를 같은 화면에 연결 | 별도 M0 신설 또는 M1~M6 재배치 rejected | `IMPLEMENTATION_SPEC.md` §1.1, `MILESTONES.md` MVP-1, `QA_AND_DEMO.md` §1.1, 완성대본 v2 N2·§4~§6 | 사용자가 우선순위 또는 M1~M6 순서를 공식 변경 |
| DEC-025 | 2026-07-31 | accepted | M1 GitHub owner는 `2klips`, private 저장소명은 `the-judge-became-a-magical-girl`, Vite base는 `/the-judge-became-a-magical-girl/`로 고정 | 사용자가 작품 제목을 적절한 영어로 번역한 저장소 생성을 지시했고 인증 계정을 명시 | M1 원격 생성·정적 경로·후속 Pages 설정의 기준 변경 | `NHN_hackathon` 기본명 superseded | `vite.config.ts`, M1 계약, 보안·배포, QA QV-04 | 사용자가 저장소명·소유자·공개범위를 다시 지정 |
| DEC-027 | 2026-08-02 | accepted | 공급자 선택 전, 격리된 `stt-lab.html`에서 동일한 PTT 녹음을 16 kHz mono PCM WAV로 고정해 A OpenAI `gpt-transcribe`, B Gemini `gemini-2.5-flash`, C 브라우저 로컬 `onnx-community/whisper-small`에 전달하고 전사문·지연·CER를 비교한다 | 사용자가 Web Speech 실제 발화에서 낮은 정확도와 발화 중 조기 종료를 확인했고 A/B/C 모두를 한 화면에서 먼저 시험하도록 승인 | `@huggingface/transformers`, 로컬 전용 Wrangler Worker, multipart STT 경계, 비교 UI·테스트 추가. 게임 `GameState`·FSM·M2 Web Speech 경로와 production 공급자 결정은 변경하지 않음 | 현 Web Speech만 조정, 한 공급자를 바로 채택하는 방식 rejected | `stt-lab.html`, `src/stt-lab/`, `worker/sttLab.ts`, `wrangler.stt-lab.toml`, `tests/sttLab*.test.ts` | 여러 사람·소음 조건 실측 후 사용자가 production STT 공급자를 선택하거나 Lab을 제거할 때 |
| DEC-028 | 2026-08-02 | accepted | 로컬 Whisper는 STT 후보에서 탈락시킨다. OpenAI `gpt-transcribe`와 Gemini audio transcription은 MVP-1 완료까지 교체 가능한 두 STT 공급자로 유지하고, 한 플레이 턴에는 선택된 공급자 하나만 호출한다. 최종 production 공급자는 M6 진입 전에 사용자가 선택하며 비선택 STT 경로와 전용 Secret은 비활성·제거한다 | 사용자 실제 발화 비교에서 로컬 Whisper 정확도가 기준 미달. GPT와 Gemini 정확도는 비슷했고 응답시간은 GPT 약 1,116ms, Gemini 약 3,220ms로 GPT가 빨랐으나 한 차례 실측만으로 최종 비용·안정성까지 확정하기 부족하다고 판단 | M3에 동일 인터페이스의 GPT/Gemini STT 어댑터·개발/QA 전환 설정·전사문 선표시를 포함. 로컬 Whisper는 게임 경로에 연결하지 않음. M6에 최종 단일 공급자 게이트 추가 | 로컬 Whisper 유지, 매 턴 A/B 동시 호출, 지금 즉시 단일 API 확정 rejected | 메인 §8~§11, `IMPLEMENTATION_SPEC.md` §1.1·§4~§8, `MILESTONES.md` M3·M6, `QA_AND_DEMO.md` QS/QL/QG, `SECURITY_AND_DEPLOYMENT.md` | MVP-1 다중 화자·소음·장문 비교에서 정확도·지연·비용 결과가 크게 달라지거나 사용자가 최종 공급자를 선택할 때 |
| DEC-029 | 2026-08-02 | accepted | M4는 별첨1의 기존 `incantationGate`와 `battle` 계약으로 더미 변신 1게이트·3페이즈만 구현한다. 변신 컷은 CSS placeholder로 한정하고 새 asset/후속 컷 필드는 만들지 않는다. 실제 완성대본 N5~N8 매핑은 DEC-024로 미결정 유지한다. `BattleState`는 노드 안의 일시 상태이며 새로고침 복구는 battle 페이즈 1 시작으로 정규화한다 | 사용자가 M3 커밋·푸시 후 M4 진행을 지시했고 M4 계약은 더미 콘텐츠와 CSS 연출을 허용한다. 미승인 본편 매핑과 asset 스키마를 고정하지 않으면서 엔진·게이트를 검증하기 위함 | `public/scenario/scenario.json`, cutscene/battle zod 스키마, `src/judge/incantation.ts`, `src/battle/*`, FSM·저장 복구·M4 UI | 완성대본의 주문 2개/N6~N8을 지금 고정하거나 cutscene asset 필드를 임의 추가하는 방식 rejected | `MILESTONES.md` M4, 메인 §4~§5, 별첨1 §4.2~§4.3, `IMPLEMENTATION_LOG.md` M4 | M5 본편 매핑·실제 변신 컷 스키마 승인 또는 battle 중간 저장 요구 변경 |
| DEC-016 | 2026-08-02 | accepted | M5의 유일한 변신 게이트가 끝나면 엔진이 `transform.cast` → `transform.complete`와 `bgm_transform`을 고정 순서로 재생한다. perfect/standard/자동 구제 모두 같은 두 컷을 사용하고 효과 강도만 달리한다. `cutscene` JSON 필드와 노드 수는 늘리지 않으며 누락·불량 파일은 기존 CSS placeholder로 폴백한다 | 변신 이벤트는 한 번뿐이고 M5의 컷씬 2개 계약을 지키면서 실제 컷 2장을 연결해야 한다. 시나리오 스키마 확장보다 중앙 연출 계약이 작고 실패에도 진행을 보장한다 | 에셋 resolver·변신 UI·오디오·로딩 테스트와 `ASSET_MANIFEST.md`. `incantationGate` 스키마는 유지 | 별도 cutscene 노드 2개, `assets[]`/후속 연출 JSON 필드 추가 rejected | 메인 §4.1, 별첨1 §4.2, 별첨2 §2, `IMPLEMENTATION_SPEC.md` §4·§9, M5 | 변신 이벤트가 둘 이상 생기거나 시나리오별 다른 변신 컷이 필요할 때 |
| DEC-019 | 2026-08-02 | accepted | `bg_hall_dark`는 정확한 계약 파일 `public/assets/bg/bg_hall_dark.webp`가 존재하고 로드되면 그 파일을 우선한다. 없거나 로드 실패하면 `bg_hall_day.webp`에 고정 필터·비네트·회색 오버레이를 적용하고, 베이스도 없으면 CSS placeholder로 진행한다. 외부 파일은 임의 이동·편집·이름 변경하지 않는다 | 사용자가 외부 담당자가 실파일을 제공할 경우 CSS 파생보다 파일을 사용하도록 최신 우선순위를 지정했다. 동시에 미전달·불량 파일이 M5 병렬 개발과 완주를 막지 않아야 한다 | 중앙 resolver의 `physical → derived → placeholder` 사다리, 에셋 오류 진단, M5 시각 QA. 시나리오는 확장자 없는 `bg_hall_dark`를 참조 | CSS 파생 고정, 실파일 필수로 시작 차단 rejected | 사용자 최신 결정, 별첨2 §3.1, `ASSET_MANIFEST.md`, `IMPLEMENTATION_SPEC.md` §9 | 외부 담당자가 파일 계약을 변경하거나 사람 QA에서 우선순위를 재지정할 때 |
| DEC-020 | 2026-08-02 | accepted | M5 플래그 사전은 `promise`, `perfect_transform`, `battle_S`, `battle_A`, `battle_B` 다섯 개로 고정한다. N4 관계 A/B/C는 새 플래그 없이 직접 node 이동과 `affinity` 구간으로 표현한다. `promise`는 전투 후 회색 빛에 가능성을 인정하는 최종 긍정 intent만 설정한다. 최종 냉소·거절 intent는 affinity와 무관하게 BAD로, 유보 intent는 NORMAL로 직접 이동한다. 변신·전투 플래그는 엔진만 설정하고 battle 등급 플래그는 상호 배타적이다 | 관계용 플래그를 늘리지 않아 화이트리스트와 엔딩 조건을 단순하게 유지하고, GOOD의 `affinity >= 70 && flags.promise` 계약을 실제 마지막 답과 연결한다 | `config.allowedFlags`, dialogue `allowedFlags/setFlags`, 최종 분기와 결정적 엔딩 테스트. 상세 사전은 아래 M5 매핑 계약을 따른다 | `relationship_a/b/c`, `believed_again`, `final_spell` 등 새 플래그 추가 rejected | 메인 §2·§6, 별첨1 §7, 완성대본 N4·N7~N8, M5 | 새 엔딩 조건 또는 관계 상태를 N5 이후 조건 분기에 직접 사용해야 할 때 |
| DEC-024 | 2026-08-02 | accepted | 완성대본 v2를 M5에서 dialogue 8개, cutscene 2개, battle 1개, GOOD/NORMAL/BAD 3개로 매핑한다. N5의 두 주문은 줄바꿈된 한 `displayText`와 한 번의 PTT 녹음으로 채점한다. battle p1은 N6 방어, p2는 N6 공격, p3는 N7 핵심 질문과 N8 마지막 주문을 결합한다. HIDDEN은 M5 컷 범위로 제외한다 | 현 스키마와 M5 노드 수를 유지하면서 5분 시연 대본, 단일 변신 게이트, 3페이즈 전투를 모두 보존한다. HIDDEN은 메인 MVP 컷 1순위다 | 실제 node/주문/분기 계약은 아래 M5 매핑 계약. 새 JSON 필드 없이 본편 `scenario.json`·`characters.json`을 작성할 수 있다 | N5 게이트 2개, battle 분할, 세 번째 cutscene, HIDDEN 선행 구현 rejected | 완성대본 v2 N0~N8, 메인 §4~§7·§10, 별첨1 §4, M5 | 사용자 대본 변경, HIDDEN 복원 승인, 사용자 테스트에서 5분 흐름이 과도하게 압축될 때 |
| DEC-030 | 2026-08-02 | accepted | 모든 물리 이미지·음악 에셋 제작은 외부 작업자가 담당한다. 이 Codex 세션은 창작 파일을 생성·편집하지 않고 논리 ID·파일명 인계 계약, 자동 검수, resolver·연출·오디오 코드 통합, 수동 QA를 담당한다. CSS·Canvas·Web Audio는 파일 에셋 제작이 아닌 런타임 코드로 유지한다 | 사용자가 에셋 담당 분리를 명시했고 M5 병렬 진행이 필요하다 | 외부 전달물은 규격·용량·루프·라이선스·제작 이력 검수 전 `approved`로 올리지 않는다. `asset/` 원본 인계 폴더는 자동 수정·stage하지 않는다 | 이 세션의 로컬 생성 모델 설치·에셋 본생산 rejected | 사용자 최신 결정, 별첨2, `ASSET_MANIFEST.md`, `AI_PRODUCTION_LOG.md`, M5 | 사용자가 에셋 책임 범위를 다시 지정할 때 |
| DEC-031 | 2026-08-02 | accepted | M5는 외부 에셋 제작과 병렬로 본편 JSON·로더·연출 코드를 먼저 구현한다. 아직 전달되지 않은 파일은 CSS placeholder로 테스트한다. 외부 파일 불일치·규격 오류는 원본을 고치거나 이름을 바꾸지 않고 논리 ID·기대 경로·실제 경로·오류를 담당자에게 반환한다 | 사용자가 병렬 진행, placeholder 테스트, 외부 원본 무변경 오류 반환을 명시했다 | asset catalog·resolver·진단 메시지·자동 테스트. `public/assets/` 통합 전에도 본편 클릭·오프라인 완주 가능 상태 유지 | 에셋 도착까지 M5 코드 중단, 외부 파일 자동 rename/convert rejected | 사용자 최신 결정, M5, DEC-030, `ASSET_MANIFEST.md` | 외부 인계 절차 또는 수정 책임자가 변경될 때 |
| DEC-032 | 2026-08-02 | accepted | 외부 제작자와 개발자가 공유하는 장면별 에셋 계약을 `SCENE_ASSET_MAPPING.md`로 고정한다. 현재 M5의 기존 논리 ID·파일명은 유지하되 각 node/phase의 배경 의미, 표시 인물·표정, BGM, 컷과 폴백을 명시한다. `bgm_crisis`, `bgm_ending`, 검은 마법소녀 후속 컷은 컷 가능이며 없을 때 기존 필수곡·CSS 연출로 완주한다. N1 주노 미노출, N3 복수 인물, N4→N5 표정 연속성, battle phase별 인물 상태는 presentation 계층이 적용한다 | 사용자가 대본·시나리오를 기준으로 에셋 작업자가 제작 목록을 확인하고 추후 개발자가 같은 명세로 장면별 매핑하도록 요청했다. 현재 dirty M5 JSON·resolver의 ID를 바꾸지 않으면서 서사와 화면 계약을 분리해야 한다 | 새 문서, 문서 지도, M5 완료 조건, manifest, workflow skill. `ending.black_magical_girl`은 컷 가능 논리 ID로 추가. 시나리오 스키마 확장과 물리 에셋 생성은 없음 | 기존 manifest만 사용해 장면 의미를 개발자가 추측하는 방식, 현재 M5 ID 전면 rename rejected | 사용자 최신 결정, 완성대본 v2 N0~N8·엔딩, 별첨2, `SCENE_ASSET_MAPPING.md`, `ASSET_MANIFEST.md` | 대본 장면·M5 노드 지도·외부 인계 방식 또는 물리 파일명이 변경될 때 |
| DEC-033 | 2026-08-02 | accepted | 별첨1의 기존 optional `ending.gradeVariants` 계약을 zod ending schema와 UI에 연결하고, 현재 `GameState.battleGrade`에 해당하는 추가 대사만 기본 ending lines 뒤에 표시한다 | strict schema가 작가 가이드의 유효 필드를 거부하고 구현 명세의 등급별 엔딩 흔적을 렌더하지 못하는 불일치를 수정한다 | `src/data/schema.ts`, `src/ui/gameView.ts`, loader·presentation 회귀 테스트. 현재 scenario JSON과 플래그 사전은 변경 없음 | 필드 삭제, 등급별 별도 ending 노드 추가 rejected | 별첨1 §4.4, `IMPLEMENTATION_SPEC.md` §5, M5 | 엔딩 데이터 형식 또는 전투 등급 저장 방식 변경 |
| DEC-034 | 2026-08-03 | accepted | 외부 에셋의 실파일명이 계약명과 다르면 납품 원본은 보존하고, 채택된 파일만 `public/assets/{bg|char|cut|bgm}/`에 계약명으로 복사한다. 원본명→계약명, 제외·누락·재작업 사유를 `ASSET_MANIFEST.md`와 납품 README에 기록한다. 누락 파일은 placeholder 경로로 작업을 계속하고 추후 작업자 요청 목록에 남긴다 | 사용자가 파일명은 개발자가 정규화하고 누락 이미지는 제외한 채 작업을 시작하되 추후 수정·재전달을 위한 기록을 남기도록 결정했다 | DEC-031의 “이름 불일치 시 반환만” 규칙 중 파일명 처리 방식을 대체한다. 논리 ID·장면 계약·포맷이 바뀌는 경우는 자동 정규화하지 않고 별도 결정한다 | 외부 원본 rename, 누락 파일 placeholder 생성, 미참조 에셋 일괄 runtime 복사 rejected | 사용자 최신 결정, `docs/Asset/README.md`, `ASSET_MANIFEST.md`, `SCENE_ASSET_MAPPING.md` | 외부 인계 폴더·명명 책임 또는 장면 계약 변경 |
| DEC-035 | 2026-08-03 | accepted | 납품된 정면 `char_doyun_magical.png`을 M5 battle p1~p3의 `doyun.magical` 임시 실파일로 사용한다. 원본과 동일 바이트를 계약 경로 `public/assets/char/char_doyun_magical.png`에 복사하고 `ready`로 전환한다. 뒷모습/반측면은 권장 최종 구도로 작업자 교체 요청을 유지하며 라이선스 확인 전 `approved`로 올리지 않는다 | 사용자가 정면 파일의 M5 임시 통합을 명시적으로 승인했다. 현재 물리 에셋 로드·배치 QA를 시작하면서 최종 구도 개선 가능성을 보존한다 | `doyun.magical` 물리 로드, M5 asset 테스트·battle 수동 QA, manifest·장면 매핑. 논리 ID·resolver 경로는 변경 없음 | 교체 파일까지 placeholder 유지, 장면 계약을 영구 정면으로 변경 rejected | 사용자 최신 결정, DEC-034, `ASSET_MANIFEST.md`, `SCENE_ASSET_MAPPING.md`, `tests/m5Assets.test.ts` | 후면/반측면 교체본 도착, 라이선스 확인, battle 합성 QA 실패 |
| DEC-036 | 2026-08-03 | accepted | commit `c2e3e1a`의 실제 배경 16장을 모두 장면에 배정한다. 기존 `bg_title`, `bg_hall_day`, `bg_hall_dark`, `bg_hall_void`는 유지하고 `bg_office_wide`, `bg_hall_time_stop`, `bg_hall_good`, `bg_hall_normal`, `bg_hall_bad`, `bg_desk_closeup`, `bg_battle_wide`, `bg_battle_core`, `bg_mind_archive`, `bg_corridor_day`, `bg_corridor_blacklight`, `bg_transform_space`를 추가한다. node JSON의 단일 `scene.bg`는 베이스만 유지하고, node line·battle phase·ending beat별 교체는 presentation 고정 매핑으로 구현한다 | 사용자가 핵심 4장 우선 통합 대신 16장 전체 장면 매핑 선확정을 선택했다. 완성대본 N0~N8·엔딩의 구체적 화면 전환과 인계 문서의 제작 의도를 모두 보존한다 | `SCENE_ASSET_MAPPING.md`가 16장 원본→논리 ID→장면 전환을 소유하고 `ASSET_MANIFEST.md`가 계약 파일명·상태를 소유한다. 후속 catalog·presentation·테스트 변경 필요. 시나리오 스키마·노드 수·플래그는 변경 없음 | 기존 4개 ID만 사용, 16개를 모두 필수 런타임 blocker로 승격, 시나리오에 배경 배열 필드 추가 rejected | 사용자 최신 결정, 완성대본 v2 N0~N8·엔딩 A~D, commit `c2e3e1a`, `asset/배경세트_인계_및_씬배치.md`, DEC-024·032·034 | 장면 대본 변경, 사람 시각 QA에서 배경 내용 불합격, 전체 용량·전환 복잡도가 M5 완료를 위협할 때 |
| DEC-037 | 2026-08-03 | accepted | DEC-036의 확정 배경 16장은 원본 ZIP을 보존한 채 채택 복사본만 `1920×1080 WebP ≤500KB`로 crop·resize·압축해 runtime에 통합한다. `TITLE`에 baked된 NHN/HACKATHON 문구·로고는 현재본 사용을 임시 승인하되 clean 교체 요청을 유지한다 | 사용자가 확정 Asset으로 M5 진행과 현재 TITLE baked 문구·로고의 임시 승인을 명시했다. 인계 문서도 최종 채택본의 runtime 규격 변환을 요구한다 | `public/assets/bg/` 16개, catalog·presentation·자동 규격 테스트·manifest. content QA 임시 승인은 생성·라이선스 증빙 승인을 뜻하지 않으므로 상태는 `ready`까지만 허용한다 | TITLE 통합 보류, 원본 PNG 직접 runtime 사용, 원본 ZIP 수정 rejected | 사용자 최신 결정, DEC-034·036, `ASSET_MANIFEST.md`, `SCENE_ASSET_MAPPING.md`, 배경 인계 문서 | clean TITLE 도착, 대회 로고 사용 정책 변경, crop 시 핵심 피사체 손실, 생성·라이선스 증빙 확인 |
| DEC-038 | 2026-08-03 | accepted | M5 장면 검수용 dev interface는 기존 `?debug=1`에 22개 장면 선택기를 추가하고 `?debug=1&scene=<장면ID>`로 비파괴 직접 프리뷰한다. 프리뷰는 저장소·FSM을 생성하거나 변경하지 않으며 invalid ID는 선택 안내를 표시한다 | 사용자가 장면별 dev 버전과 해당 query interface를 승인했다. 16개 배경뿐 아니라 N4 관계·N5 단계·battle p3 질문/주문·GOOD 후속 beat를 각각 검수해야 한다 | `src/dev/scenePreview.ts`, `GameView` dev navigator/preview, query boot 분기, CSS, unit·Playwright QA. 정상 URL에는 dev UI가 없다 | 별도 HTML entry, save state 강제 주입, 시나리오 스키마에 dev field 추가 rejected | 사용자 최신 결정, `QA_AND_DEMO.md`, DEC-036·037 | M6 production에서 debug 제거 요구, 장면 계약 변경, 운영 URL과 dev URL 분리 승인 |
| DEC-039 | 2026-08-03 | accepted | GOOD/NORMAL/BAD 엔딩은 한 화면 전체 본문 대신 문장별 `계속` 페이지로 표시한다. GOOD line 0~4는 `bg_hall_good`, line 5는 `bg_corridor_day`, line 6 이후는 `bg_corridor_blacklight`; NORMAL/BAD는 각 전용 배경을 유지하고 마지막 페이지에만 `처음부터`를 표시한다 | 사용자가 GOOD의 본 장면→밝은 복도→검은빛 복도 runtime 전환을 위해 문장별 진행을 승인했다 | ending presentation과 배경 resolver·테스트. ending JSON·FSM·save schema는 유지한다 | 모든 문장을 한 카드에 유지, 새 ending node 2개 추가, 자동 시간 전환 rejected | 사용자 최신 결정, 완성대본 GOOD 후속, DEC-033·036 | ending 대본 line 순서 변경, 스킵/로그 UI 승인, 후속 훅 컷 결정 변경 |
| DEC-040 | 2026-08-03 | accepted | 외부 필수 이미지·컷이 아직 없으면 해당 presentation 영역을 검은 placeholder로, 필수 BGM이 없으면 무음으로 처리해 M5 개발·기능 QA를 계속한다. 검은 presentation에서도 대사·자막·버튼·PTT·게이지는 유지한다. 실파일 도착 시 기존 논리 ID·계약 경로에 채우고 같은 장면 QA를 재실행한다 | 사용자가 외부 작업 완료를 기다리지 않고 검은 화면 대체로 M5를 진행한 뒤 추후 에셋을 채우도록 결정했다. 클릭·오프라인 완주 불변 계약 때문에 입력 UI까지 숨길 수 없다 | `GameView` 누락 에셋 presentation, BGM 오류 무음 처리, 회귀 테스트, 작업자 요청 문서, M5 QA 절차. manifest의 `missing/ready/approved` 상태 의미와 최종 제출 라이선스 게이트는 유지한다 | CSS 장식 placeholder 유지, 빈 파일 생성, 누락 에셋을 `ready`로 표시, UI까지 전체 black-out rejected | 사용자 최신 결정, DEC-030·031·034, M5, `M5_ASSET_HANDOFF_REQUEST.md` | 외부 필수 에셋 전부 도착, 최종 제출 게이트에서 placeholder 허용 여부 변경 |

## M5 본편 매핑 계약 — DEC-020·DEC-024·DEC-032

### 노드 지도

| 순서 | 런타임 노드 | 타입 | 완성대본 매핑 | 핵심 계약 |
|---:|---|---|---|---|
| 1 | `n0_review` | cutscene | N0 | 반복 심사와 첫 음성 안내. `n1_first_voice`로 이동 |
| 2 | `n1_first_voice` | dialogue | N1 | 재미/휴식/의심 3 intent로 주노 등장 반응 결정 |
| 3 | `n2_juno_intro` | dialogue | N2 자유 대화 1 | 호의/현실 반박/냉담 intent |
| 4 | `n2_juno_followup` | dialogue | N2 자유 대화 2 | 정체·선택 이유 질문을 받고 사건으로 수렴 |
| 5 | `n3_wraith_choice` | dialogue | N3 | 사람 우선→`n4_team`, 방법 우선→`n4_cooperate`, 도망·동조→`n4_awkward` |
| 6 | `n4_team` | dialogue | N4-A | 죽이 맞는 콤비 대사 후 변신으로 수렴 |
| 6 | `n4_cooperate` | dialogue | N4-B | 마지못한 협력 대사 후 변신으로 수렴 |
| 6 | `n4_awkward` | dialogue | N4-C | 회복/거리 유지 intent를 한 번 받고 변신으로 수렴 |
| 7 | `n5_transform` | cutscene | N5 | 단일 변신 게이트, DEC-016의 두 컷 고정 연출 |
| 8 | `battle_wraith` | battle | N6~N8 | p1 방어, p2 공격, p3 핵심 질문+마지막 주문 |
| 9 | `ch3_gray_answer` | dialogue | 정화 뒤 회색 빛에 대한 답 | 긍정은 `promise` 설정 후 조건표, 유보는 NORMAL, 냉소·거절은 BAD로 직접 수렴 |
| 10 | `ending_good/normal/bad` | ending | 엔딩 A/B/C | HIDDEN은 M5 제외 |

dialogue 노드는 전체 8개다. N4에서는 한 경로만 실행되므로 한 플레이의 실제 대화 노드 수는 6개다. M5는 완성대본의 약 5분 시연 경로를 게이트 대상으로 삼고, 메인 기획의 10~30분 확장 목표는 삭제하지 않되 현재 본편에 추가 장면을 발명해 맞추지 않는다.

### 주문 매핑

| 위치 | 표시/입력 계약 | 키워드·채점 계약 |
|---|---|---|
| N5 변신 | `몽글몽글 설렘아, 잠든 마음을 깨워 줘!\n해피 플레이! 매지컬 체인지!`를 한 번 누르고 끝까지 낭독 | `설렘`, `잠든 마음`, `해피 플레이`, `매지컬 체인지`; `minMatch: 2`, 전부 일치 시 `perfect_transform`, `maxAttempts: 2` |
| battle p1 | N6 방어 주문 전체 | `구름`, `포근`, `감싸`, `프로텍션`; `minMatch: 2` |
| battle p2 | N6 공격 주문 전체 | `별빛`, `회색 마음`, `밝혀`, `브레이크`; `minMatch: 2` |
| battle p3 | N7의 기록·핵심 질문을 `enemyPrompt/llmContext`로 제시하고 N8 기본 필살기를 spell로 표시 | 고정 주문은 `주노`, `스타라이트`, `러블리`, `플레이 빔`; 자유 대응은 자기 답·자기 주문을 LLM 판정, guard는 안전 폴백 |

### 플래그 사전

| 플래그 | 설정 주체·위치 | 사용 위치 |
|---|---|---|
| `promise` | `ch3_gray_answer`의 가능성을 인정하는 긍정 intent | GOOD: `affinity >= 70 && flags.promise` |
| `perfect_transform` | N5 네 키워드 전부 일치 시 엔진 | 전투 초기 momentum 60, HIDDEN 복원 후보 |
| `battle_S` | 전투 종료 시 엔진 | +10 affinity, 등급 연출, HIDDEN 복원 후보 |
| `battle_A` | 전투 종료 시 엔진 | +5 affinity, 등급 연출 |
| `battle_B` | 전투 종료 시 엔진 | +0 affinity, 만회 연출 |

## 제안·열린 결정

| ID | 상태 | 결정 또는 질문 | 제안/가정 | 영향 시점 | 재검토 조건 |
|---|---|---|---|---|---|
| DEC-010 | proposed | 패키지 관리자 | `[제안]` npm. 문서의 검증 명령과 GitHub Actions 단순화 | M1 전 | 팀 표준 존재 |
| DEC-011 | proposed | 테스트 러너 | `[제안]` Vitest. Vite/TS 설정 공유, 브라우저 포트 mock 용이 | M1 전 | 다른 테스트 표준 선택 |
| DEC-013 | proposed | `config.json` 전역 턴 프리셋과 `totalTurn` 점프 대상 | `[제안]` `turnPreset: "short"|"long"`이 노드 기본값을 override하고 `finalConvergenceNodeId`를 명시 | M1 전 | config 스키마 승인 |
| DEC-014 | superseded | 스냅샷 버전·battle 중간 저장 | `schemaVersion: 1`은 M1에 구현됐고 battle 복구 정책은 DEC-029로 대체 | M4 | battle 중간 저장 요구 확정 |
| DEC-015 | superseded | GitHub 소유자·저장소 이름·공개범위·Pages base·production URL | M1 소유자·이름·공개범위·base는 DEC-025로 대체. production Pages URL·활성화 조건만 M6 전 미결정 | M6 | Pages 배포 준비 |
| DEC-021 | proposed | production debug 패널 접근 | `[제안]` production 빌드에는 상태 변경 기능 비활성, 별도 demo build 또는 빌드 플래그로만 허용 | M6 전 | 현장 운영 방식 확정 |
| DEC-026 | proposed | M1 더미 데이터의 개발자 관리 스키마 | `[가정]` M1에 한해 `config.json`은 `schemaVersion/startNodeId/initialAffinity/totalTurnLimit/finalConvergenceNodeId/allowedFlags`, `characters.json`은 별첨1 §6의 페르소나 항목을 영문 필드로 사용. 작가 본편 JSON 계약으로 승격하지 않음 | M2/M3 전 | 실제 작가 JSON·전역 턴 프리셋·LLM persona 주입 계약 확정 |

## 확인된 모순·해석 주의

| 항목 | 근거 | 처리 |
|---|---|---|
| 엔딩 4종 목표 vs MVP 3종 | 메인 §6은 4종, §10은 GOOD/NORMAL/BAD 필수이며 HIDDEN 컷 1순위 | 모순 아님. 목표 범위 4, 최소 제출 범위 3으로 추적 |
| “주문 3종(변신 1 + 전투 페이즈별)” 계산 | 별첨1 §8. 전투는 3페이즈마다 다른 주문이므로 총 4전문 | DEC-024. 변신은 두 문장을 한 게이트로 묶고 battle은 3페이즈마다 다른 주문을 사용 |
| 변신 컷 2장과 JSON 참조 | 메인 §4.1·별첨2 §2는 2장 요구, 별첨1 `incantationGate`에는 asset/성공 후 lines 필드 없음 | DEC-016. JSON 확장 없이 엔진 고정 연출로 두 논리 ID를 재생 |
| `bg_hall_dark` 생성 방식 | 별첨2 §3.1 필수 파일 목록, 같은 절은 가능하면 CSS 필터 우선 | DEC-019. 정확한 실파일 우선, 실패 시 `bg_hall_day.webp` 파생, 이후 CSS placeholder |
| `bg_hall_day` 이름과 완성대본의 늦은 밤 사무실 | 현재 호환 ID는 hall/day지만 완성대본 N0~N2는 늦은 밤 사무실 | DEC-032. M5 ID·파일명은 유지하되 제작 내용은 `SCENE_ASSET_MAPPING.md`의 늦은 밤 심사 사무실을 따른다. 전면 rename은 현재 dirty M5 통합 완료 뒤 별도 결정 |
| `config.json` 한 값 전환 vs 노드별 `maxTurns` | 메인 §1은 한 값으로 짧음/김 전환, 별첨1은 각 노드 `maxTurns` 필수 | DEC-013에서 override 우선순위 확정 필요 |
| 목표 플레이타임과 완성대본 분량 | 메인 기획은 10~30분·예상 11~27분, 완성대본 v2는 약 5분 시연 구조 | DEC-024. M5 게이트는 5분 대본 경로로 검증하고 장면을 임의 추가하지 않음. 장기 확장 목표는 유지 |
| N5 변신 주문 2개와 단일 게이트 스키마 | 완성대본 v2 N5는 두 주문을 순서대로 요구, 별첨1 `incantationGate`는 주문 1개 계약 | DEC-024. 줄바꿈된 단일 전문, 한 PTT 녹음, 네 키워드로 결합 |
| N6~N8과 3페이즈 전투 매핑 | 완성대본 v2는 방어·공격·마무리 흐름, 메인·별첨1은 3페이즈 언령 배틀 | DEC-024. p1 방어, p2 공격, p3 핵심 질문+마지막 주문 |
| N4 관계 선택과 상태 표현 | 완성대본 v2는 A/B/C 반응으로 관계 온도를 다르게 표현, 승인된 플래그 사전은 없음 | DEC-020·DEC-024. 직접 node 이동과 affinity로 표현, 관계 플래그 추가 없음 |
