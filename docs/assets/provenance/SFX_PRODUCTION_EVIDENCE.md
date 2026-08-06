# SFX 제작·편집 증빙

## 생성 환경

- 생성일: 2026-08-06
- 생성 서비스: Suno Sounds, One Shot
- 현재 플랜: Pro — 사용자 확인
- 생성 당시 플랜: 사용자 확인값 Pro, 브라우저 계정 화면 별도 보존 권장
- 모델/버전: v5.5 — Suno Sounds 화면 표시값
- 생성 시작 전 잔여 크레딧: 2,350 — 화면 표시값
- 파일럿 생성 후 잔여 크레딧: 2,336 — 화면 표시값
- 파일럿 사용 크레딧: 14 — Sounds 결과 14개 생성
- 후처리: FFmpeg/FFprobe 8.1.1 예정
- runtime 연결: 없음

## 생성 후보 기록

| 그룹 | 후보명 | 작업 ID 또는 URL | 원본 SHA-256 | 상태 |
|---|---|---|---|---|
| 시간 정지 | `raw_time_stop_a.wav` | [0443f68d](https://suno.com/song/0443f68d-b953-4725-8bd8-b5c8d6a8efbb) | `47A4DA631AF7292B5DD54C95CBA991337808E7115A3A515F6BE166526421CA6D` | 사용자 선택 A — 후처리 대기 |
| 시간 정지 | `raw_time_stop_b.wav` | [e54d0669](https://suno.com/song/e54d0669-0786-425a-8302-2507e2b3dbc6) | `5098A20005364A0FBD647143472C5001D92B202DE29BE4FA9526287145EAE805` | 미선택 |
| 시간 정지 | `raw_time_stop_c.wav` | [73d7dd62](https://suno.com/song/73d7dd62-082a-458d-b6e7-fba72afd07d9) | `AC14B1785A99B48C491F92D34CB4002D028F00E450348C79D77964B158793444` | 미선택 |
| 시간 정지 | 생성 여분 D | [092eb4bf](https://suno.com/song/092eb4bf-70c5-41f3-8b4d-edaff91b7b9a) | 다운로드 없음 | 2개 단위 생성 여분 |
| 주문 시작 | `raw_cast_a.wav` | [704f7aba](https://suno.com/song/704f7aba-5b96-4147-9539-d371217839ba) | `F86B8983A9097844D80DDCB46C8AD2890E807804CB4557232BD81611433AC281` | 미선택 |
| 주문 시작 | `raw_cast_b.wav` | [e42bfb86](https://suno.com/song/e42bfb86-10e8-475d-8f80-b30a9ba55d24) | `AD922DEDE652F7E6D6B95E665C59DDDF58A7049FB104E75EF4033624CA94AF6D` | 사용자 선택 B — 후처리 대기 |
| 주문 시작 | `raw_cast_c.wav` | [38317cf4](https://suno.com/song/38317cf4-a4b0-487f-bf66-8bda7574fffa) | `4BBA3AB4D8929F379B1E4EF8564DF9CE2CE5779B06A77D541E65CFFEC4C92794` | 미선택 |
| 주문 시작 | 생성 여분 D | [4859b8df](https://suno.com/song/4859b8df-6e3e-45de-acf3-692fbc1a860b) | 다운로드 없음 | 2개 단위 생성 여분 |
| 일반 타격 | `raw_impact_a.wav` | [518a044e](https://suno.com/song/518a044e-4d69-4c9f-a013-f9b1cf21b95e) | `86A73E0735CC6FAABA614687ABBEA3AC636274045DD2A241EBC33C18BDA1A5AC` | 사용자 폐기 |
| 일반 타격 | `raw_impact_b.wav` | [c46120fb](https://suno.com/song/c46120fb-8f5f-42ce-8f64-92bf923e5f9b) | `00C72B1E7C72508EBFFFF9F65F50ECCCFC685812074A086F1F6CCBBEDF880DB5` | 사용자 폐기 |
| 일반 타격 | `raw_impact_c.wav` | [b39dedeb](https://suno.com/song/b39dedeb-3246-4195-9f8a-282bc333d0c7) | `D70B81D23FF3E1DE5D084B31EF5064AA94386ED16A1EEFF9AB4813CFED4C13FC` | 사용자 폐기 |
| 일반 타격 | `raw_impact_d.wav` | [281826a8](https://suno.com/song/281826a8-de98-4da1-b1f4-b95d3f26315b) | `4E149333838DC0AB9DE301F6B7EC56918DD93F2641252875CDED2464EB7B579E` | 사용자 폐기 |
| 일반 타격 | `raw_impact_e.wav` | [25f32c0b](https://suno.com/song/25f32c0b-0116-4ae3-acbf-96a43a27b0ea) | `6EFDBF6638741C414B50C1F75BC18DB1301971E3C7515D3E997439AC66938A96` | 사용자 폐기 |
| 일반 타격 | 생성 여분 F | [b84feafb](https://suno.com/song/b84feafb-4f14-48c9-995c-5ea7fcc034fd) | 다운로드 없음 | 2개 단위 생성 여분 |

## 파일럿 원본 규격

Suno Pro WAV 원본은 모두 48kHz, stereo, 16-bit PCM이다. 아래 peak는 FFmpeg `volumedetect`의 sample peak이며 최종 True Peak 검사가 아니다.

| 후보 | 길이 | 크기 | sample peak |
|---|---:|---:|---:|
| `raw_time_stop_a.wav` | 11.36초 | 2,181,292 bytes | -3.1 dB |
| `raw_time_stop_b.wav` | 13.32초 | 2,557,612 bytes | -2.4 dB |
| `raw_time_stop_c.wav` | 8.12초 | 1,559,212 bytes | -2.4 dB |
| `raw_cast_a.wav` | 2.52초 | 484,012 bytes | -3.3 dB |
| `raw_cast_b.wav` | 3.00초 | 576,172 bytes | -6.8 dB |
| `raw_cast_c.wav` | 2.68초 | 514,732 bytes | -5.5 dB |
| `raw_impact_a.wav` | 2.00초 | 384,172 bytes | -7.6 dB |
| `raw_impact_b.wav` | 2.00초 | 384,172 bytes | -2.6 dB |
| `raw_impact_c.wav` | 2.00초 | 384,172 bytes | -4.7 dB |
| `raw_impact_d.wav` | 2.00초 | 384,172 bytes | -2.5 dB |
| `raw_impact_e.wav` | 2.00초 | 384,172 bytes | -2.6 dB |

## 사용자 파일럿 선택

사용자 선택일은 2026-08-06이다. 아래 파일은 선택 원본을 별도 복사한 것으로, 아직 트림·음량 정규화·runtime 연결을 하지 않았다.

| 계약명 예정 | 선택 원본 | 보존 경로 | SHA-256 | 상태 |
|---|---|---|---|---|
| `sfx_time_stop.wav` | `raw_time_stop_a.wav` | `judge_magical_girl_sfx_work/selected/sfx_time_stop.wav` | `47A4DA631AF7292B5DD54C95CBA991337808E7115A3A515F6BE166526421CA6D` | 사용자 선택 A, 후처리 대기 |
| `sfx_cast.wav` | `raw_cast_b.wav` | `judge_magical_girl_sfx_work/selected/sfx_cast.wav` | `AD922DEDE652F7E6D6B95E665C59DDDF58A7049FB104E75EF4033624CA94AF6D` | 사용자 선택 B, 후처리 대기 |

일반 타격 A–E는 사용자 검수에서 모두 폐기했다. 개선 생성폼과 미제작 효과음 폼은 [SFX_SUNO_GENERATION_FORMS.md](SFX_SUNO_GENERATION_FORMS.md)에 기록한다.

## 추가 다운로드본 사용자 선택

사용자 선택일은 2026-08-06이다. 아래 5개만 선택 원본으로 별도 복사했으며, 아직 트림·음량 정규화·runtime 연결을 하지 않았다. `방어막 신버전`은 `Magical Shield Activation` 원본을 뜻하며 이전 `Magical Shield Deployment` 원본은 미반영이다.

| 계약명 예정 | 다운로드 원본 구분 | 보존 경로 | 원본 SHA-256 | 상태 |
|---|---|---|---|---|
| `sfx_transform_complete.wav` | 변신 완료 (`Magical-girl Transformation Completion`) | `assets/source/sfx/delivery/sfx_transform_complete.wav` | `CCF478921EF8B3BE124FC3A0F21568850378D624ACCD93D46E97A224F1F1E318` | 사용자 선택·source 인계, 후처리·runtime 대기 |
| `sfx_critical.wav` | 치명타 (`Critical Magical Hit`) | `assets/source/sfx/delivery/sfx_critical.wav` | `BB5880185585B1FB2AE2BEDA50D8EDBE0AED9B2CE4AD7B1AB89859D31420ECA2` | 사용자 선택·source 인계, 후처리·runtime 대기 |
| `sfx_barrier.wav` | 방어막 신버전 (`Magical Shield Activation`) | `assets/source/sfx/delivery/sfx_barrier.wav` | `52BCF2011D5815AE4B0D06534113CA2B7BACBB0D47400347B48CF2265ACE70F9` | 사용자 선택·source 인계, 후처리·runtime 대기 |
| `sfx_star_attack.wav` | 별빛 공격 (`Magical Wand Attack`) | `assets/source/sfx/delivery/sfx_star_attack.wav` | `C4DE29A13BA813D76724D0DC0464813E4410D00C580AD68A838FED52999AD6FE` | 사용자 선택·source 인계, 후처리·runtime 대기 |
| `sfx_juno_appear.wav` | 주노 등장 (`Cute Character Pop-out From A CRT Monitor`) | `assets/source/sfx/delivery/sfx_juno_appear.wav` | `C2A0B50743E1FC9C99D86F5A818438ED361AAB494A875EB16777F3CBABEE70EF` | 사용자 선택·source 인계, 후처리·runtime 대기 |

같이 확인한 다운로드본 중 회색 침식, 방어막 구버전(`Magical Shield Deployment`), 일반 타격(`Magical Combat Contact Hit`), 최종 빔 충전(`Magical Beam Charging`)은 사용자 미반영 대상으로 분류했다. 해당 4개는 저장소 source 인계에 포함하지 않았고 runtime에도 연결하지 않는다.

## 최종 납품 기록

| 최종 파일 | 선택 후보 | 길이 | 채널 | True Peak | 최종 SHA-256 | 사용자 승인 |
|---|---|---:|---:|---:|---|---|
