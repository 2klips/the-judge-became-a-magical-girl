# Project Takeover Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the verified handover baseline and add a beginner-oriented, non-duplicative record of project structure, decisions, changes, and learning.

**Architecture:** Keep factual execution history in `IMPLEMENTATION_LOG.md`, beginner explanations in new `LEARNING_LOG.md`, and document routing in `PROJECT_MAP.md`. Preserve the original source outside Git as a checksum-verified `git archive`; do not change game code, product contracts, assets, or `main`.

**Tech Stack:** Markdown, Git, PowerShell, npm, TypeScript/Vite/Vitest verification

---

## File Structure

- Create: `docs/dev/LEARNING_LOG.md`
  - Beginner-facing architecture, cost choices, terms, current state, work protocol, and first handover entry.
- Modify: `docs/dev/PROJECT_MAP.md`
  - Register `LEARNING_LOG.md` as the learning explanation source and route takeover work to it.
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
  - Append factual execution evidence for the handover snapshot and documentation setup.
- Existing external artifacts, verify only:
  - `C:\Users\user\Documents\NHN_HACKTON\baseline-archives\the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip`
  - `C:\Users\user\Documents\NHN_HACKTON\baseline-archives\the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip.sha256`

## Task 1: Add Beginner Learning Log

**Files:**
- Create: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: Confirm the learning log does not already exist**

Run:

```powershell
Test-Path -LiteralPath 'docs\dev\LEARNING_LOG.md'
git status --short
```

Expected:

```text
False
```

Only previously committed plan/spec history may exist; no unrelated working-tree changes.

- [ ] **Step 2: Create the learning log with the approved two-level format**

Create `docs/dev/LEARNING_LOG.md` with this content:

````markdown
# 프로젝트 인수 학습 기록

이 문서는 비개발자가 프로젝트를 인수하면서 변경 이유와 개발 개념을 이해하기 위한 기록이다. 실제 수행 사실과 테스트 결과는 [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md), 제품 계약과 기술 결정은 [DECISIONS.md](DECISIONS.md)를 기준으로 한다.

## 기록 원칙

- 사용자 지시를 먼저 적고, 실제 변경과 신규 요소를 구분한다.
- 코드 이름만 나열하지 않고 왜 바꿨는지 쉬운 말로 설명한다.
- 비용·시간을 줄인 선택과 그 대가를 함께 기록한다.
- 사용자가 직접 확인할 파일과 화면을 연결한다.
- 확실한 사실은 `[확정]`, 제안은 `[제안]`, 사람 검수가 필요한 내용은 `[미결정]`으로 표시한다.
- 작업 결과와 학습 설명을 분리해 같은 사실을 여러 문서에 복제하지 않는다.

## 프로젝트를 한 문장으로 설명하면

`심사역은 마법소녀가 되었다`는 브라우저에서 실행되는 음성·클릭 혼합형 비주얼노벨이다. 화면과 게임 규칙은 정적 웹앱이 담당하고, OpenAI가 필요한 음성·대화 판정만 Cloudflare Worker를 통해 호출한다.

## 전체 구조

| 구성 | 쉬운 비유 | 실제 역할 | 먼저 볼 파일 |
|---|---|---|---|
| `scenario.json` | 대본 | 장면, 대사, 선택지, 분기 | `public/scenario/scenario.json` |
| `GameState` | 현재 진행 수첩 | 현재 노드, 호감도, 플래그, 입력 상태 | `src/state.ts` |
| FSM·NodeRunner | 무대 진행자 | 현재 장면을 실행하고 다음 장면 결정 | `src/fsm.ts`, `src/engine/nodeRunner.ts` |
| `GameView` | 무대 연출 | 배경, 인물, 대화창, 버튼, 전투 UI 표시 | `src/ui/gameView.ts` |
| `main.ts` | 조립 설명서 | 엔진, UI, 오디오, 네트워크 연결 | `src/main.ts` |
| `localStorage` | 기기 안 세이브 카드 | 별도 서버 없이 진행 상태 저장 | `src/storage/saveRepository.ts` |
| Cloudflare Worker | 보안 접수 창구 | API 키를 숨기고 OpenAI 요청 검증 | `worker/index.ts` |
| GitHub Actions/Pages | 자동 포장·전시장 | 검사 후 웹 게임 배포 | `.github/workflows/` |

## 비용과 시간을 줄인 선택

