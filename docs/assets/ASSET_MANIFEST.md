# 에셋 매니페스트

규격·제작법·네이밍의 단일 진실 공급원은 [별첨2. Asset 제작 가이드라인](../별첨2_에셋_제작_가이드라인.md)이다. 장면별 사용처와 제작 내용은 [SCENE_ASSET_MAPPING.md](SCENE_ASSET_MAPPING.md)를 따른다.

상태:

- `missing`: 필수 또는 확정 M5 매핑이지만 계약 runtime 경로에 규격 통과 실파일 없음. 납품 원본만 있어도 변환·복사 전에는 `missing`이다.
- `planned`: 선택 항목 또는 코드 생성 예정.
- `ready`: 파일 존재·기본 규격 통과.
- `approved`: 사람 QA·라이선스 확인까지 완료.

`[확정, DEC-030·034·035·036·037·040·048 및 2026-08-04·08-13·08-16 사용자 결정]` 물리 에셋은 `assets/source/`에 원본을 보존하고 채택본만 `assets/runtime/`에 둔다. 현재 runtime에는 확정 배경 16장, 장면에 채택한 도윤 11장, 주노 5장, 회색 망령 2장, 변신 컷 2장, BGM 5곡, 로컬 폰트 3개가 있다. Vite는 runtime만 `dist/assets/`로 복사하며 source는 Pages 산출물에서 제외한다. 자동 규격·동일 바이트 검사를 통과한 파일만 `ready`다. 2026-08-16 사용자는 배경·도윤을 팀이 Codex/ChatGPT OpenAI 서비스와 당시 유료 Pro 이상 계정으로 직접 생성했고, backgrounds·Doyoon·Juno·gray wraith·transform cuts·continuity edits에는 text prompt 또는 team/project-owned internally generated asset만 input으로 사용해 외부 제3자 이미지가 없었음을 확인했다. BGM·source SFX는 생성 당시 Suno Pro였다. exact 모델·작업 ID 부재는 provenance gap으로 유지한다. reference-rights는 `USER ATTESTED / INTERNAL PROJECT LINEAGE`로 PASS 후보지만 법률 자문·제3자 허가 확인은 아니며, 사람 시각·청각 QA가 남은 자산은 `approved`가 아니다. 도구·제작자·권리는 [PROVENANCE.md](PROVENANCE.md)의 확인된 근거만 사용한다. 누락 이미지·컷은 검은 presentation, 누락 BGM은 무음으로 진행한다.

현재 `assets/runtime/`은 44개 파일, 총 `14,176,389 bytes`(`13.52 MiB`)다. 물리 에셋 30MiB 상한을 통과한다.

## 이미지

