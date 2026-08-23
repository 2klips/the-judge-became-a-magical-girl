# 회색 망령 전조·변신 얼굴 연속성 설계

## 목적

2026-08-23 실제 플레이 human QA에서 확인된 네 가지 문제를 좁은 범위로 닫는다.

1. direct-wish prompt CUT의 `다음 장면 ›`을 화면 중앙 하단보다 약간 위에 고정한다.
2. N2에서 N3 회색 망령이 갑자기 나타나는 전환 앞에 짧은 전조를 둔다.
3. `doyun.employee_id_surprised` 머리 둘레의 보라색 export artifact를 제거한다.
4. 변신 후 사용하는 도윤 4종의 눈을 보이게 해 `magical_pose`와 얼굴 공개 규칙을 통일한다.

스토리·분기·save·voice·Battle UI·actor composition은 바꾸지 않는다.

## 1. Direct-wish CUT 진행 버튼

- 적용 대상은 `.direct-wish-prompt-cut .early-scene-cut-controls`뿐이다.
- control은 `left: 50%`, `right: auto`, `translateX(-50%)`로 가로 중앙에 둔다.
- 세로 위치는 하단에서 약 `7vh`, desktop clamp 범위 약 `56px~80px`를 사용한다.
- 기존 borderless editorial style, keyboard focus, delayed/one-shot 안전 계약은 유지한다.
- 일반 dialogue의 `계속 ›`, Transform CUT, Battle, Ending CTA에는 전파하지 않는다.

## 2. 회색 망령 전조 interstitial

### 선택 방식

별도 scenario node를 만들지 않고 presentation 계층에 interstitial을 추가한다.

### 진입 조건

- N2 dialogue 결과가 실제로 `n3_wraith_choice`로 advance한 자연 진행에서만 1회 표시한다.
- save/Resume로 이미 N3에 들어온 경우, debug scene preview, 같은 화면 재렌더에는 반복하지 않는다.
- GameState·nodeTurn·flag·relationship 값은 변경하지 않는다.

### 화면·문구

- 기존 야간 사무실 배경을 유지한다.
- live Wraith/Doyun/Juno sprite는 interstitial 동안 표시하지 않는다.
- 모니터 주변 회색 번짐, 약한 desaturation, 짧은 noise/flicker만 presentation으로 적용한다.
- 중앙의 작은 narration overlay에 다음 문구를 표시한다.

> (모니터 속 평가 문장이 한 글자씩 회색으로 번진다.)

- 약 1.1초 후 기존 N3 confrontation 화면으로 전환한다.
- reduced-motion에서는 flicker·scale을 제거하고 짧은 opacity 전환과 동일 hold를 사용한다.

### 효과음

- 외부 binary 없이 기존 Web Audio oscillator 구조에 `wraith_omen` cue를 추가한다.
- 낮은 sine/triangle 2층, 총 약 0.5~0.7초로 구성한다.
- PTT capture 중 SFX 억제, AudioContext 실패 시 무음 fail-soft, 40ms 중복 방지 계약을 유지한다.
- N3 BGM과 voice 경로는 변경하지 않는다.

## 3. `doyun.employee_id_surprised` 보라색 artifact

### 확인된 원인

2026-08-22 정규화 스크립트가 `(255, 0, 255)` matte를 palette 투명색으로 사용했다. Lanczos/quantize 과정에서 일부 magenta 계열 픽셀이 불투명 subject color로 남아 머리와 실루엣 둘레에 보라색 선이 생겼다.

### 수정 계약

- 기존 사용자 제공 원본과 현재 runtime sprite를 edit target으로 사용한다.
- 보라색/magenta artifact만 제거한다.
- 얼굴, 머리 모양, 표정, 사원증, 손, 의상, 포즈, body proportions는 유지한다.
- 최종본은 1200×2000 RGBA transparent PNG, 800KB 이하, source/runtime 동일 bytes로 정규화한다.
- 정규화 스크립트도 alpha-safe export로 바꿔 같은 artifact 재발을 막는다.
- asset 상태는 `ready · HUMAN_RECHECK`이며 사람 승인 전 `approved`로 올리지 않는다.

## 4. 변신 얼굴 공개 규칙

사용자 결정은 기존 HQ-05 Option A를 확정한다.

- 변신 전: 기존 눈 가림 identity 유지.
- Transform CUT: 첫 full-face reveal 유지.
- 변신 후 N5~N8: 눈을 계속 보이게 한다.

### 편집 대상

| 논리 ID | 얼굴 방향 | 유지할 연기 |
|---|---|---|
| `doyun.magical` | 얼굴·눈 노출 | 기본 transformed fallback |
| `doyun.magical_defend` | 얼굴·눈 노출 | 방어 중 긴장과 힘줌 |
| `doyun.magical_attack` | 얼굴·눈 노출 | 공격 결의와 집중 |
| `doyun.magical_finish` | 얼굴·눈 노출 | 마지막 주문 외침 |

`doyun.magical_pose`는 이미 얼굴 노출·당황한 성공 표정으로 편집됐으므로 다시 수정하지 않는다.

### 이미지 불변 조건

- built-in `image_gen` edit를 사용한다.
- 각 target의 body, costume, crown, gloves, staff, ribbons, hands, legs, pose, silhouette를 보존한다.
- 머리·얼굴 영역만 바꾸고 gray despair shadow를 제거한다.
- 네 장을 같은 표정으로 만들지 않고 기존 행동 감정을 유지한다.
- transparent 1200×2000 canvas와 기존 actor anchor compatibility를 유지한다.
- source/runtime에 같은 최종본을 저장하고 provenance·manifest hash를 갱신한다.

## 5. 테스트·검증

### TDD 계약

- direct-wish CUT CTA 전용 중앙 하단 anchor 테스트.
- N2 advance 뒤 omen 1회, save/debug/re-render 반복 0 테스트.
- omen 중 live actor 0, 이후 N3 기존 actor composition 복귀 테스트.
- `wraith_omen` cue·PTT suppression·fail-soft 테스트.
- employee-ID sprite의 saturated magenta artifact 0, alpha·규격·source/runtime 동일성 테스트.
- 변신 4종의 physical asset 규격·source/runtime 동일성·manifest 상태 테스트.

### 브라우저 QA

- production/debug OFF에서 direct-wish CUT, omen, N3 reveal, N5 employee-ID, Battle p1/p2, N8 final spell을 확인한다.
- 1920×1080, 1600×900, 1366×768에서 scroll·clipping·actor/UI collision 0을 확인한다.
- omen SFX 1회, N3 reveal abruptness 완화, console error 0을 확인한다.
- 변신 얼굴·행동 감정·신체 실루엣은 사용자 `HUMAN_RECHECK`로 남긴다.

## 6. 비범위

- scenario JSON·대사·분기·ending grade 변경
- save schema 변경
- Voice Worker·PTT·BGM 변경
- Wraith/Juno/Doyun actor 위치·scale 재설계
- Battle/Ending/Post-credit UI redesign
- 신규 배경·회색 망령·주노 binary 생성
- push
