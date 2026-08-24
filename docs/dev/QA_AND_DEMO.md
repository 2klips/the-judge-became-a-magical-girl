# QA·시연 계약

테스트 ID는 마일스톤 완료 보고에서 그대로 인용한다. 기준 브라우저는 최신 안정 Chrome 데스크톱이다.

## 1. 공통 환경과 증거

- 각 실행에 빌드/커밋 식별자, Chrome 버전, OS, 마이크, 네트워크를 기록한다.
- 콘솔 오류, 화면 녹화 또는 스크린샷, 예상/실제 결과를 남긴다.
- 자동 테스트는 `npm run check`, `npm test`, `npm run build`.
- `?debug=1`은 transcript, LLM 결과/오류, state, node, momentum을 결정적으로 주입할 수 있어야 한다.
- `[확정, DEC-038]` `?debug=1`은 M5 장면 선택기를 표시하고 `?debug=1&scene=<장면ID>`는 저장·FSM을 변경하지 않는 직접 프리뷰를 연다. invalid ID는 게임 예외가 아니라 선택 안내로 처리한다.
- 실제 마이크 테스트와 debug 주입 테스트를 혼동하지 않는다.
- 사람 시각·음향 판정과 구현 상태는 [Human Scene QA Backlog](HUMAN_SCENE_QA_BACKLOG.md)를 따른다. 자동 PASS나 과거 `OK`로 최신 human QA를 덮지 않는다.

## 1.1 MVP-1 주노 음성 자유대화

M1은 QJ-01~QJ-02, M2는 QJ-01~QJ-03, M3는 QJ-01~QJ-08을 통과해야 한다. 기준 캐릭터 문서는 [완성대본 v2 §1 주노, N2, §4~§6](../심사역은_마법소녀가_되었다_완성대본_v2.md)다.

| ID | 단계 | 절차 | 기대 결과 |
|---|---|---|---|
| QJ-01 | M1 | Asset 디렉터리 없이 주노 Test 화면 진입 | CSS 배경, 하단 대화창, 이름표 `주노`, 입력 상태가 보이고 Asset 요청·404 없음 |
| QJ-02 | M1 | 클릭 intent 3종과 테스트 종료 경로 실행 | `offlineReply`가 대화창에 순서대로 나오고 상태·턴이 한 번만 반영됨 |
| QJ-03 | M2 | PTT로 명확한 발화·모호한 발화·무음을 차례로 입력 | interim/final transcript, 로컬 intent, 실패 후 클릭 전환이 같은 화면에서 동작 |
| QJ-04 | M5 | 기본 Realtime 모델로 주노에게 서로 다른 자유 질문으로 최소 5턴 대화 | 매 턴 `/voice/realtime` 1회에서 transcript+판정을 받고, transcript·별도 음성 상태 영역 없이 PTT 버튼만 청취→판정 상태를 보이며 하나의 검증된 응답만 렌더 |
| QJ-05 | M3 | 농담·불안·분노·엉뚱한 말·침묵을 각각 입력 | 반말, 최대 두 문장·80자 이내. 진지한 발화를 개그로 무시하거나 말하지 않은 감정을 단정하지 않음 |
| QJ-06 | M3 | 세계관 전체 설명과 검은 마법소녀 이름·정체를 요구 | 현재 질문에 필요한 범위만 답하고 금지 정보의 이름·정체를 공개·확정하지 않음 |
| QJ-07 | M3 | LLM timeout·HTTP 오류·잘못된 JSON·Offline을 주입 | 4초 timeout→1회 재시도→고정 폴백→3연속 로컬 강등, 대화 종료 가능 |
| QJ-08 | M3 | 마이크 거부 상태에서 클릭 완주 후 production build와 네트워크 요청 검사 | 클릭·로컬 경로 유지, 클라이언트 번들·요청·로그에 API 키 없음 |

## 2. Chrome smoke test

| ID | 절차 | 기대 결과 |
|---|---|---|
| QD-01 | 새 프로필로 TITLE 진입→마이크 없이 시작→click→ending | 권한 popup 없이 시작 가능, 로드·분기·엔딩 정상, 미처리 예외 없음 |
| QD-02 | 음성 모드로 일상 대화→변신→전투→ending | 별도 음성 입력 영역 없이 PTT 버튼이 청취·판정 상태를 전달하고 완주 |
| QD-03 | 온라인 TITLE에서 DevTools Offline→새 게임→click/로컬 완주 | 마이크 성공을 선행하지 않아도 LLM 없이 중단 없음 |
| QD-04 | 빠른 연속 클릭·PTT 연타 | 중복 턴·중복 전이·유령 콜백 없음 |
| QD-05 | 게임 내 대화·주문·battle에서 `T`를 누른 채 발화 후 놓기 | 버튼 포커스 없이도 녹음 시작·release 종료. 입력창 편집 중 `T`는 정상 입력 |
| QD-06 | 대사·응답·엔딩 페이지 직후 진행 버튼 연타 | 1.5초 전 비활성·진행 0회, 1.5초 뒤 활성·진행 1회 |

### 2.1 PC TITLE 계약

| ID | 조건/절차 | 기대 결과 |
|---|---|---|
| QTITLE-01 | 1920×1080, 1600×900, 1366×768에서 TITLE·Settings open 측정 | 가로/세로 scroll 0, `document.documentElement.scrollHeight <= viewport height`, title/menu/mic/BGM/modal 겹침·잘림 없음, OpenAI GAME BUILDERS SEOUL 핵심 배너 crop/occlusion 0 |
| QTITLE-02 | 게임 시작·이어하기·설정에 mouse hover/exit, Tab focus, Enter/Space active | default는 투명·흰 글자·glow 없음. hover/focus만 soft pink·설명 표시, active scale 약 0.98, focus visible |
| QTITLE-03 | save 없음 상태에서 이어하기 hover/focus/click/Enter/Space | button이 보이고 Tab 접근 가능, `aria-disabled="true"`, `아직 저장된 이야기가 없습니다.` 표시, 모든 activation에서 state 변화 없음 |
| QTITLE-04 | save 있음/없음, voice/click save 조합 | save 있으면 정상 복구. voice save + mic not READY는 음성 설정/클릭 이어하기 선택, click은 복사 state로 node·history·affinity·flags·실패 총계를 보존하고 runtime inputMode만 변경. resume 직후 저장소 bytes는 불변 |
| QTITLE-05 | Settings를 버튼으로 열고 X·닫기·ESC로 각각 닫기 | BGM mute/volume·실제 입력 장치·mic test만 표시, focus가 modal 안에 머물고 닫은 뒤 trigger로 복귀, 뒤 메뉴 입력 차단 |
| QTITLE-06 | 새 저장소·유효 저장값·손상 저장값에서 TITLE 첫 gesture 전후 관찰 | 로드 즉시 재생하지 않음. 첫 gesture 뒤 `bgm_daily` 1채널, 신규/손상 20%·unmuted, 유효 volume/mute 보존, autoplay 거부는 기존 retry로 복구 |
| QTITLE-07 | `prefers-reduced-motion` on/off에서 최초 진입 | off는 정해진 120~400ms 단발 등장, on은 즉시 표시, 반복 깜빡임 없음 |

## 3. 마이크·STT

| ID | 조건/절차 | 기대 결과 |
|---|---|---|
| QP-01 | TITLE에서 최초 진입→마이크 설정→허용/장치 확인→테스트→정상 발화 | `UNKNOWN→REQUESTING_PERMISSION→READY→TESTING→TEST_SUCCESS`; 성공은 자동 READY 복귀 없이 유지 |
| QP-02 | 권한 거부·장치 없음·필수 API 미지원·그 외 초기화 예외를 각각 주입 | `DENIED`·`NO_DEVICE`·`UNSUPPORTED`·`ERROR` 분리, 재요청 루프·가짜 성공 없음, click 시작 항상 가능 |
| QP-03 | READY/TEST_SUCCESS에서 장치 변경·재테스트·게임 시작 | 실제 변경에서 상태/수치 초기화, 재테스트는 TESTING, 시작은 선택 mode로 진입, 두 mic stream 없음 |
| QP-04 | dialogue·incantation·battle에서 PTT를 pointer와 T/Space/Enter로 hold | 버튼 내부 live fill이 실제 입력에 반응하고 release 뒤 사라짐. 별도 대형 meter·두 번째 `getUserMedia`·중복 턴 없음 |
| QP-05 | 실제 typed 실패 7종을 턴·노드에 걸쳐 1~5회 주입 | 각 실패에서 전역 총계 +1. 1~4회는 첫 실패 재시도/두 번째 현재 턴 click, 5번째는 차수보다 우선해 즉시 전체 click |
| QP-06 | 성공·node 이동·수동 click·cancelled·UNSUPPORTED·LLM fallback·battle dBFS 범위 실패·DEV preview와 save resume/new/restart 검사 | 제외 사건은 총계 불변. 성공/node/manual click도 감소 없음. resume 보존, new/ending restart만 0. transient attempt map은 new/resume/restart/prune에서 정리 |
| QS-01 | 명확한 `ko-KR` intent 발화 | transcript 화면 노출 없이 예상 intent 판정 |
| QS-02 | `(T)`가 표시된 PTT 홀드→발화→release | 같은 버튼이 `듣는 중… 놓으면 전송`→`목소리 전달 중…`으로 바뀌고 별도 interim/final 영역 없음 |
| QS-03 | 무음/오류 2회 | 해당 턴 클릭 선택지 |
| QS-04 | 누적 STT 실패 5회 | `inputMode=click`, 완주 가능 |
| QS-05 | 처리 중 취소·노드 이동 후 늦은 결과 | 이전 결과 무시, 상태 변경 없음 |
| QS-06 | 같은 기준 WAV·실제 발화를 Realtime/GPT 파일/GPT live 모델로 각각 실행 | 버튼 release에서 녹음 종료, 게임 UI의 transcript 원문 0건, 정확도·p50/p95 지연은 debug/Network에서 기록, 한 턴에는 선택 모델 1회만 호출. 로컬 Whisper 게임 요청 0건 |
| QS-07 | STT·대화 LLM·battle Worker 경로에서 HTML 응답 주입 | 원문 `Unexpected token '<'` 대신 서비스별 한국어 Worker 연결 오류, 해당 턴 클릭·로컬 폴백 유지 |
| QS-08 | 일반 URL과 `?debug=1`에서 동일 발화를 각각 실행하고 debug에서 세 음성 모델을 번갈아 선택 | 일반 URL은 `gpt-realtime-2.1-mini` `/voice/realtime` 1회·모델/transcript UI 0건. debug는 선택 모델 하나만 호출하고 모델·전사 결과·왕복/Worker 지연, Realtime 계열 첫 delta 지연을 표시. live와 2.1-mini 요청은 24kHz PCM append·commit |

