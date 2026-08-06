# 회색 망령 전투 액션 4상태

## 구성

- `delivery/char/`: 투명 PNG 4종
- `delivery/PRODUCTION_EVIDENCE.md`: 생성 작업·프롬프트·후처리·통합 주의사항
- `delivery/VALIDATION_REPORT.md`: 규격과 해시 검사 결과
- `source/`: 크로마 원본과 투명화 중간본
- `tools/build_gray_wraith_action_assets.py`: 정규화·압축·미리보기 생성 스크립트
- `preview_gray_wraith_actions.png`: 검수용 비교 이미지

## 권장 매핑

| 논리 ID | 파일 |
|---|---|
| `gray_wraith.normal` | `delivery/char/char_gray_wraith_normal.png` |
| `gray_wraith.hit` | `delivery/char/char_gray_wraith_hit.png` |
| `gray_wraith.attack` | `delivery/char/char_gray_wraith_attack.png` |
| `gray_wraith.death` | `delivery/char/char_gray_wraith_death.png` |

기존 매니페스트에는 `normal`과 `weakened`만 있으므로 나머지 세 상태를 사용할 경우 resolver·매니페스트·장면 매핑을 함께 추가해야 한다.
