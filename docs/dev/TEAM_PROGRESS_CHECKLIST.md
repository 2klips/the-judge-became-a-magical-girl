# 「심사역은 마법소녀가 되었다」
# 팀 공유용 개발 진행 체크리스트

## 기존 / 변경안 / 수정안 / 폐기안

> Draft · 2026-08-23 KST  
> 인계 기준 `2a5821d` → 현재 `main`·공개 Pages `df3a94d`  
> 공개 링크: <https://2klips.github.io/the-judge-became-a-magical-girl/>

이 문서는 기술 구현 순서보다 **무엇이 있었고, 왜 바꿨고, 지금 어디까지 왔는지**를 팀원이 빠르게 확인하기 위한 체크리스트다. 현재 판정은 [Human Scene QA Backlog](HUMAN_SCENE_QA_BACKLOG.md), [QA·시연 계약](QA_AND_DEMO.md), [Asset Manifest](../assets/ASSET_MANIFEST.md), [Scene Asset Mapping](../assets/SCENE_ASSET_MAPPING.md), [Provenance](../assets/PROVENANCE.md)를 우선한다.

- `[x]`: 해당 체크 항목의 구현·검증 범위 완료
- `[ ]`: 부분 완료, 보류 또는 미착수
- `ready`: 파일과 기술 검증 완료. 사람 승인인 `approved`와 다름
- `HUMAN_RECHECK`: 구현됐지만 사용자 실제 화면·음향 재검수 전

## 현재 한눈에 보기

- [x] Scenario v3.1의 18-node runtime과 GOOD/NORMAL/BAD/HIDDEN 분기
- [x] Realtime voice core, 7종 typed failure, 누적 5회 정책, PTT live meter
- [x] 선택형 마이크·9-state FSM·Settings를 갖춘 PC TITLE
- [ ] OpenAI 제출용 TITLE 배경 교체 — runtime 구현·자동 검증 완료 / `HUMAN_RECHECK`
- [x] 공통 VN dialogue/choice UI foundation — HQ-02 사용자 `PASS`
- [x] N0~N2 early-scene mini-sequence와 전용 도윤 반응 자산 통합
- [x] 최신 `main`의 GitHub Pages 배포 — Actions run #33 `SUCCESS`
- [ ] Wraith omen·변신 후 공개 얼굴 — 구현 완료 / `HUMAN_RECHECK`
- [x] Battle/Ending 1차 safe-zone 보정 — responsive collision closure 완료
- [x] Battle command deck/presentation — HQ-10 사용자 `PASS / FREEZE`
- [x] Ending result frame/editorial presentation — HQ-11 사용자 `PASS / FREEZE`
- [ ] 검은 마법소녀 post-credit 실자산·character-first 구성 — HQ-12 `OPEN`
- [ ] Juno 행동 포즈·final purification 등 잔여 visual production 판정
- [ ] AR-01 사람 장면·청각 QA, AR-02 스타일 연속성 QA, AR-10 public cold-load 5회

---

# 1. 기존

인계 기준은 실행 가능한 public baseline `2a5821d`다. 아래 항목은 그때 이미 있었고, 후속 작업에서도 기반을 유지했다.

- [x] **Vanilla TypeScript + Vite 런타임**
  - 기존: TypeScript, Vite 8, Vitest, Zod, Transformers.js, Cloudflare Worker/Wrangler 구조가 있었다.
  - 현재: 같은 기술 스택 위에서 scenario·voice·UI·asset 검증을 확장했다.
  - 비고: 프레임워크 교체나 전면 재작성은 하지 않았다.

- [x] **데이터 기반 GameEngine / FSM**
  - 기존: `TITLE → PROLOGUE → DIALOGUE → CUTSCENE → ENDING`을 node 데이터로 실행했다.
  - 현재: 기존 엔진을 보존하면서 v3.1 관계·전투·엔딩 계약을 18개 node로 확장했다.
  - 비고: story 문서가 runtime에 자동 반영되는 구조는 아니므로 JSON·engine 구현을 별도로 검증한다.

- [x] **GameState와 save/localStorage**
  - 기존: node, history, flags, affinity, emotion, input mode, 실패 누적을 schema v1으로 저장했다.
  - 현재: legacy node alias와 v2 save 호환을 유지한 채 v3.1 분기를 복구한다.
  - 비고: 이번 개발에서 save schema 버전을 올리지 않았다.

- [x] **Realtime voice 기반과 Worker 경계**
  - 기존: PTT 녹음, browser mic tester, Worker 기반 전사·판정과 OpenAI Realtime 경로가 있었다.
  - 현재: `/voice/realtime` 단일 요청으로 transcript와 대화·전투 판정을 받는 구조를 유지한다.
  - 비고: API key는 Worker/local secret에만 있고 클라이언트·문서에는 기록하지 않는다.

- [x] **Click·로컬 완주 fallback**
  - 기존: 음성이나 네트워크가 실패해도 클릭 선택과 로컬 판정으로 진행할 수 있었다.
  - 현재: TITLE부터 모든 ending까지 마이크 없이 click 완주가 가능하다.
  - 비고: fallback은 장애 복구 수단이며 서사적 패배 판정이 아니다.

