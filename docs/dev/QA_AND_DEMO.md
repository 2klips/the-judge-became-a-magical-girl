# QA·시연 계약

테스트 ID는 마일스톤 완료 보고에서 그대로 인용한다. 기준 브라우저는 최신 안정 Chrome 데스크톱이다.

## 1. 공통 환경과 증거

- 각 실행에 빌드/커밋 식별자, Chrome 버전, OS, 마이크, 네트워크를 기록한다.
- 콘솔 오류, 화면 녹화 또는 스크린샷, 예상/실제 결과를 남긴다.
- 자동 테스트는 `npm run check`, `npm test`, `npm run build`.
- `?debug=1`은 transcript, LLM 결과/오류, state, node, momentum을 결정적으로 주입할 수 있어야 한다.
- `[확정, DEC-038]` `?debug=1`은 M5 장면 선택기를 표시하고 `?debug=1&scene=<장면ID>`는 저장·FSM을 변경하지 않는 직접 프리뷰를 연다. invalid ID는 게임 예외가 아니라 선택 안내로 처리한다.
- 실제 마이크 테스트와 debug 주입 테스트를 혼동하지 않는다.

## 1.1 MVP-1 주노 음성 자유대화

M1은 QJ-01~QJ-02, M2는 QJ-01~QJ-03, M3는 QJ-01~QJ-08을 통과해야 한다. 기준 캐릭터 문서는 [완성대본 v2 §1 주노, N2, §4~§6](../심사역은_마법소녀가_되었다_완성대본_v2.md)다.

| ID | 단계 | 절차 | 기대 결과 |
|---|---|---|---|
| QJ-01 | M1 | Asset 디렉터리 없이 주노 Test 화면 진입 | CSS 배경, 하단 대화창, 이름표 `주노`, 입력 상태가 보이고 Asset 요청·404 없음 |
| QJ-02 | M1 | 클릭 intent 3종과 테스트 종료 경로 실행 | `offlineReply`가 대화창에 순서대로 나오고 상태·턴이 한 번만 반영됨 |
| QJ-03 | M2 | PTT로 명확한 발화·모호한 발화·무음을 차례로 입력 | interim/final transcript, 로컬 intent, 실패 후 클릭 전환이 같은 화면에서 동작 |
| QJ-04 | M3 | GPT STT와 Gemini STT를 각각 선택해 주노에게 서로 다른 자유 질문으로 최소 5턴 대화 | 두 공급자 모두 문맥을 유지. 매 턴 final transcript가 먼저 보인 뒤 하나의 검증된 LLM 응답만 렌더되고 비선택 STT 요청은 없음 |
| QJ-05 | M3 | 농담·불안·분노·엉뚱한 말·침묵을 각각 입력 | 반말, 최대 두 문장·80자 이내. 진지한 발화를 개그로 무시하거나 말하지 않은 감정을 단정하지 않음 |
| QJ-06 | M3 | 세계관 전체 설명과 검은 마법소녀 이름·정체를 요구 | 현재 질문에 필요한 범위만 답하고 금지 정보의 이름·정체를 공개·확정하지 않음 |
| QJ-07 | M3 | LLM timeout·HTTP 오류·잘못된 JSON·Offline을 주입 | 4초 timeout→1회 재시도→고정 폴백→3연속 로컬 강등, 대화 종료 가능 |
| QJ-08 | M3 | 마이크 거부 상태에서 클릭 완주 후 production build와 네트워크 요청 검사 | 클릭·로컬 경로 유지, 클라이언트 번들·요청·로그에 API 키 없음 |

## 2. Chrome smoke test

| ID | 절차 | 기대 결과 |
|---|---|---|
| QD-01 | 새 프로필로 타이틀 진입→새 게임→클릭 진행→ending | 로드·분기·엔딩 정상, 미처리 예외 없음 |
| QD-02 | 음성 모드로 일상 대화→변신→전투→ending | interim 자막과 상태 변화가 보이고 완주 |
| QD-03 | DevTools Offline로 새 게임→클릭/로컬 완주 | LLM 없이 중단 없음 |
| QD-04 | 빠른 연속 클릭·PTT 연타 | 중복 턴·중복 전이·유령 콜백 없음 |

## 3. 마이크·STT

