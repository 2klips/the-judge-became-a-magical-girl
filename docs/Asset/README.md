# 한도윤 전체 이미지 에셋

「심사역은 마법소녀가 되었다」 완성 대본 v2.0 장면 목록을 기준으로 구성한 투명 PNG 캐릭터 에셋 묶음이다.

- `T1_T2_T3`: 첨부 목록의 정식 18종
- `broken_variants`: 불완전 변신 경로의 전투 파생 및 마법 효과 보너스 에셋
- 얼굴 공통 규칙: 눈썹 위부터 코 아래까지 동일한 어두운 그림자, 입과 턱선은 노출
- 제작 규격: 세로형 투명 RGBA PNG, 최종 캔버스 1200×2000

기존에 제작된 이미지가 장면 지시와 일치하는 경우 해당 원본을 리사이즈·중앙 정렬해 재사용했다.

## 정식 18종

| 파일 | 용도 | 제작 |
|---|---|---|
| `char_doyun_normal_tired.png` | N0 지친 도윤 | 기존 에셋 재사용 |
| `char_doyun_normal_startled.png` | N2·N3 놀란 도윤 | 기존 에셋 재사용 |
| `char_doyun_normal_resolve.png` | N4·N5 결심, 빛나는 사원증 | 신규 |
| `char_doyun_magic_stand.png` | N5 완전 변신 대표 컷 | 기존 에셋 재사용 |
| `char_doyun_magic_defend.png` | N6 방어 자세 | 기존 에셋 재사용 |
| `char_doyun_magic_attack.png` | N6 해피 스타 브레이크 | 신규 |
| `char_doyun_magic_finish.png` | N8 러블리 플레이 빔 자세 | 기존 에셋 재사용 |
| `char_doyun_normal_smile.png` | GOOD·NORMAL 엔딩 | 신규 |
| `char_doyun_normal_shy.png` | N5 변신 직전 망설임 | 신규 |
| `char_doyun_broken_stand.png` | N5 불완전 변신 대표 컷 | 기존 에셋 재사용 |
| `char_doyun_gray_back.png` | N7 평가표 속 뒷모습 | 신규 |
| `char_doyun_gray_face.png` | N7 과거를 마주하는 측면 | 신규 |
| `char_doyun_normal_empty.png` | BAD 엔딩 | 신규 |
| `char_doyun_magic_ashamed.png` | HIDDEN 엔딩 | 신규 |
| `char_doyun_transform_silhouette.png` | N5 변신 순간 | 신규 |
| `char_doyun_magic_pose.png` | N5 하트 마무리 포즈 | 신규 |
| `char_doyun_normal_angry.png` | 자유 대화 분노 반응 | 신규 |
| `char_doyun_key_visual.png` | 타이틀 키비주얼 | 신규 |

## 불완전 변신 파생 5종

`broken_variants`에는 방어·공격·필살기 자세와 방어·필살기 마법 효과 버전이 들어 있다. 기존 제작분은 그대로 활용하고, 없던 공격 자세만 신규 생성했다.

# 한도윤 매니페스트 호환 에셋 패키지

첨부된 `ASSET_MANIFEST.md` 계약을 기준으로 기존 한도윤 23개 이미지를 재매핑한 납품 묶음이다.

## 바로 통합할 파일

- `public/assets/char_doyun_magical.png` → 논리 ID `doyun.magical`
- `public/assets/char_doyun_normal.png` → 논리 ID `doyun.normal`

`char_doyun_normal.png`은 기존 `normal_resolve` 대표 컷, `char_doyun_magical.png`은 기존 `magic_stand` 대표 컷을 사용했다.

## 규격

- 1200×2000 PNG
- 투명 배경
- 파일당 800KB 이하
- 상태: `ready` — 실파일 존재 및 자동 규격 검사 통과
- 라이선스·사람 시각 QA는 아직 완료되지 않았으므로 `approved`가 아니다.

나머지 21장은 확장 논리 ID로 `docs/dev/ASSET_MANIFEST_DOYUN.md`에 기록했다. 기존 원본 묶음은 수정하거나 삭제하지 않았다.