- [x] **BGM controller와 저장된 음량 설정**
  - 기존: scene BGM, volume/mute 저장, 재생 controller가 있었다.
  - 현재: 20% 기본값, first gesture, PTT duck/recover, 전환 fade와 무음 fallback을 강화했다.
  - 비고: BGM 5곡은 runtime `ready`; 전체 사람 청각 QA 전 `approved`는 아니다.

- [x] **v2 시나리오의 핵심 골격**
  - 기존: 심사역, 야근, 이상한 게임, 음성 사건, 주노, 회색 망령, 변신, 3-phase battle, GOOD/NORMAL/BAD가 있었다.
  - 현재: 이 골격은 유지하고 의미·분기·HIDDEN·post-credit를 v3/v3.1로 확장했다.
  - 비고: “무에서 새로 만든 게임”이 아니라 완주 가능한 v2 프로토타입을 개선한 프로젝트다.

- [x] **장면 preview와 debug 경로**
  - 기존: 개별 scene preview와 debug route가 있었다.
  - 현재: composition preset·logical asset ID·voice model·QA metadata 확인 수단으로 확장했다.
  - 비고: static `?debug=1&scene=...` preview는 actual PTT playthrough를 대체하지 않는다.

- [x] **주요 캐릭터·배경·BGM 자산**
  - 기존: 배경, 도윤, 주노, 회색 망령, 변신 컷, BGM의 핵심 자산이 이미 존재했다.
  - 현재: source/runtime 경계를 정리하고, 현재 runtime 48개·15,263,089B로 관리한다.
  - 비고: 누락 이미지는 presentation fallback, 누락 BGM은 무음으로 진행을 보존한다.

- [x] **Asset SSOT와 자동 QA의 골격**
  - 기존: manifest, provenance, scene mapping과 자동 규격 검사가 있었다.
  - 현재: 생성 계보·source/runtime 동일성·scene mapping·사람 승인 상태를 더 엄격히 분리한다.
  - 비고: 자동 테스트는 인계 시점 41 files/187 tests 기록에서 현재 61 files/439 tests로 확대됐다.

---

# 2. 변경안

기존 구조의 문제를 발견하고 새 방향으로 설계하거나 추가하기로 한 항목이다. 체크는 제안 범위의 현재 구현 상태를 나타낸다.

- [x] **Voice typed failure와 누적 5회 정책**
  - 기존 문제: 권한·녹음·무음·통신 실패가 같은 의미로 처리되고 장면마다 복구가 달랐다.
  - 변경안: 7종 typed failure, 같은 턴 retry/click, 실제 실패 누적 5회에서만 전역 click 전환.
  - 이유: 일시 장애 하나로 음성 플레이 전체가 꺼지거나 raw 오류가 노출되는 일을 막기 위해서다.
  - 상태: **완료** — save/Resume 누적·reset 경계와 dialogue/incantation/battle 공통 정책 검증.

- [x] **One-stream PTT live meter**
  - 기존 문제: 녹음 중 실제 입력 여부를 플레이어가 알기 어려웠다.
  - 변경안: 같은 capture stream을 MediaRecorder와 analyser가 공유하고 PTT 버튼 안에 level fill 표시.
  - 이유: 두 번째 `getUserMedia()` 없이 장치 문제와 서버 문제를 구분하기 위해서다.
  - 상태: **완료** — 실제 마이크와 cleanup·duck/recover 계약 검증.

- [x] **Optional microphone + 9-state model**
  - 기존 문제: TITLE mic calibration이 Start/Resume을 막는 필수 gate였다.
  - 변경안: `UNKNOWN`부터 `ERROR`까지 9-state FSM, voice/click 선택, Settings와 tester 공유.
  - 이유: 권한 거절·장치 없음·미지원 환경에서도 게임을 완주할 수 있어야 한다.
  - 상태: **완료** — actual voice와 click resume을 모두 확인.

- [x] **PC 전용 TITLE 재설계**
  - 기존 문제: 중앙 diagnostic panel이 작품 소개보다 장치 설정을 앞세웠다.
  - 변경안: left menu/right visual, Game Start·Continue·Settings, compact mic/BGM HUD, local fonts.
  - 이유: 첫 화면에서 작품과 주요 행동을 즉시 이해하도록 하기 위해서다.
  - 상태: **완료** — 1920×1080, 1600×900, 1366×768 no-scroll QA.

- [x] **BGM 20%·first-gesture 계약**
  - 기존 문제: 신규 사용자의 음량이 높고 autoplay·scene 전환의 책임이 분산됐다.
  - 변경안: 신규/손상 설정 20%, 유효 저장값 우선, 첫 gesture 재생, PTT duck/recover.
  - 이유: 시연 환경에서 음성보다 음악이 앞서거나 재생이 끊기는 문제를 줄이기 위해서다.
  - 상태: **완료** — audio behavior와 actual voice 3-surface 청취 확인.

- [x] **Scenario v2 → v3 → v3.1**
  - 기존 문제: 비판 자체가 악처럼 보이거나 “좋은 점만 보라”는 결론으로 읽힐 여지가 있었다.
  - 변경안: “비슷하다고 판단하는 것과, 보기 전에 의미 없다고 단정하는 것은 다르다”로 주제 고정.
  - 이유: 도윤이 기준을 버리지 않고 끝까지 확인한 뒤 판단하는 심사역으로 성장하게 하기 위해서다.
  - 상태: **완료** — 승인된 v3.1 story baseline 유지.

