# BGM 납품 인계 및 장면 배치

## 납품 범위

- 최종 편집한 BGM 5종을 [`assets/source/bgm/delivery/`](../../../assets/source/bgm/delivery/)에 외부 납품본으로 보관한다.
- 이 변경은 런타임 코드, 시나리오, `assets/runtime/bgm/`, 에셋 매니페스트 상태를 수정하지 않는다.
- 개발자는 사람 청각 QA와 권리 확인 후 승인한 파일만 `assets/runtime/bgm/`에 같은 파일명으로 복사한다.
- 런타임 연결 기준은 [M5 UI·BGM 요청 매핑](../M5_UI_BGM_REQUEST_MAPPING.md)과 [장면별 에셋 매핑](../SCENE_ASSET_MAPPING.md)을 따른다.

## 최종 파일과 사용 장면

| 파일 | 길이 | 재생 방식 | 권장 장면 | 원본 사용 구간 |
|---|---:|---|---|---:|
| `bgm_daily.mp3` | 86.29초 | loop 후보 | N0 `n0_review`~N2 `n2_juno_followup`, 수렴·엔딩 폴백 | `00:05.71~01:32.00` |
| `bgm_crisis.mp3` | 57.59초 | loop 후보 | N3 `n3_wraith_choice`~N5 주문 게이트 | `01:36.08~02:33.67` |
| `bgm_transform.mp3` | 19.45초 | one-shot, loop 금지 | N5 주문 성공 직후 `transform.cast`~`transform.complete` | 최종 추천 A `00:00.35~00:19.80` |
| `bgm_battle.mp3` | 69.03초 | loop 후보 | battle p1 `p1_defend`~p3 `p3_answer` | `01:40.01~02:49.04` |
| `bgm_ending.mp3` | 63.14초 | loop 후보 또는 장면 종료 시 정지 | 전투 후 수렴~GOOD/NORMAL/BAD | `00:33.39~01:36.53` |

`loop 후보`는 편집 구간상 반복 사용을 의도했다는 뜻이다. 실제 무봉제 루프 승인은 개발자 통합 후 헤드폰 반복 QA로 확정한다.

## 개발자 통합 제안

1. 타이틀은 브라우저 autoplay 제한 때문에 무음으로 유지한다.
2. `bgm_daily`는 N0~N2 장면 전환 때 재시작하지 않는다.
3. N3 진입 시 `bgm_daily`에서 `bgm_crisis`로 crossfade하고 N5 주문 판정까지 유지한다.
4. 주문 입력·PTT 청취 중 현재 BGM을 duck한다.
5. 주문 성공 후 `bgm_crisis`를 멈추고 `bgm_transform`을 한 번만 재생한다.
6. 변신 징글 종료 직전 또는 직후 `bgm_battle`로 crossfade한다.
7. battle p1~p3 이동 때 `bgm_battle`을 재시작하지 않는다.
8. 전투 종료 후 `bgm_ending`으로 crossfade하고 엔딩 내부 후속 컷에서는 재시작하지 않는다.
9. `bgm_crisis` 미승인 시 `bgm_battle`, `bgm_ending` 미승인 시 `bgm_daily`를 기존 폴백으로 사용한다.

## 파일 규격

| 파일 | 포맷 | 샘플레이트 | 채널 | 비트레이트 | 크기 | 통합 음량 | True Peak |
|---|---|---:|---:|---:|---:|---:|---:|
| `bgm_daily.mp3` | MP3 | 48kHz | 2 | 128kbps | 1,457,051 bytes | -17.44 LUFS | -4.93 dBTP |
| `bgm_crisis.mp3` | MP3 | 48kHz | 2 | 128kbps | 1,014,559 bytes | -17.44 LUFS | -5.74 dBTP |
| `bgm_transform.mp3` | MP3 | 48kHz | 2 | 128kbps | 341,944 bytes | -17.48 LUFS | -1.03 dBTP |
| `bgm_battle.mp3` | MP3 | 48kHz | 2 | 128kbps | 1,275,234 bytes | -17.41 LUFS | -4.40 dBTP |
| `bgm_ending.mp3` | MP3 | 48kHz | 2 | 128kbps | 1,113,163 bytes | -17.44 LUFS | -5.41 dBTP |

모든 파일은 파일당 3MB 제한 이하다. `bgm_transform`에는 30ms fade-in과 300ms fade-out을 적용했다. 루프 후보에는 반복 시 음량이 꺼지는 개별 fade를 넣지 않았다.

## 통합 전 필수 QA

- [ ] 각 루프 후보를 헤드폰으로 최소 3회 반복해 클릭·박자 점프·무음 틈을 확인한다.
- [ ] 노트북 스피커에서 대사와 BGM의 분리도를 확인한다.
- [ ] PTT/STT 청취 중 duck과 판정 후 복구를 확인한다.
- [ ] `bgm_transform`이 성공 판정 뒤 한 번만 재생되는지 확인한다.
- [ ] battle p1~p3 이동 때 음악이 재시작되지 않는지 확인한다.
- [ ] GOOD/NORMAL/BAD 마지막 대사까지 엔딩 음악 상태가 안정적인지 확인한다.
- [ ] [BGM 제작·편집 증빙](BGM_PRODUCTION_EVIDENCE.md)의 미확인 항목을 사람이 보완한다.
