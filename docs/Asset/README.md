# 한도윤 전체 이미지 에셋

「심사역은 마법소녀가 되었다」 완성 대본 v2.0 장면 목록을 기준으로 구성한 투명 PNG 캐릭터 에셋 묶음이다.

- `T1_T2_T3`: 첨부 목록의 정식 18종
- `broken_variants`: 불완전 변신 경로의 전투 파생 및 마법 효과 보너스 에셋
- 얼굴 공통 규칙: 눈썹 위부터 코 아래까지 동일한 어두운 그림자, 입과 턱선은 노출
- 제작 규격: 세로형 투명 PNG, 최종 캔버스 1200×2000. 실제 파일은 8-bit indexed color + `tRNS` 투명도 청크

기존에 제작된 이미지가 장면 지시와 일치하는 경우 해당 원본을 리사이즈·중앙 정렬해 재사용했다.

## 정식 18종

| 파일 | 용도 | 제작 |
|---|---|---|
| `char_doyun_normal_tired.png` | N0 지친 도윤 | 기존 에셋 재사용 |
| `char_doyun_normal_startled.png` | N2·N3 놀란 도윤 | 기존 에셋 재사용 |
| `char_doyun_normal.png` | N4·N5 결심, 빛나는 사원증 | 신규 |
| `char_doyun_magical.png` | N5 완전 변신 대표 컷 | 기존 에셋 재사용 |
| `char_doyun_magical_defend.png` | N6 방어 자세 | 기존 에셋 재사용 |
| `char_doyun_magical_attack.png` | N6 해피 스타 브레이크 | 신규 |
| `char_doyun_magical_finish.png` | N8 러블리 플레이 빔 자세 | 기존 에셋 재사용 |
| `char_doyun_normal_smile.png` | GOOD·NORMAL 엔딩 | 신규 |
| `char_doyun_normal_shy.png` | N5 변신 직전 망설임 | 신규 |
| `char_doyun_broken.png` | N5 불완전 변신 대표 컷 | 기존 에셋 재사용 |
| `char_doyun_gray_back.png` | N7 평가표 속 뒷모습 | 신규 |
| `char_doyun_gray_face.png` | N7 과거를 마주하는 측면 | 신규 |
| `char_doyun_normal_empty.png` | BAD 엔딩 | 신규 |
| `char_doyun_magical_ashamed.png` | HIDDEN 엔딩 | 신규 |
| `char_doyun_transform_silhouette.png` | N5 변신 순간 | 신규 |
| `char_doyun_magical_pose.png` | N5 하트 마무리 포즈 | 신규 |
| `char_doyun_normal_angry.png` | 자유 대화 분노 반응 | 신규 |
| `char_doyun_key_visual.png` | 타이틀 키비주얼 | 신규 |

## 불완전 변신 파생 5종

`broken_variants`에는 `char_doyun_broken_attack.png`, `char_doyun_broken_defend.png`, `char_doyun_broken_defend_effect.png`, `char_doyun_broken_finish.png`, `char_doyun_broken_finish_effect.png`이 들어 있다. 기존 제작분은 그대로 활용하고, 없던 공격 자세만 신규 생성했다.

## 이름 정규화 기록

외부 원본은 보존한다. 런타임에 채택할 때만 `public/assets/char/` 아래 계약명으로 복사한다. 2026-08-03 사용자 결정과 `DEC-034`에 따른다.

| 기존 목록명 | 실제 납품명·정규화명 |
|---|---|
| `char_doyun_normal_resolve.png` | `char_doyun_normal.png` |
| `char_doyun_magic_stand.png` | `char_doyun_magical.png` |
| `char_doyun_magic_defend.png` | `char_doyun_magical_defend.png` |
| `char_doyun_magic_attack.png` | `char_doyun_magical_attack.png` |
| `char_doyun_magic_finish.png` | `char_doyun_magical_finish.png` |
| `char_doyun_broken_stand.png` | `char_doyun_broken.png` |
| `char_doyun_magic_ashamed.png` | `char_doyun_magical_ashamed.png` |
| `char_doyun_magic_pose.png` | `char_doyun_magical_pose.png` |

### 외부 원본 6장 파일명 매핑

