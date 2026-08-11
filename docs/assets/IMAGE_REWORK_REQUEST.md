# 이미지 작업 요청 목록

- 최초 작성: 2026-08-06 (연출 폴리시 작업 준비 중 확인된 항목)
- 목적: **제작·교체·확인이 필요한 이미지 에셋을 한 문서에서 추적**한다. 외부 이미지 제작자 인계용이며, 연출 폴리시 지시서(`prompts/M5_PRESENTATION_POLISH_DIRECTIVE.md`) WP6 점검에서 나오는 추가 항목도 이 문서에 누적한다.
- 규격·네이밍·구도 상세는 [SCENE_ASSET_MAPPING.md](SCENE_ASSET_MAPPING.md) §3·§8, [별첨2](../별첨2_에셋_제작_가이드라인.md)를 따른다. 이 문서는 "무엇이 왜 필요한가"만 소유한다.

## 납품 규칙 (요약)

1. 정확한 계약 파일명으로 제작한다. 캐릭터 1200×2000 투명 PNG ≤800KB, 배경 1920×1080 WebP ≤500KB, 컷 1920×1080 WebP ≤700KB.
2. 납품 원본은 `assets/source/` 담당 폴더에 둔다. `assets/runtime/`, `src/`, `docs/`는 제작자가 수정하지 않는다.
3. 이미지에 텍스트·UI·로고를 박지 않는다(텍스트는 런타임 DOM/CSS 담당).
4. 생성 도구·모델, 프롬프트/작업 ID, 생성일, 라이선스 확인 결과를 함께 전달한다. 증빙 없는 납품은 `approved`로 승격되지 않는다.

## 1. 신규 제작 필요 (M5 필수; 최초 납품 이력)

아래 표는 2026-08-11 최초 제작 요청을 보존한 역사 기록이다. 특히 `transform.cast`의 "떠오르는 사원증" 요청은 같은 날 포즈 수정으로 대체됐으며 현재 채택본 설명이 아니다.

| 논리 ID | 파일명 | 요청 내용 | 사용 장면 | 현재 폴백 | 근거 |
|---|---|---|---|---|---|
| `gray_wraith.weakened` | `char_gray_wraith_weakened.png` | `char_gray_wraith_normal.png`와 **같은 캔버스·구도·스케일**에서, 회색 안개가 갈라지고 몸 안에 갇힌 게임 캐릭터의 빛이 새어 나오는 상태. 과장된 고통 표현 금지 — 무겁고 체념한 인상 유지 | battle에서 기세(momentum) 65 이상, N7~N8 우세 연출 | normal + CSS 파생(채도↓·내부 빛 오버레이) | SCENE_ASSET_MAPPING §3.2. 납품 delivery에 `attack`/`hit`/`death`는 있으나 `weakened`는 없음 |
| `transform.cast` | `cut_transform_01.webp` | `[역사 기록·대체됨]` 사원증이 떠오르고 도윤과 주노가 함께 주문을 외치는 영창 순간. 텍스트 없음 | N5 주문 성공 직후 1번 컷 | 배경+도윤+CSS 플래시/파티클 | SCENE_ASSET_MAPPING §3.3. 2026-08-11 납품 전에는 ASSET_MANIFEST `missing` |
| `transform.complete` | `cut_transform_02.webp` | 변신 완료. 마법소녀 도윤은 뒷모습/반측면, 주노는 곁에 위치. 완전·표준·구제 공용 1장 | N5 주문 성공 직후 2번 컷 | 배경+도윤+CSS 플래시/파티클 | SCENE_ASSET_MAPPING §3.3. 2026-08-11 납품 전에는 ASSET_MANIFEST `missing` |

### 2026-08-11 납품 상태

- `gray_wraith.weakened`: 1200×2000 투명 PNG를 source/runtime에 동일 바이트로 채택했다. 자동 규격 검사를 통과해 `ready`이며, 사람 장면 합성·권리 QA는 남아 있다.
- `transform.cast`: 최초에는 변신 전 평상복 도윤, 떠 있는 무문자 사원증, 주노, 막 시작되는 변신광의 1920×1080 WebP를 채택했다. 이 구성은 아래 포즈 수정으로 대체된 역사 기록이며 현재 최종본이 아니다.
- `transform.complete`: 마법소녀 도윤의 뒷모습/반측면과 주노가 함께 보이는 1920×1080 WebP를 채택했다. 자동 규격 검사를 통과해 `ready`다.
- 위 표의 폴백은 납품 전 상태 기록이자 실파일 로딩 실패 시 안전장치다. 세 항목 모두 `approved`는 아니며 사람 합성·권리 QA 후 승격한다.

### 2026-08-11 `transform.cast` 포즈 수정 완료

- 사용자 선택인 입 모양 1번과 A 균형형을 반영했다. 현재 최종본은 평상복 도윤이 무문자 사원증 하나를 손으로 카메라 쪽 전경에 내밀고, 진지하고 약간 부끄러운 표정의 보이는 입으로 말하며, 주노가 눈을 감고 세운 별 지팡이 주위로 두 날개를 모아 기도한다.
- 야간 사무실, 청색·금색 변신광, 원형 마법진을 유지하며 텍스트·UI·로고는 이미지에 넣지 않았다.
- 사용자 범위 변경으로 모바일 crop과 `390×844` 검수는 이 수정에서 제외했다. 데스크톱 16:9만 최종 구도 기준이며 CSS·코드·시나리오는 변경하지 않았다.
- source/runtime 동일 바이트 자동 계약을 통과해 상태는 `ready`다. 사람 미술·권리 QA가 남아 있어 `approved`는 아니다.

