# Scenario v3.1 Acting / Direction Audit

- 감사일: 2026-08-22
- 기준 branch: `codex/scenario-v31-runtime-composition-p1`
- 시작 HEAD: `7e9acabbaa3b762e12684df187b3f8d4270bf901`
- 근거: Scenario v3.1, 실제 runtime resolver, tracked character binary, 최신 [Human Scene QA Backlog](../dev/HUMAN_SCENE_QA_BACKLOG.md)
- 범위: 기존 binary remap, 방향성·대치 구도 계약, 후속 visual-production handoff. binary 생성·편집 없음.

## 1. Early Doyun beat audit

| Node / beat | Story event | 변경 전 | 사람 판독 | 목표 | 현재 판정 |
|---|---|---|---|---|---|
| N0 line 0~1 | 야근 사무실·평가표 | 숨김 | 1인칭 도입 | 도윤 노출 전 establishing | `KEEP` |
| N0 line 2~5 | 평가 반복·멈춤·`happy_break`·게임 실행·음성 prompt | line 2~3 `normal_tired`, line 4~5 `normal_startled` | 초현상 전 공포가 너무 일찍 시작 | 피곤하지만 직접 확인하는 심사역 | 전부 `normal_tired`로 `REMAP` |
| N1 | 모니터 속 목소리가 실제 응답 | `normal_startled` | 강한 기겁 | 의심·집중·mild disbelief | 사용자 승인 `doyun.normal_suspicious`로 `REMAP` |
| N2 intro opening | 주노가 실제 등장 | `normal_startled` | 강한 놀람 | 실제 불가능 현상에서 첫 강한 surprise | `KEEP` |
| N2 intro response | 호기심 / 현실 확인 / 거절 | `smile` / `normal` / `tired` | 의도와 정합 | 관계별 온도 | `KEEP` |
| N2 follow-up | 정체 / 선택 이유 / 냉담 | `normal` / `normal_shy` / `tired` | 선택 이유에서 full facepalm이 절망처럼 읽힘 | attentive / attentive / cynical tired | `normal_suspicious` / `normal_suspicious` / `tired`로 `REMAP` |
| N3 opening | 평가 문장·안개 뒤 회색 망령 reveal | `normal_startled` | 사건 강도와 정합 | actual surprise | `KEEP` |
| N3 response | 사람 보호·방법 확인 / 철수·동조 | `startled` 또는 `normal` / `tired` | 선택 뒤에도 panic이 남을 수 있음 | 행동 집중 / 체념 | `normal` / `tired`로 `REMAP` |
| N4-A | 콤비 관계 확인 | `smile`, 행동 집중 시 `normal` | 정합 | 신뢰 / 행동 집중 | `KEEP` |
| N4-B | 마지못한 협력 | 일부 `normal_shy` | full facepalm이 과도함 | 냉정하게 협력 | `normal`로 `REMAP` |
| N4-C | 서먹함·회복 / 거리 유지 | opening `normal_shy`, 회복 `smile`, 거리 `tired` | opening facepalm 과도 | 중립 긴장 / 회복 / 거리 | opening `normal`, 나머지 유지 |
| N5 line 0 | 사원증 발광·부상 | `normal_shy` | 사건 focal과 무관한 절망 | 사원증을 보는 surprise/disbelief | 사용자 승인 `doyun.employee_id_surprised` 전용 매핑, 사람 재검수 대기 |
| N5 line 1~2·incantation | 망령 압박·주노 시범·낭독 | `normal_shy` | 계속 무너진 인상 | 압박을 견디고 행동 | `normal`로 `REMAP` |
| N5 transformed-live | 변신 결과 | `magical_pose` | 몸은 적합, 얼굴은 고통/패배 | 성공+당황+벅참 | body `KEEP`, head-only `EDIT 1` 적용·`HUMAN_RECHECK` |

`normal_shy` binary는 삭제하지 않는다. 다만 현재 v3.1 runtime mapping에서는 제거했고, mild facepalm을 다시 쓸 경우 먼저 표정·손 위치 EDIT와 사람 QA가 필요하다.

## 2. HQ-03 floating employee ID handoff

- 기존 asset 적합: **NO**였고 `normal_startled` proxy는 superseded됐다.
- 채택: `doyun.employee_id_surprised` / `char_doyun_employee_id_surprised.png`.
- 제작 inventory의 `NEW 1`은 사용자 승인본 import로 충족했으며 HQ-03 상태는 `HUMAN_RECHECK`다.
- 연기: 떠오르는 사원증을 바라봄, torso가 약간 물러남, 한 손이 사원증/가슴 쪽으로 움직임, 입은 작게 열림, 눈썹은 올라감.
- 감정: `SURPRISE / DISBELIEF`; `panic / horror / despair` 금지.
- 호환: 현재 Doyun 1200×2000 투명 canvas, right actor zone, 상반신 crop에서 사원증과 시선이 함께 읽혀야 한다.

## 3. HQ-04 facepalm audit