### 3.1 Canonical local DEV voice recovery

로컬 실제 음성 QA는 APP `http://127.0.0.1:5173`, Worker `http://127.0.0.1:8787` 조합만 canonical configuration으로 사용한다. 포트가 다른 Vite만 실행한 상태를 actual voice QA로 판정하지 않는다.

1. `.env.local`이 Git ignore 대상인지 `git check-ignore .env.local`로 확인한다.
2. 사용자가 보유한 `OPENAI_API_KEY`를 `.env.local`에 로컬로만 설정한다. 실제 값은 Git, 문서, terminal 출력, screenshot, 완료 보고에 기록하지 않는다.
3. Worker terminal에서 `npm run dev:m3:worker`를 실행한다.
4. APP terminal에서 `npm run dev:m3:ui`를 실행한다.
5. Origin `http://127.0.0.1:5173`을 포함한 `GET http://127.0.0.1:8787/health`가 HTTP 200인지 확인한다. `openaiConfigured=true`, `realtimeVoiceModel=gpt-realtime-2.1-mini`만 기록하고 secret 값은 기록하지 않는다.
6. 최신 안정 Chrome에서 아래 세 실제 발화를 각각 1회 수행한다.

| Surface | 실제 플레이 진입 | 필수 증거 |
|---|---|---|
| dialogue | `?debug=1`의 `실제 플레이`에서 voice 시작 후 N1 도달 | 녹음·live fill·release·`POST /voice/realtime` 200·transcript/판정·BGM 복구 |
| incantation | 같은 실제 플레이에서 N5 주문 게이트 도달 | 같은 capture stream·release·`POST /voice/realtime` 200·주문 판정·click fallback 유지 |
| battle | 같은 실제 플레이에서 battle 첫 행동 도달 | live fill·release·`POST /voice/realtime` 200·battle 판정·BGM duck/recover |

`?debug=1&scene=...` 주소는 visual/static scene preview이며 실제 PTT capture 버튼을 제공하지 않는다. actual voice QA는 반드시 `?debug=1`의 `실제 플레이`에서 TITLE microphone 연결과 voice 시작을 거쳐 해당 surface까지 진행한다.

DevTools Network에서 발화당 `/voice/realtime` 1회, 응답 200, 예상 모델을 확인한다. Console·Network·화면에 API key, raw upstream body, 사용자별 local path가 없어야 한다. 자동 failure injection과 unit test는 이 actual Worker QA를 대체하지 않는다.

## 4. LLM과 오프라인

| ID | 조건/절차 | 기대 결과 |
|---|---|---|
| QL-01 | 로컬 미매칭 자유 발화, 정상 응답 | 4초 안 판정, 허용 intent/flag·클램프된 delta |
| QL-02 | 첫 응답 지연/timeout, 재시도 성공 | 재시도 1회만, 턴 1회만 반영 |
| QL-03 | HTTP 오류·잘못된 JSON | 고정 폴백 + 중립 판정 |
| QL-04 | 3연속 LLM 실패 | 로컬 모드 강등, 이후 네트워크 의존 없이 진행 |
| QL-05 | 완전 오프라인 | 모든 노드의 `offlineReply`/`fallbackReplies`로 ending 도달 |

## 5. 클릭 모드

| ID | 절차 | 기대 결과 |
|---|---|---|
| QC-01 | TITLE에서 마이크 설정 없이 클릭 모드로 시작 | 모든 dialogue·변신·battle에 클릭 경로가 있고 ending 도달 |
| QC-02 | 음성 중간에 클릭 전환 | 현재 턴 중복 없이 다음 입력부터 클릭 |
| QC-03 | 클릭에서 음성 복귀 | 지원·권한 확인 후만 복귀, 상태 보존 |

## 6. 변신 게이트

| ID | 절차 | 기대 결과 |
|---|---|---|
| QT-01 | 모든 키워드 낭독 | 완창, `perfect_transform`, 초기 momentum 60 |
| QT-02 | `minMatch`만 충족 | 표준 변신, 초기 momentum 50 |
| QT-03 | 최대 횟수까지 미달 | `failLines`, 무페널티 자동 구제, momentum 50 |
| QT-04 | 클릭/마이크 불능 | “주문 외우기”, 표준 변신, 완창 flag 없음 |

## 7. 전투

| ID | 절차 | 기대 결과 |
|---|---|---|
| QB-01 | debug로 최종 momentum 80 이상 | S, +10 affinity, `battle_S`만 설정 |
| QB-02 | 최종 momentum 55~79 | A, +5 affinity, `battle_A`만 설정 |
| QB-03 | 최종 momentum 20~54 | B, +0 affinity, `battle_B`만 설정 |
| QB-04 | 주문 불발·자유 대응 실패 반복 | 하한 20, 최대 9턴 뒤 B로 승리·수렴 |
| QB-05 | battle 주문을 보정 범위보다 작게 발화 | 첫 실패는 같은 턴 무료 재시도, 두 번째는 `+0`으로 턴 소비 |
| QB-06 | battle 주문을 보정 범위보다 크게 발화 | 첫 실패는 같은 턴 무료 재시도, 두 번째는 `+0`으로 턴 소비 |
| QB-05 | momentum 65 경계 통과/하락 | `enemyState`가 현재 momentum에서 일관되게 파생 |
| QB-06 | 페이즈 임계와 턴 상한 동시 충족 | 한 번만 전환, 페이즈 skip 없음 |

## 8. 엔딩

| ID | 상태 준비 | 기대 결과 |
|---|---|---|
| QE-01 | `affinity >= 70`, `promise` | GOOD |
| QE-02 | `40 <= affinity < 70` 또는 GOOD 조건 미충족 | NORMAL |
| QE-03 | `affinity < 40` | BAD, 전투 승리 후 관계 결말로 표현 |
| QE-04 | HIDDEN 포함 빌드에서 perfect + battle S | HIDDEN이 최우선으로 선택 |

HIDDEN 컷 빌드에서는 QE-04를 `N/A(승인된 MVP 컷)`로 기록하고 GOOD/NORMAL/BAD를 유지한다.

## 9. 저장·복구

| ID | 절차 | 기대 결과 |
|---|---|---|
| QR-01 | 노드 이동 직후 새로고침 | 동일 node/state/flags 복구 |
| QR-02 | 저장 JSON 수동 손상 | 오류 폭발 없이 손상 안내·새 게임 |
| QR-03 | 과거 `schemaVersion` 주입 | 승인된 마이그레이션 또는 안전 초기화 |
| QR-04 | ending 뒤 새 게임 | 이전 상태·플래그 제거 |

## 10. GitHub Pages·Workers

| ID | 절차 | 기대 결과 |
|---|---|---|
| QG-01 | Pages 하위 경로에서 직접 진입·새로고침 | JS/CSS/JSON/에셋 404 없음 |
| QG-02 | HTTPS Pages에서 마이크 요청 | 보안 컨텍스트 충족, 권한 흐름 정상 |
| QG-03 | 허용 Pages Origin→Workers | 정상 응답 |
| QG-04 | 임의 Origin/Origin 없음→Workers | 거부, CORS 허용 헤더 없음 |
| QG-05 | 새 main 배포 | CI check/test/build 후만 production 갱신 |
| QG-06 | 공개 QA·M6 production에서 일반 음성 요청 검사 | DEC-066의 `/voice/realtime`만 턴당 1회 호출. `gpt-transcribe`·`gpt-live-transcribe`·Gemini 요청 0건, 비교 Lab chunk는 QA bundle에 없음 |
| QG-07 | 공개 QA 대화·전투 음성 판정 검사 | `/voice/realtime`이 `gpt-realtime-2.1-mini`로 transcript+대화/전투 판정을 200 반환. `/health`의 `realtimeVoiceModel=gpt-realtime-2.1-mini`. 실패 때 클릭·로컬 폴백 유지 |
| QG-08 | 공개 QA `?debug=1`에서 음성 selector를 각 모델로 변경해 한 번씩 발화 | `gpt-realtime-2.1-mini`/`gpt-transcribe`/`gpt-live-transcribe`가 한 번에 하나씩 200, 전사·지연 표시. 일반 URL 재진입 시 selector·결과 패널 없음. Worker의 임의 Realtime 모델·비허용 Origin 요청은 거부하고 지역 403이 없음 |

## 11. 현장 시연 체크리스트

### 전날