## 2. 교체 요청 (현재본 임시 승인 상태)

| 논리 ID | 파일명 | 요청 내용 | 임시 승인 근거 | 우선순위 |
|---|---|---|---|---|
| `bg_title` | `bg_title.webp` | baked NHN/HACKATHON 문구·로고가 없는 clean 타이틀 배경. 작품명·시작 버튼은 런타임이 그린다 | DEC-037 (현재본 임시 사용) | 제출 정책 변경 대비 권장 |
| `doyun.magical` | `char_doyun_magical.png` | 현재 정면 포즈를 **뒷모습/반측면**으로 교체 (전투 구도 강화) | DEC-035 (정면본 임시 사용) | 권장 |

## 3. 선택 제작 (컷 가능 — 없어도 완주 가능)

| 논리 ID | 파일명 | 요청 내용 | 사용 장면 |
|---|---|---|---|
| `ending.black_magical_girl` | `cut_black_magical_girl_01.webp` | 어두운 복도, 긴 검은 지팡이를 든 성인 여성 실루엣, 회색 픽셀이 지팡이로 흡수됨. 얼굴·이름·정체 노출 금지 | GOOD 후속 훅, HIDDEN 크레딧 이후 |

## 4. 확인 요청 (제작 아님)

| 항목 | 내용 | 근거 |
|---|---|---|
| 17번째 배경 식별 | 인계 문서는 과거 17종을 언급했으나 실납품은 16장. 누락 1장의 파일명·용도 확인 필요 | SCENE_ASSET_MAPPING AR-13 |
| 도윤 세트 증빙 | 도윤 11종의 생성 도구·라이선스 증빙 미확인 → `approved` 승격 차단 중 | SCENE_ASSET_MAPPING AR-11 |
| 회색 망령 delivery 권리 증빙 | 제작 도구·작업 ID·자동 규격은 납품 문서로 확인 완료. 생성 서비스 플랜·앵커 권한·공개 배포 허용 확인 필요 | `docs/gray-wraith-action-v2/delivery/PRODUCTION_EVIDENCE.md`, DEC-034 절차 |
| (참고) 망령 액션 3종 수신 확인 | `attack`/`hit`/`death`는 수신 완료. 런타임 논리 ID로는 미등록 상태이며 등록 여부는 개발 결정(지시서 §6-2) 대기. **재제작 불필요** | gray-wraith-action-v2 delivery |

## 5. WP6 정합 점검 추가분

연출 폴리시 지시서 WP6(장면별 캐릭터 이미지-대화 정합 점검)에서 **기존 이미지 세트로 표현 불가(C형)** 판정이 나온 항목을 아래 표에 추가한다.

작성 규칙:

- 새 논리 ID가 필요한 요청은 `[제안]`으로 표기한다. 논리 ID 추가는 DEC 기록과 `SCENE_ASSET_MAPPING.md`·`ASSET_MANIFEST.md` 동시 갱신이 필요하며, 제작 착수는 사용자 승인 후다.
- 요청 내용은 코드 용어가 아니라 **장면·감정·구도를 대본 언어로** 쓴다(제작자는 코드를 보지 않는다).
- 각 항목에 반드시 **임시 대체 이미지**(현재 게임이 대신 표시하는 것)를 기록한다 — 제작 전에도 완주는 가능해야 한다.

| 논리 ID | 파일명 | 요청 내용 (장면·감정·구도) | 사용 장면·대사 위치 | 임시 대체 | 근거 (대본·매핑 문서 위치) |
|---|---|---|---|---|---|
| `gray_wraith.weakened` | `char_gray_wraith_weakened.png` | 망령의 안개가 갈라지고 내부 게임 캐릭터의 빛이 비치는 약화 상태 | battle p1~p3, momentum 65 이상 | `gray_wraith.normal` + CSS 채도·빛·균열 파생 | `CHARACTER_IMAGE_DIALOGUE_AUDIT.md` §4, 본 문서 §1 |
| `transform.cast` | `cut_transform_01.webp` | `[역사 기록·대체됨]` 사원증이 떠오르고 도윤과 주노가 함께 주문을 외치는 영창 순간 | N5 주문 성공 직후 | 배경 + 도윤 `magical_pose` + 검은 컷 영역 + CSS | `CHARACTER_IMAGE_DIALOGUE_AUDIT.md` §3, 본 문서 §1 |
| `transform.complete` | `cut_transform_02.webp` | 변신을 마친 도윤과 곁의 주노가 한 장면으로 읽히는 완료 컷 | N5 완전·표준·구제 결과 | 배경 + 도윤 `magical_pose` + 검은 컷 영역 + CSS | `CHARACTER_IMAGE_DIALOGUE_AUDIT.md` §3, 본 문서 §1 |

이 WP6 표의 임시 대체는 납품 전 점검 당시의 기록이다. 2026-08-11부터 세 논리 ID는 위 실파일을 우선 사용하고, 임시 대체는 로딩 실패 시에만 사용한다.

WP6 표의 `transform.cast` 제작 문구도 최초 요청을 보존한 역사 기록이다. 현재 최종 구도는 이 문서의 포즈 수정 완료 절과 [SCENE_ASSET_MAPPING.md](SCENE_ASSET_MAPPING.md) §3.3을 따른다.

전수 점검 결과, 위 3종 외에 도윤·주노 신규 표정 논리 ID가 필요한 C형은 발견되지 않았다. 전체 매트릭스와 B형 1건은 [CHARACTER_IMAGE_DIALOGUE_AUDIT.md](CHARACTER_IMAGE_DIALOGUE_AUDIT.md)에 기록했다.
