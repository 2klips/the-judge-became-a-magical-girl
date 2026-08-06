# 에셋 출처·정규화 기록

이 문서는 확인 가능한 사실만 기록한다. Git 작성자는 `업로드자`이며, 별도 제작 증빙이 없으면 `제작자`로 간주하지 않는다. `미확인`은 불합격이 아니라 증빙 미전달 상태다.

## 출처 상태 요약

| 묶음 | 보관 위치 | Git 업로드 근거 | 제작 도구·모델 | 라이선스·공개 사용 | 상태 |
|---|---|---|---|---|---|
| 배경 원본 16장 | `assets/source/background/심사역은_마법소녀가_되었다_최종확정_배경세트.zip` | commit `c2e3e1a`, 2026-08-03, 업로드자 `lj33126` | 미확인 | 미확인 | 규격·장면 QA `ready`, 출처 승인 대기 |
| 도윤 외부 원본 6장 | `assets/source/doyun/doyoon-hero-sprites.zip` | commit `af26039`, 2026-08-03, 업로드자 `2klips` | 미확인 | 미확인 | 원본 추적용 |
| 도윤 정규화 납품 23장 | `assets/source/doyun/delivery/` | commit `4adb4db`, 2026-08-02, 업로드자 `Rpuplesun` | 미확인 | 미확인 | 자동 규격 `ready`, 사용자 장면 사용 승인 |
| 주노 납품 5장 | `assets/source/juno/delivery/` → `assets/runtime/char/` 채택본 | commit `6076466`, 2026-08-04, 업로드자 `Rpuplesun` | Codex 내장 OpenAI 이미지 생성 도구. 모델명·버전 미노출 | 레퍼런스 권한·사용 플랜·공개 사용 미확인 | 자동 규격·runtime 합성 `ready`, 권리 승인 대기 |
| 회색 망령 액션 4장 | `docs/gray-wraith-action-v2/delivery/char/` → normal만 `assets/runtime/char/` 채택 | 2026-08-05 납품 문서·Git 이력 | Codex 내장 OpenAI 이미지 생성 도구. 모델명·버전 미노출 | 생성 서비스 플랜·앵커 권한·공개 사용 미확인 | normal 자동 규격·동일 바이트 `ready`; hit/attack/death 미등록 |
| BGM 최종 편집본 5곡 | `assets/source/bgm/delivery/` → `assets/runtime/bgm/` 동일 바이트 채택 | commit `bf44289` 인계 병합, 2026-08-06, Git 작성자 `lj33126` | Suno + FFmpeg 8.1.1, 현재 Pro 플랜 사용자 확인; 생성 당시 플랜·모델 미확인 | 생성 당시 계정 기록·약관 확인 대기 | 자동 규격·동일 바이트 `ready`, 사람 청각·권리 승인 대기 |

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

- 과거 저장 위치는 `docs/Asset/juno-reference-v2/`다. commit `6940236`에서 delivery 5장, source 10장, preview, 도구가 현재 `assets/source/juno/`로 `R100` 이동됐다. 파일 삭제나 재생성으로 해석하지 않는다.
- 제작 증빙 원문은 [JUNO_PRODUCTION_EVIDENCE.md](provenance/JUNO_PRODUCTION_EVIDENCE.md)에 보존한다.
- 작업 ID 5개, 2026-08-03 제작일, Codex 내장 OpenAI 이미지 생성 도구 사용은 전달 문서로 확인된다.
- 정확한 모델명·버전은 도구가 노출하지 않아 미확인이다.
- 레퍼런스 원본 경로는 작업자 로컬 임시 경로여서 저장소에서 재검증할 수 없다.
- 레퍼런스 사용 권한, 생성 서비스 플랜·약관, 해커톤 제출·공개 저장소 사용 허용은 미확인이다.
- 5장 1200×2000 투명 PNG, 총 872,471B 자동 규격 검사는 [JUNO_VALIDATION_REPORT.md](validation/JUNO_VALIDATION_REPORT.md)에서 확인된다.
- 5개 delivery 파일은 2026-08-04 `assets/runtime/char/`에 동일 바이트로 채택됐다. N2·battle dev 장면에서 투명 합성과 1200×2000 로드를 확인했으며 상태는 `ready`다.