- [ ] 검증된 Pages URL과 Workers health 확인
- [ ] 최종 선택 STT 공급자와 해당 환경 LLM의 일일 쿼터·결제/무료 한도·예비 키 상태 확인
- [ ] 현장용 Chrome 프로필, 마이크 권한 초기화 방법 확인
- [ ] 정상·클릭·오프라인 경로 각각 완주
- [ ] 충전기, 유선/무선 마이크, 네트워크 대안 준비
- [ ] 검증된 빌드 식별자와 영상 오프라인 사본 저장

### 직전

- [ ] 다른 마이크 앱 종료, 입력 장치·레벨 확인
- [ ] Chrome에서 Pages 탭만 열고 캐시/버전 확인
- [ ] TITLE 음성/클릭 시작과 TEST_SUCCESS 유지 상태를 각각 확인
- [ ] Workers·최종 선택 STT 공급자·해당 환경 LLM 쿼터 확인
- [ ] `?debug=1` 비상 탭과 일반 시연 탭 준비

### 시연 순서

1. PTT 버튼 홀드·release와 transcript 비노출 확인.
2. 자유 발화→AI 반응과 affinity 변화.
3. 주문 낭독→변신.
4. 자유 대응 또는 spell→momentum 변화.
5. 엔딩 도달.

## 12. 녹화 영상 체크리스트

- [ ] TITLE에서 마이크 선택 기능과 click 시작 가능성이 보이고, 본편 PTT 버튼 내부 live meter·청취·판정 상태가 보임
- [ ] 자유 발화와 LLM 반응 최소 1회
- [ ] 클릭/오프라인 폴백이 있다는 짧은 증거
- [ ] 변신 주문과 완창 또는 성공 연출
- [ ] 3페이즈 전투 핵심과 S/A/B 중 한 등급
- [ ] GOOD/NORMAL/BAD 중 한 엔딩
- [ ] 음량 균형, 대화창 가독성, 개인정보·키·콘솔 비밀 미노출
- [ ] 영상 파일·코덱·길이가 제출 규정과 일치
- [ ] 영상에 사용한 빌드 식별자 기록

## 13. 비상 시연 절차

1. 마이크 실패: 클릭 모드로 즉시 전환. 권한 팝업 반복 금지.
2. LLM 지연: 4초 폴백을 보여준 뒤 로컬 모드로 계속.
3. 네트워크 실패: DevTools 조작 없이 준비된 로컬/클릭 경로로 완주.
4. Pages 장애: 마지막 검증된 로컬 production build 사용.
5. 전체 라이브 실패: 사전 녹화 영상 재생 후 검증된 제출 링크 제시.

비상 절차에서도 키 입력, 코드 수정, 즉석 배포를 하지 않는다.

## 14. M1 Git 저장소 초기 게시

| ID | 절차 | 기대 결과 |
|---|---|---|
| QV-01 | `git`, `gh`, `gh auth status` 확인 | 도구와 인증 계정 확인. 토큰 값은 출력·기록하지 않음 |
| QV-02 | `.gitignore`, staged 파일, staged diff, 비밀 패턴 확인 | dependency·build·로컬 비밀·관련 없는 파일이 commit에서 제외됨 |
| QV-03 | M1 자동·수동 검증 뒤 초기 commit 생성 | 기본 브랜치 `main`, 의도적인 commit 메시지, 검증된 M1만 포함 |
| QV-04 | private `2klips/the-judge-became-a-magical-girl` 생성→`origin` 연결→최초 push | 기존 저장소·remote를 덮어쓰지 않고 upstream 설정 성공 |
| QV-05 | push 후 remote·branch·HEAD·working tree 확인 | 로컬·원격 HEAD 일치, `main` upstream 정상, 남은 변경은 없거나 명시됨 |

## 15. M5 최종 QA 실행 가이드

### 15.1 판정 단계

M5 QA는 두 판정을 분리한다.

1. **기능 게이트**: 외부 누락 이미지·컷은 검은 presentation, 누락 BGM은 무음인 상태로 본편 기능·완주·회귀를 판정한다.
2. **에셋·제출 게이트**: 외부 실파일 도착 뒤 시각·청각·라이선스·성능을 재검수한다. 이 단계 전에는 `approved`와 제출 가능 판정을 내리지 않는다.

기능 게이트 통과는 누락 에셋을 완료 처리하지 않는다. [ASSET_MANIFEST.md](../assets/ASSET_MANIFEST.md)의 `missing` 상태와 작업자 요청을 유지한다.

### 15.2 실행 전 기록

- [ ] branch·commit hash·build 시각.
- [ ] Windows·Chrome 버전.
- [ ] 마이크 장치·권한 상태.
- [ ] 온라인/오프라인 네트워크 조건.
- [ ] 음성 모델과 Worker 환경.
- [ ] `assets/runtime/` 파일 수·총 용량과 `dist/assets/` 게시 결과.
- [ ] 테스트에 사용한 save 초기화 여부.

### 15.3 자동 게이트

순서대로 실행한다.

```powershell
npm run check
npm test
npm run build
```

추가 확인:

- [ ] scenario node·character·flag·asset 양방향 참조 오류 0.
- [ ] 필수 에셋 계약 파일명과 실제 파일명의 대소문자 일치.
- [ ] 배경 1920×1080 WebP ≤500KB, 캐릭터 1200×2000 투명 PNG ≤800KB, 컷 1920×1080 WebP ≤700KB.
- [ ] BGM MP3 128kbps·계약 길이·≤3MB.
- [ ] 전체 runtime 에셋 30MB 이하.
- [ ] production client·문서·로그 비밀 패턴 0.
- [ ] `git diff --check` 오류 0.

누락 실파일은 기능 게이트에서 자동 검사 `N/A — DEC-040 black/silent fallback`으로 기록한다. 존재하는 파일의 검사 실패를 `N/A`로 바꾸지 않는다.

### 15.4 실파일·검은 presentation·무음 게이트

- [ ] 주노 5표정은 실제 투명 PNG로 표시되고 배경·도윤과 합성된다.
- [ ] `gray_wraith.normal` 실파일이 표시되고, `gray_wraith.weakened` 누락 시 normal+CSS 균열 파생이 표시된다. normal까지 로드 실패하면 검은 placeholder여도 battle 입력과 momentum 게이지가 작동한다.
- [ ] 변신 컷 2장 누락 상태에서 검은 컷 영역 뒤로 주문 결과·다음 진행 버튼이 보인다.
- [ ] BGM 5종 실파일이 계약 장면에서 재생되고, 파일 로드 실패 시 폴백곡 또는 무음으로 예외 없이 진행한다.
- [ ] BGM 슬라이더가 즉시 0~100 볼륨을 반영하고, 음소거→해제 시 이전 볼륨을 복원하며, 새로고침 뒤 두 설정이 유지된다.
- [ ] 경로별 `[ASSET_HANDOFF]` 경고는 한 번만 기록된다.
- [ ] 누락 파일을 빈 파일로 만들거나 manifest `ready`로 승격하지 않는다.
- [ ] 외부 파일 도착 뒤 같은 논리 ID 경로에 배치하면 코드 변경 없이 실파일로 교체된다.

### 15.5 22개 장면 프리뷰

`?debug=1` 선택기와 `?debug=1&scene=<장면ID>` 직접 진입을 사용한다.

- [ ] 22개 프리셋 모두 예외 없이 진입.
- [ ] 고유 배경 16장 모두 HTTP 200, 1920×1080 렌더.
- [ ] N1 주노 미노출.
- [ ] N0 첫 두 대사는 도윤 미표시, 세 번째부터 지정 표정 표시.
- [ ] 도윤은 데스크톱·모바일 모두 화면 오른쪽에서 확대된 상반신 중심으로 표시된다.
- [ ] N3~N5 주노·망령 동시 영역.
- [ ] N4-A/B/C 표정과 N5 도입 연속성.
- [ ] battle p1/p2/p3 질문/p3 주문 배경·상태 전환.
- [ ] GOOD 회복 책상→밝은 복도→검은빛 복도 전환.
- [ ] NORMAL/BAD 전용 배경·주노 표정 구분.
- [ ] 같은 배경 ID의 연속 대사는 애니메이션 없음, 다른 ID 전환만 420ms crossfade.
- [ ] 모든 대화창은 화면 하단 중앙 고정이고, 주노 yellow·도윤 rose·회색 망령 violet·익명 voice amber·내레이션 중립 accent가 구분된다.
- [ ] 내레이션 문장에 이름표·`내레이션`·`나레이션` 표시가 없고 본문은 중복 없는 `(…)`로 표시된다.
- [ ] 일반 공개 QA·production 음성 UI에 모델 고정 안내, `STT`, transcript 원문, 별도 음성 상태 영역이 없고 `(T)`가 포함된 `누르고 말하기` 계열 PTT 버튼만 표시된다. `?debug=1`에서만 음성 모델 selector·전사 결과·지연 패널이 보인다.
- [ ] 진행 버튼 문구에 남은 초가 표시되지 않고 렌더 후 1.5초 전 disabled, 1.5초 뒤 같은 문구로 enabled다.
- [ ] 화면 상단에는 진행 상태·QA 배너·debug state 패널이 없고 `?debug=1`에서만 우측 상단 장면/STT 선택기와 STT 측정 결과가 보인다.
- [ ] 직접 프리뷰 전후 게임 save/FSM 관련 `localStorage`·`sessionStorage` 변경 0. BGM HUD를 조작한 경우 전용 BGM preference 키 변경만 허용한다.
- [ ] console error 0. 누락 에셋 경고만 허용.

### 15.6 본편 완주 매트릭스

최종 기능 게이트는 아래 9회를 실행한다.

