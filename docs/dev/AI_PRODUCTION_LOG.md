# AI 제작 로그

100% AI 제작 과정 증빙용이다. 비밀값, 개인 발화 원문, 계정 정보는 기록하지 않는다. 에셋 상태는 [ASSET_MANIFEST.md](ASSET_MANIFEST.md), 기술 결정은 [DECISIONS.md](DECISIONS.md)에 따로 기록한다.

## 빈 템플릿

| 날짜 | 작업 | 사용 AI 도구 | 입력 자료 | 생성 결과 | 사람이 한 검수 | 최종 사용 여부 | 사용 토큰 수 | 관련 파일 또는 커밋 |
|---|---|---|---|---|---|---|---|---|
| YYYY-MM-DD |  |  | 파일명·프롬프트 ID만. 비밀 제외 | 산출물 요약 | 검수자·기준·수정 내용 | 사용/보류/폐기 | 측정값 또는 미측정 | 경로 또는 commit |

필요하면 한 작업에 여러 행을 쓴다. AI가 만든 초안과 사람이 선택·수정한 최종본의 관계를 추적할 수 있어야 한다.

## 기록 예시

| 날짜 | 작업 | 사용 AI 도구 | 입력 자료 | 생성 결과 | 사람이 한 검수 | 최종 사용 여부 | 사용 토큰 수 | 관련 파일 또는 커밋 |
|---|---|---|---|---|---|---|---|---|
| 2026-07-28 | M1~M6 개발 문서 체계 초안 | Codex | 기획서 v2, 별첨1, 별첨2, 현재 파일 구조, 사용자 문서 요구사항 | 행동 규칙·구현 계약·마일스톤·QA·보안·에셋·프롬프트 문서 | 사용자 최종 검수 대기. 자동 링크·비밀 패턴·계약 대조는 별도 검증 | 보류 | 작업 토큰 수 | `AGENTS.md`, `docs/dev/`, `prompts/` |
| 2026-07-28 | M1 GitHub 초기 게시 계약·복붙 프롬프트 | Codex | M1 계약, 보안·배포, QA, 사용자 Git 저장소 생성·push 요구 | M1에 Git 초기화·private 원격 생성·검증 후 push 게이트 추가, 완전한 M1 프롬프트 작성 | 기존 Git 부재 확인. 관련 문서 계약·경로·비밀 제외·force push 금지 대조 | 사용 | 미측정 | `AGENTS.md`, `docs/dev/`, `prompts/M1_IMPLEMENTATION_PROMPT.md` |
| 2026-07-31 | M1 클릭 완주 엔진·주노 Test 화면 | Codex | 기획서 v2, 별첨1, 완성대본 v2 N2·주노 지침, M1 계약, 사용자 GitHub 지시 | Vite/TS/Vanilla 앱, zod 데이터 경계, 상태·FSM·분기·저장, CSS 화면, 23 tests | 사용자 UI 최종 검수 대기. 자동 check/test/build와 Chrome 150의 GOOD/NORMAL/BAD·복구·404 검증 완료 | 사용 | 미측정 | `src/`, `public/scenario/`, `tests/`, `docs/dev/IMPLEMENTATION_LOG.md`, 초기 commit `feat: bootstrap playable M1` |
| 2026-08-02 | M2 STT A/B/C 비교 Lab | Codex | 사용자 PTT 조기 종료·정확도 피드백, M2 계약, OpenAI/Gemini/Hugging Face 공식 문서 | 동일 WAV 기반 OpenAI·Gemini·로컬 Whisper 비교 UI, 로컬 Worker, CER·지연 측정, 10개 Lab 테스트 | 사용자 실제 발화 검수 완료. 로컬 Whisper 정확도 미달로 폐기, GPT/Gemini 정확도 유사·응답 약 1,116ms/3,220ms로 MVP 후보 유지 | 부분 사용: A/B 유지, C 폐기 | 미측정 | `stt-lab.html`, `src/stt-lab/`, `worker/sttLab.ts`, `tests/sttLab*.test.ts`, DEC-027·DEC-028 |
| 2026-08-02 | M5 본편 런타임·에셋 인계 계약 | Codex | 사용자 외부 에셋 담당 결정, 메인 기획서, 완성대본 v2 N0~N8, 별첨1·2, M5, 기존 M4 스키마 | DEC-016·019·020·024 해결: 고정 변신 컷 연출, 파생 사건 배경, 5개 플래그, 대화 8·컷씬 2·battle 1 매핑. 물리 에셋 외부 인계 경계는 DEC-030에 기록 | 사용자 “M5 진입 전 DEC-016·019·020·024 해결 진행” 지시. 코드·JSON·외부 `asset/`은 변경하지 않고 문서 계약만 검수 | 사용 | N/A | `docs/dev/DECISIONS.md`, `IMPLEMENTATION_SPEC.md`, `ASSET_MANIFEST.md`, DEC-016·019·020·024·030 |
| 2026-08-02 | 장면별 에셋 매핑 명세 | Codex | 사용자 외부 에셋 제작·개발 매핑 요청, 완성대본 v2, 실제 M5 scenario JSON, asset catalog, 별첨2, DEC-016·019·024·030·031 | 타이틀~GOOD/NORMAL/BAD와 HIDDEN 확장까지 배경·인물·표정·BGM·컷·폴백·정확한 파일명을 연결한 `SCENE_ASSET_MAPPING.md`; manifest·M5·workflow 지시 동기화 | 기준 문서·현재 런타임 ID·dirty M5 diff 대조 완료. 에셋 시각/청각·라이선스 사람 검수는 전달 후 필요 | 사용 | 미측정 | `docs/dev/SCENE_ASSET_MAPPING.md`, DEC-032, `ASSET_MANIFEST.md`, `AGENTS.md`, `PROJECT_MAP.md` |
| 2026-08-02 | M5 본편 JSON·로더·placeholder 연출 | Codex | 완성대본 v2, 장면별 에셋 매핑, DEC-016·019·020·024·030~032, 사용자 외부 에셋 무변경 조건 | 본편 14노드·2캐릭터 JSON, 중앙 asset catalog, 실파일→파생→CSS fallback, 장면별 복수 인물·표정, 변신 2컷, battle 3인 stage, BGM crossfade/duck, Web Audio SFX 5종, Canvas 파티클 | `check`·102 tests·build, headed Chromium 클릭 GOOD 완주, N1 미노출·N3/N5 복수 인물·battle 3인 placeholder·콘솔 error 0 확인. 물리 에셋·음성 3경로 사람 QA는 대기 | 부분 사용: 코드·JSON 사용, 물리 에셋 대기 | 미측정 | `public/scenario/`, `src/assets/`, `src/audio/`, `src/ui/`, `tests/m5*.test.ts`, `IMPLEMENTATION_LOG.md` |

## 기록 규칙

- 프롬프트 전문이 길면 별도 파일/도구 대화 ID를 참조하고 입력 자료 핵심만 적는다.
- 재생성·편집 파생은 원본 행 또는 파일을 연결한다.
- 사람 검수에는 “좋아 보임” 대신 규격, 일관성, 라이선스, 실행 결과를 적는다.
- 폐기 산출물도 이유를 남긴다. 파일 자체 보관 여부는 대회 규정과 저장 용량에 따른다.
- 코드 작업은 마일스톤, 테스트 결과, commit을 연결한다.
- 에셋은 생성 도구 플랜·약관 확인 날짜를 함께 남긴다.
