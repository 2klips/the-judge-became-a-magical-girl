# 보안·배포 계약

제품 선택은 [메인 기획서 §8.1, §9, §11](../음성_미연시_기획서_v2_A안확정.md)에 따른다. 실제 비밀값은 이 문서에 기록하지 않는다.

Workers·Origin·쿼터·HTTPS 선택은 `[확정]`이다. 그 외 요청 제한, 로그 최소화, 검사 절차는 `[제안]` 보안 운영 계약이다.

## 1. 신뢰 경계

```text
Chrome on GitHub Pages
  → 공개 HTTPS 요청
Cloudflare Worker
  → Origin/요청 검증, Secret 주입
  → 선택된 STT 공급자(OpenAI 또는 Gemini)
  → 환경별 선택 LLM API(OpenAI 또는 Gemini)
```

- GitHub Pages 번들은 공개 정보다. 비밀을 넣을 수 없다.
- Worker만 STT 공급자와 환경별 선택 LLM 자격증명을 읽는다.
- `[확정, DEC-028]` MVP-1까지 OpenAI/Gemini STT Secret을 모두 사용할 수 있지만 일반 턴은 선택된 공급자 하나만 호출한다. M6 production은 최종 선택 공급자만 활성화한다.
- LLM 응답은 신뢰하지 않고 클라이언트에서 다시 zod 검증·클램프한다.

## 2. Workers 비밀정보

- production 키는 Wrangler Secret 또는 Cloudflare 대시보드 Secret으로 저장한다.
- 코드, `wrangler.toml`, 문서, 이슈, 로그, CI 출력에 실제 값을 넣지 않는다.
- 키 전체 또는 사용자 발화 전체를 Worker 로그로 남기지 않는다.
- 예비 키는 별도 Secret 슬롯에 보관하되 평시 자동 노출·동시 사용하지 않는다.
- STT 평가용 Secret과 production LLM Secret은 논리적으로 분리한다. 같은 공급자라도 용도·회수 시점이 다른 키를 공유하지 않는다.
- 로테이션 후 이전 키는 해당 공급자 콘솔에서 폐기하고 배포·smoke test를 다시 수행한다.

## 3. Origin 허용 목록

- 정확한 production Origin과 명시적 로컬 개발 Origin만 허용한다.
- `*.github.io` 전체 허용 금지. 조직/사용자와 저장소 경로가 맞는 우리 배포 Origin을 명시한다.
- Origin 문자열을 단순 `includes`로 검사하지 않는다. URL 파싱 후 scheme/host/port를 정확히 비교한다.
- `null`, 누락 Origin, 임의 서브도메인, 유사 도메인은 거부한다.
- `OPTIONS` preflight와 실제 요청에 같은 정책을 적용한다.
- 오류 응답에 허용 CORS 헤더를 무조건 붙이지 않는다.

`[확정, DEC-051]` M5 공개 QA Pages Origin은 `https://2klips.github.io`다. 브라우저의 `Origin`에는 저장소 path가 포함되지 않으므로 Worker allowlist는 이 정확한 scheme/host 조합을 사용하고 `*.github.io` wildcard는 사용하지 않는다. M6 production URL이 달라지면 별도 Origin으로 다시 검증한다.

## 4. 요청·응답 제한

- LLM 경로는 `POST application/json`, STT 경로는 `POST multipart/form-data`의 제한된 `audio/wav`만 허용한다.
- M3 Worker는 WAV 오디오를 14MB, JSON 요청을 32KB로 제한하고 최근 대화는 최대 3턴(메시지 6개)만 받는다. Gemini inline audio의 base64 팽창을 포함해 공급자 20MB 경계 아래로 유지한다.
- 모델·temperature·출력 토큰·response schema는 Worker가 소유한다. 클라이언트가 임의 override하지 못한다.
- LLM 클라이언트 타임아웃은 4초·재시도 1회. STT 타임아웃은 Gemini 약 3,220ms 사용자 실측을 잘라내지 않도록 M3 p95 측정 뒤 별도 확정한다. Worker에도 더 긴 상한을 둔다.
- 오류는 일반화된 코드로 반환한다. 공급자 응답·키·내부 스택을 브라우저에 노출하지 않는다.
- `[제안]` 요청별 상관 ID를 생성하되 발화나 개인정보를 ID에 넣지 않는다.

## 5. STT 공급자·LLM 쿼터와 키 운영

