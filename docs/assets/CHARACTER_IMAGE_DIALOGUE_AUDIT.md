# 장면별 캐릭터 이미지-대화 정합 점검

- 점검일: 2026-08-06
- 범위: `scenario.json` 14개 노드 전 라인·비트·intent, 전투 p1~p3 상태, GOOD/NORMAL/BAD 전 라인
- 정답 소스: `SCENE_ASSET_MAPPING.md` §4 → 완성대본 v2 §3·N0~엔딩 → `scenario.json`
- 실제 렌더 소스: `presentationDoyun.ts`, `gameView.ts`, `GameState.npcEmotion`, `enemyStateFor(momentum)`
- 판정: `OK` / `A` presentation 오매핑 / `B` 작가 JSON 값 검토 필요 / `C` 실이미지 부족
- 보호 규칙: B형은 이 점검에서 `scenario.json`을 수정하지 않는다. C형은 기존 이미지·CSS 폴백으로 완주성을 유지한다.

타이틀은 JSON 노드 수에 포함되지 않는다. 계약대로 캐릭터를 표시하지 않아 `OK`다.

## 1. N0~N3

| 노드 | 라인·비트 | 화자·대사 요지 | 계약상 이미지 | 실제 렌더 이미지 | 판정 |
|---|---|---|---|---|---|
| `n0_review` | line 0 | 내레이션: 늦은 밤 평가표 | 인물 없음 | 인물 없음 | OK |
| `n0_review` | line 1 | 내레이션: 차별성 부족 | 인물 없음 | 인물 없음 | OK |
| `n0_review` | line 2 | 내레이션: 기존 작품과 유사 | 도윤 `normal_tired` | 도윤 `normal_tired` | OK |
| `n0_review` | line 3 | 내레이션: 붙여넣다 멈춤 | 도윤 `normal_tired` | 도윤 `normal_tired` | OK |
| `n0_review` | line 4 | 내레이션: 원하는 것을 말하라 | 도윤 `normal_startled` | 도윤 `normal_startled` | OK |
| `n1_first_voice` | opening | 익명 목소리: 원하는 것을 말해 줘 | 도윤 `normal_startled`, 주노 미노출 | 도윤 `normal_startled` + 빛 구체, 주노 미노출 | OK |
| `n1_first_voice` | `seek_new_fun` | 새 재미를 원함 | 도윤 `normal_startled`, 주노 미노출 | 동일 | OK |
| `n1_first_voice` | `want_rest` | 쉬고 싶음 | 도윤 `normal_startled`, 주노 미노출 | 동일 | OK |
| `n1_first_voice` | `question_signal` | 목소리 정체 의심 | 도윤 `normal_startled`, 주노 미노출 | 동일 | OK |
| `n2_juno_intro` | opening | 주노 첫 등장·마법소녀 선언 | 도윤 `normal_startled`; 주노 첫 비트 `surprised` 뒤 `happy` | 도윤 `normal_startled`; 주노 `happy`로 바로 시작 | **B** — `npc.startEmotion` 검토 |
| `n2_juno_intro` | `curious_magic` | 호기심·호의 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `n2_juno_intro` | `realistic_objection` | 성별·근로조건 확인 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n2_juno_intro` | `reject_juno` | 냉담·거절 | 도윤 `normal_tired`; 주노 `upset` | 동일 | OK |
| `n2_juno_followup` | opening | 질문 하나만 받음 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n2_juno_followup` | `ask_identity` | 주노 정체 확인 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n2_juno_followup` | `ask_why_chosen` | 선택 이유 질문 | 도윤 `normal_shy`; 주노 `shy` | 동일 | OK |
| `n2_juno_followup` | `stay_cold` | 본론만 재촉 | 도윤 `normal_tired`; 주노 `upset` | 동일 | OK |
| `n3_wraith_choice` | opening | 망령 정체와 대응 질문 | 도윤 `normal_startled`; 망령 `normal`; 주노 `upset` | 동일 | OK |
| `n3_wraith_choice` | `protect_others` | 사람·게임을 먼저 걱정 | 도윤 `normal_startled`; 망령 `normal`; 주노 반응 종착 `happy` | 동일 | OK |
| `n3_wraith_choice` | `seek_method` | 해결 방법 확인 | 도윤 `normal`; 망령 `normal`; 주노 `neutral` | 동일 | OK |
| `n3_wraith_choice` | `withdraw_or_agree` | 도망·체념·동조 | 도윤 `normal_tired`; 망령 `normal`; 주노 `upset` | 동일 | OK |

근거: `SCENE_ASSET_MAPPING.md` §4.1 및 응답 직후 도윤 감정 매핑, 완성대본 v2 §도윤 이미지 사용 매핑·N2·N3.

## 2. N4 세 분기

| 노드 | 라인·비트 | 화자·대사 요지 | 계약상 이미지 | 실제 렌더 이미지 | 판정 |
|---|---|---|---|---|---|
| `n4_team` | opening | 좋은 호흡 확인 | 도윤 `normal_smile`; 망령 `normal`; 주노 `happy` | 동일 | OK |
| `n4_team` | `match_rhythm` | 같이 호흡 맞춤 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `n4_team` | `tease_juno` | 호흡을 농담으로 받아침 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `n4_team` | `focus_action` | 변신부터 하자고 집중 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n4_cooperate` | opening | 제한적 협력 제안 | 도윤 `normal`; 망령 `normal`; 주노 `neutral` | 동일 | OK |
| `n4_cooperate` | `follow_steps` | 지금은 지시에 따름 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n4_cooperate` | `demand_answers` | 끝난 뒤 설명 요구 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n4_cooperate` | `complain_then_help` | 불평하면서 도움 | 도윤 `normal_shy`; 주노 `shy` | 동일 | OK |
| `n4_awkward` | opening | 서먹함·시간 부족 | 도윤 `normal_shy`; 망령 `normal`; 주노 `upset` | 동일 | OK |
| `n4_awkward` | `repair_relation` | 사과·관계 회복 | 도윤 `normal_smile`; 주노 반응 종착 `shy` | 동일 | OK |
| `n4_awkward` | `limited_cooperation` | 지금만 협력 | 도윤 `normal`; 주노 `neutral` | 동일 | OK |
| `n4_awkward` | `keep_distance` | 거리 유지 | 도윤 `normal_tired`; 주노 `neutral` | 동일 | OK |