`asset/doyoon-hero-sprites.zip`과 같은 이름의 압축 해제 폴더는 외부 제작자가 전달한 원본 보관본이다. `doyoon` 표기는 프로젝트 계약의 `doyun`과 다르므로 원본은 rename하지 않고 아래 파생 관계만 기록한다.

| 외부 원본명 | 정규화·규격 보정본 |
|---|---|
| `01_doyoon_office_tired.png` | `docs/Asset/assets/char_doyun_normal_tired.png` |
| `02_doyoon_office_startled.png` | `docs/Asset/assets/char_doyun_normal_startled.png` |
| `03_doyoon_magical_complete.png` | `docs/Asset/assets/char_doyun_magical.png` |
| `04_doyoon_magical_incomplete.png` | `docs/Asset/assets/char_doyun_broken.png` |
| `05_doyoon_battle_guard.png` | `docs/Asset/assets/char_doyun_magical_defend.png` |
| `06_doyoon_final_spell.png` | `docs/Asset/assets/char_doyun_magical_finish.png` |

원본은 977×1609~1610 PNG이며 4장은 800KB 상한을 넘는다. runtime 후보가 아니라 생성 원본 추적용이다. ZIP 6개 entry와 압축 해제본 6장은 SHA-256이 각각 일치한다.

# 한도윤 매니페스트 호환 에셋 패키지

프로젝트 `docs/dev/ASSET_MANIFEST.md` 계약을 기준으로 기존 한도윤 23개 이미지를 재매핑한 납품 묶음이다. 납품 원본은 `docs/Asset/assets/`에 보존한다.

## 바로 통합할 파일

- `docs/Asset/assets/char_doyun_magical.png` → 채택 시 `public/assets/char/char_doyun_magical.png` → 논리 ID `doyun.magical`
- `docs/Asset/assets/char_doyun_normal.png` → 확장판 채택 시 `public/assets/char/char_doyun_normal.png` → 논리 ID `doyun.normal`

`char_doyun_normal.png`은 기존 `normal_resolve` 대표 컷, `char_doyun_magical.png`은 기존 `magic_stand` 대표 컷을 사용했다.

## 규격

- 1200×2000 PNG
- 투명 배경
- 파일당 800KB 이하
- 납품 자동 검사: 23장 전부 통과
- 런타임 상태: `doyun.magical`은 사용자 임시 승인을 받아 `public/assets/char/char_doyun_magical.png`에 통합하고 `ready`로 전환. `doyun.normal`은 확장판 전용 `planned` 유지
- 라이선스·사람 시각 QA는 아직 완료되지 않았으므로 `approved`가 아니다.

나머지 21장은 현재 논리 ID를 만들지 않고 납품 원본으로 보관한다. 정확한 상태와 작업자 재요청 목록은 `docs/dev/ASSET_MANIFEST.md`가 소유한다. 별도 `ASSET_MANIFEST_DOYUN.md`는 사용하지 않는다.

## 누락·재작업 요청

- `[임시 통합·교체 요청]` `doyun.magical`: 현재 정면 파일은 DEC-035로 M5 임시 사용. 추후 battle p1~p3용 뒷모습 또는 반측면 단일 포즈로 교체한다.
- `[필수·누락]` `cut_transform_01.webp`: N5 영창 순간 컷.
- `[필수·누락]` `cut_transform_02.webp`: N5 변신 완료 컷. 도윤은 뒷모습 또는 반측면이어야 한다.
- `[증빙 누락]` 생성 도구·모델, 프롬프트/작업 ID, 생성일, 사용 플랜·라이선스 확인 결과.

기존 원본 묶음은 수정하거나 삭제하지 않았다.

## M5 작업자 전달 문서

- [M5 외부 에셋 작업 요청서](M5_ASSET_HANDOFF_REQUEST.md): 필수 누락, 임시 사용·교체, 선택 제작, 규격, 납품 구조, 증빙, 재납품 조건.
- [M5 UI·BGM 작업 매핑](M5_UI_BGM_REQUEST_MAPPING.md): 코드 생성 UI/SFX 담당 경계, 필수·선택 BGM, 장면 재생, 청감 인수 기준.

`[확정]` 누락 이미지·컷은 검은 presentation, 누락 BGM은 무음으로 대체해 M5 개발을 계속한다. 대사·자막·입력 UI는 검은 화면 위에서도 유지한다.