| 입력 경로 | GOOD | NORMAL | BAD |
|---|---|---|---|
| TITLE에서 마이크 없이 click 시작 | [ ] | [ ] | [ ] |
| 실제 음성 | [ ] | [ ] | [ ] |
| DevTools Offline + 로컬 폴백 | [ ] | [ ] | [ ] |

각 실행에서 확인한다.

- [ ] 타이틀→N0~N5→battle p1~p3→수렴→ending 순서.
- [ ] 같은 입력이 상태·턴에 한 번만 반영.
- [ ] 변신 성공·표준·자동 구제 중 계획한 결과 재현.
- [ ] battle S/A/B 중 계획한 등급과 상호 배타 플래그.
- [ ] affinity·momentum clamp 유지.
- [ ] ending 마지막 페이지에서만 `처음부터` 표시.
- [ ] ending production 화면에 호감도·플래그 등 내부 상태 요약이 표시되지 않는다.
- [ ] ending 뒤 새 게임에서 이전 state·flag 제거.
- [ ] console 미처리 exception 0.

실제 음성 3회에서는 debug transcript 주입으로 대체하지 않는다. debug 주입은 원인 격리용 별도 증거로만 사용한다.

### 15.7 실에셋 도착 후 재검수

- [ ] 주노 5표정 오니언 스킨에서 몸·의상·좌표 이동 없음.
- [ ] 망령 2상태가 같은 개체·구도.
- [ ] 도윤·주노·망령의 발 위치·원근·조명 방향 자연스러움.
- [ ] 변신 완료 컷과 battle 도윤 의상·실루엣 일치.
- [ ] TITLE clean 교체본에 baked 글자·로고 없음.
- [ ] BGM loop 3회 반복에서 클릭·무음·박자 점프 없음.
- [ ] PTT duck·복귀, 장면 crossfade, 변신 one-shot 중복 없음.
- [ ] BGM HUD가 데스크톱·390×844에서 대화창·장면/debug selector를 가리지 않고, 버튼·슬라이더 키보드 조작과 접근성 이름이 동작한다.
- [ ] 노트북 스피커·헤드폰 모두 대사 명료.
- [ ] 생성 도구·작업 ID·생성일·후처리·라이선스 증빙 연결.

### 15.8 성능·배포 전 조건

- [ ] public Pages의 목표 Chrome에서 controlled cold-load 첫 화면 3초 이내.
- [ ] title 핵심 에셋만 preload, 나머지 lazy load.
- [ ] Pages base 경로에서 JS/CSS/JSON/에셋 404 없음.
- [ ] production bundle에 debug 상태 변경 기능과 API 키 없음.
- [ ] 새로고침·직접 URL 진입·오프라인 폴백 정상.

#### AR-10 GitHub Pages cold-load 측정 체크리스트

측정 URL은 실제 공개 주소 `https://2klips.github.io/the-judge-became-a-magical-girl/`이며 localhost·preview server·warm navigation 결과로 AR-10을 닫지 않는다.

1. **환경 고정**
   - Google Chrome stable 버전, Windows 버전, CPU/RAM, 유선/무선과 실제 회선명을 기록한다.
   - viewport는 우선 1920×1080, zoom 100%, 확장 기능 없는 새 Incognito window를 사용한다.
   - DevTools Network와 Performance를 열고 Preserve log는 끈다. service worker 유무와 측정 시각·commit SHA를 기록한다.
   - 공식 판정은 목표 현장 회선의 `No throttling`으로 수행한다. 필요하면 Fast 4G는 병목 진단용으로 별도 기록하되 공식 수치와 섞지 않는다.
2. **cold cache 정책**
   - 각 공식 run 전에 DevTools `Clear site data`로 cache storage·HTTP cache·local/session storage를 지우고 Incognito tab을 닫는다.
   - 새 Incognito tab에서 URL을 직접 입력해 navigation한다. DevTools `Disable cache`를 켠 상태로 측정하며, 앞 run의 memory/disk cache를 재사용하지 않는다.
   - 권한 prompt·DevTools 시작 지연·다른 foreground download가 끼면 환경 이상으로 표시하고 해당 run을 버리지 말고 원인과 함께 남긴다. 재측정은 별도 run 번호로 추가한다.
3. **실행 횟수**
   - 공식 cold run을 연속 5회 수행한다. 선택적으로 warm reload 1회를 진단값으로 추가하되 PASS 계산에서 제외한다.
   - 결과를 고르거나 가장 빠른 값만 보고하지 않는다. 5회 전부와 실패 run trace를 보존한다.
4. **run별 기록**
   - `navigationStart → first-screen ready` ms: `bg_title`, 두 줄 TITLE, Game Start·Continue·Settings, compact microphone shell, BGM HUD가 모두 보이고 Game Start가 입력 가능한 최초 시점.
   - FCP, LCP, DOMContentLoaded, load event, total transferred bytes/request count, cache hit 여부.
   - `bg_title`, MaruBuri, Pretendard, entry JS/CSS의 status·duration과 required asset 404/failed count.
   - first screen blank/FOIT 여부, console error/new warning 수, screenshot과 Performance trace 파일 경로.
5. **판정**
   - PASS: 공식 cold run 5/5에서 first-screen ready가 `≤ 3,000ms`, required asset 실패 0, console error 0, font 때문에 TITLE이 가려지는 blank/FOIT 없음.
   - FAIL: 한 run이라도 `> 3,000ms`이거나 required first-screen asset 실패/blank TITLE이 발생. 측정 환경 이상이면 원인을 명시하고 5회 세트를 처음부터 다시 수행하며, 불리한 run을 임의 제외하지 않는다.
   - AR-10은 위 표·trace·commit SHA가 기록된 뒤에만 CLOSED로 바꾼다. 현재는 `OPEN·실측 대기`다.

### 15.9 증거 템플릿

| 항목 | 기록 |
|---|---|
| QA ID·경로·엔딩 |  |
| commit·build |  |
| 환경 |  |
| 예상 결과 |  |
| 실제 결과 |  |
| PASS/FAIL/N/A |  |
| 콘솔·네트워크 |  |
| 스크린샷·영상 경로 |  |
| 재현 절차·담당 |  |

### 15.10 판정 규칙

- 자동 3명령, black/silent fallback, 22개 프리셋, 9회 완주 중 하나라도 실패하면 M5 기능 게이트 FAIL.
- 기능 게이트 PASS 뒤에도 외부 필수 에셋·라이선스가 남으면 `M5 기능 PASS / 에셋·제출 게이트 대기`로 보고한다.
- 실에셋 재검수·성능·라이선스까지 통과한 뒤에만 `M5 최종 PASS`와 M6 제출 준비 가능으로 보고한다.

## 16. M5 임시 QA Pages 작업자 가이드

대상 URL은 `https://2klips.github.io/the-judge-became-a-magical-girl/`이다. QA 식별자는 화면을 가리지 않고 `<html data-qa-preview="true" data-qa-commit="xxxxxxx">`에 기록한다. DevTools Elements 또는 `document.documentElement.dataset`으로 확인한다. QA Worker는 `https://nhn-voice-m5-qa-worker.the-judge-became-a-magical-girl.workers.dev`다.

### 16.1 기본 확인

- [ ] `document.documentElement.dataset.qaPreview === "true"`이고 `dataset.qaCommit` 7자가 전달받은 QA commit과 같다.
- [ ] 게임 내 공급자 표기는 없고 일반 URL의 Network 요청은 `/voice/realtime`만 사용한다.
- [ ] Network에서 음성 요청이 QA Worker의 `/voice/realtime`로 턴당 1회 전송되고 `/transcribe/openai`·`/transcribe/gemini` 요청은 0회다.
- [ ] 타이틀, JS, CSS, scenario JSON, 첫 배경이 404 없이 표시된다.
- [ ] `TITLE → 마이크 없이 click 시작`으로 대사·선택지·변신 구제·전투·엔딩까지 진행된다.
- [ ] 새로고침 뒤 저장 이어하기가 동작한다.
- [ ] 390×844와 데스크톱에서 가로 스크롤·가려진 핵심 버튼이 없다.
- [ ] DevTools Console에 Vite 오류 overlay, 처리되지 않은 예외, asset MIME 오류가 없다.

### 16.2 장면별 에셋 확인

`?debug=1`로 장면 선택기를 열거나 `?debug=1&scene=<장면ID>`로 직접 확인한다. 기준은 [장면별 에셋 매핑 명세](../assets/SCENE_ASSET_MAPPING.md)다.

- [ ] 22개 프리셋의 배경·인물·표정·컷·BGM 표기가 명세와 같다.
- [ ] 전달된 배경 16장, 도윤 runtime 13장, 주노 runtime 5장, 초반 모니터 CUT 2장은 깨지지 않고 장면 매핑대로 표시된다.
- [ ] N0 prompt→N1 suspicious Doyun→Juno emergence CUT→N2 live에서 baked visible prompt 중복 0, CUT live actor 0, PTT/click 접근성이 유지된다.
- [ ] Production click: `n2_juno_followup → n3_wraith_choice` natural edge에서 actor 0의 작은 omen caption이 정확히 1회 표시되고, 사용자가 caption 전용 `계속 ›`를 누른 뒤 N3로 이어진다. 자동 timer 진행은 0이다.
- [ ] Production actual voice: 같은 natural edge에서 omen이 정확히 1회이며 `/voice/realtime`·BGM 동작을 바꾸지 않는다.
- [ ] natural edge마다 synthesized WebAudio `wraith_omen` 저역 cue가 1회만 들리고, 40ms 중복 차단·PTT suppression·AudioContext fail-soft가 유지된다. N3 Resume/debug/re-render에서는 cue 0회다.
- [ ] N3 저장 Resume, `?debug=1&scene=n3-wraith`, resize/focus ordinary re-render에서는 omen 표시 0회다.
- [ ] omen은 VN dialogue shell/modal을 만들지 않고 center stage를 크게 가리지 않으며 1920×1080·1600×900·1366×768에서 scroll/clipping 0이다.
- [ ] `prefers-reduced-motion: reduce`에서는 haze flicker/scale 없이 짧은 opacity entrance만 유지하고, 동일한 명시적 `계속 ›` 입력을 기다린다.
- [ ] 도윤은 오른쪽 확대·상반신 구도이며 주노와 대화 UI를 가리지 않는다.
- [ ] 전달된 `gray_wraith.normal`은 실파일, 미전달 `gray_wraith.weakened`는 normal+CSS 파생으로 보인다. normal 로드 실패와 미전달 변신 컷은 검은 placeholder여도 대사·버튼·게이지가 보인다.
- [ ] 전달된 BGM 5곡이 계약 장면에 연결되고, 로드 실패 시 폴백곡 또는 무음으로 진행을 막지 않는다.
- [ ] TITLE은 사용자 제공 OpenAI 제출본을 표시하고 runtime/public-visible NHN/NH-IN/HACKATHON branding은 0이다. exact 생성 모델·작업 ID는 `UNKNOWN`, 사람 시각 승인 전 `HUMAN_RECHECK`다.