| 선택 | 절감된 비용·시간 | 대가와 주의점 |
|---|---|---|
| GitHub Pages | 프론트 서버 운영비 | 정적 웹만 제공 가능 |
| Cloudflare Worker | 상시 백엔드 서버 관리 | 공개 API 호출 제한과 비용 감시 필요 |
| 별도 DB 없음 | DB 요금·스키마·운영 | 계정·클라우드 세이브·랭킹 없음 |
| `localStorage` | 저장 API 개발비 | 다른 기기로 세이브가 이동하지 않음 |
| Vanilla TypeScript + Vite | 프레임워크 의존성과 초기 설정 | 큰 UI 파일을 수동 관리해야 함 |
| JSON 시나리오 | 전용 시나리오 편집기 개발 | 비개발자 편집 시 형식 검증 필요 |
| 로컬 판정·클릭 폴백 | 일부 AI 호출비와 장애 위험 | 단순 키워드 오판정 가능 |
| 턴 단위 음성 처리 | 지속 실시간 세션 복잡도 | 완전한 실시간 대화보다 지연이 느껴질 수 있음 |
| AI 이미지·Suno 음원 | 외주 제작비와 제작 기간 | 권리 증빙·스타일 통일·사람 검수 필요 |
| 자동 테스트·배포 | 반복 수동 검사 시간 | 실제 화면·음향 검수는 대체하지 못함 |

## 왜 현재 구조를 유지하나

- 단일 `GameState`와 직렬 FSM은 진행 순서를 추적하기 쉽고 저장·복구 오류 범위를 줄인다.
- JSON과 zod 검증은 잘못된 대본 참조를 게임 시작 전에 발견한다.
- OpenAI Secret을 Worker에만 두면 공개 웹 코드에서 키가 노출되지 않는다.
- AI 장애가 나도 클릭·로컬 경로로 엔딩까지 갈 수 있어 시연 실패를 줄인다.
- 싱글 플레이 완성이 우선이므로 현재는 DB와 UI 프레임워크를 추가하지 않는다.

## 현재 인수 기준점

- `[확정]` 기준 날짜: 2026-08-10 KST
- `[확정]` 기준 브랜치: `main`
- `[확정]` 기준 커밋: `2a5821d8429d88208cb415b06992e7f6fe4dfabf`
- `[확정]` 기준 테스트: TypeScript 검사 PASS, 41 files·187 tests PASS, production build PASS
- `[확정]` 원본은 저장소 밖 ZIP과 SHA-256으로 보관한다.
- `[확정]` 이후 구현은 최신 `origin/main`에서 만든 `codex/` 브랜치에서 수행한다.

### 인수 당시 남은 주요 작업

1. 누락된 변신 컷 2장과 `gray_wraith.weakened` 실파일 해결
2. 채택한 WAV 효과음 5종 runtime 연결
3. 모바일 타이틀 BGM HUD 겹침 수정
4. 마이크 없이 시작하는 클릭 전용 진입 결정
5. Worker 호출 제한·비용 경고 추가
6. 키보드 포커스·화면 낭독·모바일 조작 접근성 보완
7. production 빌드에서 STT Lab 대용량 의존성 분리
8. README·LICENSE·권리·AI 제작 증빙과 정식 릴리스 절차 정리

## 앞으로의 작업 순서

1. 현재 인수 기준점과 기록 체계 고정
2. 필수 누락 이미지 해결
3. 채택 효과음 5종 연결
4. 모바일·마이크 없는 시작·접근성 개선
5. 실제 화면 E2E 검증 추가
6. 저장·로컬 판정·전투 정책 오류 보강
7. Worker 호출 비용 방어
8. production 빌드와 배포 절차 정리
9. 공개 문서·권리·AI 제작 증빙 완성
10. 클릭·음성 3종 엔딩 완주 검수와 정식 릴리스

## 작업별 기록 양식

### 작업 전

```text
- 사용자 지시:
- 시작 브랜치와 커밋:
- 현재 문제:
- 변경 예정 파일:
- 신규 요소:
- 기존 기능 위험:
- 완료 검증 방법:
```

### 작업 후

```text
- 실제 변경 파일:
- 신규·수정·삭제·대체:
- 각 변경 이유:
- 자동 검증:
- 수동 검증:
- 남은 위험:
- 커밋과 복구 방법:
- 이번에 배운 개념:
```

## 2026-08-10 — 인수 원본 보관과 기록 체계

### 사용자 지시

현재 버전을 원본 파일로 별도 보관해 최종 버전과 비교하고, 이후 작업마다 무엇을 왜 수정했는지 초보자 관점으로 기록한다.

### 수행 내용

- 기준 커밋 `2a5821d`의 Git 추적 파일만 `git archive` ZIP으로 보관했다.
- ZIP 262개 파일과 Git 추적 파일 262개가 일치하고 목록 차이가 0임을 확인했다.
- SHA-256 체크섬을 별도 파일로 보관했다.
- `main`을 수정하지 않고 `codex/project-takeover-baseline` 격리 브랜치를 만들었다.
- 기존 실행 기록과 겹치지 않도록 이 학습 문서를 분리했다.

### 이번에 배운 개념

