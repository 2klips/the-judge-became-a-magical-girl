# 회색 망령 전투 액션 4상태 제작 증빙

## 납품 상태

- 제작일: 2026-08-05
- 상태: `ready`
- 제작 도구: Codex 내장 OpenAI 이미지 생성 도구
- 모델/버전: 도구가 정확한 모델명과 버전을 세션에 노출하지 않아 기록 불가
- 기존 `outputs/gray-wraith-delivery/` 2상태 패키지는 수정하지 않고 보존함

## 논리 ID 제안

| 논리 ID | 파일 | 의미 | 계약 여부 |
|---|---|---|---|
| `gray_wraith.normal` | `char_gray_wraith_normal.png` | 대기·기본 상태 | 기존 계약 |
| `gray_wraith.hit` | `char_gray_wraith_hit.png` | 공격에 맞은 직후 | 확장 제안 |
| `gray_wraith.attack` | `char_gray_wraith_attack.png` | 안개 팔 횡베기 공격 | 확장 제안 |
| `gray_wraith.death` | `char_gray_wraith_death.png` | 핵과 안개가 무너지는 소멸 | 확장 제안 |

`hit`, `attack`, `death`는 기존 `ASSET_MANIFEST.md`와 `SCENE_ASSET_MAPPING.md`에 정의되지 않은 확장 상태이므로 실제 통합 시 resolver와 매핑 문서 갱신이 필요하다.

## 스타일·아이덴티티 앵커

- 공통 스타일 문장: `Polished Korean visual-novel game illustration, clean dark expressive linework, soft cel shading, restrained cinematic lighting, crisp readable silhouettes, luminous cyan-gold highlights.`
- 캐릭터 앵커: `outputs/gray-wraith-delivery/source/gray_wraith_normal_transparent.png`
- 고정 요소: 매끈한 마스크형 머리, 지친 눈, 거대한 회색 안개 체형, 긴 팔, 연결된 안개 꼬리, 흑연·잿빛·청회색 재질
- 변경 요소: 상태별 자세, 팔과 꼬리의 동세, 표정 긴장도, 피격·소멸 시 내부 빛

## 파일별 생성 기록

| 상태 | 생성 작업 ID | 제작 관계 |
|---|---|---|
| `normal` | `exec-96c974ad-7faa-489c-9786-239ae69f6323` | 기존 회색 망령 마스터 재사용 |
| `hit` | `exec-33daa672-423f-4eef-b2f5-2b614e47d242` | 마스터 참조, 피격 반동과 가슴 충격 균열 생성 |
| `attack` | `exec-3d8fb336-aab0-40b2-86fb-eef5087c14a0` | 마스터 참조, 전방 돌진·안개 팔 횡베기 생성 |
| `death` | `exec-ad17bd91-b86e-42cf-a7f9-15924b0d43d0` | 마스터 참조, 안개 붕괴·핵 소멸 생성 |

## 프롬프트 요약

- `normal`: 숙인 머리와 내려간 팔, 무겁고 체념한 기본 자세
- `hit`: 몸을 대각선 뒤로 비틀고 한 팔로 가슴을 감싸며 청록·금빛 충격 균열 노출
- `attack`: 몸을 전방으로 기울이고 오른팔을 넓은 안개 칼날처럼 횡으로 휘두름
- `death`: 어깨와 팔이 처지고 안개 꼬리가 나선형으로 풀리며 희미한 내부 핵과 파편이 사라짐
- 공통 금지: 고어, 피, 해골·뿔·사슬, 글자·로고·UI, 배경, 바닥 그림자, 다른 캐릭터

## 후처리

1. 액션 생성본은 순수 마젠타 크로마 배경으로 생성하고 원본을 `source/`에 보존함.
2. `remove_chroma_key.py`의 border 자동 키, soft matte, edge contract, despill, spill cleanup으로 투명화함.
3. 정상본의 녹색 반사와 액션본의 마젠타 반사를 중성 회색으로 정리함.
4. 각 상태를 1200×2000 캔버스의 같은 상단·세로 기준으로 정규화하고 하단 UI 여백을 동일하게 맞춤.
5. 4장에 공통 256색 팔레트와 무디더 압축을 적용함.

## 라이선스 확인란

| 확인 항목 | 상태 | 확인자 | 날짜 | 근거 링크 |
|---|---|---|---|---|
| 생성 서비스 플랜의 해커톤 제출 허용 | 미확인 | — | — | — |
| 공개 배포·홍보물 사용 허용 | 미확인 | — | — | — |
| 캐릭터 앵커 에셋 사용 권한 | 미확인 | — | — | — |

확인 완료 전까지 본 에셋은 `ready` 상태다.