- [x] **N6/N7/N8 분기 재구축**
  - 기존 문제: N6의 “둘 다”가 정답처럼 보이고, 기술 실패와 BAD 의미가 섞일 수 있었다.
  - 변경안: 방어/공격 첫 선택, 조건부 두 번째 주문, BELIEVE/POSSIBILITY/CYNIC, final refusal 분리.
  - 이유: 플레이 선택·판단 책임·late recovery를 엔딩과 정확히 연결하기 위해서다.
  - 상태: **완료** — CYNIC+success=NORMAL, technical failure≠BAD, HIDDEN 5조건을 runtime test로 보호.

- [x] **GOOD/NORMAL/BAD/HIDDEN + canonical post-credit**
  - 기존 문제: HIDDEN runtime과 독립 post-credit가 없고 GOOD 뒤 후속 정보가 감정적 완결을 침범했다.
  - 변경안: 4 ending을 분리하고 GOOD/HIDDEN만 같은 canonical post-credit로 연결.
  - 이유: 본편 결말과 sequel hook을 분리하면서 심사 결과 왜곡 개그를 제거하기 위해서다.
  - 상태: **완료** — 분기 로직 완료. Post-credit visual asset은 별도 `OPEN`.

- [x] **Global composition preset·safe zone**
  - 기존 문제: 장면마다 actor 위치가 달라 face·staff·core가 겹쳤다.
  - 변경안: conversation/confrontation/protect/battle/solo-cut/ending preset과 좌·중앙 support·우 safe zone.
  - 이유: 고정 좌표 hack 대신 3개 PC viewport에서 일관된 구도를 만들기 위해서다.
  - 상태: **완료** — actor no-overlap foundation과 responsive metadata 구현.

- [x] **CUT mode / SPRITE mode exclusivity**
  - 기존 문제: baked transform CUT 위에 live Doyun/Juno가 함께 보여 인물이 중복됐다.
  - 변경안: full baked CUT frame에서는 모든 live actor를 숨기고 live scene에서만 다시 표시.
  - 이유: 동일 인물 중복과 silhouette 충돌을 구조적으로 막기 위해서다.
  - 상태: **완료** — transform CUT01/02 live actor count 0.

- [x] **VN UI design system foundation**
  - 기존 문제: 큰 rounded card, 제각각인 accent, dashboard형 선택지가 배경·연기를 가렸다.
  - 변경안: navy-black surface, 1px border, 작은 radius, speaker accent, vertical response hierarchy.
  - 이유: 장면별 AI-generated component가 아니라 하나의 authored VN처럼 보이게 하기 위해서다.
  - 상태: **완료** — HQ-02 사용자 `PASS`; 전역 HQ-13은 scene-specific UI 때문에 `HUMAN_RECHECK`.

- [x] **N0~N2 early-scene mini-sequence**
  - 기존 문제: 이상한 prompt와 주노 등장 사이의 시각적 연결과 도윤 반응이 약했다.
  - 변경안: direct-wish monitor → suspicious Doyun → Juno monitor emergence CUT → N2 live.
  - 이유: 같은 workstation·night lighting 안에서 초현상이 단계적으로 커지게 하기 위해서다.
  - 상태: **완료** — baked prompt 1회, accessible hidden semantic, CUT actor duplicate 0.

- [ ] **Wraith omen**
  - 기존 문제: 회색 망령이 전조 없이 나타나 장면 전환이 갑작스러웠다.
  - 변경안: N2→N3 natural edge에서만 작은 caption과 synthesized WebAudio cue를 1회 표시.
  - 이유: save/FSM을 바꾸지 않고 “무언가 깨어난다”는 리듬을 만들기 위해서다.
  - 상태: **부분 완료** — 기술·브라우저 검증 완료, 실제 청감·reduced-motion 사용자 `HUMAN_RECHECK`.

- [ ] **Doyun acting·transform face continuity**
  - 기존 문제: 초반부터 놀란 표정이 반복되고 CUT에서만 공개된 얼굴이 live에서 다시 가려졌다.
  - 변경안: tired→suspicious→surprise 단계와 Option A “변신 후 N5~N8 얼굴 공개” 적용.
  - 이유: 사건 강도와 캐릭터 감정 개방을 같은 시각 언어로 연결하기 위해서다.
  - 상태: **부분 완료** — mapping·5종 facial edit 구현, HQ-01·03·05·07 사용자 `HUMAN_RECHECK`.

- [x] **Battle presentation 개선**
  - 기존 문제: HUD·BGM·대화·command UI가 경쟁하고 작은 viewport에서 겹쳤다.
  - 변경안: top safe lane, actor battle zones, compact command deck, dialogue/dock 16px+ gap.
  - 이유: 전투 정보 위계와 캐릭터 행동을 동시에 읽게 하기 위해서다.
  - 상태: **완료** — actor/HUD/safe-gap과 command deck 정렬·voice/click/result presentation 사용자 `PASS / FREEZE`.

