# M1 구현·GitHub 최초 게시 프롬프트

아래 코드 블록 전체를 새 Codex 작업에 그대로 붙여넣는다.

````text
Use `$nhn-voice-vn-workflow`.

# 작업 모드와 권한

`MILESTONE_IMPLEMENTATION` 모드로 M1을 구현한다.

프로젝트 루트:
C:\Users\axz14\Desktop\Project\NHN_hackathon

이번 요청은 다음 외부 변경까지 명시적으로 허용한다:

- 로컬 Git 저장소 초기화
- 현재 GitHub CLI 인증 계정에 private GitHub 저장소 생성
- `origin` 연결
- 검증된 M1 초기 commit을 `main`에 최초 push

GitHub Pages 배포, Cloudflare Workers 배포, API 키·Secret 등록은 허용하지 않는다.


# 시작 전 필수 확인

모든 파일을 UTF-8로 읽는다.

다음 문서를 먼저 읽고 지시 우선순위를 따른다:

- AGENTS.md
- docs/dev/PROJECT_MAP.md
- docs/음성_미연시_기획서_v2_A안확정.md
- docs/별첨1_스토리_작가_가이드라인.md
- docs/dev/IMPLEMENTATION_SPEC.md
- docs/dev/MILESTONES.md의 M1 절
- docs/dev/QA_AND_DEMO.md의 QD-01, QR-01, QV-01~QV-05
- docs/dev/SECURITY_AND_DEPLOYMENT.md의 로컬 env, M1 GitHub 초기 게시, 비밀정보 검사 절
- docs/dev/DECISIONS.md의 DEC-010, DEC-011, DEC-013, DEC-014, DEC-022, DEC-025

다음 상태를 읽기 전용으로 확인한다:

- 현재 전체 파일 구조
- 기존 `.git` 존재 여부
- 기존 Git remote
- `git status --short`
- `git --version`
- `node --version`
- `npm --version`
- `gh --version`
- `gh auth status`

`gh`가 없거나 인증되지 않았으면 저장소나 코드를 변경하지 말고, 필요한 최소 조치만 보고하고 중단한다.

기존 `.git`, 기존 `origin`, 동일 이름 GitHub 저장소가 있으면 덮어쓰거나 재사용을 추측하지 말고 현재 상태와 충돌을 보고한 뒤 중단한다.

Git commit 작성자 정보가 없으면 전역 Git 설정을 임의 변경하지 않는다. 필요한 `user.name`과 `user.email`만 사용자에게 요청하고 중단한다.


# 이번 작업에서 확정할 입력

- 패키지 관리자: npm
- 테스트 러너: Vitest
- 실행 환경: Windows PowerShell, 현재 설치된 Node.js, 최신 안정 Chrome 데스크톱
- GitHub owner: `gh api user --jq .login`으로 확인한 현재 인증 계정
- GitHub repository: `the-judge-became-a-magical-girl`
- GitHub visibility: private
- 기본 브랜치: `main`
- Vite base: `/the-judge-became-a-magical-girl/`
- 초기 commit 메시지: `feat: bootstrap playable M1`
- 시나리오: 저장소 내부 M1용 더미 JSON
- 에셋: CSS 또는 저장소 내부 placeholder
- 스냅샷 버전: `schemaVersion: 1`
- 외부 API와 실제 Secret: 사용하지 않음

위 값은 이번 M1 실행에 한해 승인된 입력이다. 다른 아키텍처·스키마·외부 서비스를 추가하지 않는다.


# 목표

더미 시나리오와 클릭 입력만 사용해

`TITLE → PROLOGUE → DIALOGUE/CUTSCENE → ENDING`

을 완주 가능한 데이터 기반 M1 게임을 구현한다.

긍정·중립·부정 클릭 경로로 서로 다른 상태와 GOOD/NORMAL/BAD 엔딩을 재현한다.

타입 검사, 테스트, production build, 브라우저 수동 검증을 통과한 뒤 프로젝트를 Git 저장소로 초기화한다. 검증된 M1만 초기 commit으로 만들고 지정한 private GitHub 저장소의 `main`에 push한다.


# M1 구현 범위

- Vite + TypeScript + Vanilla DOM/CSS 최소 스캐폴드
- npm 기반 설치·스크립트
- Vitest 기반 핵심 도메인 테스트
- 단일 `GameState`
- 직렬 FSM
- 중앙 상태 갱신 함수
- `TITLE`, `PROLOGUE`, `DIALOGUE`, 일반 `CUTSCENE`, `ENDING`
- `dialogue`, 일반 `cutscene`, `ending` JSON 노드
- 클릭 intent 선택
- affinity 0~100 클램프
- 허용 flag 화이트리스트
- `nodeTurn`, `totalTurn`
- intent `next` 우선
- `maxTurns`와 `exitOnMaxTurns`
- 허용 문법만 처리하는 분기 조건 파서
- `eval`과 `new Function` 금지
- `scenario.json`, `characters.json`, `config.json`
- zod 런타임 검증
- `next`, 캐릭터 ID, 엔딩 참조 무결성 검사
- 잘못된 데이터의 한국어 오류 진단
- 노드 이동 시 `localStorage` 저장
- `schemaVersion: 1`
- 새로고침 복구
- 손상 스냅샷 안전 초기화
- 최소 타이틀·대화·선택지·엔딩 UI
- 실제 에셋 대신 CSS/placeholder
- `npm run check`
- `npm test`
- `npm run build`
- `.gitignore`
- 검증 후 Git 초기화·commit·GitHub 최초 push