N4 마지막 `npcEmotion`은 상태에 저장된다. N5 도입과 주문 게이트에서 이 값을 다시 사용한다.

## 3. N5 변신

| 노드 | 라인·비트 | 화자·대사 요지 | 계약상 이미지 | 실제 렌더 이미지 | 판정 |
|---|---|---|---|---|---|
| `n5_transform` | line 0 | 내레이션: 사원증 부상 | 도윤 `normal_shy`; 망령 `normal`; 직전 N4 주노 표정 | 동일 | OK |
| `n5_transform` | line 1 | 망령: 창피함·무관심 압박 | 도윤 `normal_shy`; 망령 `normal`; 직전 N4 주노 표정 | 동일 | OK |
| `n5_transform` | line 2 | 주노: 주문을 따라오라고 외침 | 도윤 `normal_shy`; 망령 `normal`; 주노 `surprised` | 동일 | OK |
| `n5_transform` | 주문 게이트 | 두 문장 낭독 | 도윤 `normal_shy`; 직전 N4 주노 표정을 소형 유지 | **수정 전 주노 누락 → 수정 후 동일** | **A→OK** |
| `n5_transform` | 완전·표준 결과 | 변신 완료 | 도윤 `magical_pose`; `transform.cast`→`complete` 컷 속 주노 | 도윤 `magical_pose` + 컷 검은 폴백 + CSS | **C** — 컷 2장 미납품 |
| `n5_transform` | 구제 결과 | 주노가 함께 외침(`shy`) | 도윤 `magical_pose`; 완료 컷 속 주노 | 도윤 `magical_pose` + 컷 검은 폴백 + 텍스트 | **C** — 컷 2장 미납품 |

A형 수정: `renderIncantation()`이 `GameState.npcEmotion`을 읽어 주문 게이트에도 주노를 유지한다. 신규 논리 ID나 작가 JSON 변경 없음.

## 4. `battle_wraith` 전투