- [ ] **Ending·Post-credit presentation 개선**
  - 기존 문제: Ending은 generic modal처럼 보이고 post-credit는 검은 마법소녀보다 UI가 주인공이었다.
  - 변경안: editorial ending layout과 black magical girl character-first composition.
  - 이유: 결말의 감정과 후속 훅을 서로 다른 시각적 정점으로 만들기 위해서다.
  - 상태: **부분 완료** — GOOD/NORMAL/BAD/HIDDEN 공통 result frame·actor safe-zone은 HQ-11 사용자 `PASS / FREEZE`; HQ-12 Post-credit만 `OPEN`.

- [ ] **잔여 visual production**
  - 기존 문제: Juno는 표정 5종만 있어 행동 silhouette가 반복되고 정화·후속 훅의 핵심 cut이 없다.
  - 변경안: Juno barrier/protect·encourage/cast·point/explain, final purification, black magical girl 후보 제작.
  - 이유: 감정 표정과 행동 연기를 분리하고 climax·post-credit 밀도를 높이기 위해서다.
  - 상태: **미착수** — 신규 binary 제작 전 scene/layout 계약 재확인 필요.

- [ ] **Rights/provenance와 asset approval 분리**
  - 기존 문제: 파일 준비, 생성 계보, 권리 확인, 사람 품질 승인이 한 상태처럼 읽혔다.
  - 변경안: `ready`/`approved`, `USER ATTESTED`, internal lineage, accepted submission risk를 분리.
  - 이유: 확인되지 않은 법률 승인이나 제작 이력을 과장하지 않기 위해서다.
  - 상태: **부분 완료** — AR-09 PASS 후보·비차단; exact model/work ID와 사람 품질 승인은 별도.

- [x] **CI와 최신 Pages 자동 배포**
  - 기존 문제: 로컬 검증은 통과했지만 Ubuntu CI의 Python dependency와 shallow history가 배포를 막았다.
  - 변경안: Python 3.12+numpy/Pillow, full Git history checkout, source validation 뒤 Pages deploy.
  - 이유: historical asset verifier를 유지한 채 main과 public build를 동일하게 만들기 위해서다.
  - 상태: **완료** — run #33 build/deploy `SUCCESS`, public HTTP 200, SHA `df3a94d`.

- [ ] **AR-10 public cold-load gate**
  - 기존 문제: HTTP 200과 로컬 체감 속도만 있고 공식 공개망 성능 증거가 없다.
  - 변경안: cold cache 5회 모두 first-screen ready ≤3,000ms, asset/error/FOIT 0.
  - 이유: 실제 팀원·심사 환경의 최초 진입 시간을 수치로 보증하기 위해서다.
  - 상태: **미착수** — 최종 asset/bundle freeze 뒤 측정.

---

# 3. 수정안

초기 변경안을 실제 구현·사람 QA에서 다시 다듬은 항목이다. `첫 구현 → 발견된 문제 → 최종 수정` 순으로 읽으면 된다.

- [x] **TITLE microphone `NO_DEVICE` 오판 수정**
  - 첫 구현: placeholder option도 device selector의 값으로 전달됐다.
  - 발견된 문제: 표시 문구가 `deviceId.exact`가 되어 실제 장치가 있어도 `NO_DEVICE`로 분류될 수 있었다.
  - 최종 수정: placeholder value를 명시적으로 비워 실제 device ID만 capture에 전달했다.
  - 현재 결과: TITLE mic 연결·test·gameplay ownership actual QA 통과.

- [x] **Narration·dialogue `계속 ›` 위치 규격화**
  - 첫 구현: body flow 안의 compact link 또는 scene별 별도 anchor였다.
  - 발견된 문제: 문장 길이와 장면에 따라 CTA 위치가 계속 움직이고 본문의 일부처럼 읽혔다.
  - 최종 수정: core shell 우하단 고정 slot, direct-wish CUT는 전용 중앙 하단 위쪽 slot로 분리했다.
  - 현재 결과: 일반 dialogue와 scene-specific CUT가 서로의 CTA 규칙을 바꾸지 않는다.

- [x] **Choice card grid → VN response list**
  - 첫 구현: 1~3개 선택지를 같은 크기의 3-column card로 표시했다.
  - 발견된 문제: 설문·dashboard처럼 보여 대사보다 UI가 앞섰다.
  - 최종 수정: 1~3개는 numbered vertical list, 4개 이상만 최대 2-column로 제한했다.
  - 현재 결과: HQ-02 공통 dialogue/choice UI 사용자 `PASS`.

- [x] **Early Doyun 감정 과장 완화**
  - 첫 구현: `normal_startled`와 강한 facepalm이 초반 여러 beat에 반복됐다.
  - 발견된 문제: 초현상을 보기 전부터 기겁하거나 절망하는 사람처럼 보였다.
  - 최종 수정: tired→suspicious→actual surprise mapping, full facepalm runtime use 0으로 정리했다.
  - 현재 결과: mapping 구현 완료, 전체 감정선은 HQ-01·04 `HUMAN_RECHECK`.

- [x] **Doyun suspicious·employee-ID 전용 pose 도입**
  - 첫 구현: 기존 normal/startled로 의심과 사원증 부상을 함께 표현했다.
  - 발견된 문제: 시선·손·사건 focal relation이 맞지 않고 강한 놀람이 반복됐다.
  - 최종 수정: `normal_suspicious`는 N1/N2, `employee_id_surprised`는 N5 첫 beat에만 매핑했다.
  - 현재 결과: logical mapping·규격 PASS, HQ-03 사람 장면 재검수 대기.