## 승인 규칙

- 파일·규격·장면 합성만 통과하면 `ready`.
- 제작자·도구·모델·권리 근거를 사람이 확인해야 `approved`.
- 근거 없는 도구 추정, Git 업로드자를 제작자로 표기, 약관 추정 승격을 금지한다.

## BGM 최종 편집본

- MP3 5곡, 48kHz stereo, 128kbps, 개별 3MB 이하, 약 -17.5~-17.4 LUFS다.
- 최종 SHA-256, 소스 구간, 생성폼은 [BGM_PRODUCTION_EVIDENCE.md](provenance/BGM_PRODUCTION_EVIDENCE.md)에 기록한다.
- 장면별 사용·통합 QA는 [BGM_HANDOFF.md](provenance/BGM_HANDOFF.md)에 기록한다.
- 현재 Suno Pro 사용은 사용자가 확인했지만 생성 당시 플랜·곡 ID·생성일·모델은 증빙 보완 전 미확인이다.
- 2026-08-06 최종 5곡을 `assets/runtime/bgm/`에 동일 바이트로 채택했다. source/runtime SHA-256 일치, 전체 runtime 30MB 이하를 확인했다.
- 사람의 3회 루프·대사 마스킹·PTT duck·장면 전환 청감과 생성 당시 플랜·곡 ID 확인 전 상태는 `ready`이며 `approved` 승격을 금지한다.

## 회색 망령 액션 납품

- 제작·검증 원문은 `docs/gray-wraith-action-v2/delivery/PRODUCTION_EVIDENCE.md`, `VALIDATION_REPORT.md`에 있다.
- `char_gray_wraith_normal.png`는 1200×2000 투명 PNG, 413,056B, SHA-256 `508F119B89752B19B056256D5EB641CD23A74FD26FCB7543F719193C08756839`이며 runtime 채택본과 동일하다.
- `hit`/`attack`/`death`는 수신했지만 사용자 결정에 따라 신규 논리 ID로 등록하지 않았다. source 납품만 보존한다.
- 계약 필수 `char_gray_wraith_weakened.png`는 납품되지 않았다. 별도 제작 요청을 유지한다.

## SFX source 인계

- 사용자 청감으로 선택한 Suno Sounds One Shot WAV 5종만 `assets/source/sfx/delivery/`에 계약명으로 복사했다.
- 모두 생성 WAV와 동일 바이트이며 트림·정규화·재인코딩하지 않았다. 48kHz stereo 16-bit PCM 규격이다.
- Suno Pro 사용은 사용자가 확인했다. 생성 당시 계정 화면·작업 ID·약관·해커톤 제출 허용 근거는 팀 보존 전 미확인이다.
- `assets/runtime/sfx/`와 코드는 수정하지 않았으며 상태는 `ready`, `approved`가 아니다.

| 원본 구분 | 계약 파일명 | SHA-256 |
|---|---|---|
| Magical-girl Transformation Completion | `sfx_transform_complete.wav` | `CCF478921EF8B3BE124FC3A0F21568850378D624ACCD93D46E97A224F1F1E318` |
| Critical Magical Hit | `sfx_critical.wav` | `BB5880185585B1FB2AE2BEDA50D8EDBE0AED9B2CE4AD7B1AB89859D31420ECA2` |
| Magical Shield Activation | `sfx_barrier.wav` | `52BCF2011D5815AE4B0D06534113CA2B7BACBB0D47400347B48CF2265ACE70F9` |
| Magical Wand Attack | `sfx_star_attack.wav` | `C4DE29A13BA813D76724D0DC0464813E4410D00C580AD68A838FED52999AD6FE` |
| Cute Character Pop-out From A CRT Monitor | `sfx_juno_appear.wav` | `C2A0B50743E1FC9C99D86F5A818438ED361AAB494A875EB16777F3CBABEE70EF` |

장면별 통합 계약은 [SFX_HANDOFF.md](provenance/SFX_HANDOFF.md), 생성 후보·미반영 기록은 [SFX_PRODUCTION_EVIDENCE.md](provenance/SFX_PRODUCTION_EVIDENCE.md)를 따른다.
