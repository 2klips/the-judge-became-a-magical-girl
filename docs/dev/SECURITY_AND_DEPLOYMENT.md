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
  → Gemini LLM API
```

- GitHub Pages 번들은 공개 정보다. 비밀을 넣을 수 없다.
- Worker만 STT 공급자와 Gemini LLM 자격증명을 읽는다.
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

`[미결정, DEC-015]` production Pages URL과 활성화 시점은 아직 없다. 저장소·base는 DEC-025로 확정됐다. Pages 배포 확정 뒤 allowlist와 QA QG-03/QG-04를 갱신한다.

## 4. 요청·응답 제한

- LLM 경로는 `POST application/json`, STT 경로는 `POST multipart/form-data`의 제한된 `audio/wav`만 허용한다.
- M3 Worker는 WAV 오디오를 14MB, JSON 요청을 32KB로 제한하고 최근 대화는 최대 3턴(메시지 6개)만 받는다. Gemini inline audio의 base64 팽창을 포함해 공급자 20MB 경계 아래로 유지한다.
- 모델·temperature·출력 토큰·response schema는 Worker가 소유한다. 클라이언트가 임의 override하지 못한다.
- LLM 클라이언트 타임아웃은 4초·재시도 1회. STT 타임아웃은 Gemini 약 3,220ms 사용자 실측을 잘라내지 않도록 M3 p95 측정 뒤 별도 확정한다. Worker에도 더 긴 상한을 둔다.
- 오류는 일반화된 코드로 반환한다. 공급자 응답·키·내부 스택을 브라우저에 노출하지 않는다.
- `[제안]` 요청별 상관 ID를 생성하되 발화나 개인정보를 ID에 넣지 않는다.

## 5. STT 공급자·Gemini LLM 쿼터와 키 운영

- OpenAI와 Google 콘솔에서 평가용 STT 키의 사용 상한을 각각 설정한다.
- GPT/Gemini STT와 Gemini LLM의 모델 ID, 무료 한도, 가격, rate limit은 M3 시작 직전 공식 문서와 콘솔에서 확인한다. 2026-08-02 확인 결과 대화 LLM은 DEC-018에 따라 `gemini-3.1-flash-lite`, `thinkingLevel: minimal`을 사용한다.
- MVP-1 측정은 공급자·오디오 길이·성공 여부·지연만 기록하고 키나 개인 발화 원문은 기록하지 않는다.
- M6 진입 전 사용자가 production STT 공급자 하나를 선택한다. 비선택 STT 라우트와 전용 Secret은 제거·폐기한다.
- 시연 전날·직전에 선택 STT와 Gemini LLM 사용량·차단 상태를 확인한다.
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

현재 디렉터리는 Git 저장소이며 DEC-022·DEC-025에 따른 private `origin`과 기본 브랜치 `main`이 연결돼 있다. Pages 배포는 M6까지 수행하지 않는다.

### M1 GitHub 초기 게시 계약

- 소유자: `2klips`.
- 저장소명: `the-judge-became-a-magical-girl`.
- 공개범위: `private`.
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

- [ ] production Pages Origin 확정
- [ ] Worker allowlist 최소화
- [ ] 최종 STT 공급자와 Gemini LLM 모델 ID·쿼터 확인
- [ ] 선택 STT·Gemini LLM production/예비 Secret 등록, 비선택 STT Secret·라우트 제거, 코드 미포함
- [ ] `.gitignore`와 예시 env 확인
- [ ] CI check/test/build 성공
- [ ] Pages base와 asset/scenario 경로 성공
- [ ] HTTPS 마이크 허용·거부 테스트
- [ ] 허용/비허용 Origin 테스트
- [ ] 비밀정보 검사
- [ ] 마지막 검증 빌드와 롤백 대상 식별