- OpenAI와 Google 콘솔에서 평가용 STT 키의 사용 상한을 각각 설정한다.
- GPT/Gemini STT와 Gemini LLM의 모델 ID, 무료 한도, 가격, rate limit은 M3 시작 직전 공식 문서와 콘솔에서 확인한다. 2026-08-02 확인 결과 대화 LLM은 DEC-018에 따라 `gemini-3.1-flash-lite`, `thinkingLevel: minimal`을 사용한다.
- MVP-1 측정은 공급자·오디오 길이·성공 여부·지연만 기록하고 키나 개인 발화 원문은 기록하지 않는다.
- `[확정, DEC-051]` 공개 QA와 이후 production 게임 STT는 OpenAI `gpt-transcribe`로 고정한다. production Worker는 Gemini STT route를 노출하지 않으며, Gemini STT는 격리된 로컬 비교 Lab에만 남긴다.
- `[확정, DEC-052]` 공개 QA 대화·전투는 OpenAI Responses API `gpt-5.6-luna`, `reasoning.effort: low`, strict JSON Schema, `store: false`로 고정한다. QA Worker에는 `OPENAI_API_KEY`만 필요하며 `GEMINI_API_KEY`는 제거한다. 로컬 M3 회귀·비교는 Gemini 기본값과 로컬 Secret을 유지한다.
- 시연 전날·직전에 선택 STT와 해당 환경 LLM 사용량·차단 상태를 확인한다.
- 예비 키 로테이션 담당자와 절차를 팀 내부 비공개 운영 기록에 둔다.
- STT 쿼터 소진은 클릭·로컬 입력 경로, LLM 쿼터 소진은 고정 응답·로컬 판정 경로로 강등한다. 게임 실패로 처리하지 않는다.

## 6. 로컬 `.env` 정책

Git 제외 대상:

```gitignore
.env
.env.*
!.env.example
.dev.vars
.dev.vars.*
*.local
```

- `.env.example`에는 변수명과 비밀이 아닌 설명/자리표시자만 둔다.
- `VITE_*` 변수는 브라우저 번들에 포함된다. 비밀에 사용 금지.
- Worker 로컬 개발 비밀은 `.dev.vars` 또는 로컬 Secret 저장소에 둔다.
- 터미널 명령에 실제 키를 인라인으로 넣지 않는다. 셸 기록·Codex 출력에 남을 수 있다.

## 7. GitHub Pages

- GitHub Actions가 `check → test → build → deploy` 순서로 성공한 산출물만 배포한다.
- Vite `base`는 DEC-025의 `/the-judge-became-a-magical-girl/`을 사용한다.
- Pages는 HTTPS를 사용한다. Web Speech API와 마이크 권한은 보안 컨텍스트·Chrome 지원 감지 뒤 활성화한다.
- 정적 번들은 Worker endpoint URL과 비밀이 아닌 개발 공급자 선택값만 알 수 있다. API 키는 알지 못한다.
- main 실패 빌드가 마지막 검증 배포를 덮지 않게 deploy job을 검증 job 뒤에 둔다.
- 배포 후 [QA QG-01~QG-05](QA_AND_DEMO.md)를 수행한다.

현재 디렉터리는 Git 저장소이며 DEC-022·DEC-025에 따른 private `origin`과 기본 브랜치 `main`이 연결돼 있다. 정식 production Pages 배포는 M6까지 수행하지 않는다. DEC-041의 임시 QA 배포만 아래 경계로 예외 승인됐다.

### M5 임시 QA Pages 예외

