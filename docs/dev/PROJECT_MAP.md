# 프로젝트 문서 지도

## 상태 표기

- `[확정]`: 기준 문서 또는 승인된 결정에 근거. 구현 계약.
- `[제안]`: Codex가 빈칸을 메우기 위해 제시. 승인 전 변경 가능.
- `[미결정]`: 구현 전 사용자 결정 또는 실측 필요.

## 단일 진실 공급원

| 영역 | 단일 진실 공급원 | 새 개발 문서 역할 |
|---|---|---|
| 게임 흐름, 상태, 수렴, 변신, 전투, 기술 스택, MVP, M1~M6 | [음성 미연시 기획서 v2 — A안 확정판](../음성_미연시_기획서_v2_A안확정.md) | 실행 경계·검증 기준으로 변환 |
| 등장인물, 감정선, 고정 대사, 자유 대화 방향, N0~N8·엔딩 연출 | [심사역은 마법소녀가 되었다 완성대본 v2](../심사역은_마법소녀가_되었다_완성대본_v2.md) | 스토리·캐릭터 구현의 현재 기준. 런타임 필드는 별첨1을 따름 |
| 시나리오 노드와 `characters.json` 작성 계약 | [별첨1. 스토리/시나리오 작가 가이드라인](../별첨1_스토리_작가_가이드라인.md) | 스키마를 복제하지 않고 런타임 책임만 정의 |
| 이미지·오디오·UI 에셋 규격과 네이밍 | [별첨2. Asset 제작 가이드라인](../별첨2_에셋_제작_가이드라인.md) | 제작 상태와 참조 추적 |
| Codex 영구 행동 규칙 | [AGENTS.md](../../AGENTS.md) | 구현마다 적용 |
| 구현 아키텍처 계약 | [IMPLEMENTATION_SPEC.md](IMPLEMENTATION_SPEC.md) | 모듈 경계·실행 순서·포트 정의 |
| 단계별 작업 경계 | [MILESTONES.md](MILESTONES.md) | M1~M6 완료·검증 게이트 |
| 품질과 시연 절차 | [QA_AND_DEMO.md](QA_AND_DEMO.md) | 재현 가능한 테스트 목록 |
| 결정과 열린 쟁점 | [DECISIONS.md](DECISIONS.md) | 기준 문서 빈칸·변경 이력 |
| 보안과 배포 | [SECURITY_AND_DEPLOYMENT.md](SECURITY_AND_DEPLOYMENT.md) | 비밀·Workers·Pages 운영 계약 |
| 에셋 추적 | [ASSET_MANIFEST.md](ASSET_MANIFEST.md) | 논리 ID→실파일→QA 상태 |
| AI 제작 증빙 | [AI_PRODUCTION_LOG.md](AI_PRODUCTION_LOG.md) | 입력·생성·사람 검수 기록 |
| 마일스톤 실행 이력 | [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) | 작업·테스트·오류 수정·잔여 위험 기록 |

[팀 전달용 완료 메시지](../팀전달용_대본디벨롭_완료메시지.md)는 제작 상태·검토 요청을 설명하는 인계 문서다. 스토리 내용의 단일 진실 공급원은 완성대본 v2다.

`docs/temp/`와 루트 `prompt/`는 기획 과정 자료다. 구현 계약의 출처로 사용하지 않는다. `files.zip`은 기준 문서 사본 보관물이며 단일 진실 공급원이 아니다.

## 충돌 처리

제품 내용 충돌 시:

1. 사용자의 최신 명시적 결정
2. 메인 기획서의 시스템·아키텍처 계약
3. 스토리·캐릭터·장면 영역의 완성대본 v2
4. 해당 전문 영역의 별첨1 또는 별첨2
5. 승인된 ADR-lite 결정. 단, 상위 문서를 변경한다면 승인 근거와 대체 대상을 명시해야 함
6. 구현 문서
7. 코드