- [x] **Employee-ID sprite magenta alpha cleanup**
  - 첫 구현: 캐릭터 정규화 뒤 머리 둘레에 반투명 magenta fringe가 남았다.
  - 발견된 문제: 어두운 office 배경에서 보라색 외곽선처럼 드러났다.
  - 최종 수정: historical baseline의 artifact 1,923px만 alpha 0으로 정리하고 그 밖 pixel 변경 0을 검증했다.
  - 현재 결과: source/runtime 동일, 생성형 재그리기 없음, 실제 합성 `HUMAN_RECHECK`.

- [x] **N3 대치 구도와 Juno anchor 수정**
  - 첫 구현: Wraith가 작고 Doyun/Juno 뒤에 끼었으며 Juno가 중앙 위에 떠 있었다.
  - 발견된 문제: 적↔주인공 대립축과 support triangle이 읽히지 않았다.
  - 최종 수정: Wraith LEFT/CENTER-LEFT, Doyun RIGHT, Juno Doyun-side center-low로 분리했다.
  - 현재 결과: actor overlap 0 foundation; 최종 미술 판정은 HQ-08 `HUMAN_RECHECK`.

- [x] **무조건 mirror 대신 asset별 방향 감사**
  - 첫 구현: 화면 안쪽을 보게 하려면 공통 `scaleX(-1)` 적용이 쉬웠다.
  - 발견된 문제: 사원증·지팡이·의상·손잡이 비대칭이 뒤집힐 수 있었다.
  - 최종 수정: Wraith 2종만 `SAFE_TO_MIRROR`, Doyun 13종·Juno 5종은 `USE_ORIGINAL_ONLY`로 기록했다.
  - 현재 결과: inward-facing metadata 구현, HQ-09 `HUMAN_RECHECK`.

- [x] **Transform CUT/live actor 중복 제거**
  - 첫 구현: baked Doyun/Juno가 있는 CUT 위에 live sprite도 보였다.
  - 발견된 문제: 같은 인물이 한 frame에 두 번 등장했다.
  - 최종 수정: CUT mode에서는 live actor 0, transformed-live에서만 sprite를 복귀시켰다.
  - 현재 결과: CUT/SPRITE exclusivity contract와 focused test로 고정.

- [x] **Transform CUT 보상감·handoff 개선**
  - 첫 구현: 작은 상단 wide frame과 큰 검정 여백, CUT02→office hard cut이었다.
  - 발견된 문제: 얼굴·사원증 reward가 작고 pose/location 변화가 거칠었다.
  - 최종 수정: full-stage/near-full-stage CUT, white/blue flash 220ms, live fade 340ms/80ms delay.
  - 현재 결과: reduced-motion과 duplicate actor 0을 유지한다.

- [x] **N5 transformation result UI·표정 수정**
  - 첫 구현: 큰 중앙 modal이 Juno를 가리고 `magical_pose`는 고통·절망처럼 보였다.
  - 발견된 문제: 성공·민망함의 보상 장면과 UI/얼굴 감정이 충돌했다.
  - 최종 수정: compact cyan result card와 즉시 활성 CTA, heart-hands body를 유지한 head-only expression edit.
  - 현재 결과: UI overlap 0, asset은 HQ-07 `HUMAN_RECHECK`.

- [x] **Wraith omen 자동 진행 → 명시적 진행**
  - 첫 구현: natural edge caption이 짧게 유지된 뒤 자동으로 N3로 이동했다.
  - 발견된 문제: 사용자가 전조 문장을 읽기 전에 장면이 넘어갈 수 있었다.
  - 최종 수정: 작은 caption 전용 `계속 ›`를 누를 때까지 유지하고 Resume/debug/re-render 재생은 0으로 보존했다.
  - 현재 결과: story node/save 변경 없이 edge-only presentation으로 동작.

- [x] **Wraith 위협 scale 재조정**
  - 첫 구현: N3/N6에서 망령이 background prop처럼 작았다.
  - 발견된 문제: Doyun과의 대립이 약하고 실루엣 존재감이 부족했다.
  - 최종 수정: N6 first choice에만 42vw/780px·80vh/860px 상한을 적용하고 Battle scale은 동결했다.
  - 현재 결과: actor/UI 가림 0, 최종 사람 미술 판정 대기.

- [x] **Battle HUD/BGM safe lane 분리**
  - 첫 구현: 상단 Battle HUD와 BGM control이 같은 영역을 사용했다.
  - 발견된 문제: 우측 상단 UI가 실제로 겹치고 Juno가 dialogue/command 영역과 경쟁했다.
  - 최종 수정: BGM top-left lane을 보존하고 Battle HUD를 오른쪽에서 시작, Juno를 lower support lane으로 이동했다.
  - 현재 결과: 3개 PC viewport HUD overlap 0; HQ-10 전체 redesign은 `OPEN`.

- [x] **Battle dialogue/command dock responsive gap**
  - 첫 구현: 1920에서는 정상이지만 1366×768에서 11.7px 겹쳤다.
  - 발견된 문제: 자동 bbox 0 판정과 달리 실제 visible panel이 충돌했다.
  - 최종 수정: actor·dock anchor를 유지하고 dialogue bottom clamp 하한만 `190px → 228px`로 조정했다.
  - 현재 결과: gap 27.4/20.0/16.6px, 3개 viewport 최소 16px 충족.

