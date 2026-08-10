# 프로젝트 인수 기준점 및 학습 기록 설계

## 1. 목적

- `[확정]` 기존 게임의 최신 `main`을 원본 기준점으로 보존한다.
- `[확정]` 이후 작업은 `main`이 아닌 `codex/` 작업 브랜치에서 수행한다.
- `[확정]` 변경마다 사용자 지시, 변경 전후, 신규 요소, 검증 결과와 초보자용 기술 설명을 함께 남긴다.
- `[확정]` 최종 버전에서 인수 당시 원본과 파일·Git 차이를 재현 가능하게 비교한다.

## 2. 기준점

| 항목 | 값 |
|---|---|
| 기준 날짜 | 2026-08-10 KST |
| 저장소 | `2klips/the-judge-became-a-magical-girl` |
| 기준 브랜치 | `main` |
| 기준 커밋 | `2a5821d8429d88208cb415b06992e7f6fe4dfabf` |
| 커밋 제목 | `feat: use realtime voice and add BGM controls` |
| 인수 작업 브랜치 | `codex/project-takeover-baseline` |

기준 확인 시 로컬 `main`과 `origin/main`은 같은 커밋이었다. 원본 checkout의 작업트리도 깨끗했다.

## 3. 원본 보관 설계

원본 파일 묶음은 저장소 밖 아래 경로에 둔다.

```text
C:\Users\user\Documents\NHN_HACKTON\baseline-archives\
  the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip
  the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip.sha256
```

ZIP은 `git archive`로 기준 커밋의 추적 파일만 생성한다. 다음 항목은 포함하지 않는다.

- `.git/`
- `node_modules/`
- `dist/`
- Git에 포함되지 않은 로컬 환경 파일과 API Secret
- 임시 테스트·브라우저 출력물

검증 계약:

1. `git ls-tree -r --name-only <baseline>` 파일 목록과 ZIP 파일 목록이 일치해야 한다.
2. ZIP과 Git 파일 수가 같아야 한다.
3. SHA-256 체크섬 파일을 함께 보관한다.
4. `.env.example`은 자리표시자 계약 파일이므로 포함한다. 실제 `.env`·`.dev.vars`는 포함하지 않는다.
5. 기존 ZIP이 있으면 자동 덮어쓰지 않는다.

2026-08-10 생성 결과:

| 항목 | 결과 |
|---|---|
| ZIP 크기 | `82,730,214 bytes` |
| Git 추적 파일 | `262` |
| ZIP 파일 | `262` |
| 목록 차이 | `0` |
| SHA-256 | `AB4C1ACA6CDDF9DC8E7A09C4C40240BD4F70D9B88AB1BBD88F6E35EBBF877EDC` |

## 4. 기록 문서 책임

중복 문서를 늘리지 않고 기존 단일 진실 공급원과 역할을 분리한다.

### `docs/dev/IMPLEMENTATION_LOG.md`

실제로 수행한 작업 사실만 기록한다.

- 사용자 지시 요약
- 시작·종료 커밋과 브랜치
- 변경 파일과 동작
- 자동·수동 검증 결과
- 발견한 오류와 수정
- 남은 위험

### `docs/dev/LEARNING_LOG.md`

프로젝트를 인수한 비개발자가 이해할 수 있는 학습 설명을 기록한다.

- 이번 변경을 한 이유
- 관련 개발 개념과 쉬운 비유
- 기존 구조에서 데이터가 흐르는 순서
- 비용·시간을 절감한 선택
- 선택의 단점과 주의점
- 사용자가 직접 확인할 파일
- 다음 작업 전에 알아야 할 내용

### `docs/dev/DECISIONS.md`

기술 선택이나 제품 계약이 바뀔 때만 기록한다. 단순 구현 결과나 학습 설명을 중복 기록하지 않는다.

### `docs/dev/MILESTONES.md`

단계별 범위와 완료 기준이 바뀔 때만 수정한다.

### `docs/dev/PROJECT_MAP.md`

신규 `LEARNING_LOG.md`의 역할과 작업별 읽기 경로를 등록한다.

## 5. 변경별 기록 형식

각 기능·버그·자산 통합 작업은 아래 두 단계를 남긴다.

### 작업 전

```text
- 사용자 지시
- 현재 브랜치와 시작 커밋
- 현재 문제 또는 목표
- 변경 예정 파일
- 신규 추가 요소
- 기존 기능에 미칠 위험
- 완료를 증명할 검증 방법
```

### 작업 후

```text
- 실제 변경 파일
- 각 파일을 바꾼 이유
- 신규·수정·삭제·대체 항목
- 자동 테스트 결과
- 브라우저·청감·플레이 검증 결과
- 남은 문제와 다음 단계
- 커밋과 되돌리는 방법
- 초보자 학습 설명
```

## 6. Git 작업 계약

- 원본 `main`에 직접 커밋하거나 push하지 않는다.
- 기능별 `codex/<topic>` 브랜치를 최신 `origin/main`에서 만든다.
- 작업 전후 `git status --short`와 대상 diff를 확인한다.
- 관련 파일만 stage한다.
- force push, history rewrite, 사용자 변경 삭제를 하지 않는다.
- push나 PR 생성은 사용자가 요청한 범위에서만 수행한다.
- 하나의 커밋에는 설명 가능한 하나의 목적만 둔다.

현재 인수 문서 작업은 `codex/project-takeover-baseline`에서 수행한다.

## 7. 검증 계약

기준선과 이후 코드 변경은 다음을 기본 검증으로 사용한다.

```text
npm run check
npm test
npm run build
```

2026-08-10 기준선 결과:

- `npm run check`: PASS, TypeScript 오류 0
- `npm test`: PASS, 41 files / 187 tests
- `npm run build`: PASS

문서만 변경하는 작업도 링크·경로·커밋 번호·체크섬을 수동 검증한다. 실제 UI·음향 변경은 자동 테스트만으로 완료 처리하지 않고 브라우저·청감 검수를 추가한다.

## 8. 최종 비교 방법

최종 버전 커밋을 `<final-commit>`이라고 할 때:

```text
git diff --stat 2a5821d8429d88208cb415b06992e7f6fe4dfabf..<final-commit>
git diff --name-status 2a5821d8429d88208cb415b06992e7f6fe4dfabf..<final-commit>
git log --oneline 2a5821d8429d88208cb415b06992e7f6fe4dfabf..<final-commit>
```

필요하면 원본 ZIP을 별도 폴더에 풀어 최종 산출물과 파일 단위로 비교한다. ZIP은 증거 보관물이므로 작업 중 수정하지 않는다.

## 9. 이번 설계의 범위

포함:

- 원본 ZIP과 체크섬 보관
- 기준 커밋·검증 결과 기록
- `IMPLEMENTATION_LOG.md` 인수 항목 추가
- 초보 학습용 `LEARNING_LOG.md` 추가
- `PROJECT_MAP.md`에 학습 기록 역할 등록

제외:

- 게임 기능·UI·시나리오 변경
- 누락 이미지와 SFX 통합
- 원격 push·PR·merge
- `main` 직접 수정
- DB나 프레임워크 도입

누락 이미지와 SFX 통합은 이 인수 기준점 작업이 검토·확정된 뒤 별도 설계와 작업 브랜치에서 진행한다.
