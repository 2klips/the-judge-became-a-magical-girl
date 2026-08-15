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
| P0 필수 이미지 3장 | `assets/source/p0-required-images/delivery/` → `assets/runtime/char/`, `assets/runtime/cut/` 동일 바이트 채택 | 최초 commit `438f2f7`, `transform.cast` 최종 commit `67dbf9f1a25e81dcc49e4cbfd56b22a6106bd28f`, 2026-08-11, Codex | Codex 내장 OpenAI 이미지 생성·편집 도구(모델·버전·작업 ID 미노출), FFmpeg 8.1.1, Pillow | 생성 서비스 플랜·참조 이미지 권한·공개 사용 미확인 | 자동 규격·동일 바이트 `ready`, 사람 장면·권리 QA 대기 |
| 2026-08-13 야근 연속성 재편집 7종 | 배경 source `assets/source/background/delivery/`, 컷 source `assets/source/p0-required-images/delivery/` → runtime 동일 바이트 | commit `92ef1e267aeb547dfba6033c35433f5c08b14ef5`, 2026-08-13, Codex | Codex 내장 OpenAI `image_gen` 편집(정확한 모델·버전·작업 ID 미노출), FFmpeg Lanczos | 참조 이미지 권한·생성 서비스 플랜·공개 배포 허용 미확인 | 7종 사용자 시각 채택·자동 규격·동일 바이트 `ready`; 데스크톱 브라우저·권리 QA 대기 |
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
- 이 액션 납품 묶음에는 계약 필수 `char_gray_wraith_weakened.png`가 없었다. 해당 상태는 아래 P0 필수 이미지 작업에서 별도로 생성·채택했다.

## P0 필수 이미지 3종

- 회색 망령 약화본은 `char_gray_wraith_normal.png`, `char_gray_wraith_hit.png`의 실루엣·균열 방향을 참조해 같은 캔버스의 약화 상태로 생성했다.
- 변신 영창 컷의 최초 납품은 `bg_transform_space.webp`, `char_doyun_normal_shy.png`, `char_juno_surprised.png`를 참조했다. 최초 후보가 이미 마법소녀 복장을 입어 장면 순서와 어긋나 폐기됐고, 평상복으로 재생성한 뒤 목걸이형 사원증 중복을 제거해 떠 있는 무문자 사원증 하나를 남겼다. 이 최초 납품은 아래 2026-08-11 포즈 수정으로 대체됐다.
- 변신 완료 컷은 `bg_transform_space.webp`, `char_doyun_magical_pose.png`, `char_juno_happy.png`를 참조해 도윤의 뒷모습/반측면과 주노가 함께 보이도록 생성했다.
- 생성 원본의 크로마 배경은 imagegen 보조 스크립트로 알파 처리했다. 컷 2장은 FFmpeg로 WebP 정규화했고, 망령 RGBA PNG는 용량 상한을 넘어서 Pillow로 indexed palette + `tRNS` PNG로 무손실 캔버스·투명도 계약을 유지하며 압축했다.
- Codex 내장 도구가 정확한 모델명·버전·작업 ID를 노출하지 않아 해당 값은 미확인이다. 생성 서비스 플랜, 참조 이미지 권한, 공개 배포 허용은 사람 확인 전까지 미확인이다.

### 2026-08-11 `transform.cast` 포즈 수정 이력