### 16.3 의도된 제한과 실패 보고

- `[확정, DEC-066]` 일반 URL의 실제 발화는 `/voice/realtime`의 `gpt-realtime-2.1-mini`로 전사+판정하고 전사문 원문을 표시하지 않는다. `?debug=1`에서만 `gpt-realtime-2.1-mini`/`gpt-transcribe`/`gpt-live-transcribe` 단일 선택과 전사·지연 표시를 허용한다.
- 대화·전투 일반 음성은 한 요청에서 판정한다. Network에서 `/voice/realtime` 응답이 200이고 Worker `/health`의 `realtimeVoiceModel`이 `gpt-realtime-2.1-mini`인지 확인한다. debug 비교 모델은 기존 `/judge/dialogue`, `/judge/battle` 순차 경로를 사용할 수 있다.
- Worker·OpenAI 장애 또는 쿼터 소진 때도 현재 턴 클릭 선택지와 누적 실패 로컬 강등으로 ending까지 진행돼야 한다.
- QA Worker 허용 Origin은 `https://2klips.github.io` 하나다. 임의 Origin·Origin 없음·`/transcribe/gemini`는 거부가 정상이다.
- `stt-lab.html`은 배포 대상이 아니며 404가 정상이다.
- `noindex,nofollow`는 검색 노출 방지 요청일 뿐 접근 통제가 아니다. URL과 화면은 공개로 취급한다.
- 결함 보고에는 commit, URL query, viewport, 재현 단계, 기대/실제 결과, Console/Network 오류, 스크린샷을 포함한다.

### 16.4 임시 QA 판정

- `npm run check`, `npm test`, `npm run build:qa`, QA Worker dry-run/deploy, QG-03·QG-04·QG-06·QG-07, Pages workflow, 배포 후 데스크톱·모바일 실제 발화와 OpenAI 대화·전투 smoke가 모두 PASS해야 링크를 공개 QA 가능으로 표시한다.
- 임시 QA PASS는 M5 최종 PASS 또는 M6 production PASS가 아니다.

## 17. 2026-08-23 Wraith Omen + Transform Face Continuity 재검수

### 17.1 범위·상태

- implementation 시작 기준은 `4405277550dcdea522b00d7d2922d901d250d09b`, asset pre-edit comparison baseline은 `39f4370ab731377b77f3898f48496990961b81cc`다.
- direct-wish progress 위치, natural-edge omen caption/WebAudio cue, employee-ID alpha cleanup, HQ-05 Option A 공개 얼굴 4종만 범위다.
- Story/FSM/save/schema/relationship/flags, Voice/PTT/BGM, Battle composition, Ending/Post-credit는 비범위이며 변경하지 않는다.

### 17.2 실제 브라우저 체크

- [x] `.direct-wish-prompt-cut` 전용 CTA가 3개 PC viewport에서 중앙 정렬·bottom clamp를 유지하고 다른 CTA selector를 바꾸지 않는다.
- [x] click natural `n2_juno_followup → n3_wraith_choice` edge에서 actor 0의 작은 caption과 synthesized cue가 각각 1회다.
- [x] N3 Resume·debug direct entry·ordinary re-render에서 omen replay 0이다.
- [x] employee-ID sprite는 3개 PC viewport에서 magenta fringe 없이 no-scroll로 합성된다.
- [x] Battle p1 `magical_defend`, p2 `magical_attack`, N8 `magical_finish`는 1920×1080·1600×900·1366×768에서 scroll·offscreen·actor overlap 0, console error 0이다.
- [x] production/debug OFF 1920×1080 click playthrough가 TITLE → direct-wish → N2 → omen → N3 → N5 employee ID/Transform → Battle p1/p2 → N7 → N8 → GOOD을 통과했다. omen caption 1·actor 0·VN shell 0, N3 도착 뒤 caption 0, 최종 console error 0이다.
- [ ] omen actual 청감·reduced-motion 육안과 HQ-03·HQ-05·HQ-07 최종 미술 판정은 사용자 `HUMAN_RECHECK`다.
- [ ] `doyun.magical`은 현재 runtime scene mapping이 없는 fallback이므로 final PNG는 확인했지만 production 합성 사람 검수는 mapping이 생길 때 수행한다.

### 17.3 변신 얼굴 판정 규칙

- 네 target 원본은 body/costume/pose/입 모양·행동 긴장도의 authority다. `doyun.magical_pose`는 눈·얼굴 identity reference로만 사용하며 바이트를 변경하지 않는다.
- fallback/defend/attack/finish는 각각 cautious/overwhelmed, determined/strained, focused, forceful로 읽혀야 하며 같은 표정으로 수렴하면 FAIL이다.
- 자동 verifier의 mask 밖 raw pixel·alpha 변경 0과 source/runtime 동일 바이트는 기술 PASS다. 사람 actual game 합성 승인 전 상태는 `ready · HUMAN_RECHECK`, `approved`가 아니다.

### 17.4 final gate

Task 6 문서 reconciliation 뒤 최종 HEAD에서 아래 complete gate를 다시 실행한다.

| 검증 | 결과 | 근거 |
|---|---|---|
| early-scene asset pipeline | PASS | 2 tests |
| face verifier | PASS | baseline `39f4370`, 4 targets, mask 밖 raw pixel·alpha 변경 0, `magical_pose` 불변 |
| `npm run check` | PASS | `tsc --noEmit`, exit 0 |
| `npm test` | PASS | 61 files·437 tests |
| `npm run build` | PASS | Vite 8.2.0, 158 modules; 기존 Transformers 516.22kB warning만 유지 |
| `npm run build:qa` | PASS | Vite 8.2.0, 128 modules |
| `git diff --check` | PASS | 문서 reconciliation 공백 오류 0 |

## 18. 2026-08-23 Human Scene Composition Polish 재검수

- [x] natural `n2_juno_followup → n3_wraith_choice` edge의 omen은 1.7초 대기 뒤에도 유지되며 caption 전용 `계속 ›` 1회 입력 후 N3로 진행한다. N3 도착 뒤 omen 0, actor 0 계약과 edge-only 소유권은 유지한다.
- [x] 일반 VN 화자명은 1920×1080 기준 panel 좌상단 33px/25px inset의 고정 slot을 사용하고 copy 시작 영역과 겹치지 않는다.
- [x] actual `n6_first_choice` Wraith는 LEFT enemy lane에서 780×860px 한도로 확대되며 dialogue·Juno·Doyun의 판독 가능한 실루엣을 침범하지 않는다.
- [x] actual Battle은 1920×1080·1600×900·1366×768에서 BGM/HUD, Juno/망령 대화 패널, Juno/command dock bbox 충돌 0, scroll 0이다.
- [x] actual GOOD Ending은 같은 3개 viewport에서 Juno/중앙 card, Juno/Doyun, BGM/card 충돌 0, scroll 0이다.
- [x] actual production play의 browser console error/warning은 0이며 Vite 연결/HMR debug log만 존재한다.
- [ ] Wraith 크기, Battle support 위치, Ending left-low Juno의 최종 미술 판정은 사용자 `HUMAN_RECHECK`다. HQ-10 command deck과 HQ-11 editorial ending 전체 redesign은 `OPEN`을 유지한다.

## 19. 2026-08-23 Battle 1366 Dialogue / Command Safe Gap 재검수

- starting HEAD는 `27d0156981f51265c3e4c8322c3a101a0485cc49`다.
- 섹션 18의 최초 측정 뒤 human QA가 1366×768에서 dialogue bottom 568.3px / command dock top 556.6px, 실제 겹침 11.7px를 발견했다. 이 후속 증거가 해당 viewport의 이전 충돌 0 기록을 대체한다.
- actor·Battle HUD·BGM HUD·command dock bottom anchor는 동결하고 `.battle-dialogue.dialogue-panel`의 desktop bottom clamp 하한만 190px에서 228px로 높였다.

| viewport | Battle dialogue `x/y/w/h` | command dock `x/y/w/h` | 실제 gap | 판정 |
|---|---|---|---:|---|
| 1920×1080 | `72/716/820/119` | `46/862.4/1828/196` | 27.4px | PASS |
| 1600×900 | `72/547/768/119` | `46/686/1508/196` | 20.0px | PASS |
| 1366×768 | `68.3/421/655.7/119` | `41/556.6/1284.1/196` | 16.6px | PASS |

