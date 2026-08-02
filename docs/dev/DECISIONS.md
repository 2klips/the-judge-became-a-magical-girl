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
| DEC-022 | 2026-07-28 | accepted | M1 완료 범위에 로컬 Git 초기화, GitHub 저장소 생성, 검증된 초기 commit의 `main` push를 포함하고 Pages 배포는 M6에 유지 | M1부터 원격 이력·복구 지점을 확보하되 배포 위험은 분리 | M1 선행조건·완료·검증에 Git/GitHub 게이트 추가 | pre-M1 별도 저장소 준비 또는 M6까지 로컬 유지 rejected | `MILESTONES.md` M1, `SECURITY_AND_DEPLOYMENT.md` §7~§8, M1 프롬프트 | 사용자가 저장소 게시 시점을 다시 지정 |
| DEC-023 | 2026-07-31 | accepted | 에셋 통합 전 최우선 MVP-1을 `주노 음성 자유대화` 수직 슬라이스로 정하고 M1→M3에서 누적 구현한다. M3 통과를 M4 진입 게이트로 삼는다 | 실제 에셋 없이 STT·LLM·로컬 폴백의 핵심 재미와 현장 안정성을 먼저 검증 | M1은 CSS 배경·대화창·클릭, M2는 STT·로컬 판정, M3은 Workers·LLM 자유대화를 같은 화면에 연결 | 별도 M0 신설 또는 M1~M6 재배치 rejected | `IMPLEMENTATION_SPEC.md` §1.1, `MILESTONES.md` MVP-1, `QA_AND_DEMO.md` §1.1, 완성대본 v2 N2·§4~§6 | 사용자가 우선순위 또는 M1~M6 순서를 공식 변경 |
| DEC-025 | 2026-07-31 | accepted | M1 GitHub owner는 `2klips`, private 저장소명은 `the-judge-became-a-magical-girl`, Vite base는 `/the-judge-became-a-magical-girl/`로 고정 | 사용자가 작품 제목을 적절한 영어로 번역한 저장소 생성을 지시했고 인증 계정을 명시 | M1 원격 생성·정적 경로·후속 Pages 설정의 기준 변경 | `NHN_hackathon` 기본명 superseded | `vite.config.ts`, M1 계약, 보안·배포, QA QV-04 | 사용자가 저장소명·소유자·공개범위를 다시 지정 |
| DEC-027 | 2026-08-02 | accepted | 공급자 선택 전, 격리된 `stt-lab.html`에서 동일한 PTT 녹음을 16 kHz mono PCM WAV로 고정해 A OpenAI `gpt-transcribe`, B Gemini `gemini-2.5-flash`, C 브라우저 로컬 `onnx-community/whisper-small`에 전달하고 전사문·지연·CER를 비교한다 | 사용자가 Web Speech 실제 발화에서 낮은 정확도와 발화 중 조기 종료를 확인했고 A/B/C 모두를 한 화면에서 먼저 시험하도록 승인 | `@huggingface/transformers`, 로컬 전용 Wrangler Worker, multipart STT 경계, 비교 UI·테스트 추가. 게임 `GameState`·FSM·M2 Web Speech 경로와 production 공급자 결정은 변경하지 않음 | 현 Web Speech만 조정, 한 공급자를 바로 채택하는 방식 rejected | `stt-lab.html`, `src/stt-lab/`, `worker/sttLab.ts`, `wrangler.stt-lab.toml`, `tests/sttLab*.test.ts` | 여러 사람·소음 조건 실측 후 사용자가 production STT 공급자를 선택하거나 Lab을 제거할 때 |
| DEC-028 | 2026-08-02 | accepted | 로컬 Whisper는 STT 후보에서 탈락시킨다. OpenAI `gpt-transcribe`와 Gemini audio transcription은 MVP-1 완료까지 교체 가능한 두 STT 공급자로 유지하고, 한 플레이 턴에는 선택된 공급자 하나만 호출한다. 최종 production 공급자는 M6 진입 전에 사용자가 선택하며 비선택 STT 경로와 전용 Secret은 비활성·제거한다 | 사용자 실제 발화 비교에서 로컬 Whisper 정확도가 기준 미달. GPT와 Gemini 정확도는 비슷했고 응답시간은 GPT 약 1,116ms, Gemini 약 3,220ms로 GPT가 빨랐으나 한 차례 실측만으로 최종 비용·안정성까지 확정하기 부족하다고 판단 | M3에 동일 인터페이스의 GPT/Gemini STT 어댑터·개발/QA 전환 설정·전사문 선표시를 포함. 로컬 Whisper는 게임 경로에 연결하지 않음. M6에 최종 단일 공급자 게이트 추가 | 로컬 Whisper 유지, 매 턴 A/B 동시 호출, 지금 즉시 단일 API 확정 rejected | 메인 §8~§11, `IMPLEMENTATION_SPEC.md` §1.1·§4~§8, `MILESTONES.md` M3·M6, `QA_AND_DEMO.md` QS/QL/QG, `SECURITY_AND_DEPLOYMENT.md` | MVP-1 다중 화자·소음·장문 비교에서 정확도·지연·비용 결과가 크게 달라지거나 사용자가 최종 공급자를 선택할 때 |

