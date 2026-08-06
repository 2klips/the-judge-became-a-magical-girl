# 효과음 제작 준비안

## 범위와 현재 상태

- 이 문서는 효과음 제작 사양과 장면 배치 제안만 확정한다. 이번 납품에는 효과음 파일과 런타임 연결 변경이 없다.
- 현재 게임은 [`src/audio/sfx.ts`](../../../src/audio/sfx.ts)의 Web Audio 합성음 `confirm`, `cast`, `critical`, `impact`, `recognition_fail`을 사용한다. 개발자 승인 전에는 이를 교체하지 않는다.
- 실제 파일 제작은 사용자 검토 뒤 별도 배치로 진행한다. Suno의 음악 생성폼이 아니라 **Suno Sounds의 One Shot** 방식이 우선이다.
- PTT/마이크가 입력을 듣는 동안에는 효과음을 재생하지 않는다. 녹음 종료 또는 판정 결과 뒤에만 재생한다.

## 장면별 우선순위

| 우선 | 제안 파일명 | 장면·트리거 | 의도 | 권장 길이·사용 |
|---|---|---|---|---|
| P0 | `sfx_time_stop.wav` | N1 첫 음성 직후 시간 정지 | 일상에서 마법 사건으로 넘어가는 경계 | 약 1.0초, one-shot |
| P0 | `sfx_wraith_enter.wav` | N3 회색 망령 등장 | 안개·파편이 침투하는 불안 | 약 1.5초, one-shot |
| P0 | `sfx_cast.wav` | N5 주문 성공, `transform.cast` | 주문 승인과 변신 시작 | 약 1.1초, one-shot |
| P0 | `sfx_transform_complete.wav` | `transform.complete` 컷 전환 | 완성된 변신의 짧은 확정감 | 약 0.8초, one-shot |
| P0 | `sfx_barrier.wav` | battle p1 방어 성공 | 투명 방벽이 펼쳐지고 잠기는 느낌 | 약 1.0초, one-shot |
| P0 | `sfx_impact_01~03.wav` | battle 일반 타격·실패 피드백 | 반복 사용 가능한 절제된 마법 타격 | 약 0.45초, 3변형 순환 |
| P0 | `sfx_star_attack.wav` | battle p2 별빛 공격 | 지팡이 스윙에서 별빛 폭발로 연결 | 약 0.8초, one-shot |
| P0 | `sfx_critical.wav` | 큰 주문 성공·강한 타격 | 일반 타격보다 선명한 성공 보상 | 약 0.8초, one-shot |
| P0 | `sfx_final_beam.wav` | battle p3 최종 빔 | 충전→발사→회색 핵 균열 | 약 2.0초, 단일 시퀀스 |
| P1 | `sfx_mic_ready.wav` | PTT 준비 완료 | 녹음 가능 상태를 조용히 알림 | 0.15~0.25초 |
| P1 | `sfx_juno_appear.wav` | N2 주노 등장 | 가볍고 맑은 마법 출현 | 0.6~0.9초 |
| P1 | `sfx_convergence.wav` | 전투 후 사무실 복귀 | 잔광이 접히며 현실로 수렴 | 0.8~1.2초 |
| P1 | `sfx_blacklight_absorb.wav` | 엔딩 검은 마법소녀 흡수 | 빛을 삼키는 낮은 흡입과 잔향 | 1.2~1.8초 |
| P1 | `sfx_unknown_user.wav` | HIDDEN `unknown_user` | 낯선 접속·식별 불가 신호 | 0.4~0.7초 |
| P1 | `sfx_gray_stamp.wav` | 회색 도장 판정 강조 | 사무용 도장과 마법 파편 결합 | 0.4~0.6초 |

`recognition_fail`과 일반 UI `confirm`은 현재 합성음이 기능적으로 충분하다. 외부 제작 우선순위는 낮게 유지한다.