Codex 행동 충돌 시 사용자 지시 → 루트 `AGENTS.md` → 작업 템플릿 순서다. 충돌을 발견하면 임의 선택하지 말고 [DECISIONS.md](DECISIONS.md)의 열린 결정에 기록한다.

## 담당 영역

| 영역 | 주 담당 | 변경 대상 | 필수 교차 확인 |
|---|---|---|---|
| 엔진·UI·SFX | Codex | `src/`, 테스트, 빌드 설정 | 메인 기획서, 구현 명세, 마일스톤 |
| 시나리오 | 작가/Claude | `public/scenario/*.json` | 별첨1, 로더 검증 결과 |
| 캐릭터 | GPT Image + 사람 검수 | `public/assets/char/` | 별첨2, 에셋 매니페스트 |
| 배경 | 미드저니 + 사람 검수 | `public/assets/bg/` | 별첨2, 에셋 매니페스트 |
| BGM | Suno + 사람 검수 | `public/assets/bgm/` | 별첨2, 에셋 매니페스트 |
| LLM 프록시 | Codex | `worker/` | 보안·배포 문서 |
| Git 저장소 초기 게시 | Codex + 저장소 관리자 | `.gitignore`, Git metadata, GitHub remote | M1, 보안·배포, 결정 기록 |
| 배포 | Codex + 저장소 관리자 | `.github/workflows/`, Pages/Workers 설정 | 보안·배포, QA |

## 작업별 읽기 세트

| 작업 | 반드시 읽을 문서 |
|---|---|
| 모든 코드 변경 | `AGENTS.md`, 이 문서, `IMPLEMENTATION_SPEC.md`, 해당 `MILESTONES.md` 절 |
| 시나리오 로더·분기 | 위 문서 + 별첨1 §3~§4, §7~§8 |
| STT·대화 판정 | 메인 §3, §7~§8 + `QA_AND_DEMO.md` |
| 주노 음성 자유대화 MVP-1 | 완성대본 v2 §1 주노, N2, §3~§6 + `IMPLEMENTATION_SPEC.md` §1.1 + `MILESTONES.md` MVP-1 절 + `QA_AND_DEMO.md` QJ 계열 |
| 변신·전투 | 메인 §4~§5 + 별첨1 §4.2~§4.3 |
| LLM·Workers | 메인 §8.3, §9, §11 + `SECURITY_AND_DEPLOYMENT.md` |
| 에셋 통합 | 별첨2 + `ASSET_MANIFEST.md` |
| Git 초기화·GitHub 최초 push | M1 + `SECURITY_AND_DEPLOYMENT.md` §7~§8 + `DECISIONS.md` DEC-022·DEC-025 |
| 배포·현장 준비 | `SECURITY_AND_DEPLOYMENT.md`, `QA_AND_DEMO.md`, M6 |
| 기능 제안 | [DECISIONS.md](DECISIONS.md), [기능 제안 템플릿](../../prompts/FEATURE_PROPOSAL_TEMPLATE.md) |
| 버그 수정 | [버그 수정 템플릿](../../prompts/BUG_FIX_TEMPLATE.md), 영향받는 계약 문서 |

## 문서 갱신 규칙

- 제품 기획 변경: 사용자 승인 후 기준 문서와 관련 ADR을 갱신.
- 구현 세부 결정: `DECISIONS.md`만 갱신하고 관련 문서에서 ID를 참조.
- 마일스톤 범위·완료 기준 변경: `MILESTONES.md` 한 곳에서 갱신.
- 테스트 절차 변경: `QA_AND_DEMO.md` 한 곳에서 갱신.
- 마일스톤 수행 결과·오류 수정: `IMPLEMENTATION_LOG.md`에 누적.
- 에셋 상태 변경: `ASSET_MANIFEST.md`; 제작 증빙은 `AI_PRODUCTION_LOG.md`.