- **커밋:** 특정 시점의 프로젝트 상태를 가리키는 Git 기준점이다.
- **브랜치:** 원본 흐름을 건드리지 않고 변경을 쌓는 독립 작업선이다.
- **worktree:** 같은 저장소의 다른 브랜치를 별도 폴더에서 여는 기능이다.
- **`git archive`:** 커밋에 포함된 원본 파일만 묶고 Git 내부 정보와 로컬 임시 파일은 제외한다.
- **SHA-256:** ZIP이 나중에 바뀌지 않았는지 확인하는 디지털 지문이다.
- **회귀 검사:** 새 변경 때문에 기존 정상 기능이 깨지지 않았는지 확인하는 검사다.

### 비교와 복구

- 코드 차이는 기준 커밋과 최종 커밋의 `git diff`로 확인한다.
- 원본 파일 자체는 별도 ZIP에서 확인한다.
- 작업 브랜치 문제가 생겨도 `main`과 원본 ZIP은 영향을 받지 않는다.
````

- [ ] **Step 3: Validate required learning sections and links**

Run:

```powershell
rg -n '^## (프로젝트를 한 문장으로 설명하면|전체 구조|비용과 시간을 줄인 선택|현재 인수 기준점|앞으로의 작업 순서|작업별 기록 양식|2026-08-10)' docs/dev/LEARNING_LOG.md
@(
  'public/scenario/scenario.json',
  'src/state.ts',
  'src/fsm.ts',
  'src/engine/nodeRunner.ts',
  'src/ui/gameView.ts',
  'src/main.ts',
  'src/storage/saveRepository.ts',
  'worker/index.ts',
  '.github/workflows'
) | ForEach-Object { if (-not (Test-Path -LiteralPath $_)) { throw "Missing referenced path: $_" } }
```

Expected: seven matching section lines; no `Missing referenced path` error.

- [ ] **Step 4: Check and commit the learning log**

Run:

```powershell
git diff --check
git status --short
git add -- docs/dev/LEARNING_LOG.md
git diff --cached --check
git commit -m "docs: add project takeover learning log"
```

Expected: only `docs/dev/LEARNING_LOG.md` is committed.

## Task 2: Register Learning Log in Project Map

**Files:**
- Modify: `docs/dev/PROJECT_MAP.md`

- [ ] **Step 1: Add the document responsibility row**

Add this row after the `마일스톤 실행 이력` row in `단일 진실 공급원`:

```markdown
| 프로젝트 인수 학습 기록 | [LEARNING_LOG.md](LEARNING_LOG.md) | 변경 이유·개념·비용·위험을 비개발자 관점으로 설명. 수행 사실은 `IMPLEMENTATION_LOG.md`를 기준으로 함 |
```

- [ ] **Step 2: Add the takeover reading set**

Add this row to `작업별 읽기 세트`:

```markdown
| 프로젝트 인수·학습 기록 | `AGENTS.md`, 이 문서, `LEARNING_LOG.md`, `IMPLEMENTATION_LOG.md` |
```

- [ ] **Step 3: Add the learning-log update rule**

Add this bullet under `문서 갱신 규칙`:

```markdown
- 사용자 학습 설명: `LEARNING_LOG.md`에 변경 이유·개념·비용·위험을 기록하되 수행 사실과 테스트 결과는 `IMPLEMENTATION_LOG.md`를 기준으로 링크한다.
```

- [ ] **Step 4: Validate links and commit the map update**

Run:

```powershell
rg -n '프로젝트 인수 학습 기록|프로젝트 인수·학습 기록|사용자 학습 설명' docs/dev/PROJECT_MAP.md
Test-Path -LiteralPath 'docs\dev\LEARNING_LOG.md'
git diff --check
git add -- docs/dev/PROJECT_MAP.md
git diff --cached --check
git commit -m "docs: route takeover learning records"
```

Expected: three matching lines, `True`, and a commit containing only `PROJECT_MAP.md`.

## Task 3: Verify Baseline and Documentation

**Files:**
- Verify only; no source change

- [ ] **Step 1: Verify the external ZIP checksum**

Run:

```powershell
$archive = 'C:\Users\user\Documents\NHN_HACKTON\baseline-archives\the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip'
$checksum = "$archive.sha256"
$expected = (Get-Content -LiteralPath $checksum -Raw).Split(' ')[0].Trim()
$actual = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
if ($expected -ne $actual) { throw "Checksum mismatch: expected=$expected actual=$actual" }
"SHA256=$actual"
```

Expected:

```text
SHA256=AB4C1ACA6CDDF9DC8E7A09C4C40240BD4F70D9B88AB1BBD88F6E35EBBF877EDC
```

- [ ] **Step 2: Verify ZIP contents against the baseline commit**