- [x] **GOOD Ending actor/card 임시 안전영역**
  - 첫 구현: Juno가 중앙 ending card와 겹쳤다.
  - 발견된 문제: 결말 actor와 system-like modal이 같은 focal area를 차지했다.
  - 최종 수정: Juno를 card 밖 left-low lane에 배치해 Juno/card·Juno/Doyun 충돌을 제거했다.
  - 현재 결과: responsive safe-zone PASS, HQ-11 editorial layout은 여전히 `OPEN`.

- [x] **Transform face continuity Option A 적용**
  - 첫 구현: CUT01/02에서만 얼굴이 보이고 post-transform live에서는 다시 눈이 가려졌다.
  - 발견된 문제: 의도된 reveal이 아니라 서로 다른 제작 시점의 불일치처럼 보였다.
  - 최종 수정: `magical`, defend, attack, finish 각각의 기존 몸·입·긴장도를 유지한 masked face edit를 적용했다.
  - 현재 결과: mask 밖 pixel/alpha 변경 0; 4종 감정 차이는 HQ-05 `HUMAN_RECHECK`.

- [x] **CI Python asset-verifier dependency 보완**
  - 첫 구현: 로컬 Python 환경에는 numpy/Pillow가 있었지만 Ubuntu workflow에는 설치 단계가 없었다.
  - 발견된 문제: run #31 `Validate source`가 `ModuleNotFoundError: numpy`로 실패했다.
  - 최종 수정: Python 3.12와 필요한 `numpy`, `Pillow`만 명시적으로 설치했다.
  - 현재 결과: run #33에서 dependency install·source validation PASS.

- [x] **CI historical baseline shallow checkout 수정**
  - 첫 구현: asset verifier는 과거 binary와 현재 cleanup을 비교했지만 checkout history가 얕았다.
  - 발견된 문제: run #32에서 historical Git object를 읽지 못해 `Validate source`가 실패했다.
  - 최종 수정: `fetch-depth: 0`과 실제 tracked historical runtime path 검증을 추가했다.
  - 현재 결과: verifier를 약화하지 않고 run #33 build/deploy `SUCCESS`.

---

# 4. 폐기안

논의·초기 구현했지만 현재 계약에서 사용하지 않는 의미 있는 방향만 기록한다.

- [x] **TITLE의 마이크 필수 gate**
  - 원래 의도: 실제 음성 게임임을 보이기 위해 calibration 성공 전 Start/Resume을 막는다.
  - 폐기 이유: 권한 거절·장치 없음·미지원 환경에서 게임 자체를 시작할 수 없었다.
  - 대체안: optional 9-state microphone과 처음부터 끝까지 가능한 click mode.

- [x] **첫 음성 실패에서 전역 click 전환**
  - 원래 의도: 네트워크 장애 뒤 즉시 안정적인 click 경로를 제공한다.
  - 폐기 이유: 일시 장애 한 번으로 사용자의 voice 선택을 과도하게 취소했다.
  - 대체안: 같은 턴 retry/click과 실제 typed failure 누적 다섯 번째의 전역 전환.

- [x] **기술 실패를 BAD 또는 낮은 ending으로 처리**
  - 원래 의도: 최종 주문 실패를 하나의 결말 조건으로 단순화한다.
  - 폐기 이유: STT·timeout·HTTP·schema 오류는 인물의 서사적 선택이 아니다.
  - 대체안: technical failure는 retry/click fallback, 명시적 narrative refusal만 BAD.

- [x] **비평/부정 평가 자체를 회색 망령의 악으로 정의**
  - 원래 의도: 냉소를 물리치고 즐거움을 회복하는 메시지를 단순하게 전달한다.
  - 폐기 이유: 심사 기준과 비판 자체를 부정하거나 무조건 긍정하는 이야기로 읽힐 수 있었다.
  - 대체안: 망령은 “실망하기 싫어 기대하지 않는 체념”, 도윤은 끝까지 확인한 뒤 판단한다.

- [x] **N6의 `방어/공격/둘 다` 동급 기본 선택**
  - 원래 의도: 모든 행동 스타일을 처음부터 열어 자유도를 높인다.
  - 폐기 이유: “둘 다”가 사실상 최적 정답처럼 보였다.
  - 대체안: 첫 행동은 방어 또는 공격, 성공·관계/dual intent 뒤 선택 가능한 두 번째 주문.

- [x] **HIDDEN의 `만장일치 통과` 개그**
  - 원래 의도: 완벽한 플레이의 과장된 보상을 보여준다.
  - 폐기 이유: 마법 사건이 실제 게임 심사 결과를 왜곡한 것처럼 보였다.
  - 대체안: 심사 결과는 보존하고 사내 변신 영상 viral 개그만 유지.

- [x] **GOOD 직후 긴 1,024개 잔향 후속 설명**
  - 원래 의도: 다음 이야기의 규모와 검은 마법소녀를 강하게 예고한다.
  - 폐기 이유: GOOD의 감정적 완결을 깨고 정보가 과했다.
  - 대체안: GOOD/HIDDEN 종료 뒤 하나의 간결한 canonical post-credit.