## 제안·열린 결정

| ID | 상태 | 결정 또는 질문 | 제안/가정 | 영향 시점 | 재검토 조건 |
|---|---|---|---|---|---|
| DEC-010 | proposed | 패키지 관리자 | `[제안]` npm. 문서의 검증 명령과 GitHub Actions 단순화 | M1 전 | 팀 표준 존재 |
| DEC-011 | proposed | 테스트 러너 | `[제안]` Vitest. Vite/TS 설정 공유, 브라우저 포트 mock 용이 | M1 전 | 다른 테스트 표준 선택 |
| DEC-013 | proposed | `config.json` 전역 턴 프리셋과 `totalTurn` 점프 대상 | `[제안]` `turnPreset: "short"|"long"`이 노드 기본값을 override하고 `finalConvergenceNodeId`를 명시 | M1 전 | config 스키마 승인 |
| DEC-014 | proposed | 스냅샷 버전·battle 중간 저장 | `[제안]` `schemaVersion: 1`; 노드 이동만 저장하므로 battle 중간 복구는 페이즈 시작으로 정규화 | M1/M4 전 | 복구 UX 요구 확정 |
| DEC-015 | superseded | GitHub 소유자·저장소 이름·공개범위·Pages base·production URL | M1 소유자·이름·공개범위·base는 DEC-025로 대체. production Pages URL·활성화 조건만 M6 전 미결정 | M6 | Pages 배포 준비 |
| DEC-016 | proposed | 주문 성공 뒤 변신 컷 2장 참조 위치 | `[미결정]` 별첨1 cutscene 스키마에 후속 연출/asset 필드 없음. 엔진 고정 연출, 별도 cutscene 노드, 스키마 확장 중 선택 필요 | M4 전 | 스키마 소유자 결정 |
| DEC-018 | proposed | Gemini 정확한 모델 ID·단가·무료 한도 | `[미결정]` 구현 시 공식 문서와 콘솔에서 확인. 기획서의 “Gemini 2.5 Flash-Lite”를 검증 전 문자열로 고정하지 않음 | M3 전 | API 계정/현재 제공 모델 확인 |
| DEC-019 | proposed | `bg_hall_dark` 실파일 여부 | `[미결정]` 필수 목록에는 별도 파일, 제작 요령은 CSS 파생 우선. 논리 ID를 실파일 또는 파생 scene recipe로 해석할지 결정 | M5 전 | 스타일 샘플 비교 |
| DEC-020 | proposed | 실제 플래그 사전과 본편 JSON | `[미결정]` 완성대본 v2는 존재하지만 런타임 `scenario.json`·`characters.json`과 관계·엔딩 플래그 사전은 없음 | M5 전 | 작가 JSON·플래그 사전 도착 |
| DEC-021 | proposed | production debug 패널 접근 | `[제안]` production 빌드에는 상태 변경 기능 비활성, 별도 demo build 또는 빌드 플래그로만 허용 | M6 전 | 현장 운영 방식 확정 |
| DEC-024 | proposed | 완성대본 v2의 런타임 계약 매핑 | `[미결정]` 5분 대본과 기존 플레이타임, N5 주문 2개와 단일 `incantationGate`, N6~N8과 3페이즈 전투, N4 관계 선택과 플래그를 구현 전 매핑해야 함 | M4 전(플레이타임·주문·전투), M5 전(관계·엔딩) | 작가·기획자 매핑 승인 |
| DEC-026 | proposed | M1 더미 데이터의 개발자 관리 스키마 | `[가정]` M1에 한해 `config.json`은 `schemaVersion/startNodeId/initialAffinity/totalTurnLimit/finalConvergenceNodeId/allowedFlags`, `characters.json`은 별첨1 §6의 페르소나 항목을 영문 필드로 사용. 작가 본편 JSON 계약으로 승격하지 않음 | M2/M3 전 | 실제 작가 JSON·전역 턴 프리셋·LLM persona 주입 계약 확정 |