| 논리 ID | 파일명 | 종류 | 규격 | 용량 상한 | 우선순위 | 상태 | 생성 도구 | 라이선스 | 시나리오 참조 위치 | QA |
|---|---|---|---|---:|---|---|---|---|---|---|
| `juno.neutral` | `char_juno_neutral.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI 이미지 생성·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | `characters.json` emotion + dialogue NPC | source/runtime 동일 바이트·자동 규격·N2/battle 합성 PASS. 사람 variation/장면 QA 대기 |
| `juno.happy` | `char_juno_happy.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI 이미지 편집·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | 동일 | source/runtime 동일 바이트·자동 규격 PASS. 사람 variation/장면 QA 대기 |
| `juno.shy` | `char_juno_shy.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI 이미지 편집·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | 동일 | source/runtime 동일 바이트·자동 규격 PASS. 사람 variation/장면 QA 대기 |
| `juno.upset` | `char_juno_upset.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI 이미지 편집·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | 동일 | source/runtime 동일 바이트·자동 규격 PASS. 사람 variation/장면 QA 대기 |
| `juno.surprised` | `char_juno_surprised.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI 이미지 편집·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | 동일 | source/runtime 동일 바이트·자동 규격·N2 합성 PASS. 사람 variation/장면 QA 대기 |
| `gray_wraith.normal` | `char_gray_wraith_normal.png` | 적 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | Codex 내장 OpenAI 이미지 생성·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle `enemy.id` + state | source/runtime 동일 바이트·413,056B·자동 규격 PASS. 사람 합성 QA 대기 |
| `gray_wraith.weakened` | `char_gray_wraith_weakened.png` | 적 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | Codex 내장 OpenAI 이미지 생성·편집 도구·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle `enemy.id` + state | source/runtime 동일 바이트·205,779B·자동 규격 PASS. DEC-060 폴백 유지. 사람 합성 QA 대기 |
| `doyun.normal_tired` | `char_doyun_normal_tired.png` | 평상복 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N0 line 2~5, N2 거절·냉담, N3 철수·동조, N4 거리 유지 | 자동 규격 PASS. v3.1 human acting remap은 `HUMAN_RECHECK` |
| `doyun.normal_startled` | `char_doyun_normal_startled.png` | 평상복 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N2 실제 주노 등장, N3 망령 opening, N5 floating ID 임시 proxy | 자동 규격 PASS. 강한 surprise를 실제 초현상 이후로 제한. N5 전용 시선 pose `NEW 1` 대기 |
| `doyun.normal` | `char_doyun_normal.png` | 평상복 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N1 mild disbelief, N2 후속, N3 보호·방법 확인, N4 행동·협력, N5 압박·영창 | 자동 규격 PASS. v3.1 human acting remap은 `HUMAN_RECHECK` |
| `doyun.normal_smile` | `char_doyun_normal_smile.png` | 평상복 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N2 호기심, N4-A·관계 회복, GOOD·NORMAL | 자동 규격·응답 매핑·배치 QA PASS |
| `doyun.normal_shy` | `char_doyun_normal_shy.png` | 평상복 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | 현재 v3.1 runtime mapping 없음; binary 보존 | full facepalm이 절망/고통으로 읽힌다는 human QA로 기존 사용처 superseded. mild facepalm 재사용 시 EDIT·사람 QA 필요 |
| `doyun.normal_empty` | `char_doyun_normal_empty.png` | 평상복 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | BAD | 자동 규격 PASS, 장면 QA 대기 |
| `doyun.magical` | `char_doyun_magical.png` | 마법소녀 대표 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | 전투 fallback | 자동 규격 PASS, 사용자 정면 포즈 임시 승인 DEC-035. 교체·사람 장면 QA 대기 |
| `doyun.magical_defend` | `char_doyun_magical_defend.png` | 마법소녀 방어 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p1 | 자동 규격 PASS, 장면 QA 대기 |
| `doyun.magical_attack` | `char_doyun_magical_attack.png` | 마법소녀 공격 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p2 | 자동 규격 PASS, 장면 QA 대기 |
| `doyun.magical_finish` | `char_doyun_magical_finish.png` | 마법소녀 마무리 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p3 | 자동 규격 PASS, 장면 QA 대기 |
| `doyun.magical_pose` | `char_doyun_magical_pose.png` | 마법소녀 포즈 | 1200×2000 PNG 투명 | 800KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N5 변신 결과·전투 후 수렴 | 자동 규격 PASS, 장면 QA 대기 |
| `transform.cast` | `cut_transform_01.webp` | 컷씬 | 1920×1080 WebP | 700KB | 필수 | ready | Codex 내장 OpenAI 이미지 편집·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | 엔진 고정 변신 연출 1번, DEC-016 | source/runtime 동일 바이트·229,306B·SHA-256 `43E98D673C2DF9989B929A5B4575763CE254248410DEEC02D616E7F2EF80FD74`. A2 사원증의 은백색 내부 별빛·파란 테두리와 야간 영창 장면. 2026-08-13 사용자 시각 채택; 전체 continuity QA 대기 |
| `transform.complete` | `cut_transform_02.webp` | 컷씬 | 1920×1080 WebP | 700KB | 필수 | ready | Codex 내장 OpenAI 이미지 편집·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | 엔진 고정 변신 연출 2번, DEC-016 | source/runtime 동일 바이트·209,748B·SHA-256 `113F777CAA7785171B9CC112175E5D7CCDB1B2CBAE96BC592FF166918C2CFD3A`. 일몰을 야간 완료 장면으로 교체. 2026-08-13 사용자 시각 채택; 전체 continuity QA 대기 |
| `ending.black_magical_girl` | `cut_black_magical_girl_01.webp` | GOOD 후속 컷 | 1920×1080 WebP | 700KB | 컷 가능 | planned | 미정 | 미확인 | GOOD 후속 훅·HIDDEN 재사용, DEC-032 | 얼굴·이름 비노출 검수 대기 |
| `juno.climax` | `char_juno_climax.png` | 추가 포즈 | 1200×2000 PNG 투명 | 800KB | 확장 | planned | 미정 | 미확인 | 현재 M5 미사용 | 제작 보류 |
| `bg_title` | `bg_title.webp` | 타이틀 배경 | 1920×1080 WebP | 500KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보; branding은 제출 맥락 risk accepted | title presentation | 210,992B. baked NHN/HACKATHON 표시는 사용자 제출-context 위험 수용. 상표 허가·license approved 아님; 일반 공개·개인 상업판은 clean 교체 또는 별도 허가 필요 |
| `bg_office_wide` | `bg_office_wide.webp` | 메인 사무실 전경 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI base USER ATTESTED + Codex 이미지 편집·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | N0 도입 beat | 131,376B·SHA-256 `F404F46A15FBA0F6B884E6777D0B1858DD2B0C100E452E3DFB7152104E39AE5D`. 심사 핵심 팀이 남아 있는 심야 야근. 2026-08-13 사용자 시각 채택; 전체 continuity QA 대기 |
| `bg_hall_day` | `bg_hall_day.webp` | 도윤 책상 1인칭 기본 | 1920×1080 WebP | 500KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N0 심사, N2 | 176,244B. `BG-02` 4:3 원본 중앙 16:9 crop, 모니터·키보드·사원증 보존 및 runtime 전환 QA PASS |
| `bg_hall_time_stop` | `bg_hall_time_stop.webp` | 시간정지 책상 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N1 | 130,218B. 자동 규격·runtime 전환 QA PASS |
| `bg_hall_dark` | `bg_hall_dark.webp` 우선 → `bg_hall_day.webp` + scene recipe | 회색 침식 책상/파생 | 1920×1080 WebP 또는 CSS | 500KB/0 | 필수·폴백 가능 | ready | OpenAI base USER ATTESTED + Codex 이미지 편집·폴백 | internal project lineage·USER ATTESTED·rights PASS 후보/N/A | N3~N5 도입, 수렴; DEC-019·036 | 114,630B·SHA-256 `D0C3999651ADC8CDA35EDF24F0F433608FD690CF13FB01AA89FCC88E15160BE9`. 시간·인식이 멈춘 핵심 팀을 보호하는 야간 장면. 2026-08-13 시각 채택; 전체 continuity QA 대기 |
| `bg_hall_good` | `bg_hall_good.webp` | GOOD 회복 책상 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | GOOD | 180,822B. 자동 규격·GOOD 1~5페이지 runtime QA PASS |
| `bg_hall_normal` | `bg_hall_normal.webp` | NORMAL 부분 회복 책상 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | NORMAL | 135,792B. 자동 규격·dev ending 합성 QA PASS |
| `bg_hall_bad` | `bg_hall_bad.webp` | BAD 회색 책상 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | BAD | 100,448B. 자동 규격·dev ending 합성 QA PASS |
| `bg_desk_closeup` | `bg_desk_closeup.webp` | 데스크 클로즈업 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | N5 사원증·주문 게이트 | 206,318B. 자동 규격·주문 UI 가독성 QA PASS |
| `bg_transform_space` | `bg_transform_space.webp` | 변신 추상 공간 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI base USER ATTESTED + Codex 이미지 편집·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | N5 변신 결과 하부 | 283,142B·SHA-256 `D1BA348DCE1BA9C1258996376EA7E4830A33B579EF724263A779208CB4497011`. 야간 사무실 연속성. 2026-08-13 시각 채택; 전체 continuity QA 대기 |
| `bg_battle_wide` | `bg_battle_wide.webp` | 전투 와이드 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI base USER ATTESTED + Codex 이미지 편집·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p1 | 142,878B·SHA-256 `622E8355ACD187B0029112B0A0F30F0D31A49C33C7D42AF2E26F2636042B235B`. 정지된 핵심 팀을 보호하는 야간 전투. 2026-08-13 시각 채택; 전체 continuity QA 대기 |
| `bg_hall_void` | `bg_hall_void.webp` | 망령 전투 공간 | 1920×1080 WebP | 500KB | 필수 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p2 | 131,940B. 자동 규격·도윤 실파일 합성 runtime QA PASS |
| `bg_mind_archive` | `bg_mind_archive.webp` | N7 심리·아카이브 공간 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p3 질문 beat | 126,264B. 자동 규격·질문 UI 가독성 runtime QA PASS |
| `bg_battle_core` | `bg_battle_core.webp` | 회색 핵 최종전 | 1920×1080 WebP | 500KB | 폴백 가능 | ready | OpenAI base USER ATTESTED + Codex 이미지 편집·모델 미노출 | internal project lineage·USER ATTESTED·rights PASS 후보 | battle p3 주문 beat | 118,876B·SHA-256 `6AE173DD2C61306CD1DA740D6FD7DE92A0C638B90547B2589FC468EB7159AE8C`. 정지된 핵심 팀을 보호하는 야간 최종전. 2026-08-13 시각 채택; 전체 continuity QA 대기 |
| `bg_corridor_day` | `bg_corridor_day.webp` | 밝은 복도 | 1920×1080 WebP | 500KB | 컷 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | GOOD 후속 도입, HIDDEN 전환 | 126,688B. 자동 규격·GOOD 6페이지 runtime QA PASS |
| `bg_corridor_blacklight` | `bg_corridor_blacklight.webp` | 검은빛 복도 | 1920×1080 WebP | 500KB | 컷 가능 | ready | OpenAI Codex/ChatGPT·Pro 이상 USER ATTESTED·모델 미확인 | internal project lineage·USER ATTESTED·rights PASS 후보 | GOOD 후속 검은빛, HIDDEN | 76,672B. 포스터 baked text 포함. GOOD 7페이지 runtime QA PASS |
| `bg_lounge_day` | `bg_lounge_day.webp` | 배경 | 1920×1080 WebP | 500KB | 확장 | planned | 미정 | 미확인 | 현재 M5 미사용 | 제작 보류 |
| `bg_street_evening` | `bg_street_evening.webp` | 배경 | 1920×1080 WebP | 500KB | 확장 | planned | 미정 | 미확인 | 현재 M5 미사용 | 제작 보류 |
| `bg_ch2_branch` | `[제안] bg_{장소}_{상태}.webp` | 배경 | 1920×1080 WebP | 500KB | 컷 가능 | planned | 미정 | 미확인 | chapter 2 `scene.bg` | 이름·장면 대기 |

### N5 변신 결과 visual-production handoff (2026-08-20)

- `doyun.magical_pose`: `EDIT REQUIRED` — 신규 pose 0장, 기존 pose EDIT 1장.
- 유지: 현행 costume, heart-hand body pose, 실루엣, 1200×2000 투명 canvas compatibility.
- 표정 목표: “변신에 성공했지만 당황하고 벅찬 상태”. 눈은 읽히게 유지하고 full-eye 절망 shadow를 제거한다. 눈썹은 약하게 곤란한 인상, 옅은 blush, 작고 어색한 forced smile을 사용한다.

### Phase B acting visual-production handoff (2026-08-22)

- floating employee ID reaction: `NEW pose candidate = 1`. logical ID·파일명은 아직 만들지 않는다. 사원증을 직접 바라보는 surprise/disbelief, 약한 recoil, 사원증/가슴 쪽 손, 작게 열린 입을 요구한다. panic/horror/despair는 금지한다.
- `doyun.normal_shy`: 현재 v3.1 mapping에서 제거했다. mild 관자놀이/이마 짚기 연기가 후속 승인될 때만 `EDIT 1` 후보이며 현재 필수 제작량에는 포함하지 않는다.
- HQ-05 얼굴 continuity는 [acting/direction audit](V31_ACTING_DIRECTION_AUDIT.md#4-hq-05-transformation-face-continuity--human-decision-required)의 Option A/B 사람 결정 전까지 asset 변경 금지다.
- 금지: 고통·패배가 아닌 코믹한 당혹감이라는 N5 결과 정서를 절망·심한 괴로움·패배 표정으로 바꾸는 것.
- binary 생성·편집은 별도 visual-production 단계 소유다. 현재 runtime 파일과 논리 ID는 변경하지 않는다.

### 2026-08-03 배경 납품·이름 정규화 추적

- 원본: `assets/source/background/심사역은_마법소녀가_되었다_최종확정_배경세트.zip`, commit `c2e3e1a`, SHA-256 `C4F6AD44F38C5CBC680937F01996F1FD145329DA5FF93CB8541DBB828FB887CF`, 33,378,690B.
- ZIP 무결성: CRC 오류 0. 실제 배경 PNG 16장 + `manifest.txt` 1개. 인계 문서의 과거 17종 대비 미상 1장 누락은 현재 매핑에서 제외한다.
- 원본 자동 규격: `BG-02`는 1448×1086, 나머지 15장은 1672×941 PNG·개별 약 1.7~2.5MB다. DEC-037에 따라 채택 복사본 16개를 `1920×1080 WebP`, quality 84, 개별 76,672~316,250B로 변환했다. 총 2,666,866B.
- 사람 시각 QA: 16장 모두 사람·캐릭터 없음. `BG-02A~E`는 같은 정면 책상 계열, `BG-04~04B`는 같은 사무실 와이드 계열. `BG-02`는 4:3 상단 시점이라 변형군과 hard cut 전환만 허용한다.
- 내용 QA: `TITLE`의 대형 NHN/HACKATHON 표시는 2026-08-16 사용자가 NHN 해커톤 제출 맥락에 한정해 위험을 수용했다. 이는 상표 허가·license approved가 아니며 일반 공개·개인 상업판은 clean 교체 또는 별도 허가가 필요하다.
- 증빙: 팀이 Codex/ChatGPT OpenAI 서비스와 생성 당시 유료 Pro 이상 계정으로 직접 생성했다는 사용자 확인은 기록했다. 정확한 모델·프롬프트/작업 ID·생성일과 최초 input/reference 계보는 미확인이다. 사람 QA와 남은 권리 확인 전 모든 배경은 `approved` 승격 금지.

| 납품 원본 | 논리 ID | runtime 계약 파일 | 확정 장면 | 상태·폴백 |
|---|---|---|---|---|
| `title__bg00_nhn_hq_hackathon_2026_afternoon.png` | `bg_title` | `bg_title.webp` | 타이틀 | DEC-037 임시 승인·ready·2026-08-16 제출-context 위험 수용. 상표 허가 아님; 범용 공개판 clean 교체/별도 허가 검토 |
| `BG-01_메인_사무실_전경.png` | `bg_office_wide` | `bg_office_wide.webp` | N0 도입 | 2026-08-03 납품 원본은 2026-08-13 야간 재편집본으로 superseded; 실패 시 `bg_hall_day` |
| `BG-02_도윤_책상_1인칭.png` | `bg_hall_day` | `bg_hall_day.webp` | N0 심사, N2 | 16:9 crop QA 필수 |
| `BG-02A_시간정지.png` | `bg_hall_time_stop` | `bg_hall_time_stop.webp` | N1 | 실패 시 `bg_hall_day` + CSS |
| `BG-02B_회색침식.png` | `bg_hall_dark` | `bg_hall_dark.webp` | N3~N5 도입, 수렴 | 실패 시 `bg_hall_day` 파생 |
| `BG-02C_GOOD.png` | `bg_hall_good` | `bg_hall_good.webp` | GOOD | 실패 시 `bg_hall_day` + 아침빛 |
| `BG-02D_NORMAL.png` | `bg_hall_normal` | `bg_hall_normal.webp` | NORMAL | 실패 시 `bg_hall_day` + 회색 오버레이 |
| `BG-02E_BAD.png` | `bg_hall_bad` | `bg_hall_bad.webp` | BAD | 실패 시 `bg_hall_dark` |
| `BG-03_데스크_클로즈업.png` | `bg_desk_closeup` | `bg_desk_closeup.webp` | N5 사원증·주문 | 실패 시 `bg_hall_dark` |
| `BG-07_변신_추상_공간.png` | `bg_transform_space` | `bg_transform_space.webp` | N5 변신 결과 하부 | 실패 시 기존 CSS 변신 placeholder |
| `BG-04_전투용_와이드.png` | `bg_battle_wide` | `bg_battle_wide.webp` | battle p1 | 실패 시 `bg_hall_void` |
| `BG-04A_망령_전투.png` | `bg_hall_void` | `bg_hall_void.webp` | battle p2 | 기존 필수 ID |
| `BG-05_N7_심리_공간.png` | `bg_mind_archive` | `bg_mind_archive.webp` | battle p3 질문 | 실패 시 `bg_hall_void` + DOM |
| `BG-04B_회색핵_최종전.png` | `bg_battle_core` | `bg_battle_core.webp` | battle p3 주문 | 실패 시 `bg_hall_void` |
| `BG-06_복도.png` | `bg_corridor_day` | `bg_corridor_day.webp` | GOOD 후속 도입, HIDDEN 전환 | 컷 가능. 없으면 검은 화면 전환 |
| `BG-06A_검은빛_복도.png` | `bg_corridor_blacklight` | `bg_corridor_blacklight.webp` | GOOD 후속 검은빛, HIDDEN | 컷 가능. 포스터 text·검은 잔향 QA 대기 |

### 2026-08-13 야근 연속성 재편집본 source/runtime

- commit `92ef1e267aeb547dfba6033c35433f5c08b14ef5`에서 배경 5종의 source 대응본을 `assets/source/background/delivery/`에 추가했고 컷 2종은 `assets/source/p0-required-images/delivery/`를 교체했다. 위 현재 표의 7개 runtime과 각 source 대응본은 모두 동일 바이트다.
- 모두 1920×1080 WebP이며 배경 5종은 500KiB 이하, 컷 2종은 700KiB 이하다. 배경은 FFmpeg Lanczos 중앙 crop·quality 82, 컷은 quality 84로 정규화했다.
- 사용자가 사전에 지적된 작은 구도·가시성 차이를 인지하고 7종 모두를 시각 채택했다. 현재 상태는 `ready`며, 대체 후 데스크톱 16:9 브라우저 QA와 권리·배포 게이트는 대기다. 모바일은 제품 범위에서 제외했다.

### 2026-08-03 도윤 납품 추적

- 외부 생성 원본 보관본: `assets/source/doyun/doyoon-hero-sprites.zip`, SHA-256 `0C881C8C0D14B9849B71EB456993CDA25F79E4358E1363306223D13C31CC4BC9`, 5,701,127B. 기존 압축 해제본 6장과 entry별 SHA-256 일치, 경로 이탈 0. 중복 압축 해제본은 2026-08-04 제거했다.
- 원본 자동 검사: 6장 모두 투명 PNG, 977×1609~1610. 4장이 800KB 상한을 넘고 계약 캔버스 1200×2000이 아니므로 원본 추적용으로만 보존한다. 원본명→정규화명은 [PROVENANCE.md](PROVENANCE.md)가 소유한다.
- 정규화 납품본: `assets/source/doyun/delivery/`, commit `4adb4db`, PNG 23장, 총 5,538,435B.
- 자동 검사: 23장 모두 1200×2000 8-bit indexed PNG + `tRNS` 투명도, 실제 투명 픽셀 존재, 개별 최대 343,450B, 손상·SHA-256 완전 중복 없음.
- 이름 정규화 전체 기록은 [PROVENANCE.md](PROVENANCE.md)가 소유한다.
- 채택 범위: N0 세 번째 문장부터 엔딩까지 사용하는 평상복 6장, 마법소녀 5장을 `assets/runtime/char/`에 원본과 동일 바이트로 복사했다. 나머지 납품본은 source에만 보존한다.
- `doyun.magical` SHA-256은 `D93364C7E8D141D00F22AB5CB4782078F1A928DAC398BE9BAB0915170A230123`이며 source와 runtime이 동일하다. DEC-035 임시 승인과 후면/반측면 교체 요청을 유지한다.

작업자 재요청:

1. `char_doyun_magical.png`: 현재 정면본을 대체할 battle p1~p3용 뒷모습 또는 반측면 단일 포즈.
2. `cut_transform_01.webp`: N5 영창 순간, 1920×1080 WebP ≤700KB.
3. `cut_transform_02.webp`: N5 변신 완료, 도윤 뒷모습 또는 반측면, 1920×1080 WebP ≤700KB.
4. 생성 도구·모델, 프롬프트/작업 ID, 생성일, 사용 플랜·라이선스 확인 결과.

### 2026-08-04 주노 과거 경로 확인·runtime 채택

- 최초 납품: commit `6076466`의 `docs/Asset/juno-reference-v2/`.
- 이동 확인: commit `6940236`에서 delivery 5장과 source 10장이 각각 `assets/source/juno/delivery/`, `assets/source/juno/intermediate/`로 `R100` 이동됐다. 삭제·재생성된 파일이 아니다.
- 채택 범위: 계약 파일명 5장을 `assets/runtime/char/`에 source와 동일 바이트로 복사했다.
- 자동 검사: 5장 모두 1200×2000 8-bit indexed PNG + `tRNS`, 개별 800KB 이하, source/runtime hash 일치.
- 장면 검사: N2 `surprised`, battle p1 `neutral`이 실제 배경 위에 투명 합성되고 도윤 우측 확대 구도와 함께 표시된다.
- 남은 게이트: 첨부 레퍼런스 파생·공개 사용 권한과 생성 서비스 플랜 확인. 확인 전 상태는 `ready`다.

## 오디오

| 논리 ID | 파일명 | 종류 | 규격 | 용량 상한 | 우선순위 | 상태 | 생성 도구 | 라이선스 | 시나리오 참조 위치 | QA |
|---|---|---|---|---:|---|---|---|---|---|---|
| `bgm_daily` | `bgm_daily.mp3` | BGM | MP3 128kbps, 60~90초 loop | 3MB | 필수 | ready | Suno + FFmpeg 8.1.1 | Suno Pro at creation·USER ATTESTED·rights PASS 후보 | N0~N2, 수렴·엔딩 폴백 | source/runtime 동일 바이트·48kHz stereo·128kbps·1,457,051B PASS. 3회 루프·대사 마스킹 QA 대기 |
| `bgm_battle` | `bgm_battle.mp3` | BGM | MP3 128kbps, 60~90초 loop | 3MB | 필수 | ready | Suno + FFmpeg 8.1.1 | Suno Pro at creation·USER ATTESTED·rights PASS 후보 | battle p1~p3, crisis 폴백 | source/runtime 동일 바이트·48kHz stereo·128kbps·1,275,234B PASS. 3회 루프·대사 마스킹 QA 대기 |
| `bgm_transform` | `bgm_transform.mp3` | 징글 | MP3 128kbps, 10~20초 one-shot | 3MB | 필수 | ready | Suno + FFmpeg 8.1.1 | Suno Pro at creation·USER ATTESTED·rights PASS 후보 | N5 변신 결과, DEC-016·032 | source/runtime 동일 바이트·19.45초·341,944B PASS. 무보컬·중복 재생 청감 QA 대기 |
| `bgm_crisis` | `bgm_crisis.mp3` | BGM | MP3 128kbps, 30~60초 loop | 3MB | 컷 가능 | ready | Suno + FFmpeg 8.1.1 | Suno Pro at creation·USER ATTESTED·rights PASS 후보 | N3~N5 선호; 없으면 `bgm_battle` | source/runtime 동일 바이트·57.59초·1,014,559B PASS. 3회 루프 QA 대기 |
| `bgm_ending` | `bgm_ending.mp3` | BGM | MP3 128kbps, 약 60초 loop/tail | 3MB | 컷 가능 | ready | Suno + FFmpeg 8.1.1 | Suno Pro at creation·USER ATTESTED·rights PASS 후보 | 수렴~엔딩 선호; 없으면 `bgm_daily` | source/runtime 동일 바이트·63.14초·1,113,163B PASS. 3엔딩 청감 QA 대기 |

## 코드 생성 UI·SFX

| 논리 ID | 파일명/구현 | 종류 | 규격 | 용량 상한 | 우선순위 | 상태 | 생성 도구 | 라이선스 | 참조 위치 | QA |
|---|---|---|---|---:|---|---|---|---|---|---|
| `mic.idle` | DOM/CSS | UI 상태 | 코드 | 0 | 필수 | ready | Codex | N/A | mic indicator | 자동 상태 전환 PASS, 시각 QA 대기 |
| `mic.listening` | DOM/CSS + Web Audio | UI 상태 | 기존 PTT 버튼 내부 live fill, DEC-073. 같은 capture stream을 MediaRecorder와 analyser가 공유하며 quiet/good/loud를 장식 fill로 표시한다. 별도 meter panel 없음. meter 실패는 녹음을 중단하지 않고 no-fill로 강등 | 0 | 필수 | ready | Codex | N/A | dialogue/incantation/battle spell/freeform PTT | Phase B 자동 QA PASS. CORSAIR Chrome에서 네 surface live fill, pointer/T, release reset PASS. focused Space/Enter, physical loud, 강제 scene replacement, 실제 getUserMedia 횟수 계측은 manual PENDING |
| `mic.processing` | DOM/CSS | UI 상태 | 코드 | 0 | 필수 | ready | Codex | N/A | mic indicator | 자동 상태 전환 PASS, 시각 QA 대기 |
| `mic.setup` | DOM/SVG/CSS + Web Audio | TITLE 마이크 설정 | DEC-071 optional microphone 9-state FSM, Settings, voice/click Start·Resume, 접근 가능한 save 없음 Continue, click-only 완주, TITLE microphone test·device select | 0 | 필수 | ready | Codex | N/A | title/settings/start/resume | 9-state 자동 회귀 PASS. CORSAIR READY→TESTING→TEST_SUCCESS, QHD Webcam 전환·CORSAIR 복귀, TEST_SUCCESS→voice N0, TITLE tester→gameplay PTT ownership, PC 3 viewport no-scroll PASS. DENIED/NO_DEVICE/UNSUPPORTED/ERROR 실제 브라우저 재현은 manual PENDING |
| `sfx.confirm` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | ready | Codex | N/A | 선택 확정 | 자동 트리거 PASS, 청감 대기 |
| `sfx.cast` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | ready | Codex | N/A | 주문 성공 | 자동 트리거 PASS, 청감 대기 |
| `sfx.critical` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | ready | Codex | N/A | 완창/크리티컬 | 자동 트리거 PASS, 청감 대기 |
| `sfx.impact` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | ready | Codex | N/A | 전투 플래시 | 자동 트리거 PASS, 청감 대기 |
| `sfx.recognition_fail` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | ready | Codex | N/A | STT 실패 | 자동 트리거 PASS, 청감 대기 |

대화창, 이름표, 버튼, 자막, 호감도·momentum 게이지는 CSS 컴포넌트다. 파일 에셋 매니페스트에 추가하지 않는다.

### 파일 SFX source 인계

`[확정, DEC-065]` 아래 WAV는 사용자 청감 선택과 기본 규격 검사를 통과한 source 납품본이다. 아직 runtime 파일이나 코드 cue가 아니며 현재 Web Audio 동작을 대체하지 않는다.

| 계획 cue | source 파일 | 규격·길이 | 상태 | 생성 도구·플랜 | 사용 위치 | runtime·QA |
|---|---|---|---|---|---|---|
| `sfx.transform_complete` | `sfx_transform_complete.wav` | WAV PCM16, 48kHz stereo, 2.440초 | ready | Suno Sounds One Shot·Pro at creation USER ATTESTED·repository distribution rights PASS 후보 | N5 `n5_transform` 결과 표시 | 미연결·BGM 중첩 청감 대기 |
| `sfx.critical` | `sfx_critical.wav` | WAV PCM16, 48kHz stereo, 2.000초 | ready | Suno Sounds One Shot·Pro at creation USER ATTESTED·repository distribution rights PASS 후보 | battle spell `delta >= 25` | 기존 oscillator 교체 대기 |
| `sfx.barrier` | `sfx_barrier.wav` | WAV PCM16, 48kHz stereo, 5.000초 | ready | Suno Sounds One Shot·Pro at creation USER ATTESTED·repository distribution rights PASS 후보 | p1 `p1_defend` 방어막 활성 | 신규 cue·중복 재생 QA 대기 |
| `sfx.star_attack` | `sfx_star_attack.wav` | WAV PCM16, 48kHz stereo, 2.000초 | ready | Suno Sounds One Shot·Pro at creation USER ATTESTED·repository distribution rights PASS 후보 | p2 `p2_attack` 별 투사체 발사 | 신규 cue·타격음 분리 QA 대기 |
| `sfx.juno_appear` | `sfx_juno_appear.wav` | WAV PCM16, 48kHz stereo, 2.000초 | ready | Suno Sounds One Shot·Pro at creation USER ATTESTED·repository distribution rights PASS 후보 | N2 `n2_juno_intro` 첫 등장 | 신규 cue·장면당 1회 QA 대기 |

최종 SHA-256과 원본 구분은 [SFX_HANDOFF.md](provenance/SFX_HANDOFF.md)와 [SFX_PRODUCTION_EVIDENCE.md](provenance/SFX_PRODUCTION_EVIDENCE.md)를 따른다. 생성 당시 Suno Pro 및 타인 lyrics/audio/reference 미사용은 2026-08-16 `USER ATTESTED`로 저장소 배포 권리 PASS 후보다. runtime 통합·청감 QA 전에는 전체 자산을 `approved`로 올리지 않는다.

## 통합 게이트

- 논리 ID는 시나리오에서 확장자 없이 사용한다.
- 실파일명·논리 ID·장면 사용처 변경은 시나리오 참조, resolver, [SCENE_ASSET_MAPPING.md](SCENE_ASSET_MAPPING.md), 이 표를 같은 변경에서 갱신한다.
- `[확정, DEC-034]` 외부 원본은 rename·변환하지 않는다. 파일명만 다르면 채택 복사본을 계약명으로 정규화하고 매핑을 기록한다. 포맷·규격·장면 내용 오류는 담당자에게 반환한다.
- 캐릭터 5표정은 같은 1200×2000 좌표와 몸 윤곽을 유지한다.
- 이미지 production 전 팀 스타일 앵커를 확정한다.
- `ready` 전 규격·투명도·용량 자동 검사, `approved` 전 사람 시각/청각 QA와 라이선스 확인.
- 전체 물리 에셋 30MB 이하. 첫 화면 필수분만 preload, 나머지는 lazy load.
- 생성·편집 이력은 [AI_PRODUCTION_LOG.md](AI_PRODUCTION_LOG.md)에 기록한다.

## PC TITLE 폰트

| runtime 파일 | 용도 | 규격·크기 | 상태 | 라이선스·QA |
|---|---|---|---|---|
| `fonts/maruburi/MaruBuri-SemiBold.otf` | TITLE h1 | 공식 OpenType SemiBold 600·742,176B | ready | NAVER 공식 archive 원본·OFL 1.1·source/runtime SHA-256 일치·HTTP 200 `font/otf` |
| `fonts/pretendard/Pretendard-Regular.woff2` | TITLE 일반 UI | 공식 v1.3.9 static WOFF2 400·765,892B | ready | 공식 GitHub release·OFL 1.1·source/runtime SHA-256 일치·HTTP 200 `font/woff2` |
| `fonts/pretendard/Pretendard-SemiBold.woff2` | TITLE 강조 UI | 공식 v1.3.9 static WOFF2 600·785,856B | ready | 공식 GitHub release·OFL 1.1·source/runtime SHA-256 일치·HTTP 200 `font/woff2` |

CDN과 외부 font request는 사용하지 않는다. 상세 출처·hash·notice는 [PROVENANCE.md](PROVENANCE.md)의 `2026-08-15 PC TITLE 로컬 폰트`를 따른다. 폰트 채택 후 runtime은 14,176,389B로 30MiB 상한 이하다.
