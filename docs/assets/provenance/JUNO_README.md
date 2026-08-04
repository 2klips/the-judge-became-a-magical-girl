# 주노 레퍼런스 반영 표정 5종

첨부된 주노 디자인 시트를 기준으로 다시 제작한 비주얼노벨용 스프라이트 패키지다.

## 구성

- `../../../assets/source/juno/delivery/`: 계약 파일명의 보존 source 5종
- `../../../assets/runtime/char/`: 게임·Pages가 사용하는 동일 바이트 채택본 5종
- `JUNO_PRODUCTION_EVIDENCE.md`: 레퍼런스·생성 작업·후처리·라이선스 기록
- `../validation/JUNO_VALIDATION_REPORT.md`: 규격과 오니언 스킨 자동 검사 결과
- `../../../assets/source/juno/intermediate/`: 크로마 생성 원본 및 투명화 중간본
- `../../../assets/source/juno/tools/build_juno_assets.py`: 얼굴 합성·정규화·압축·미리보기 생성 스크립트
- `../../../assets/source/juno/preview_juno_expressions.png`: 런타임에 사용하지 않는 검수용 비교 이미지

## 런타임 매핑

| 논리 ID | 파일 |
|---|---|
| `juno.neutral` | `assets/runtime/char/char_juno_neutral.png` |
| `juno.happy` | `assets/runtime/char/char_juno_happy.png` |
| `juno.shy` | `assets/runtime/char/char_juno_shy.png` |
| `juno.upset` | `assets/runtime/char/char_juno_upset.png` |
| `juno.surprised` | `assets/runtime/char/char_juno_surprised.png` |

과거 `docs/Asset/juno-reference-v2/`의 파일은 commit `6940236`에서 현재 source 경로로 `R100` 이동됐다. runtime 채택본은 source delivery와 동일 바이트다.