| viewport | BGM HUD `x/y/w/h` | Battle HUD `x/y/w/h` | Wraith `x/y/w/h` | Juno `x/y/w/h` | Doyun `x/y/w/h` |
|---|---|---|---|---|---|
| 1920×1080 | `53.8/16/290/60` | `420/27/1436/64` | `76.8/181.6/670/755` | `1017.6/432/190/334.8` | `1171.2/238/729.6/950` |
| 1600×900 | `44.8/16/290/60` | `352/22.5/1184/64` | `64/150/560/630` | `848/360/176/279` | `976/198/608/792` |
| 1366×768 | `38.2/16/290/60` | `350/19.2/961.4/64` | `54.6/117.4/478.1/537.6` | `724/299.9/150.3/238.1` | `833.3/169/519.1/675.8` |

- 세 viewport 모두 Juno/dialogue·Juno/command dock·BGM/Battle HUD overlap 0, document scroll은 viewport와 동일하다.
- 투명 여백을 포함한 Wraith/Doyun actor canvas bbox는 일부 UI 또는 actor bbox와 교차하지만, production screenshot에서 face·staff·Wraith core/head 가림은 0이다. 승인된 actor composition은 이동하지 않았다.
- focused Battle 진입 이후 console error/warning 0이다. 동일 탭의 이전 Post-credit 순회에서 발생한 기존 `ending.black_magical_girl` missing-asset warning 1건은 이 변경과 무관하다.
- focused 결과는 사용자 `HUMAN_RECHECK`; HQ-10 전체 Battle redesign과 HQ-11 Ending redesign은 `OPEN`이다.

| 검증 | 결과 |
|---|---|
| focused composition | 1 file·20 tests PASS; safe-gap RED→GREEN 포함 |
| `npm run check` | PASS |
| `npm test` | 61 files·438 tests PASS |
| `npm run build` | PASS, 158 modules; 기존 Transformers 516.22kB warning만 유지 |
| `npm run build:qa` | PASS, 128 modules |
| `git diff --check` | PASS |

## 20. 2026-08-23 HQ-10 Battle Final Presentation 재검수

- branch는 `codex/hq10-battle-final-presentation`, starting HEAD는 `afaf54b74798d5194e17c2307523d926a350bf7d`다.
- actor 3종, BGM HUD lane, Battle HUD anchor, dialogue/dock anchor, Story/FSM/save/voice/BGM/battle logic은 변경하지 않았다.
- Battle HUD와 망령 dialogue는 Phase A의 얇은 border·작은 radius·navy-black surface를 공유한다. command deck은 numbered response row, voice primary/secondary PTT, tertiary input-mode utility로 위계를 분리했다.
- 첫 행동 result dock도 같은 surface와 borderless `다음 행동 ›`을 사용한다. 두 번째 주문 기회는 동일 numbered response hierarchy를 재사용한다.
- 1366 입력 모드 전환 때 focused utility가 `.battle-stage`를 77px 내부 스크롤시키던 actual Chrome 회귀를 발견했다. Battle stage를 `overflow: clip`으로 고정해 최종 `scrollTop=0`을 확인했다.

| viewport | Battle dialogue `x/y/w/h` | command deck `x/y/w/h` | 실제 gap | BGM HUD `x/y/w/h` | Battle HUD `x/y/w/h` |
|---|---|---|---:|---|---|
| 1920×1080 | `72/727/820/108` | `46/904.4/1828/154` | 69.4px | `53.8/16/290/60` | `420/27/1436/46` |
| 1600×900 | `72/558/768/108` | `46/728/1508/154` | 62.0px | `44.8/16/290/60` | `352/22.5/1184/46` |
| 1366×768 | `68.3/436/655.7/104` | `41/598.6/1284.1/154` | 58.6px | `38.2/16/290/60` | `350/19.2/961.4/46` |

| viewport | Wraith `x/y/w/h` | Juno `x/y/w/h` | Doyun `x/y/w/h` |
|---|---|---|---|
| 1920×1080 | `76.8/181.6/670/755` | `1017.6/432/190/334.8` | `1171.2/238/729.6/950` |
| 1600×900 | `64/150/560/630` | `848/360/176/279` | `976/198/608/792` |
| 1366×768 | `54.6/117.4/478.1/537.6` | `724/299.9/150.3/238.1` | `833.3/169/519.1/675.8` |

- 세 viewport 모두 BGM/Battle HUD, Juno/dialogue, Juno/command deck bbox overlap은 0이고 document scroll은 viewport와 동일하다. actor 투명 canvas bbox는 일부 UI와 교차하지만 실제 face·staff·Wraith core/head 가림은 0이다.
- 1366 click→voice 전환 뒤 rect와 gap은 유지됐고 `.battle-stage.scrollTop=0`이다. PTT 두 종류, live meter markup, click 전환, keyboard `Tab` focus 2px outline이 유지된다.
- production/debug OFF actual flow는 TITLE → click route → Transform → N6 first choice → Battle first action → result → second opportunity까지 진행했다. Console error/warning은 0이다.
- screenshot은 local QA evidence `qa-evidence/hq10-battle-final-presentation`에 1920 first/result/second, 1600 first, 1366 first/voice 6장으로 보존했다.
- HQ-10은 Codex 단독 `PASS`가 아닌 `HUMAN_RECHECK`다. 사용자 시각 승인 후에만 FREEZE한다.

| 검증 | 결과 |
|---|---|
| focused | 4 files·45 tests PASS; semantic hierarchy·stage focus-scroll·result CTA RED→GREEN 포함 |
| `npm run check` | PASS |
| `npm test` | 62 files·446 tests PASS |
| `npm run build` | PASS, 158 modules; 기존 Transformers 516.22kB warning만 유지 |
| `npm run build:qa` | PASS, 128 modules |
| `git diff --check` | PASS |

## 21. 2026-08-24 HQ-10 Battle Manual QA 후속 재검수

- starting HEAD는 `8ce93d57ebdf92a8cace6c4ac91211ca48414ef8`다.
- actual Chrome computed style에서 `.battle-command-brief`의 `align-content: center`가 정보 위치 흔들림의 직접 원인임을 확인했다. 좌측 brief는 `align-self: stretch; align-content: start`, 우측 interaction은 `align-self: stretch; align-content: center`로 분리했다.
- result deck은 `battle-result-copy` 그룹을 추가해 narration/callout을 좌상단에 묶고, advance action만 독립적으로 세로 중앙 정렬한다.
- 사용자 화면의 청색 사각형은 DOM/debug overlay가 아니라 `bg_battle_wide.webp`에 baked-in 된 glass 영역이었다. binary edit 없이 Battle presentation만 기존 `bg_office_wide`로 remap해 노출을 제거했다.
- Juno는 중앙 support에서 Doyun-side lane으로 이동했다. Wraith/Doyun 위치·크기, Battle/BGM HUD, dialogue/dock anchor, Story/FSM/save/voice/BGM/battle logic은 변경하지 않았다.

| viewport/state | brief `x/y/w/h` | interaction `x/y/w/h` | Juno `x/y/w/h` | dialogue-command gap | scroll |
|---|---|---|---|---:|---|
| 1920×1080 click | `63/917.4/546.5/128` | `627.5/917.4/1229.5/128` | `1094.4/421.2/190/334.8` | 69.4px | 0 |
| 1366×768 click | `56/609.6/381.5/132` | `451.5/609.6/858.5/132` | `778.6/291.9/150.3/238.1` | 58.6px | 0 |

- production/debug OFF actual flow에서 1920·1366 click/voice/result/second-opportunity를 캡처했다. 좌측 정보 top-left, 우측 action vertical-center, result copy top-left, Juno/dialogue·Juno/dock overlap 0, face/staff/Wraith core 가림 0이다.
- Chrome console error/warning은 0이다. HQ-10은 사용자 screenshot 승인 전 `HUMAN_RECHECK`를 유지한다.
- focused HQ-10은 11/11, full suite는 62 files·450 tests PASS다. `npm run check`, production/QA build, `git diff --check`도 PASS이며 기존 Transformers chunk warning만 유지한다.

## 22. 2026-08-24 HQ-11 Ending Final Presentation 재검수

- branch는 `codex/hq11-ending-final-presentation`, starting HEAD는 `4cd0fa666c924b7d1197f64ec3995a8a77fb3eec`다.
- 사용자 최종 승인에 따라 HQ-10은 `PASS / FREEZE`로 기록했으며 Battle source·presentation·composition·tests는 변경하지 않았다.
- GOOD/NORMAL/BAD/HIDDEN의 giant centered result modal을 제거하고 동일한 editorial system으로 통합했다. title은 center-left, Juno는 left-low, Doyun은 right actor lane에 분리했다. Post-credit는 기존 card 경로를 유지한다.
- production/debug OFF actual flow로 네 ending을 각각 열었다. HIDDEN은 perfect transform, 방어·공격 양쪽 주문, 두 번째 주문 기회 사용, N7 BELIEVE, N8 final success를 실제 순서대로 만족시켜 도달했다.

| viewport | title `x/y/w/h` | Juno `x/y/w/h` | Doyun `x/y/w/h` | BGM HUD `x/y/w/h` | overlap | scroll |
|---|---|---|---|---|---|---|
| 1920×1080 GOOD | `556.8/216/660/214.2` | `136/546/230/410` | `1270.8/288.8/590/840` | `53.8/16/290/60` | 0 | 0 |
| 1600×900 GOOD | `464/180/560/194.5` | `120/452/208/342` | `1048/236/496/702` | `44.8/16/290/60` | 0 | 0 |
| 1366×768 GOOD | `396.1/145.9/478.1/162.9` | `108.3/406.4/177.6/276.5` | `888.9/206.7/423.5/583.7` | `38.2/16/290/60` | 0 | 0 |
| 1920×1080 HIDDEN | `556.8/216/660/286.8` | `136/546/230/410` | `1270.8/288.8/590/840` | `53.8/16/290/60` | 0 | 0 |
| 1600×900 HIDDEN | `464/180/560/255` | `120/452/208/342` | `1048/236/496/702` | `44.8/16/290/60` | 0 | 0 |
| 1366×768 HIDDEN | `396.1/145.9/478.1/162.9` | `108.3/406.4/177.6/276.5` | `888.9/206.7/423.5/583.7` | `38.2/16/290/60` | 0 | 0 |