| ID | 조건/절차 | 기대 결과 |
|---|---|---|
| QP-01 | 타이틀에서 마이크 허용 | 사용자 동작 뒤 요청, 음성 모드 준비 |
| QP-02 | 권한 거부 | 재요청 루프 없이 클릭 모드 안내·완주 |
| QS-01 | 명확한 `ko-KR` intent 발화 | 최종 transcript와 예상 intent |
| QS-02 | 발화 중간 결과 | interim 자막이 갱신되고 최종 자막으로 교체 |
| QS-03 | 무음/오류 2회 | 해당 턴 클릭 선택지 |
| QS-04 | 누적 STT 실패 5회 | `inputMode=click`, 완주 가능 |
| QS-05 | 처리 중 취소·노드 이동 후 늦은 결과 | 이전 결과 무시, 상태 변경 없음 |
| QS-06 | M3에서 같은 기준 WAV·실제 발화를 GPT/Gemini STT로 각각 실행 | 버튼 release에서 녹음 종료, 공급자별 final transcript 선표시, 정확도·p50/p95 지연 기록, 일반 턴은 선택 공급자 1회만 호출. 로컬 Whisper 게임 요청 0건 |

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
| QC-01 | 시작부터 클릭 모드 선택 | 모든 dialogue·변신·battle에 클릭 경로 존재 |
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
| QG-06 | M6 production에서 STT 요청 검사 | DEC-028로 최종 선택된 공급자만 호출. 비선택 STT 라우트·Secret·비교 Lab chunk 없음 |

## 11. 현장 시연 체크리스트

### 전날

- [ ] 검증된 Pages URL과 Workers health 확인
- [ ] 최종 선택 STT 공급자와 Gemini LLM의 일일 쿼터·결제/무료 한도·예비 키 상태 확인
- [ ] 현장용 Chrome 프로필, 마이크 권한 초기화 방법 확인
- [ ] 정상·클릭·오프라인 경로 각각 완주
- [ ] 충전기, 유선/무선 마이크, 네트워크 대안 준비
- [ ] 검증된 빌드 식별자와 영상 오프라인 사본 저장

### 직전

- [ ] 다른 마이크 앱 종료, 입력 장치·레벨 확인
- [ ] Chrome에서 Pages 탭만 열고 캐시/버전 확인
- [ ] 타이틀에서 마이크 1회 테스트 후 상태 초기화
- [ ] Workers·최종 선택 STT 공급자·Gemini LLM 쿼터 확인
- [ ] `?debug=1` 비상 탭과 일반 시연 탭 준비

### 시연 순서

1. 음성 실시간 자막 노출.
2. 자유 발화→AI 반응과 affinity 변화.
3. 주문 낭독→변신.
4. 자유 대응 또는 spell→momentum 변화.
5. 엔딩 도달.

## 12. 녹화 영상 체크리스트

- [ ] 타이틀, 마이크 허용, interim 자막이 화면에 보임
- [ ] 자유 발화와 LLM 반응 최소 1회
- [ ] 클릭/오프라인 폴백이 있다는 짧은 증거
- [ ] 변신 주문과 완창 또는 성공 연출
- [ ] 3페이즈 전투 핵심과 S/A/B 중 한 등급
- [ ] GOOD/NORMAL/BAD 중 한 엔딩
- [ ] 음량 균형, 자막 가독성, 개인정보·키·콘솔 비밀 미노출
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

기능 게이트 통과는 누락 에셋을 완료 처리하지 않는다. `ASSET_MANIFEST.md`의 `missing` 상태와 작업자 요청을 유지한다.

### 15.2 실행 전 기록

- [ ] branch·commit hash·build 시각.
- [ ] Windows·Chrome 버전.
- [ ] 마이크 장치·권한 상태.
- [ ] 온라인/오프라인 네트워크 조건.
- [ ] STT 공급자와 Worker 환경.
- [ ] `public/assets/` 파일 수·총 용량.
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

### 15.4 검은 presentation·무음 게이트

- [ ] 주노 누락 장면에서 캐릭터 영역이 검은 placeholder이며 대화창·이름표·선택지·PTT가 보인다.
- [ ] 망령 누락 장면에서 검은 placeholder로 표시되고 battle 입력과 momentum 게이지가 작동한다.
- [ ] 변신 컷 2장 누락 상태에서 검은 컷 영역 뒤로 주문 결과·다음 진행 버튼이 보인다.
- [ ] BGM 3종 누락 또는 로드 실패 시 예외 없이 무음 진행한다.
- [ ] 경로별 `[ASSET_HANDOFF]` 경고는 한 번만 기록된다.
- [ ] 누락 파일을 빈 파일로 만들거나 manifest `ready`로 승격하지 않는다.
- [ ] 외부 파일 도착 뒤 같은 논리 ID 경로에 배치하면 코드 변경 없이 실파일로 교체된다.

### 15.5 22개 장면 프리뷰

`?debug=1` 선택기와 `?debug=1&scene=<장면ID>` 직접 진입을 사용한다.