## 확인된 모순·해석 주의

| 항목 | 근거 | 처리 |
|---|---|---|
| 엔딩 4종 목표 vs MVP 3종 | 메인 §6은 4종, §10은 GOOD/NORMAL/BAD 필수이며 HIDDEN 컷 1순위 | 모순 아님. 목표 범위 4, 최소 제출 범위 3으로 추적 |
| “주문 3종(변신 1 + 전투 페이즈별)” 계산 | 별첨1 §8. 전투는 3페이즈마다 다른 주문이므로 총 4전문 | `[미결정]` 문구 오기 가능성. 구현은 메인 §5.2의 페이즈별 다른 문구를 우선해 변신 1 + 전투 3으로 가정 |
| 변신 컷 2장과 JSON 참조 | 메인 §4.1·별첨2 §2는 2장 요구, 별첨1 `incantationGate`에는 asset/성공 후 lines 필드 없음 | DEC-016에서 해결 전 스키마 확장 금지 |
| `bg_hall_dark` 생성 방식 | 별첨2 §3.1 필수 파일 목록, 같은 절은 가능하면 CSS 필터 우선 | DEC-019. 논리 ID 계약은 유지 |
| `config.json` 한 값 전환 vs 노드별 `maxTurns` | 메인 §1은 한 값으로 짧음/김 전환, 별첨1은 각 노드 `maxTurns` 필수 | DEC-013에서 override 우선순위 확정 필요 |
| 목표 플레이타임과 완성대본 분량 | 메인 기획은 10~30분·예상 11~27분, 완성대본 v2는 약 5분 시연 구조 | DEC-024. MVP-1 범위에는 영향 없음. 전체 시나리오 구현 전 모드별 분량 매핑 필요 |
| N5 변신 주문 2개와 단일 게이트 스키마 | 완성대본 v2 N5는 두 주문을 순서대로 요구, 별첨1 `incantationGate`는 주문 1개 계약 | DEC-024 해결 전 스키마 임의 확장 금지 |
| N6~N8과 3페이즈 전투 매핑 | 완성대본 v2는 방어·공격·마무리 흐름, 메인·별첨1은 3페이즈 언령 배틀 | DEC-024에서 노드·페이즈 경계를 승인받기 전 구현 매핑 고정 금지 |
| N4 관계 선택과 상태 표현 | 완성대본 v2는 A/B/C 반응으로 관계 온도를 다르게 표현, 승인된 플래그 사전은 없음 | DEC-020·DEC-024. 화이트리스트 승인 전 새 플래그 생성 금지 |