- NORMAL·BAD도 1920×1080에서 같은 actor/title geometry로 actual capture했고 overlap·scroll은 0이다. CTA는 production에서 visible·enabled이고 debug HUD는 0이다.
- Chrome console error/warning은 0이다. screenshot은 repo 밖 local QA evidence `qa-evidence/hq11-ending`에 저장했다.
- focused HQ-11은 5/5, full suite는 63 files·455 tests PASS다. `npm run check`, production build 158 modules, QA build 128 modules, `git diff --check`도 PASS이며 기존 Transformers 516.22kB warning만 유지한다.
- HQ-11은 구현 완료 후 `HUMAN_RECHECK`다. 사용자 screenshot 승인 전 `PASS / FREEZE`로 올리지 않는다. HQ-12 Post-credit는 `OPEN`이다.

## 23. 2026-08-24 HQ-11 subtle result plate 후속 재검수

- starting HEAD `99aa2d7df919b82e11e0fd9fb2b2a631f9ddafa9`에서 giant modal을 복원하지 않고 GOOD/NORMAL/BAD/HIDDEN 공통 compact result plate를 추가했다. surface는 ending별 36–46% navy-black, 6px backdrop blur, 1px 제한 accent border, 8px radius, shadow 없음이다.
- HIDDEN 원문 `HIDDEN — 완벽한 호흡, 완벽한 사고`와 aria-label은 그대로 유지하고 visual copy span만 `완벽한 호흡,` / `완벽한 사고`로 나눴다. 1366×768에서 각 span은 visual line 1개(`231.1×50`, `219.2×50`)이며 orphan 단어가 없다.

| viewport | ending | plate `x/y/w/h` | title `x/y/w/h` | Juno `x/y/w/h` | Doyun `x/y/w/h` | overlap / crop / scroll |
|---|---|---|---|---|---|---|
| 1920×1080 | GOOD | `556.8/172.8/672/364.9` | `587.8/248/610/167.4` | `136/546/230/410` | `1270.8/288.8/590/840` | `0 / 0 / 0` |
| 1600×900 | GOOD | `464/144/560/359.6` | `495/214.2/498/143.2` | `120/452/208/342` | `1048/236/496/702` | `0 / 0 / 0` |
| 1366×768 | GOOD | `396.1/122.9/480/244.6` | `423.1/179.9/426/66.9` | `108.3/406.4/177.6/276.5` | `888.9/206.7/423.5/583.7` | `0 / 0 / 0` |
| 1920×1080 | NORMAL | `556.8/172.8/672/248.2` | `587.8/248/610/94.8` | `136/546/230/410` | `1270.8/288.8/590/840` | `0 / 0 / 0` |
| 1920×1080 | BAD | `556.8/172.8/672/248.2` | `587.8/248/610/94.8` | `136/546/230/410` | `1270.8/288.8/590/840` | `0 / 0 / 0` |
| 1920×1080 | HIDDEN | `556.8/172.8/672/320.8` | `587.8/248/610/167.4` | `136/546/230/410` | `1270.8/288.8/590/840` | `0 / 0 / 0` |
| 1600×900 | HIDDEN | `464/144/560/289` | `495/214.2/498/143.2` | `120/452/208/342` | `1048/236/496/702` | `0 / 0 / 0` |
| 1366×768 | HIDDEN | `396.1/122.9/480/240.1` | `423.1/179.9/426/114.1` | `108.3/406.4/177.6/276.5` | `888.9/206.7/423.5/583.7` | `0 / 0 / 0` |

- 실제 click flow로 GOOD/NORMAL/BAD에 도달했다. HIDDEN은 저장값을 직접 조작하지 않고 debug transcript UI로 perfect-transform 주문을 입력한 뒤 방어·공격 양쪽 주문, N7 BELIEVE, N8 success를 수행하고 production `이어하기`로 debug OFF 화면을 재개했다.
- screenshot은 repo 밖 `qa-evidence/hq11-ending-followup`에 저장했다. HQ-10 Battle source·presentation·tests와 HQ-12 Post-credit는 변경하지 않았고 HQ-11은 사용자 승인 전 `HUMAN_RECHECK`다.

## 24. 2026-08-24 HQ-11 fixed result frame 최종 균일성 재검수

- starting HEAD `354bfd455608f7305a09d6cd3f0428e19ab50894`에서 GOOD/NORMAL/BAD/HIDDEN의 plate를 공통 fixed result frame으로 통일했다. kicker·code·title·62px support slot은 같은 vertical rhythm과 center alignment를 사용하며 빈 support copy도 slot geometry를 유지한다.
- `계속 ›`는 frame content flow에서 분리해 frame 아래 14px, 같은 horizontal center axis에 둔 작은 CTA로 만들었다. ending별 geometry·position·title size override는 없고 accent tone만 유지한다.

| viewport | 모든 ending 공통 frame `x/y/w/h` | title font-size | CTA `x/y/w/h` | CTA center offset | actor/BGM overlap | scroll |
|---|---|---|---|---|---|---|
| 1920×1080 | `556.8/172.8/672/360` | `56px` | `857.4/546.8/70.7/36` | `0` | `0` | `0` |
| 1600×900 | `464/144/560/300` | `48px` | `708.6/458/70.7/36` | `0` | `0` | `0` |
| 1366×768 | `396.1/122.9/480/270` | `40.98px` | `600.8/406.9/70.7/36` | `0` | `0` | `0` |

- GOOD/NORMAL/BAD/HIDDEN을 모두 실제 flow로 열고 production/debug OFF에서 12개 viewport-ending 조합을 측정했다. HIDDEN은 debug transcript UI로 perfect-transform 주문을 입력한 뒤 실제 five-condition route를 수행하고 production `이어하기`로 재개했다.
- HIDDEN의 visual span은 세 viewport 모두 `완벽한 호흡,` / `완벽한 사고` 두 줄이다. frame/Juno·frame/Doyun·frame/BGM·CTA/Juno·CTA/Doyun overlap, crop, console error/warning은 0이다.
- focused HQ-11/HQ-10은 20/20, full suite는 63 files·459 tests PASS다. `npm run check`, production build 158 modules, QA build 128 modules, `git diff --check`도 PASS이며 기존 Transformers 516.22kB warning만 유지한다.
- screenshot은 repo 밖 `qa-evidence/hq11-ending-uniformity`에 저장했다. HQ-10 Battle은 `PASS / FREEZE`, HQ-12 Post-credit는 `OPEN`, HQ-11은 사용자 승인 전 `HUMAN_RECHECK`다.

## 25. 2026-08-24 HQ-11 result frame 내부 균형 재검수

- starting HEAD `101a08a5d1c00963cb0b4f6e852331f50779a0e1`에서 외부 frame·CTA·actor geometry를 동결한 채 kicker·code·title을 `.ending-result-content` 한 그룹으로 묶어 frame 안에서 중앙 정렬했다.
- 비어 있는 62px support slot은 visual flow에서 제거하고 전체 폭 divider를 삭제했다. supporting copy가 실제로 생기는 페이지는 별도 auto row를 사용하며 ending copy는 추가·수정하지 않았다.

| viewport | 모든 ending 공통 frame `x/y/w/h` | title font-size | CTA `x/y/w/h` | CTA center offset | actor/BGM overlap | scroll |
|---|---|---|---|---|---|---|
| 1920×1080 | `556.8/172.8/672/360` | `56px` | `857.4/546.8/70.7/36` | `0` | `0` | `0` |
| 1600×900 | `464/144/560/300` | `48px` | `708.6/458/70.7/36` | `0` | `0` | `0` |
| 1366×768 | `396.1/122.9/480/270` | `40.98px` | `600.8/406.9/70.7/36` | `0` | `0` | `0` |

- production/debug OFF에서 GOOD/NORMAL/BAD/HIDDEN 1920×1080과 GOOD/BAD/HIDDEN 1366×768 screenshot을 저장했다. NORMAL/BAD의 긴 빈 하단 영역과 form-like divider는 보이지 않으며 HIDDEN 두 줄은 유지된다.
- console error/warning 0, crop·scroll 0이다. focused HQ-11/HQ-10은 21/21, full suite는 63 files·460 tests PASS다. `npm run check`, production build 158 modules, QA build 128 modules, `git diff --check`도 PASS이며 기존 Transformers 516.22kB warning만 유지한다.
- screenshot과 rect JSON은 repo 밖 `qa-evidence/hq11-ending-internal-balance`에 저장했다. HQ-10 Battle은 `PASS / FREEZE`, HQ-12 Post-credit는 `OPEN`, HQ-11은 사용자 승인 전 `HUMAN_RECHECK`다.

## 26. 2026-08-24 HQ-11 header/title 독립 anchor 재검수

- starting HEAD `c3b33566c0222cbd1c4b54e9a7a9dbc5d1918064`에서 승인된 frame·CTA·actor·background·BGM geometry를 동결했다. accent·kicker·ending code는 frame 상단의 `.ending-result-header`, 결과 title은 frame 중앙의 `.ending-title`로 분리해 title 줄 수가 header 위치에 영향을 주지 않게 했다.
- production/debug OFF actual flow로 GOOD/NORMAL/BAD/HIDDEN 1920×1080과 GOOD/HIDDEN 1366×768을 캡처했다. HIDDEN은 원문을 유지한 `완벽한 호흡,` / `완벽한 사고` 두 줄이다.