## Suno Sounds 원샷 프롬프트

각 프롬프트는 **One Shot**으로 생성하고, 노래·보컬·긴 전개가 나오면 폐기한다.

### 시간 정지

```text
1.0-second one-shot game sound effect, a clock tick abruptly freezes, airy vacuum pull and thin glass resonance, late-night office atmosphere, immediate transient, short clean tail, no voice, no music, no bass boom, no long reverb
```

### 회색 망령 등장

```text
1.5-second one-shot game sound effect, gray fog sweep with paper and digital fragments, restrained uncanny low rumble, compact cinematic texture, no jump scare, no voice, no music, no long drone
```

### 주문·변신 시작

```text
1.1-second one-shot magical-girl game sound effect, rapid airy whoosh rising into celesta sparkle, subtle office approval chime, sincere and compact, no voice, no music bed, no long reverb
```

### 변신 완료

```text
0.8-second one-shot magical transformation completion sound, bright crystalline confirmation and compact star shimmer, confident clean ending, no voice, no music bed, no trailer impact
```

### 방벽

```text
1.0-second one-shot magical shield sound effect, translucent bubble barrier expands and locks, soft magical pulse and small crystalline seal, no explosion, no voice, no music
```

### 일반 타격 3변형

```text
0.45-second one-shot restrained magical impact, soft electric crack with a small glass sparkle, punchy but dialogue-friendly, no bass boom, no voice, no music, create a clean isolated hit
```

같은 프롬프트로 질감이 다른 3개를 고르고 음량을 맞춘다.

### 별빛 공격

```text
0.8-second one-shot magical wand attack, quick wand-swing whoosh into a compact bright starburst, energetic but not harsh, no explosion boom, no voice, no music
```

### 강한 타격

```text
0.8-second one-shot critical magical hit, sharp crystalline transient, controlled impact body and pink-white sparkle, exciting but compact, no huge explosion, no trailer boom, no voice, no music
```

### 최종 빔

```text
2.0-second one-shot magical final attack sequence, very short charge, focused beam release, gray crystal core fracture and compact sparkling tail, no voice, no music bed, no long rumble
```

## 편집·납품 규격

- 원본 보관: 생성 서비스에서 받을 수 있는 최고 품질 파일과 곡/효과 ID를 함께 보존한다.
- 마스터: WAV, 48kHz, 24-bit. 방향성이 필요 없는 UI·타격은 mono, 화면 전체를 가로지르는 전환·빔만 stereo 후보로 둔다.
- 시작 무음은 거의 제거하되 첫 transient가 잘리지 않게 5~15ms 여유를 둔다.
- 끝은 클릭 없이 짧게 정리하고 불필요한 긴 잔향은 자른다.
- True Peak는 최대 -1 dBTP 이하로 맞추고, 같은 계열 3변형의 체감 음량을 통일한다.
- 반복 타격은 3변형을 순환해 피로감을 줄인다.
- 개발용 압축 포맷과 실제 runtime 파일명은 개발자가 브라우저 호환성·용량을 확인한 뒤 결정한다.

## 제작 전·통합 전 게이트

- [ ] 사용자가 P0 목록과 프롬프트를 검토하고 실제 생성 범위를 승인한다.
- [ ] Suno Sounds 생성 당시 Pro 플랜·생성일·작업 ID를 기록한다.
- [ ] `gray_wraith` normal/weakened, `transform.cast`/`transform.complete`, 엔딩 검은 마법소녀 컷 확정 뒤 프레임 타이밍을 다시 맞춘다.
- [ ] 개발자가 현재 합성음 유지/파일 교체/병행 정책을 결정한다.
- [ ] 마이크 녹음 중 무음, 결과 뒤 재생 규칙을 실제 브라우저에서 확인한다.
- [ ] BGM duck 상태에서 효과음이 대사와 충돌하지 않는지 노트북 스피커와 헤드폰으로 확인한다.