| 페이즈 | 비트 | 화자·대사 요지 | 계약상 이미지 | 실제 렌더 이미지 | 판정 |
|---|---|---|---|---|---|
| p1 `p1_defend` | 대기 | 망령: 기대하면 실망 | 도윤 `magical_defend`; 망령 momentum 상태; 주노 `neutral` | 동일 | OK/C¹ |
| p1 | 주문 성공 | 보호 주문·적 반응 | 도윤 `magical_defend`; 망령 momentum 상태; 주노 `neutral` | 동일 | OK/C¹ |
| p1 | 주문 실패 | 주문 불발 | 같은 페이즈 포즈, 망령 상태 유지, 주노 `neutral` | 동일 | OK/C¹ |
| p1 | 버티기 | 방어막으로 견딤 | 같은 페이즈 포즈, 망령 상태 유지, 주노 `neutral` | 동일 | OK/C¹ |
| p1 | momentum 65 전이 | 망령 균열·내부 빛 | 망령 `weakened` | `normal` + CSS 파생 폴백 | **C¹** |
| p2 `p2_attack` | 대기 | 망령: 실망의 귀환 | 도윤 `magical_attack`; 망령 momentum 상태; 주노 `happy` | 동일 | OK/C¹ |
| p2 | 주문 성공 | 별빛 공격·적 반응 | 도윤 `magical_attack`; 망령 momentum 상태; 주노 `happy` | 동일 | OK/C¹ |
| p2 | 주문 실패 | 주문 불발 | 같은 페이즈 포즈, 망령 상태 유지, 주노 `happy` | 동일 | OK/C¹ |
| p2 | 버티기 | 회색 파동을 견딤 | 같은 페이즈 포즈, 망령 상태 유지, 주노 `happy` | 동일 | OK/C¹ |
| p2 | momentum 65 전이 | 망령 균열·내부 빛 | 망령 `weakened` | `normal` + CSS 파생 폴백 | **C¹** |
| p3 `p3_answer` | 질문 대기 | 망령: 과거 게임·기대 질문 | 도윤 `magical_finish`; 망령 momentum 상태; 주노 `neutral` | 동일 | OK/C¹ |
| p3 | 주문 성공 | 마지막 주문·회색 핵 | 도윤 `magical_finish`; 망령 momentum 상태; 주노 `neutral` | 동일 | OK/C¹ |
| p3 | 주문 실패 | 마지막 주문 불발 | 같은 페이즈 포즈, 망령 상태 유지, 주노 `neutral` | 동일 | OK/C¹ |
| p3 | 버티기 | 주노가 앞을 막음 | 같은 페이즈 포즈, 망령 상태 유지, 주노 `neutral` | 동일 | OK/C¹ |
| p3 | momentum 65 전이 | 망령 균열·내부 빛 | 망령 `weakened` | `normal` + CSS 파생 폴백 | **C¹** |

¹ `gray_wraith.weakened` 실파일 미납품. `DEC-060`에 따라 동일 normal 스프라이트를 채도·밝기·균열 CSS로 파생하고, normal까지 실패하면 검은 화면으로 강등한다. `attack`/`hit`/`death`는 지시서 기본값에 따라 미등록 상태다.

## 5. 수렴·엔딩