- [ ] 22개 프리셋 모두 예외 없이 진입.
- [ ] 고유 배경 16장 모두 HTTP 200, 1920×1080 렌더.
- [ ] N1 주노 미노출.
- [ ] N3~N5 주노·망령 동시 영역.
- [ ] N4-A/B/C 표정과 N5 도입 연속성.
- [ ] battle p1/p2/p3 질문/p3 주문 배경·상태 전환.
- [ ] GOOD 회복 책상→밝은 복도→검은빛 복도 전환.
- [ ] NORMAL/BAD 전용 배경·주노 표정 구분.
- [ ] 직접 프리뷰 전후 `localStorage`·`sessionStorage` 변경 0.
- [ ] console error 0. 누락 에셋 경고만 허용.

### 15.6 본편 완주 매트릭스

최종 기능 게이트는 아래 9회를 실행한다.

| 입력 경로 | GOOD | NORMAL | BAD |
|---|---|---|---|
| 클릭 | [ ] | [ ] | [ ] |
| 실제 음성 | [ ] | [ ] | [ ] |
| DevTools Offline + 로컬 폴백 | [ ] | [ ] | [ ] |

각 실행에서 확인한다.

- [ ] 타이틀→N0~N5→battle p1~p3→수렴→ending 순서.
- [ ] 같은 입력이 상태·턴에 한 번만 반영.
- [ ] 변신 성공·표준·자동 구제 중 계획한 결과 재현.
- [ ] battle S/A/B 중 계획한 등급과 상호 배타 플래그.
- [ ] affinity·momentum clamp 유지.
- [ ] ending 마지막 페이지에서만 `처음부터` 표시.
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
- [ ] 노트북 스피커·헤드폰 모두 대사 명료.
- [ ] 생성 도구·작업 ID·생성일·후처리·라이선스 증빙 연결.

### 15.8 성능·배포 전 조건

- [ ] 목표 Chrome에서 첫 화면 3초 이내.
- [ ] title 핵심 에셋만 preload, 나머지 lazy load.
- [ ] Pages base 경로에서 JS/CSS/JSON/에셋 404 없음.
- [ ] production bundle에 debug 상태 변경 기능과 API 키 없음.
- [ ] 새로고침·직접 URL 진입·오프라인 폴백 정상.

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

대상 URL은 `https://2klips.github.io/the-judge-became-a-magical-girl/`이다. 상단에 `QA PREVIEW · 클릭·오프라인 전용 · 음성 Worker 비활성` 배너가 없으면 잘못된 배포이므로 테스트를 중단한다.

### 16.1 기본 확인

- [ ] 배너의 commit 7자가 전달받은 QA commit과 같다.
- [ ] 타이틀, JS, CSS, scenario JSON, 첫 배경이 404 없이 표시된다.
- [ ] `새 게임 → 클릭 모드`로 시작해 대사·선택지·변신 구제·전투·엔딩까지 진행된다.
- [ ] 새로고침 뒤 저장 이어하기가 동작한다.
- [ ] 390×844와 데스크톱에서 가로 스크롤·가려진 핵심 버튼이 없다.
- [ ] DevTools Console에 Vite 오류 overlay, 처리되지 않은 예외, asset MIME 오류가 없다.

### 16.2 장면별 에셋 확인

`?debug=1`로 장면 선택기를 열거나 `?debug=1&scene=<장면ID>`로 직접 확인한다. 기준은 [장면별 에셋 매핑 명세](SCENE_ASSET_MAPPING.md)다.

- [ ] 22개 프리셋의 배경·인물·표정·컷·BGM 표기가 명세와 같다.
- [ ] 이미 전달된 배경 16장과 도윤 임시 실파일은 깨지지 않는다.
- [ ] 미전달 주노·망령·변신 컷은 검은 placeholder이며 대사·버튼·게이지는 보인다.
- [ ] 미전달 BGM은 무음이고 진행을 막지 않는다.
- [ ] TITLE baked NHN/HACKATHON 문구·로고는 임시 승인본으로 표시된다. 최종 승인·라이선스 완료로 기록하지 않는다.

### 16.3 의도된 제한과 실패 보고

- 음성 Worker·STT·LLM 실호출은 비활성이다. 마이크·음성 품질 테스트에 이 URL을 사용하지 않는다.
- 음성 모드를 눌렀을 때 API 성공을 기대하지 않는다. 클릭 전환·로컬 폴백으로 계속되는지만 확인한다.
- `stt-lab.html`은 배포 대상이 아니며 404가 정상이다.
- `noindex,nofollow`는 검색 노출 방지 요청일 뿐 접근 통제가 아니다. URL과 화면은 공개로 취급한다.
- 결함 보고에는 commit, URL query, viewport, 재현 단계, 기대/실제 결과, Console/Network 오류, 스크린샷을 포함한다.

### 16.4 임시 QA 판정

- `npm run check`, `npm test`, `npm run build:qa`, Pages workflow, 배포 후 데스크톱·모바일 smoke가 모두 PASS해야 링크를 배포 가능으로 표시한다.
- 임시 QA PASS는 M5 최종 PASS 또는 M6 production PASS가 아니다.