- 사용자는 입 모양 1번(중간 크기로 분명히 말하는 입, 진지하고 약간 부끄러운 표정)과 A 균형형을 선택했다. 현재 `cut_transform_01.webp`를 편집 대상으로, `char_doyun_normal_shy.png`를 도윤의 사무복·정체성 참고로, `char_juno_surprised.png`를 주노의 몸·별 지팡이 참고로 사용했다.
- Codex 내장 OpenAI 이미지 편집으로 후보를 만들고 FFmpeg로 1920×1080 WebP를 정규화했다. 도구는 정확한 모델명·버전·작업 ID를 노출하지 않는다.
- 최초 포즈 수정 commit `2b99e2327c1a752751a614bc6003456dbb5f816e`의 후보는 186,428B, SHA-256 `038E554CFCAAB243C230C25316B62F3048602B7B67747AB4F8BFFCE6C30C6A54`였다. 데스크톱 전체 구도는 통과했지만 당시 요구한 정확한 중앙 모바일 crop에서 핵심 관계가 남지 않아 최종본으로 쓰지 않았다. 파일은 별도로 채택하지 않고 Git 이력에 보존한다.
- 이후 사용자가 모바일을 제품 범위에서 제외했다. CSS·코드 변경 없이 데스크톱 16:9 중앙 구도 후보를 final commit `67dbf9f1a25e81dcc49e4cbfd56b22a6106bd28f`로 source/runtime 두 경로에 동일 바이트 채택했다.
- 최종본은 평상복 도윤 한 명이 무문자 사원증 하나를 자연스럽게 손에 잡아 전경으로 내밀며 보이는 입으로 말하고, 눈을 감은 주노 한 명이 세운 별 지팡이 주위로 두 날개를 모아 기도한다. 청색·금색 야간 사무실과 마법진을 유지하며 텍스트·UI·로고는 없다.
- 교체 전 원본 `transform.cast`는 177,098B, SHA-256 `507CA55683BC50CCBB83B3196598DB4D2DCA1CF82B58A5AEF796CD007634140D`였으며 현재는 superseded 이력이다.
- 최종 `transform.cast`는 200,470B, SHA-256 `A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152`다. 자동 계약을 통과한 `ready` 상태이며 사람 미술·권리 QA 전에는 `approved`로 승격하지 않는다. 참조 이미지 권한, 생성 서비스 플랜, 공개 배포 허용도 계속 미확인이다.

| runtime 파일 | 규격·크기 | SHA-256 |
|---|---|---|
| `assets/runtime/char/char_gray_wraith_weakened.png` | 1200×2000 indexed PNG + `tRNS`, 205,779B | `3B9746765326936E3598DCF6CA74DCA29A134229D4BF2DE5ADF607D8E8FF468C` |
| `assets/runtime/cut/cut_transform_01.webp` | 1920×1080 WebP, 200,470B | `A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152` |
| `assets/runtime/cut/cut_transform_02.webp` | 1920×1080 WebP, 205,400B | `1BBB807758BB978B6C97223E949EF91BF77CB456C30A68AE7E99E29611C32EB6` |

위 컷 2종 표는 2026-08-11 채택 이력이며 commit `92ef1e2`에서 superseded됐다. `cut_transform_01`의 `A9AB42...D5152`는 이번 편집의 역사적 입력 base였고, 직전 current 229,404B 리비전과 같은 파일이 아니다.

## 2026-08-13 야근 연속성 7종 최종 lineage

- 각 기존 source/채택본을 Codex 내장 OpenAI `image_gen`으로 한 번씩 편집했다. 후보는 저장소 밖 `C:/Users/user/.codex/visualizations/2026/08/12/019ff64a-8a00-72e3-a26f-020f8215bbe6/late-night-team-overtime-candidates`에 생성됐다.
- FFmpeg Lanczos 중앙 crop으로 1920×1080 WebP를 만들었다. 배경 quality 82, 컷 quality 84다. 텍스트·UI·로고를 baked하지 않았다.
- 사용자가 2026-08-13 사전에 지적된 미세한 구도·가시성 차이를 수용하고 7종 모두를 시각 채택했다. 이 검토는 참조 권한·생성 서비스 플랜·공개 배포 허용을 증명하지 않으므로 상태는 `ready`다.