현재 `doyun.normal_shy` 사용처였던 N2 선택 이유, N4-B/C, N5 도입·영창을 모두 `normal` 또는 관계별 기존 asset으로 remap했다. 따라서 현재 runtime의 full-facepalm occurrence는 0이다.

- runtime mismatch 제거: `REMAP EXISTING`.
- 기존 binary 삭제: 금지.
- 후속 asset handoff: mild 관자놀이/이마 짚기 연기가 꼭 필요하다고 사람이 결정할 때만 `normal_shy`의 `EDIT 1` 후보. 현재 필수 신규 pose로 계산하지 않는다.

## 4. HQ-05 transformation face continuity — HUMAN DECISION REQUIRED

| 선택지 | 서사·시각 장점 | asset 영향 | 주의 |
|---|---|---|---|
| **A — Transformation Reveal** | 변신 CUT을 첫 full-face reveal로 삼고 이후에도 감정이 열린 도윤을 유지한다. 변화의 의미가 강하고 CUT→live 연속성이 좋다. | `magical_pose`는 2026-08-23 읽히는 눈·민망함 head-only EDIT 적용 완료. 남은 실제 post-transform 사용본 `magical_defend`, `magical_attack`, `magical_finish` 3장 눈/얼굴 EDIT. dormant fallback `magical`까지 family를 맞추면 1장 추가 | N5~N8 전 장면의 얼굴·헤어 shadow 일관성을 같이 검수해야 함 |
| **B — Keep Eyes Obscured** | 변신 전후의 도윤 identity를 유지하고 live sprite 작업량을 줄인다. | `cut_transform_01.webp`, `cut_transform_02.webp` 2장 EDIT에 더해, 현재 읽히는 눈으로 편집된 `magical_pose`를 obscured motif로 되돌리는 1장 EDIT 필요 | 첫 얼굴 공개의 서사적 보상은 사라지며 CUT focal을 훼손하지 않는 가림 방식 필요 |

관계 상태는 이 결정의 조건이 아니다. 이번 phase는 어느 안도 자동 선택하지 않는다.

## 5. Facing / mirror safety audit

| Family / logical ID | 기본 배치 | 판정 | 근거·계약 |
|---|---|---|---|
| `gray_wraith.normal`, `gray_wraith.weakened` | LEFT enemy | `SAFE_TO_MIRROR` | 읽을 수 있는 text·고정 소품이 없는 안개형 실루엣. confrontation/protect/battle에서 screen-right 방향으로만 mirror |
| `doyun.normal_tired`, `normal_startled`, `normal_suspicious`, `employee_id_surprised`, `normal`, `normal_smile`, `normal_shy`, `normal_empty` | RIGHT hero | `USE_ORIGINAL_ONLY` | 사원증·손·의상·헤어 비대칭을 보존. 원본을 right zone에서 inward/front로 사용 |
| `doyun.magical`, `magical_defend`, `magical_attack`, `magical_finish`, `magical_pose` | RIGHT hero | `USE_ORIGINAL_ONLY` | 지팡이·손·의상 장식·공격 방향 비대칭을 보존 |
| `juno.neutral`, `happy`, `shy`, `upset`, `surprised` | Doyun-side support | `USE_ORIGINAL_ONLY` | 지팡이 handedness와 몸 실루엣 비대칭을 보존 |

현재 승인 배치에서는 `NEEDS_DIRECTIONAL_ASSET = 0`. 원본-only actor를 반대편 edge로 옮겨 반드시 바깥을 보게 되는 새 장면이 생길 때만 directional asset을 별도 요청한다. CSS 일괄 `scaleX(-1)`은 금지한다.

## 6. Confrontation composition contract

- Gray Wraith: LEFT/CENTER-LEFT의 큰 enemy mass, focal core/head는 enemy side에 유지, screen-right/inward.
- Doyun: RIGHT hero zone, screen-left/inward, 얼굴·손·지팡이 판독 유지.
- Juno: center-low이되 Doyun 쪽 support triangle로 읽히도록 기존보다 오른쪽으로 붙이고 작게 유지.
- 화면 읽기: `[ WRAITH ] ↔ [ JUNO + DOYUN ]`.
- 예외: 서사적 거절·외면 장면만 outward-facing 허용하며 scene metadata로 명시한다.
- `confrontation`, `protect`, `battle`은 Wraith만 audited mirror를 적용한다. approved battle action placement는 변경하지 않는다.

## 7. Visual-production matrix

| Family | NEW | EDIT | 상태 |
|---|---:|---:|---|
| Doyun | 0 outstanding | 0 확정 + HQ-05 조건부 | floating ID reaction import 완료; `magical_pose` head-only EDIT 1 적용·사람 재검수 대기; mild facepalm EDIT는 선택적; HQ-05 A/B 결정 대기 |
| Juno | 3 | 0 | `barrier/protect`, `encourage/cast`, `point/explain` 기존 TODO 유지 |
| Black Magical Girl | 1 | 0 | `ending.black_magical_girl` 기존 TODO 유지 |

모든 수치는 visual-production inventory다. Phase B 당시 binary 변경 수는 0이었고, 2026-08-23 후속 human QA에서 `magical_pose` head-only EDIT 1을 적용했다.