| 노드 | 라인·비트 | 화자·대사 요지 | 계약상 이미지 | 실제 렌더 이미지 | 판정 |
|---|---|---|---|---|---|
| `ch3_gray_answer` | opening | 주노: 작은 회색 빛의 질문 | 도윤 `magical_pose`; 주노 `neutral`; 망령 제거 | 동일 | OK |
| `ch3_gray_answer` | `allow_one_more_play` | 한 번 더 직접 판단 | 도윤 `magical_pose`; 주노 `happy` | 동일 | OK |
| `ch3_gray_answer` | `reserve_final_judgement` | 가능성 유보 | 도윤 `magical_pose`; 주노 `neutral` | 동일 | OK |
| `ch3_gray_answer` | `reject_final_hope` | 기대 거절 | 도윤 `magical_pose`; 주노 `upset` | 동일 | OK |
| `ending_good` | line 0 | GOOD 제목 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `ending_good` | line 1 | 평가 삭제·재실행 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `ending_good` | line 2 | 즐거움이 분명함 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `ending_good` | line 3 | 더 플레이하고 싶음 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `ending_good` | line 4 | 주노: 재미의 소리가 들림 | 도윤 `normal_smile`; 주노 `happy` | 동일 | OK |
| `ending_good` | line 5 | 복도·검은 지팡이 잔향 흡수 | 도윤 숨김; 주노 `surprised` | 동일 | OK |
| `ending_good` | line 6 | TO BE CONTINUED·검은빛 | 도윤·주노 별도 표시 없음 | 동일 | OK |
| `ending_normal` | line 0 | NORMAL 제목 | 도윤 `normal_smile`; 주노 `neutral` | 동일 | OK |
| `ending_normal` | line 1 | 일부 회색 잔존 | 도윤 `normal_smile`; 주노 `neutral` | 동일 | OK |
| `ending_normal` | line 2 | 평가 저장 보류·재실행 | 도윤 `normal_smile`; 주노 `neutral` | 동일 | OK |
| `ending_normal` | line 3 | 주노: 포기가 아니라 기다림 | 도윤 `normal_smile`; 주노 `neutral` | 동일 | OK |
| `ending_normal` | line 4 | UNKNOWN USER CONNECTED | 도윤 `normal_smile`; 주노 `neutral` | 동일 | OK |
| `ending_bad` | line 0 | BAD 제목 | 도윤 `normal_empty`; 주노 `upset` | 동일 | OK |
| `ending_bad` | line 1 | 사무실 색 미복구 | 도윤 `normal_empty`; 주노 `upset` | 동일 | OK |
| `ending_bad` | line 2 | 추가 검토 불필요 | 도윤 `normal_empty`; 주노 `upset` | 동일 | OK |
| `ending_bad` | line 3 | 주노: 답을 빨리 정함 | 도윤 `normal_empty`; 주노 `upset` | 동일 | OK |
| `ending_bad` | line 4 | 주노: 다음에는 더 듣겠다 | 도윤 `normal_empty`; 주노 `upset` | 동일 | OK |

## 6. 분류 결과

### A형 — 수정 완료

| 위치 | 수정 전 | 계약 | 처리 |
|---|---|---|---|
| N5 주문 게이트 | 도윤만 표시, 주노 소실 | 도윤 `normal_shy` + 직전 N4 주노 표정 유지 | `resolveIncantationCompanionVisual()` 추가, `renderIncantation()`에 주노 표시 |

### B형 — 사용자 승인 전 변경 금지

| JSON 위치 | 현재값 | 대본·매핑 근거 | 제안값 | 영향 |
|---|---|---|---|---|
| `n2_juno_intro.npc.startEmotion` | `happy` | 완성대본 N2 첫 등장 `surprised → happy`; `SCENE_ASSET_MAPPING.md` §4.1도 동일 | `surprised` | opening에서 놀란 첫 등장, intent 응답부터 기존 `happy/neutral/upset` 사용 |

`public/scenario/scenario.json`은 수정하지 않았다.

### C형 — 제작 요청과 임시 대체 확인

| 항목 | 미납품 이미지 | 임시 대체 | 요청 문서 |
|---|---|---|---|
| 변신 영창·완료 | `cut_transform_01.webp`, `cut_transform_02.webp` | 배경 + 도윤 `magical_pose` + 검은 컷 영역 + CSS 플래시/파티클 | `IMAGE_REWORK_REQUEST.md` §1 |
| 망령 weakened | `char_gray_wraith_weakened.png` | `gray_wraith.normal` + CSS 채도·빛·균열 파생 | `IMAGE_REWORK_REQUEST.md` §1 |

기존 도윤 11종·주노 5종으로 표현할 수 없는 신규 감정은 발견되지 않았다. 새 논리 ID 제안 없음.

## 7. 육안 QA 상태

- 코드·문서 전수 대조: 완료.
- 22개 debug 프리뷰: 최종 UI 개편(WP3/WP4) 뒤 전수 재검증 예정.
- 실플레이 N4-A/B/C→N5 표정 연속성: 최종 UI 개편 뒤 브라우저에서 재검증 예정.
- 따라서 이 문서는 정합 계약 매트릭스이며, 최종 사람 합성 QA 완료 표시는 아니다.
