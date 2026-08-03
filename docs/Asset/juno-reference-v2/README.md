# 주노 레퍼런스 반영 표정 5종

첨부된 주노 디자인 시트를 기준으로 다시 제작한 비주얼노벨용 스프라이트 패키지다.

## 구성

- `delivery/char/`: 계약 파일명의 투명 PNG 5종
- `delivery/PRODUCTION_EVIDENCE.md`: 레퍼런스·생성 작업·후처리·라이선스 기록
- `delivery/VALIDATION_REPORT.md`: 규격과 오니언 스킨 자동 검사 결과
- `source/`: 크로마 생성 원본 및 투명화 중간본
- `tools/build_juno_assets.py`: 얼굴 합성·정규화·압축·미리보기 생성 스크립트
- `preview_juno_expressions.png`: 런타임에 사용하지 않는 검수용 비교 이미지

## 런타임 매핑

| 논리 ID | 파일 |
|---|---|
| `juno.neutral` | `delivery/char/char_juno_neutral.png` |
| `juno.happy` | `delivery/char/char_juno_happy.png` |
| `juno.shy` | `delivery/char/char_juno_shy.png` |
| `juno.upset` | `delivery/char/char_juno_upset.png` |
| `juno.surprised` | `delivery/char/char_juno_surprised.png` |