입력 계층은 이후 M2에서 클릭 구현을 STT 구현과 교체하거나 함께 사용할 수 있도록 포트 또는 동등한 명확한 경계로 분리한다.


# M1 비범위

- STT 또는 Web Speech API
- 마이크 권한 요청
- 실시간 음성 자막
- Gemini 또는 다른 LLM 호출
- Cloudflare Workers
- 실제 API 키·토큰·Secret
- 변신 주문 게이트
- battle runner
- momentum
- 실제 본편 시나리오
- 실제 이미지·BGM·SFX
- 파티클·고급 연출
- HIDDEN 엔딩 전용 기능
- GitHub Actions
- GitHub Pages 배포
- Workers 배포
- 다음 마일스톤 선행 구현
- 관련 없는 리팩터링
- 승인되지 않은 dependency·스키마 필드·에셋 ID


# 구현 규칙

1. 문서 계약과 현재 파일을 먼저 대조한다.
2. `.gitignore`를 dependency 설치와 Git staging 전에 준비한다.
3. 작은 실행 가능 단위로 구현한다.
4. 도메인 로직을 DOM, 저장소, 입력 구현과 분리한다.
5. 외부 입력과 저장 데이터는 경계에서 zod로 검증한다.
6. 상태는 중앙 함수만 변경한다.
7. LLM·STT가 없어도 M1은 독립 실행 가능해야 한다.
8. 더미 시나리오는 별첨1 계약을 가능한 범위에서 따른다.
9. 오류를 숨기거나 잘못된 JSON을 자동 보정하지 않는다.
10. 기존 기준 문서를 재작성하지 않는다.
11. 구현 중 새 결정이 생긴 경우만 docs/dev/DECISIONS.md를 갱신한다.
12. docs/assets/AI_PRODUCTION_LOG.md에 이번 Codex 작업과 최종 commit을 기록한다.
13. 검증이 실패하면 원인을 수정하고 관련 검증을 다시 실행한다.
14. 검증을 실행하지 못한 항목은 완료로 표현하지 않는다.


# `.gitignore` 최소 계약

다음을 검토해 제외한다:

- `node_modules/`
- `dist/`
- `coverage/`
- `*.log`
- `.env`
- `.env.*`
- `!.env.example`
- `.dev.vars`
- `.dev.vars.*`
- `.wrangler/`
- `*.local`
- OS 임시 파일
- IDE 로컬 설정
- 실제 API 키·토큰·Secret을 포함한 파일

`.env.example`이 필요하면 실제 값 없이 변수명과 자리표시자만 넣는다.

`VITE_*` 값은 공개 번들에 포함되므로 비밀값으로 사용하지 않는다.


# 자동 검증

반드시 실행한다:

```powershell
npm run check
npm test
npm run build
```

최소 자동 테스트:

- affinity 하한·상한 클램프
- 허용 flag 적용
- 비허용 flag 거부
- intent `next` 우선순위
- `maxTurns` 강제 이동
- `exitOnMaxTurns` 위에서 아래 평가
- 조건 파서 허용 문법
- 위험하거나 알 수 없는 조건식 거부
- zod 스키마 성공·실패
- 존재하지 않는 `next` 검출
- 존재하지 않는 캐릭터 ID 검출
- 스냅샷 저장·복구 왕복
- 손상 스냅샷 안전 처리
- GOOD/NORMAL/BAD 더미 경로


# 수동 플레이 검증

production build 또는 동등한 실제 브라우저 실행으로 확인한다:

1. 새 게임 시작
2. 클릭만으로 타이틀→엔딩 도달
3. 긍정 경로의 예상 affinity·flag·GOOD 확인
4. 중립 경로의 NORMAL 확인
5. 부정 경로의 BAD 확인
6. 노드 이동 후 새로고침→동일 node/state/flags 복구
7. 새 게임→이전 상태 제거
8. 브라우저 콘솔 미처리 예외 없음
9. JS/CSS/JSON 경로 오류 없음

QA 결과에 QD-01, QR-01과 클릭 경로 3회의 pass/fail을 기록한다.


# Git 초기화 전 게이트

코드 구현과 모든 자동·수동 검증을 먼저 완료한다.

그다음 다음을 확인한다:

- `.gitignore` 내용
- 전체 파일 목록
- 포함할 M1 코드·테스트·문서
- 제외할 dependency·build·비밀·로컬 파일
- 실제 비밀값이 파일에 없는지
- 관련 없는 사용자 파일을 staging하지 않는지

`files.zip`, `docs/temp/`, 기존 `prompt/` 기획 과정 자료는 자동으로 staging하지 않는다. 제품 실행·현재 계약에 필요한 파일만 포함하고, 포함 여부가 불명확하면 제외한 뒤 최종 보고에 적는다.


# Git·GitHub 게시 절차

검증 게이트 통과 후 수행한다:

1. 프로젝트 루트에서 Git 저장소를 `main` 기본 브랜치로 초기화한다.
2. `git status --short`로 전체 상태를 확인한다.
3. M1 실행·테스트·현재 계약에 필요한 파일만 명시적으로 staging한다.
4. staged 파일 목록과 staged diff를 검토한다.
5. `git diff --cached --check`를 실행한다.
6. staged 내용에서 비밀 패턴을 검사한다. 실제 비밀값은 출력하지 않는다.
7. `feat: bootstrap playable M1` 메시지로 초기 commit을 만든다.
8. `2klips/the-judge-became-a-magical-girl` private GitHub 저장소를 만든다.
9. 새 원격을 `origin`으로 연결한다.
10. `main`을 최초 push하고 upstream을 설정한다.
11. push 후 로컬 HEAD와 원격 `main` HEAD가 일치하는지 확인한다.
12. `git status --short`, `git remote -v`, 현재 branch/upstream, `gh repo view` 결과를 확인한다.

초기 저장소이므로 PR은 만들지 않는다.


# Git·GitHub 금지사항

- `git add -A`로 범위를 확인하지 않은 전체 파일을 무조건 staging
- 관련 없는 사용자 파일 commit
- API 키·토큰·`.env`·`.dev.vars` commit
- `git push --force`
- 기존 remote 교체
- 기존 GitHub 저장소 삭제
- 기존 Git 기록 재작성
- 동일 이름 저장소의 소유권이나 용도를 추측
- 검증 실패 상태 commit·push
- GitHub Pages 활성화
- GitHub Actions deploy 생성
- 저장소 공개범위를 public으로 변경

GitHub 저장소 생성 또는 push가 실패하면 force push나 remote 교체로 우회하지 않는다. 로컬 검증 결과와 commit을 보존하고 정확한 오류와 최소 해결 단계만 보고한다.


# M1 완료 조건

다음을 모두 충족해야 완료다:

1. 클릭만으로 타이틀에서 엔딩까지 완주
2. GOOD/NORMAL/BAD 더미 경로 재현
3. 잘못된 JSON과 참조 오류가 시작 전에 한국어로 차단
4. affinity 클램프와 flag 화이트리스트 작동
5. 새로고침 후 node/state/flags 복구
6. 새 게임 시 이전 상태 제거
7. 브라우저 콘솔 미처리 예외 없음
8. `npm run check` 성공
9. `npm test` 성공
10. `npm run build` 성공
11. QD-01, QR-01, 클릭 3경로 통과
12. `.gitignore`가 dependency·build·비밀·로컬 파일 제외
13. 검증된 M1만 초기 commit에 포함
14. private GitHub 저장소 `2klips/the-judge-became-a-magical-girl` 생성
15. `origin`이 생성한 저장소를 가리킴
16. `main` push와 upstream 설정 성공
17. 로컬·원격 HEAD 일치
18. working tree가 깨끗하거나 남은 파일이 명시됨
19. 실제 비밀정보가 commit에 없음
20. GitHub Pages와 Workers가 배포되지 않음


# 중단 조건

다음 경우만 중단한다:

- `gh` 미설치 또는 미인증
- Git commit 작성자 정보 없음
- 기존 `.git`, 기존 `origin`, 동일 이름 GitHub 저장소 충돌
- 기존 사용자 변경과 안전하게 분리 불가
- 실제 비밀값 또는 추가 외부 계정 권한 필요
- 확정 기획·데이터 계약 변경 필요
- 자동 또는 수동 검증 실패를 범위 내에서 해결할 수 없음

중단할 때 이미 확인한 사실, 정확한 차단 원인, 필요한 최소 사용자 조치 하나만 보고한다.


# 최종 보고

다음 순서로 보고한다:

1. 구현 결과와 플레이 흐름
2. 생성·수정 파일
3. 주요 아키텍처 선택
4. `npm run check`, `npm test`, `npm run build` 결과
5. QD-01, QR-01, 클릭 3경로 수동 결과
6. GitHub 저장소 URL과 공개범위
7. 기본 브랜치와 upstream
8. 초기 commit hash와 메시지
9. `origin` URL
10. staging에서 제외한 파일
11. 비밀정보 검사 결과
12. 최종 `git status --short`
13. 확정사항과 별도인 가정·제안
14. 남은 위험
15. M2 진입 가능 여부
16. GitHub Pages와 Workers가 아직 배포되지 않았다는 확인
````