| source ↔ runtime 동일 바이트 | 입력·편집 계보 | 규격·크기 | SHA-256 |
|---|---|---|---|
| `background/delivery/bg_office_wide.webp` ↔ `bg/bg_office_wide.webp` | 2026-08-03 배경을 심야 야근 핵심 팀 전경으로 편집 | 1920×1080 WebP, 131,376B | `F404F46A15FBA0F6B884E6777D0B1858DD2B0C100E452E3DFB7152104E39AE5D` |
| `background/delivery/bg_hall_dark.webp` ↔ `bg/bg_hall_dark.webp` | 정지한 팀·마법적 인식 차단을 심야 장면으로 편집 | 1920×1080 WebP, 114,630B | `D0C3999651ADC8CDA35EDF24F0F433608FD690CF13FB01AA89FCC88E15160BE9` |
| `background/delivery/bg_transform_space.webp` ↔ `bg/bg_transform_space.webp` | 변신 공간의 야간 연속성 강화 | 1920×1080 WebP, 283,142B | `D1BA348DCE1BA9C1258996376EA7E4830A33B579EF724263A779208CB4497011` |
| `background/delivery/bg_battle_wide.webp` ↔ `bg/bg_battle_wide.webp` | 정지한 핵심 팀 보호 구도로 편집 | 1920×1080 WebP, 142,878B | `622E8355ACD187B0029112B0A0F30F0D31A49C33C7D42AF2E26F2636042B235B` |
| `background/delivery/bg_battle_core.webp` ↔ `bg/bg_battle_core.webp` | 정지한 팀 보호·야간 최종전으로 편집 | 1920×1080 WebP, 118,876B | `6AE173DD2C61306CD1DA740D6FD7DE92A0C638B90547B2589FC468EB7159AE8C` |
| `p0-required-images/delivery/cut_transform_01.webp` ↔ `cut/cut_transform_01.webp` | 역사적 base `A9AB42...D5152`를 편집. A2 사원증 은백색 내부 별빛·파란 테두리 유지 | 1920×1080 WebP, 229,306B | `43E98D673C2DF9989B929A5B4575763CE254248410DEEC02D616E7F2EF80FD74` |
| `p0-required-images/delivery/cut_transform_02.webp` ↔ `cut/cut_transform_02.webp` | 일몰 변신 완료를 야간으로 편집 | 1920×1080 WebP, 209,748B | `113F777CAA7785171B9CC112175E5D7CCDB1B2CBAE96BC592FF166918C2CFD3A` |

모든 lineage의 참조 이미지 권한·생성 서비스 플랜·공개 배포 허용은 미확인이다. 자동 규격·source/runtime 동일성은 commit `92ef1e267aeb547dfba6033c35433f5c08b14ef5`에서 확인했고, 교체 후 데스크톱 16:9 브라우저 QA는 대기다.

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

## 2026-08-15 PC TITLE 로컬 폰트

### MaruBuri SemiBold

- 공식 배포처: NAVER 한글한글 아름답게 `https://hangeul.naver.com/maruproject_11`.
- 공식 archive: `maruburi.zip` (`https://hangeul.pstatic.net/hangeul_static/webfont/zips/maruburi.zip`), 내부 `MaruBuriOTF.zip`.
- 공식 archive에는 해당 weight의 WOFF2가 없다. 사용자 예외 승인에 따라 임의 변환·subset·rename 없이 공식 원본 `MaruBuri-SemiBold.otf` 바이트를 그대로 채택했다.
- source/runtime: `assets/source/fonts/maruburi/MaruBuri-SemiBold.otf` ↔ `assets/runtime/fonts/maruburi/MaruBuri-SemiBold.otf`.
- 규격·크기·SHA-256: OpenType OTF, 742,176B, `18DFD1167D44877A5AFC1386DB5F09C3EA494AB83A5ADF0A64953C43C208DD21`.
- 저작권·라이선스: Copyright © NAVER Corporation, SIL Open Font License 1.1. 배포 notice는 [MARUBURI_LICENSE.txt](provenance/MARUBURI_LICENSE.txt)에 포함한다.
- 다운로드·바이트 검증일: 2026-08-15 KST.

### Pretendard 1.3.9

- 공식 배포처: `orioncactus/pretendard` GitHub release `v1.3.9`.
- 공식 archive: `Pretendard-1.3.9.zip`. archive의 `web/static/woff2/`에서 필요한 Regular·SemiBold만 채택했다.
- `Pretendard-Regular.woff2`: 765,892B, SHA-256 `FAD853F7F47C6C8B103171E7193FA095708CDCD70850A71D93AA5379E8A61D63`.
- `Pretendard-SemiBold.woff2`: 785,856B, SHA-256 `C863F76A7DE5C1DDC1ED8B2FA794964530774592C4F31407A84E2A2AE93F17F0`.
- source/runtime은 각각 `assets/source/fonts/pretendard/`와 `assets/runtime/fonts/pretendard/`에서 동일 바이트다. CDN·외부 font request·variable font·Bold weight는 추가하지 않았다.
- 저작권·라이선스: Copyright © 2021 Kil Hyung-jin, SIL Open Font License 1.1. 공식 archive의 notice 원문은 [PRETENDARD_LICENSE.txt](provenance/PRETENDARD_LICENSE.txt)에 포함한다.
- 다운로드·바이트 검증일: 2026-08-15 KST.

### runtime budget

- 폰트 전 runtime: 11,882,465B (11.33MiB).
- 채택 폰트: 2,293,924B.
- 폰트 후 runtime: 14,176,389B (13.52MiB).
- 30MiB 상한을 유지한다.