Run:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = 'C:\Users\user\Documents\NHN_HACKTON\baseline-archives\the-judge-became-a-magical-girl-handover-2026-08-10-2a5821d.zip'
$zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
try {
  $zipFiles = @($zip.Entries | Where-Object { -not $_.FullName.EndsWith('/') } | ForEach-Object { $_.FullName.Replace('/','\') } | Sort-Object)
  $gitFiles = @(git -c core.quotepath=false ls-tree -r --name-only 2a5821d8429d88208cb415b06992e7f6fe4dfabf | ForEach-Object { $_.Replace('/','\') } | Sort-Object)
  $diff = @(Compare-Object -ReferenceObject $gitFiles -DifferenceObject $zipFiles)
  if ($diff.Count -ne 0) { throw "Archive file-list mismatch: $($diff.Count)" }
  "GIT_FILES=$($gitFiles.Count) ZIP_FILES=$($zipFiles.Count) DIFF_COUNT=$($diff.Count)"
} finally {
  $zip.Dispose()
}
```

Expected:

```text
GIT_FILES=262 ZIP_FILES=262 DIFF_COUNT=0
```

- [ ] **Step 3: Run the project verification contract**

Run:

```powershell
npm run check
npm test
npm run build
```

Expected:

- TypeScript exits 0.
- Vitest reports `41 passed` files and `187 passed` tests.
- Vite build exits 0; the known Transformers chunk-size warning may remain.

## Task 4: Append Factual Handover Entry

**Files:**
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`

- [ ] **Step 1: Append the verified handover record**

Append:

```markdown

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
| 제외 확인 | `.git`, `node_modules`, `dist`, 로컬 Secret 없음 |

`.env.example`은 실제 Secret이 아닌 자리표시자 계약 파일이므로 Git 원본과 함께 보관했다.

### 문서 처리

- `docs/dev/LEARNING_LOG.md`를 새로 만들어 구조·비용 절감 선택·현재 위험·작업별 학습 형식을 기록했다.
- `docs/dev/PROJECT_MAP.md`에 학습 기록의 역할·읽기 세트·갱신 규칙을 등록했다.
- 수행 사실은 이 문서, 제품 계약은 기존 기준 문서, 학습 설명은 `LEARNING_LOG.md`로 분리했다.

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
- 이 브랜치를 검토한 뒤 다음 별도 작업으로 필수 누락 이미지 해결에 진입한다.
- 원격 push·PR·merge는 사용자 요청 전 수행하지 않는다.
```

- [ ] **Step 2: Validate factual values and document references**

Run:

```powershell
rg -n '프로젝트 인수 기준점|2a5821d8429d88208cb415b06992e7f6fe4dfabf|82,730,214|AB4C1ACA6CDDF9DC8E7A09C4C40240BD4F70D9B88AB1BBD88F6E35EBBF877EDC|41 files·187 tests' docs/dev/IMPLEMENTATION_LOG.md
Test-Path -LiteralPath 'docs\dev\LEARNING_LOG.md'
Test-Path -LiteralPath 'docs\dev\PROJECT_MAP.md'
```

Expected: all five factual patterns found; both paths return `True`.

- [ ] **Step 3: Commit the factual execution record**

Run:

```powershell
git diff --check
git add -- docs/dev/IMPLEMENTATION_LOG.md
git diff --cached --check
git commit -m "docs: record takeover baseline verification"
```

Expected: commit contains only `IMPLEMENTATION_LOG.md`.

## Task 5: Final Scope Audit

**Files:**
- Verify only

- [ ] **Step 1: Confirm no game or asset files changed**

Run:

```powershell
git diff --name-status 2a5821d8429d88208cb415b06992e7f6fe4dfabf..HEAD
```

Expected changed paths only:

```text
docs/dev/IMPLEMENTATION_LOG.md
docs/dev/LEARNING_LOG.md
docs/dev/PROJECT_MAP.md
docs/superpowers/plans/2026-08-10-project-takeover-baseline.md
docs/superpowers/specs/2026-08-10-project-takeover-baseline-design.md
```

- [ ] **Step 2: Confirm clean worktree and branch isolation**

Run:

```powershell
git diff --check
git status --short --branch
git log --oneline 2a5821d8429d88208cb415b06992e7f6fe4dfabf..HEAD
git -C 'C:\Users\user\Documents\NHN_HACKTON\the-judge-became-a-magical-girl' status --short --branch
git -C 'C:\Users\user\Documents\NHN_HACKTON\the-judge-became-a-magical-girl' rev-parse HEAD
```

Expected:

- Work branch clean and ahead of `origin/main` only by intentional documentation commits.
- Original checkout remains clean on `main`.
- Original checkout HEAD remains `2a5821d8429d88208cb415b06992e7f6fe4dfabf`.
- No push, PR, merge, tag, or `main` mutation performed.