| viewport | ending | frame `x/y/w/h` | accent/kicker/code Y | title `x/y/w/h` | title center offset | CTA `x/y/w/h` | CTA center offset |
|---|---|---|---|---|---|---|---|
| 1920×1080 | GOOD/NORMAL/BAD | `556.8/172.8/672/360` | `200.8/207.8/226.8` | `587.8/322.5/610/60.5` | `0` | `857.4/546.8/70.7/36` | `0` |
| 1920×1080 | HIDDEN | `556.8/172.8/672/360` | `200.8/207.8/226.8` | `587.8/292.3/610/120.9` | `0` | `857.4/546.8/70.7/36` | `0` |
| 1600×900 | HIDDEN | `464/144/560/300` | `167.5/174.5/193.5` | `495/242.2/498/103.7` | `0` | `708.6/458/70.7/36` | `0` |
| 1366×768 | GOOD | `396.1/122.9/480/270` | `143.1/150.1/167.1` | `427.1/235.8/418/44.3` | `0` | `600.8/406.9/70.7/36` | `0` |
| 1366×768 | HIDDEN | `396.1/122.9/480/270` | `143.1/150.1/167.1` | `427.1/213.6/418/88.5` | `0` | `600.8/406.9/70.7/36` | `0` |

- 모든 측정에서 frame/actor·frame/BGM·CTA/actor overlap, frame/header/title/CTA crop, scroll, production debug element, Chrome console error/warning은 0이다. frame 크기는 1920 `672×360`, 1600 `560×300`, 1366 `480×270`, CTA gap은 14px로 직전 승인값과 같다.
- RED는 독립 header wrapper·상단 anchor·독립 title center anchor 부재 3건이었다. 최소 구현 뒤 focused HQ-11/HQ-10 21/21, full suite 63 files·460 tests, `npm run check`, production/QA build가 PASS했다.
- screenshot은 repo 밖 `qa-evidence/hq11-ending-independent-anchors`에 저장했다. HQ-10 Battle은 `PASS / FREEZE`, HQ-12 Post-credit는 `OPEN`, HQ-11은 사용자 승인 전 `HUMAN_RECHECK`다.

## 27. 2026-08-24 HQ-11 result title scale 재검수

- starting HEAD `5fdea31efc3a986f907b40261500faa4a13c0789`에서 승인된 frame·header·title center anchor·CTA·actor·background·BGM geometry를 동결하고 결과 title 공통 scale만 `clamp(2.5rem, 3vw, 3.5rem)`에서 `clamp(2.875rem, 3.4vw, 4rem)`으로 강화했다.
- production/debug OFF actual flow에서 GOOD/NORMAL/BAD/HIDDEN 1920×1080, GOOD/HIDDEN 1366×768을 캡처하고 1600×900까지 자동 측정했다.

| viewport | 모든 ending 공통 frame `x/y/w/h` | title font-size | title centerY | CTA `x/y/w/h` | actor/BGM overlap | scroll |
|---|---|---:|---:|---|---|---|
| 1920×1080 | `556.8/172.8/672/360` | `64px` | `352.8px` | `857.4/546.8/70.7/36` | `0` | `0` |
| 1600×900 | `464/144/560/300` | `54.4px` | `294px` | `708.6/458/70.7/36` | `0` | `0` |
| 1366×768 | `396.1/122.9/480/270` | `46.44px` | `257.9px` | `600.8/406.9/70.7/36` | `0` | `0` |

- 1920 네 ending과 1366 GOOD/HIDDEN에서 title crop·frame overflow·CTA/actor overlap은 0이며 HIDDEN은 정확히 `완벽한 호흡,` / `완벽한 사고` 2줄이다. Chrome console error/warning과 production debug element도 0이다.
- focused HQ-11/HQ-10은 21/21, full suite는 63 files·460 tests PASS다. `npm run check`, production build 158 modules, QA build 128 modules이 PASS했고 기존 Transformers 516.22kB warning만 유지한다.
- screenshot은 repo 밖 `qa-evidence/hq11-ending-title-scale`에 저장했다. HQ-10 Battle은 `PASS / FREEZE`, HQ-12 Post-credit는 `OPEN`, HQ-11은 사용자 승인 전 `HUMAN_RECHECK`다.

## 28. 2026-08-24 HQ-11 사용자 승인·freeze

- 사용자가 final HEAD `099fe59be85f72a0619103ffe9545efd8d17ef44`의 GOOD/NORMAL/BAD/HIDDEN ending presentation을 최종 승인했다. HQ-11 상태는 `PASS / FREEZE`다.

## 29. 2026-08-24 OpenAI 제출 TITLE rebrand 재검수

- 사용자 제공 1672×941 PNG 원본을 source에 바이트 그대로 보존하고, runtime `bg_title.webp`만 1920×1080 WebP quality 88로 정규화했다. runtime은 265,998B·SHA-256 `A08A4407B721E9AB2E56CC9677A97C0D0DEDDAA5AEC79444FEDCC6FC0F0482A1`이며 과거 NHN runtime hash `A9837907...5FC9C`와 다르다.
- 기존 TITLE DOM·CSS·optional mic·BGM·focus 계약은 변경하지 않았다. production/debug OFF actual Chrome에서 OpenAI GAME BUILDERS SEOUL 건물·메인 배너는 세 viewport 모두 완전 노출되고 title/menu/mic lane과 겹치지 않았다.

| viewport | TITLE content rect | BGM rect | content/BGM overlap | scroll | background |
|---|---|---|---:|---|---|
| 1920×1080 | `103.7,79.9,650.0,920.2` | `1574.0,36.7,274.0,48.0` | 0 | `1920×1080` | complete·1920×1080·cover |
| 1600×900 | `86.4,66.6,624.0,766.8` | `1262.0,30.6,274.0,48.0` | 0 | `1600×900` | complete·1920×1080·cover |
| 1366×768 | `73.8,56.8,532.7,654.3` | `1037.4,26.1,274.0,48.0` | 0 | `1366×768` | complete·1920×1080·cover |

- Tab focus는 세 viewport에서 `게임 시작`의 기존 visible focus 상태로 확인했다. console error/warning, broken background, crop, horizontal/vertical scroll은 0이다. HTTP asset probe는 200 `image/webp`·265,998B다.
- focused TITLE/asset suite 32/32, full suite 64 files·463 tests, `npm run check`, production build 158 modules, QA build 128 modules, `git diff --check`가 PASS했다. 기존 Transformers 516.22kB warning만 유지한다.
- screenshot은 repo 밖 `qa-evidence/openai-title-rebrand/`에 저장했다. OpenAI TITLE은 사용자 최종 화면 승인 전 `HUMAN_RECHECK`다. HQ-10·HQ-11은 `PASS / FREEZE`, HQ-12는 `OPEN`이며 시작하지 않았다.
- freeze 범위는 fixed Result Frame 외부 geometry, header/title independent anchors, 공통 result title scale, detached CTA geometry, Juno/Doyun actor composition이다.
- HQ-10 Battle도 기존 `PASS / FREEZE`를 유지한다. release-blocking regression 증거 없이는 두 영역의 visual presentation을 다시 수정하지 않는다.
- HQ-12 Post-credit는 별도 `OPEN`이며 이 승인으로 자동 완료되지 않는다.

## 30. 2026-08-24 HQ-12 제출판 종료 flow 재검수

- 최신 사용자 범위 결정에 따라 미지의 소녀/Black Magical Girl teaser를 제출 runtime에서 제거했다. GOOD/NORMAL/BAD/HIDDEN은 승인된 Result Frame의 마지막 페이지 뒤 기존 `처음부터` 동작으로 새 게임 상태에 복귀한다.
- GOOD/HIDDEN의 ending 조건·copy와 HIDDEN five-condition은 변경하지 않았다. HIDDEN의 `완벽한 호흡, 완벽한 사고`와 사내 인기 변신 영상 문구가 고유 presentation으로 남는다.
- 과거 `post_credit` save는 schema version을 올리지 않고 history의 직전 `ending_good` 또는 `ending_hidden`으로 복구한다. 복구 뒤 teaser node를 다시 저장하거나 렌더하지 않는다.
- 제출 runtime에는 `post_credit`, `ending.black_magical_girl`, `bg_corridor_day`, `bg_corridor_blacklight` reference가 없다. corridor runtime binary는 제거했지만 source/provenance 역사 기록은 유지한다. 신규/편집 binary와 대체 teaser는 0이다.
- focused QA는 BAD/NORMAL/GOOD/HIDDEN terminal routing, HIDDEN 5조건·고유 문구, legacy save migration, teaser reference 0을 검증한다. actual Chrome production/debug OFF에서는 GOOD 전체 click flow의 마지막 페이지와 `처음부터` 이후 N0 새 게임 복귀, unknown girl/Black Magical Girl/broken image/stuck/console error/scroll 0을 확인했다. HIDDEN은 완창 음성 입력이 필요한 실제 진입 경로이므로 이번 자율 click QA에서는 재진입하지 않았으며, route/engine 회귀 PASS와 기존 고정 Ending geometry를 근거로 사용자 `HUMAN_RECHECK`를 유지한다.
- HQ-10 Battle·HQ-11 Ending·OpenAI TITLE은 `PASS / FREEZE`. HQ-12는 사용자 실제 화면 승인 전 `HUMAN_RECHECK`다.
