# SFX 5종 개발자 인계

- 인계일: 2026-08-06
- 상태: 사용자 청감 선택 완료, source `ready`, runtime 미연결
- 생성: Suno Sounds One Shot, Pro 플랜 — 사용자 확인
- 후처리: 없음. 생성 WAV의 트림·정규화·재인코딩 없이 바이트 보존

## 인계 범위

아래 5개만 `assets/source/sfx/delivery/`에 넣는다. 이 인계는 원본 보존과 장면 계약만 포함하며 `assets/runtime/`, `src/`, `public/scenario/`는 수정하지 않는다.

| 파일 | 길이 | 크기 | 규격 | SHA-256 |
|---|---:|---:|---|---|
| `sfx_transform_complete.wav` | 2.440초 | 468,652B | WAV PCM 16-bit, 48kHz, stereo | `CCF478921EF8B3BE124FC3A0F21568850378D624ACCD93D46E97A224F1F1E318` |
| `sfx_critical.wav` | 2.000초 | 384,172B | WAV PCM 16-bit, 48kHz, stereo | `BB5880185585B1FB2AE2BEDA50D8EDBE0AED9B2CE4AD7B1AB89859D31420ECA2` |
| `sfx_barrier.wav` | 5.000초 | 960,172B | WAV PCM 16-bit, 48kHz, stereo | `52BCF2011D5815AE4B0D06534113CA2B7BACBB0D47400347B48CF2265ACE70F9` |
| `sfx_star_attack.wav` | 2.000초 | 384,172B | WAV PCM 16-bit, 48kHz, stereo | `C4DE29A13BA813D76724D0DC0464813E4410D00C580AD68A838FED52999AD6FE` |
| `sfx_juno_appear.wav` | 2.000초 | 384,172B | WAV PCM 16-bit, 48kHz, stereo | `C2A0B50743E1FC9C99D86F5A818438ED361AAB494A875EB16777F3CBABEE70EF` |

## 장면·트리거 계약

| 파일 | 런타임 위치 | 정확한 재생 시점 | 기존 코드와의 관계 |
|---|---|---|---|
| `sfx_transform_complete.wav` | N5 `n5_transform` | 주문 판정이 끝나고 변신 결과 화면을 표시하는 순간. perfect·standard·rescued 공통, 결과 렌더당 1회 | 현재 `main.ts`의 perfect=`critical`, 나머지=`cast` 분기를 이 파일 1회 재생으로 교체하는 후보. `bgm_transform`과 겹칠 수 있으므로 청감 QA 필요 |
| `sfx_critical.wav` | `battle_wraith` 전 페이즈 | spell 결과의 momentum 증가량 `delta >= 25`가 확정되는 순간 | 현재 `SfxPlayer.play("critical")` 오실레이터 교체 후보. N5 perfect 변신에는 사용하지 않는다 |
| `sfx_barrier.wav` | p1 `p1_defend` | 성공한 방어 주문 뒤 방어막 visual이 펼쳐지는 순간 | phase 전용 신규 cue 후보. 일반 `impact`보다 먼저 1회 재생 |
| `sfx_star_attack.wav` | p2 `p2_attack` | 성공한 공격 주문 뒤 지팡이를 휘두르고 별 투사체가 발사되는 순간 | phase 전용 신규 cue 후보. 후속 충돌음이 아니라 발사음으로 사용 |
| `sfx_juno_appear.wav` | N2 `n2_juno_intro` | 첫 진입에서 주노 스프라이트가 모니터 밖으로 나타나는 순간 | 장면 전용 신규 cue 후보. 대사 rerender가 아니라 장면 진입당 1회 |

## 개발 통합 주의

- source 파일을 게임에서 직접 참조하지 않는다. 사람 청감·라이선스 QA 뒤 채택본만 `assets/runtime/sfx/`에 복사한다.
- 현재 `src/audio/sfx.ts`의 Web Audio 구현은 이 인계에서 유지한다. 파일 로드 실패 시 기존 오실레이터 또는 무음으로 진행하고 게임 흐름을 막지 않는다.
- STT 녹음·PTT 청취 중에는 신규 SFX를 재생하지 않는다. 재생 중 PTT가 시작되면 중단하거나 캡처에 섞이지 않게 한다.
- N2·N5 재렌더, 음성 재시도, debug scene 재진입에서 중복 재생 방지 키를 둔다.
- `sfx_barrier.wav`는 `Magical Shield Activation` 신버전이다. `Magical Shield Deployment` 구버전을 대체 파일로 사용하지 않는다.
- `sfx_star_attack.wav`는 귀여운 별 투사체 발사음이다. 타격 접촉음이나 최종 빔으로 재사용하지 않는다.

## 미반영 파일

같이 검수한 회색 침식, 방어막 구버전, 일반 타격, 최종 빔 충전은 이번 인계에 포함하지 않는다. 이전에 선별한 시간정지 A와 주문 시작 B도 이번 Git 게시 범위 밖이다.

## 개발자 체크리스트

- [ ] runtime 채택 전 사람 청감과 Suno Pro 생성·대회 제출 권리 근거를 확인한다.
- [ ] source/runtime SHA-256 일치를 확인한다.
- [ ] N2·N5 장면당 1회, p1·p2 행동당 1회 재생을 확인한다.
- [ ] battle `delta >= 25`에서만 파일 치명타음이 재생되는지 확인한다.
- [ ] PTT 청취 중 SFX가 녹음·전사에 섞이지 않는지 확인한다.
- [ ] 파일 404·decode 실패에서도 Web Audio 또는 무음 폴백으로 완주되는지 확인한다.

## 권리 증빙 상태

사용자는 Suno Pro 플랜을 사용했다고 확인했다. 생성 당시 계정 화면, 작업 ID, 적용 약관과 해커톤 제출 허용 근거는 팀이 별도 보존해야 하며, 확인 전 manifest 상태를 `approved`로 올리지 않는다.