- URL: `https://2klips.github.io/the-judge-became-a-magical-girl/`.
- 저장소 공개범위: `public`. GitHub Free의 private Pages 미지원으로 DEC-042에서 사용자가 코드·에셋 전체 공개를 승인해 DEC-025의 `private` 계약 중 공개범위만 대체했다.
- 소스: `codex/m5-asset-handoff-docs` 브랜치 push와 수동 실행만 허용한다.
- 공개범위: 저장소가 private이어도 Pages URL은 공개될 수 있다. 비공개 자료·비밀·개인 발화·API 키를 포함하지 않는다.
- 빌드: `npm run build:qa`. 게임 `index.html`만 만들며 `stt-lab.html`, 로컬 Whisper WASM·모델을 제외한다.
- 네트워크: `[확정, DEC-051]` QA 모드는 GitHub Actions repository variable `QA_WORKER_URL`을 `VITE_WORKER_URL`로 주입한다. 값은 HTTPS `*.workers.dev`여야 하며 없거나 HTTP면 build/runtime 게이트가 실패한다. Worker `env.qa`는 Pages Origin만 허용하고 OpenAI STT route만 활성화한다.
- 배포값: `QA_WORKER_URL=https://nhn-voice-m5-qa-worker.the-judge-became-a-magical-girl.workers.dev`.
- LLM: `[확정, DEC-052]` Gemini 지역 제한을 우회하지 않고 공개 QA의 `/judge/dialogue`, `/judge/battle`만 OpenAI `gpt-5.6-luna`로 전환한다. 공개 HTTP 요청·응답 스키마와 클릭·로컬 폴백은 유지한다. M6 production LLM은 별도 확정 전 기존 계약을 바꾸지 않는다.
- 화면: `QA PREVIEW`, 타이틀 마이크 테스트 필수, GPT STT 활성, OpenAI LLM 활성, 클릭·오프라인 폴백, commit 7자를 표시하고 검색 엔진에 `noindex,nofollow`를 요청한다. 게임 STT 공급자 선택 UI는 `GPT · 고정`으로 표시한다.
- debug: `?debug=1`과 장면 프리뷰는 작업자 QA를 위해 의도적으로 유지한다. 정식 production의 상태 변경 debug 정책은 DEC-021 해결 전이며 이 예외로 확정하지 않는다.
- 종료: M6 정식 배포 때 production workflow·Worker Origin·GPT STT·debug 정책으로 교체하거나 임시 Pages를 내린다.
- 환경 보호: `github-pages` 배포 허용 branch는 `main`, `codex/m5-asset-handoff-docs` 두 개다. 임의 branch나 tag는 허용하지 않는다.

### M1 GitHub 초기 게시 계약

- 소유자: `2klips`.
- 저장소명: `the-judge-became-a-magical-girl`.
- 최초 게시 공개범위: `private`. 현재는 DEC-042에 따라 `public`이며 이 항목은 M1 당시 이력이다.
- 기본 브랜치: `main`.
- Vite base: `/the-judge-became-a-magical-girl/`.
- 시작 전 `git --version`, `gh --version`, `gh auth status`를 확인한다.
- 기존 `.git`, `origin`, 동일 이름 원격 저장소가 있으면 덮어쓰지 않고 중단한다.
- `.gitignore`와 비밀정보 검사를 commit보다 먼저 완료한다.
- 자동·수동 M1 검증을 통과한 파일만 staging·commit한다.
- 최초 push에 force 옵션을 사용하지 않는다.
- push 뒤 `origin`, upstream, 로컬·원격 HEAD 일치를 확인한다.
- 공개범위나 저장소명이 달라져야 하면 생성 전에 사용자 최신 지시를 받는다.

## 8. 제출 전 비밀정보 검사

Git 초기화 후:

1. `git status --short`로 추적·미추적 파일 확인.
2. `git grep -n -I -E "(API_KEY|SECRET|TOKEN|PRIVATE_KEY)"` 결과를 사람이 검토. 변수명·자리표시자는 허용, 값은 금지.
3. 가능하면 `gitleaks detect --no-banner --redact` 실행.
4. production build 파일에서 Secret 변수명과 공급자 키 패턴 검색.
5. GitHub Actions 로그, Worker 로그, 녹화 영상, 스크린샷에 키가 없는지 확인.
6. 유출 의심 시 먼저 키 폐기·교체. Git 기록 정리는 그다음 별도 승인 절차로 수행.

M1 초기 commit 전에는 추가로 `git diff --cached --check`, staged 파일 목록, staged diff를 검토한다. 관련 없는 파일이나 `files.zip`, 임시 기획 자료를 포함할지는 자동으로 가정하지 않는다.

검사 결과는 실제 값을 복사하지 않고 `도구 / 결과 / 조치 / 검증 시각`만 기록한다.

## 9. 배포 체크리스트

- [x] M5 QA Pages Origin 확정 — `https://2klips.github.io`
- [x] QA Worker allowlist 최소화 — exact Origin 1개
- [x] 최종 STT 공급자 확정 — OpenAI `gpt-transcribe`
- [x] 공개 QA 대화·전투 LLM 확정 — OpenAI `gpt-5.6-luna`, `reasoning.effort: low`
- [x] QA `OPENAI_API_KEY` Secret 등록, Gemini STT route 제거, 코드 미포함
- [x] 공개 QA OpenAI 대화·전투 실호출 smoke — 두 route 200·스키마·안전 검증 통과. 다중 발화 품질 QA는 계속
- [ ] `.gitignore`와 예시 env 확인
- [ ] CI check/test/build 성공
- [ ] Pages base와 asset/scenario 경로 성공
- [ ] HTTPS 마이크 허용·거부 테스트
- [ ] 허용/비허용 Origin 테스트
- [ ] 비밀정보 검사
- [ ] 마지막 검증 빌드와 롤백 대상 식별
