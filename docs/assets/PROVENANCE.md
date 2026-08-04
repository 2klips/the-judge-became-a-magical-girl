# 에셋 출처·정규화 기록

이 문서는 확인 가능한 사실만 기록한다. Git 작성자는 `업로드자`이며, 별도 제작 증빙이 없으면 `제작자`로 간주하지 않는다. `미확인`은 불합격이 아니라 증빙 미전달 상태다.

## 출처 상태 요약

| 묶음 | 보관 위치 | Git 업로드 근거 | 제작 도구·모델 | 라이선스·공개 사용 | 상태 |
|---|---|---|---|---|---|
| 배경 원본 16장 | `assets/source/background/심사역은_마법소녀가_되었다_최종확정_배경세트.zip` | commit `c2e3e1a`, 2026-08-03, 업로드자 `lj33126` | 미확인 | 미확인 | 규격·장면 QA `ready`, 출처 승인 대기 |
| 도윤 외부 원본 6장 | `assets/source/doyun/doyoon-hero-sprites.zip` | commit `af26039`, 2026-08-03, 업로드자 `2klips` | 미확인 | 미확인 | 원본 추적용 |
| 도윤 정규화 납품 23장 | `assets/source/doyun/delivery/` | commit `4adb4db`, 2026-08-02, 업로드자 `Rpuplesun` | 미확인 | 미확인 | 자동 규격 `ready`, 사용자 장면 사용 승인 |
| 주노 납품 5장 | `assets/source/juno/delivery/` | commit `6076466`, 2026-08-04, 업로드자 `Rpuplesun` | Codex 내장 OpenAI 이미지 생성 도구. 모델명·버전 미노출 | 레퍼런스 권한·사용 플랜·공개 사용 미확인 | 자동 규격 `ready`, runtime 통합 승인 대기 |

## 배경 원본

- SHA-256: `C4F6AD44F38C5CBC680937F01996F1FD145329DA5FF93CB8541DBB828FB887CF`
- 크기: `33,378,690 bytes`
- 확인 구성: PNG 16장 + `manifest.txt` 1개, CRC 오류 0.
- `BG-02`는 1448×1086, 나머지 15장은 1672×941.
- runtime 변환: 16개 채택본을 1920×1080 WebP quality 84로 crop·resize·압축. 원본 식별자→계약명은 [ASSET_MANIFEST.md](ASSET_MANIFEST.md)에 기록한다.
- `TITLE`에 baked된 NHN/HACKATHON 문구·로고는 사용자 임시 승인. clean 교체 요청 유지.
- 과거 문서의 `미드저니 추정` 표기는 증빙이 아니므로 제거했다. 제작 도구·모델·프롬프트/작업 ID·생성일·라이선스는 모두 미확인이다.
- 작업자 원문: [BACKGROUND_HANDOFF.md](provenance/BACKGROUND_HANDOFF.md).

## 도윤 원본·납품본

### 외부 원본 6장

- ZIP SHA-256: `0C881C8C0D14B9849B71EB456993CDA25F79E4358E1363306223D13C31CC4BC9`
- 크기: `5,701,127 bytes`.
- ZIP 6개 entry와 기존 압축 해제본 6장의 entry별 SHA-256 일치, 경로 이탈 0.
- 원본은 977×1609~1610 PNG이며 4장이 runtime 800KB 상한을 넘는다.
- hash 동일 압축 해제 중복본은 2026-08-04 제거했고 ZIP만 보존했다.

| 외부 원본명 | 정규화 납품본 |
|---|---|
| `01_doyoon_office_tired.png` | `char_doyun_normal_tired.png` |
| `02_doyoon_office_startled.png` | `char_doyun_normal_startled.png` |
| `03_doyoon_magical_complete.png` | `char_doyun_magical.png` |
| `04_doyoon_magical_incomplete.png` | `char_doyun_broken.png` |
| `05_doyoon_battle_guard.png` | `char_doyun_magical_defend.png` |
| `06_doyoon_final_spell.png` | `char_doyun_magical_finish.png` |

### 정규화 납품 23장

- 23장 모두 1200×2000 8-bit indexed PNG + `tRNS`, 실제 투명 픽셀 존재, 개별 800KB 이하.
- 제작자·생성 도구·모델·프롬프트/작업 ID·생성일·라이선스는 전달되지 않았다.
- 기존 목록과 실파일명이 다른 항목은 다음과 같이 기록한다.

| 기존 목록명 | 납품·runtime 계약명 |
|---|---|
| `char_doyun_normal_resolve.png` | `char_doyun_normal.png` |
| `char_doyun_magic_stand.png` | `char_doyun_magical.png` |
| `char_doyun_magic_defend.png` | `char_doyun_magical_defend.png` |
| `char_doyun_magic_attack.png` | `char_doyun_magical_attack.png` |
| `char_doyun_magic_finish.png` | `char_doyun_magical_finish.png` |
| `char_doyun_broken_stand.png` | `char_doyun_broken.png` |
| `char_doyun_magic_ashamed.png` | `char_doyun_magical_ashamed.png` |
| `char_doyun_magic_pose.png` | `char_doyun_magical_pose.png` |

## 주노 납품

- 제작 증빙 원문은 [JUNO_PRODUCTION_EVIDENCE.md](provenance/JUNO_PRODUCTION_EVIDENCE.md)에 보존한다.
- 작업 ID 5개, 2026-08-03 제작일, Codex 내장 OpenAI 이미지 생성 도구 사용은 전달 문서로 확인된다.
- 정확한 모델명·버전은 도구가 노출하지 않아 미확인이다.
- 레퍼런스 원본 경로는 작업자 로컬 임시 경로여서 저장소에서 재검증할 수 없다.
- 레퍼런스 사용 권한, 생성 서비스 플랜·약관, 해커톤 제출·공개 저장소 사용 허용은 미확인이다.
- 5장 1200×2000 투명 PNG, 총 872,471B 자동 규격 검사는 [JUNO_VALIDATION_REPORT.md](validation/JUNO_VALIDATION_REPORT.md)에서 확인된다.

## 승인 규칙

- 파일·규격·장면 합성만 통과하면 `ready`.
- 제작자·도구·모델·권리 근거를 사람이 확인해야 `approved`.
- 근거 없는 도구 추정, Git 업로드자를 제작자로 표기, 약관 추정 승격을 금지한다.