- [x] **CUT와 같은 인물 live sprite 동시 표시**
  - 원래 의도: 기존 scene stage를 유지한 채 CUT을 overlay한다.
  - 폐기 이유: baked actor와 live actor가 중복되어 장면 판독이 깨졌다.
  - 대체안: CUT mode와 SPRITE mode의 상호 배타 렌더.

- [x] **모든 actor의 일괄 mirror·global scale**
  - 원래 의도: 적↔주인공 시선과 크기를 한 CSS 규칙으로 빠르게 통일한다.
  - 폐기 이유: 의상·지팡이·사원증 비대칭과 scene별 bbox 차이를 훼손했다.
  - 대체안: asset별 mirror safety와 named composition preset.

- [x] **3-column generic choice cards와 giant modal**
  - 원래 의도: 선택지를 균등하게 보여 주고 중요 장면을 큰 card로 강조한다.
  - 폐기 이유: dashboard·survey처럼 보이고 캐릭터·배경의 비중을 낮췄다.
  - 대체안: vertical VN response list, compact/editorial progression control.

- [x] **Baked prompt와 동일한 visible DOM text 이중 표시**
  - 원래 의도: 이미지 속 문구와 runtime prompt를 동시에 명확히 보여 준다.
  - 폐기 이유: 같은 문장이 겹치고 승인된 monitor composition을 훼손했다.
  - 대체안: visible baked text는 한 asset에만 허용하고 DOM은 screen-reader semantic으로 숨긴다.

- [x] **CI 통과를 위한 historical verifier 제거·약화**
  - 원래 의도: 과거 object 조회 실패를 우회해 Pages 배포를 빠르게 재개한다.
  - 폐기 이유: employee-ID cleanup의 “artifact 밖 pixel 변경 0” 증거를 잃는다.
  - 대체안: 실제 pre-cleanup tracked path와 full history checkout으로 검증 의미를 그대로 보존.

---

## 인계 당시 vs 현재

| 구분 | 인계 당시 | 현재 | 상태 |
|---|---|---|---|
| Story | v2, N0~N5·3-phase battle·GOOD/NORMAL/BAD | 승인된 v3.1 주제, 18 nodes, N6/N7/N8, 4 endings, canonical post-credit | runtime 완료·visual QA 진행 |
| Voice | Realtime/PTT/Worker 기반, 실패 의미·복구가 분산 | 7 typed failures, 누적 5회, actual dialogue/incantation/battle QA | core 완료 |
| TITLE | 중앙 mic calibration 중심, mic 성공이 진입 gate | PC 3 viewport, optional mic, 9-state FSM, Settings, BGM 20%, OpenAI 제출 배경 교체 | UX freeze·새 배경 HUMAN_RECHECK |
| VN UI | 큰 rounded panel과 card형 선택 | 공통 navy VN shell, speaker accent, vertical choice, editorial CTA | HQ-02 PASS; HQ-13 재검수 |
| Character acting | early startled/facepalm 반복, 변신 얼굴 불연속 | suspicious·ID reaction 전용 pose, facepalm remap, post-transform 공개 얼굴 | 구현·HUMAN_RECHECK |
| Composition | scene별 좌표, actor overlap·방향 규칙 부재 | named preset, safe zone, inward-facing audit, CUT/SPRITE exclusivity | foundation 완료 |
| Battle | 3-phase 기능 중심, HUD/actor/UI 충돌 가능 | actor lanes, HUD/BGM 분리, responsive dialogue/dock 16px+, 정돈된 command/result deck | HQ-10 PASS / FREEZE |
| Ending | GOOD/NORMAL/BAD, HIDDEN·독립 post-credit 없음 | 4 endings, 공통 result frame·독립 header/title·detached CTA·Juno safe-zone | HQ-11 PASS / FREEZE; HQ-12 OPEN |
| Assets | 핵심 자산 다수와 SSOT 골격 | runtime 48 files/14.61MiB, early cuts·poses·face edits·OpenAI 제출 TITLE·hash 검증 | 기술 ready; 사람 approved 대기 |
| Rights | tool/plan/reference 상태가 일부 혼재 | USER ATTESTED/internal lineage/Suno Pro를 분리 기록하고 과거 NHN TITLE은 archive, 현재 OpenAI 제출본 provenance는 별도 기록 | AR-09 PASS 후보·새 TITLE exact 모델/work ID UNKNOWN |
| Tests | 41 files / 187 tests 기록 | 64 files / 463 tests PASS | 확대 완료 |
| CI | 로컬과 Ubuntu Python/Git history 차이 미검증 | Python deps, historical verifier, full checkout, build/deploy 자동화 | run #33 SUCCESS |
| Public Pages | 이전에는 TITLE baseline `2a6d9e4` 제공 | 최신 `main` `df3a94d` 배포, HTTP 200 | 최신본 공개 |

## 남은 작업

### 반드시 남은 작업

- [ ] **AR-01 Human visual/audio scene QA:** Wraith omen 청감, BGM loop/masking/duck, 전체 click/voice scene composite를 사람 기준으로 승인한다.
- [ ] **AR-02 Style/scene consistency:** HQ-01·03·05·07·08·09의 `HUMAN_RECHECK`와 캐릭터·배경·CUT 전수 style-anchor 판정을 닫는다.
- [ ] **HQ-10 Battle:** safe-gap은 유지하되 command deck·정보 위계의 전체 redesign과 human approval을 완료한다.
- [ ] **HQ-11 Ending:** 임시 safe-zone 위에서 GOOD/NORMAL/BAD/HIDDEN의 editorial layout과 감정 차이를 승인한다.
- [ ] **HQ-12 Post-credit:** `ending.black_magical_girl` 실자산과 character-first corridor composition을 구현·검수한다.
- [ ] **잔여 visual production 우선순위:** release closure 직접 관련은 ① Black Magical Girl post-credit asset, ② final purification CUT이다. 이후 ③ Juno barrier/protect, ④ Juno encourage/cast, ⑤ Juno point/explain 순으로 진행하며, 그 밖의 배경/컷 후보는 keep/edit/new/presentation으로 최종 판정한다.
- [ ] **AR-10:** 최종 asset freeze 뒤 public Pages cold cache 5/5에서 first-screen ready ≤3초를 증명한다.
- [ ] **Final release QA:** 최신 Pages SHA에서 required asset 200, console error 0, click/voice ending matrix와 제출 smoke를 다시 확인한다.

### 선택적 polish

- [ ] N0 seated Doyun IMAGE 1은 `P2 OPTIONAL`; 현재 runtime dependency 없이 deferred 상태다.
- [ ] source SFX 5종 runtime 연결은 WebAudio cue와 중복·PTT 오염을 별도 검증할 때만 진행한다.
- [ ] narration `계속 ›` discoverability의 소폭 강조는 현재 승인된 VN geometry를 바꾸지 않는 범위에서만 검토한다.
- [ ] 과거 “17번째 배경”은 파일명·용도가 확인될 때만 추가하며 현재 16개 mapping을 흔들지 않는다.
- [ ] Transformers 516.22kB chunk warning은 release blocker가 아니며 별도 dependency hardening으로 분리한다.

### 완료되어 건드리지 않는 영역

- [x] Scenario v3.1의 주제·N6/N7/N8·ending 의미 계약과 schema v1 save 호환.
- [x] Realtime voice core, 7종 failure, 누적 5회, one-stream PTT meter, click fallback.
- [x] PC TITLE, 20% BGM 기본값, optional mic, 9-state FSM, local fonts.
- [x] HQ-02 core VN dialogue/choice foundation과 TITLE 비변경 계약.
- [x] global composition preset, actor safe zone, CUT/SPRITE exclusivity, approved transform handoff.
- [x] historical asset verifier의 비교 의미와 source/runtime SSOT 경계.
- [x] `main`의 run #33 GitHub Pages 배포 기반. 다음 변경은 새 검증 run으로만 갱신한다.

## 주요 근거 문서

- [개발 구현 기록](IMPLEMENTATION_LOG.md)
- [Human Scene QA living backlog](HUMAN_SCENE_QA_BACKLOG.md)
- [QA·시연 계약](QA_AND_DEMO.md)
- [Scenario v3.1 완성대본](../심사역은_마법소녀가_되었다_완성대본_v3.md)
- [Asset Manifest](../assets/ASSET_MANIFEST.md)
- [Scene Asset Mapping](../assets/SCENE_ASSET_MAPPING.md)
- [Provenance](../assets/PROVENANCE.md)
- [2026-08-17 종합 보고서](../reports/PROJECT_DEVELOPMENT_PROGRESS_REPORT_2026-08-17.md)

## Git SHA Appendix

| 기준점 | SHA | 의미 |
|---|---|---|
| 인계 baseline | `2a5821d` | Realtime voice·BGM controls가 있는 v2 public prototype |
| Voice Phase A | `651781c` | 누적 5회 실패 정책 actual manual gate 기록 |
| PTT Phase B | `2addc0e` | one-stream live meter Chrome 검증 |
| TITLE public baseline | `2a6d9e4` | PC TITLE·interaction·asset SSOT 정렬 당시 공개 기준 |
| Rights evidence | `8279a8d` | OpenAI/Suno/NHN 제출 맥락 attestation 기록 |
| Scenario v3 / v3.1 | `87f3f43` / `e039095` | story rewrite와 branching logic closure |
| Runtime composition | `4e7f4bc` | v3.1 data/FSM/composition 구현 |
| VN UI Phase A/A.1 | `e3025e5` / `7e9acab` | 공통 VN foundation과 interaction hierarchy |
| Early-scene assets | `18e9bd5` | suspicious·employee-ID·monitor CUT 통합 |
| Omen/face closure | `d4dc048`~`1e79156` | natural-edge omen, audio cue, alpha cleanup, 공개 얼굴, QA evidence |
| Scene safe zones | `27d0156` / `6add9db` | N6/Battle/Ending 보정과 1366 command gap closure |
| CI dependencies | `f3e8757` | Python 3.12, numpy, Pillow 설치 |
| 현재 main/public | `df3a94d` | historical baseline full checkout, Actions run #33 배포 성공 |

배포 증거: [GitHub Actions run #33](https://github.com/2klips/the-judge-became-a-magical-girl/actions/runs/32640208250) — build/deploy `SUCCESS`, head SHA `df3a94d`.
