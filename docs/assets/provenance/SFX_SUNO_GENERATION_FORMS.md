# Suno 효과음 생성폼

## 사용 방법

- Suno `Create` → `Sounds`에서 모델 `v5.5`를 선택한다.
- 아래 **사운드 설명**만 설명 칸에 붙여 넣는다. 제목은 다운로드 파일을 구분하기 위한 작업명이며 입력 필드가 아니다.
- 전 항목 `One-Shot`, `BPM Auto`, `Key Random`을 사용한다.
- 결과가 음악처럼 이어지거나, 음성·반복음·긴 도입부가 섞이면 폐기한다.
- P0는 항목당 2회 생성해 4개 후보를 비교한다. P1은 우선 1회 생성해 2개 후보를 비교한다.
- 채택 후보는 **WAV 원본**으로 내려받는다. Suno 전체 생성 길이는 무시하고, 아래 목표 구간에 맞는 단일 사건음만 추후 편집한다.
- 원본은 음량 정규화나 MP3 변환 없이 전달한다. 채택본의 트림·페이드·음량 통일은 납품 단계에서 처리한다.

## 사용자 선택 완료 — 재생성하지 않음

| 계약명 | 선택본 | 장면·의도 | 현재 상태 |
|---|---|---|---|
| `sfx_time_stop.wav` | 시간 정지 A | N3 시간 정지 진입. 세계가 순간적으로 얼어붙는 경계 표시 | 원본 보존, 후처리 대기 |
| `sfx_cast.wav` | 주문/변신 시작 B | N3 도윤의 변신 주문과 마력이 모이기 시작하는 시점 | 원본 보존, 후처리 대기 |

## P0 — 필수 제작

### 1. 회색 망령 출현

- 계약명: `sfx_wraith_enter.wav`
- 사용 장면: N3, 회색 안개가 사무실을 침식하고 망령 형상이 완성되는 컷
- 의도: 공포 점프스케어보다 ‘서류·재가 비현실적으로 응집되는 불길함’을 전달한다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 1.2–1.8초

**사운드 설명**

```text
Single isolated game sound effect: gray fog sweeps into a late-night office, papery ash and digital fragments gather into a wraith, soft reversed-breath texture and thin glass resonance, restrained uncanny tension, clear beginning and clean short tail. No speech, whisper, scream, melody, music, jump scare, bass boom, repeated hits, or long drone.
```

### 2. 변신 완료

- 계약명: `sfx_transform_complete.wav`
- 사용 장면: N3, 변신 연출 마지막 프레임에서 복장과 마법 문양이 고정되는 순간
- 의도: `sfx_cast`의 시작음과 구분되는 명확한 완료 신호다. 밝고 자신감 있지만 긴 징글이 되면 안 된다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.6–0.9초

**사운드 설명**

```text
Single isolated magical-girl transformation completion sound effect: a bright crystalline seal locks into place, compact celesta-like sparkle, star shimmer and a confident approval chime, sincere, radiant and slightly office-tech. Immediate attack and clean short tail. No voice, spoken spell, melody, music bed, comedy, trailer boom, repeated sequence, or long reverb.
```

### 3. 마법 방어막

- 계약명: `sfx_barrier.wav`
- 사용 장면: B3, 투명한 보호막이 도윤 주위로 빠르게 펼쳐지고 고정되는 컷
- 의도: 폭발음이 아니라 ‘팽창 → 막 형성 → 잠금’이 한 번에 읽히는 보호음이다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.8–1.2초

**사운드 설명**

```text
Single isolated magical shield deployment sound effect: a translucent bubble rapidly expands around the heroine, soft energy pulse, glassy membrane tension, then a crisp crystalline lock. Protective, bright and controlled, medium impact. No explosion, weapon hit, voice, music, bass boom, repetition, or long tail.
```

### 4. 일반 타격 — 개선폼

- 계약명: `sfx_impact_01.wav`, `sfx_impact_02.wav`, `sfx_impact_03.wav`
- 사용 장면: B3 반복 전투. 망령에게 일반 마법 공격이 실제로 접촉하는 프레임
- 의도: 기존 A–E 후보는 모두 폐기했다. 새 폼은 선행 위시를 제거하고, 노트북 스피커에서도 접촉점이 들리는 건조한 중역대 펀치를 강화한다.
- 생성: 아래 기본폼 2회, 후보 4개 중 성격이 다른 3개 선택
- 목표 사용 길이: 각 0.30–0.55초

**사운드 설명 — 기본폼**

```text
Single isolated magical combat contact hit: one sharp energy snap, solid mid-frequency punch and a tiny glass-star sparkle immediately after the hit, readable on laptop speakers, strong but not cinematic. Dry immediate attack, very short clean tail. No lead-in whoosh, gunshot, explosion, bass boom, voice, music, echo, or repeated hits.
```

기본폼 결과가 여전히 약하면 아래 강화폼으로 1회만 추가 생성한다.

**사운드 설명 — 강화폼**

```text
Single isolated close-range magical strike: one hard compact impact with a crisp electric crack, firm punch in the mid frequencies and one short crystal-shard accent, strong on laptop speakers, dry and immediate. No whoosh, gunshot, explosion, sub-bass, voice, music, echo, debris tail, or repeated hits.
```

선택 시 세 파일의 역할을 나눈다.

| 계약명 | 선택 기준 |
|---|---|
| `sfx_impact_01.wav` | 가장 짧고 선명한 기본타 |
| `sfx_impact_02.wav` | 전기 균열이 조금 강한 변주 |
| `sfx_impact_03.wav` | 유리별 반짝임이 조금 강한 변주 |

### 5. 별빛 공격

- 계약명: `sfx_star_attack.wav`
- 사용 장면: B3, 완드를 휘둘러 별 모양 투사체를 발사하는 공격 컷
- 의도: 휘두름과 발사가 하나의 짧은 동작으로 연결되어야 한다. 일반 타격음보다 공격의 출발을 설명한다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.7–1.0초

**사운드 설명**

```text
Single isolated magical wand attack sound effect: a fast wand-swing whoosh immediately connects to a bright star-shaped energy burst, sparkling particles scatter and stop, agile and heroic with a clear two-part motion. No huge explosion, gunshot, voice, music, bass boom, repeated attacks, or long reverb.
```

### 6. 치명타

- 계약명: `sfx_critical.wav`
- 사용 장면: B3, 강한 공격이 적의 핵이나 약점에 적중하는 강조 프레임
- 의도: 일반 타격보다 한 단계 강하지만 예고편식 저음 폭발은 피한다. 날카로운 결정 파열로 차이를 만든다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.6–0.9초

**사운드 설명**

```text
Single isolated critical magical hit: razor-sharp crystalline transient, firm energy-impact body, pink-white star fracture and a short glitter tail, clearly stronger than a normal hit but controlled for dialogue. No trailer boom, huge explosion, metallic sword, voice, music, repeated hits, or long rumble.
```

### 7. 최종 빔

- 계약명: `sfx_final_beam.wav`
- 사용 장면: B3 전투 마무리, 충전 후 빔이 발사되어 회색 결정을 깨는 연속 컷
- 의도: 짧은 충전·발사·파괴가 한 파일 안에서 읽히는 전투 피니셔다. 영화 예고편 규모의 과도한 저음은 배제한다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 1.6–2.4초

**사운드 설명**

```text
Single isolated final magical beam sequence for a game: very short rising charge, focused beam launch, sustained energy core for a moment, gray crystal shatters at impact, compact sparkling release. Powerful but clean and below cinematic-trailer scale. No voice, chant, music, huge bass boom, repeated shots, or long rumble.
```

## P1 — 장면 완성도용 추가 제작

### 8. 마이크 준비

- 계약명: `sfx_mic_ready.wav`
- 사용 장면: 음성 입력·마이크 버튼이 준비 상태로 바뀌는 UI
- 의도: 대사를 방해하지 않는 짧은 준비 확인음이다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.15–0.25초

**사운드 설명**

```text
Single isolated UI microphone-ready cue: one soft digital activation ping with a tiny clean air pulse, calm, precise and unobtrusive, clearly audible on laptop speakers. Extremely short and dry. No voice, recording-beep imitation, melody, music, alarm, bass, echo, or repeated notes.
```

### 9. 주노 등장

- 계약명: `sfx_juno_appear.wav`
- 사용 장면: N3, 주노가 작은 빛과 함께 나타나는 첫 프레임
- 의도: 친근함과 신비감을 주되 천사 합창이나 음악성 있는 징글은 피한다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.6–0.9초

**사운드 설명**

```text
Single isolated magical character-appearance sound effect: a small warm air bloom, delicate glass shimmer and one gentle star glint, friendly and mysterious, compact visual-novel scale. No voice, angel choir, melody, music bed, comedy pop, impact boom, repeated sparkle, or long reverb.
```

### 10. 수렴·복구

- 계약명: `sfx_convergence.wav`
- 사용 장면: 전투 종료 뒤 흩어진 마력이 수렴하고 사무실이 정상으로 돌아오는 컷
- 의도: 승리 팡파르가 아니라 긴장이 조용히 풀리는 복구 신호다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.8–1.2초

**사운드 설명**

```text
Single isolated magical convergence sound effect: scattered light particles fold inward, a soft reverse shimmer closes, then late-night office room tone settles back into place. Relief after battle, quiet and clean. No voice, melody, music, explosion, bass boom, repeated pulses, or long ambient tail.
```

### 11. 검은빛 흡수

- 계약명: `sfx_blacklight_absorb.wav`
- 사용 장면: 회색 마력이나 빛 조각이 검은빛 안으로 빨려 들어가는 컷
- 의도: 공포음이 아니라 통제된 흡수 현상을 표현한다. 안쪽으로 빨려드는 방향감이 핵심이다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 1.2–1.8초

**사운드 설명**

```text
Single isolated dark-magical absorption sound effect: a controlled inward suction pulls bright particles into black light, low airy vacuum, muted glass resonance and a short sealed ending. Unsettling but not horror. No voice, scream, music, huge bass drop, explosion, heartbeat, repetition, or long drone.
```

### 12. 알 수 없는 사용자

- 계약명: `sfx_unknown_user.wav`
- 사용 장면: 시스템이 정체불명의 사용자·심사 대상을 감지하는 UI 알림
- 의도: 정상 업무용 알림이 아주 살짝 깨지는 느낌으로 불신을 만든다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.4–0.7초

**사운드 설명**

```text
Single isolated unknown-user system cue: a brief office-terminal notification becomes subtly corrupted, clean digital chirp, tiny data glitch and unresolved glass tick. Suspicious, compact and readable. No voice, spoken ID, melody, music, alarm siren, harsh static, repeated beeps, or long tail.
```

### 13. 회색 판정 도장

- 계약명: `sfx_gray_stamp.wav`
- 사용 장면: 회색 판정 또는 심사 결과가 문서에 찍히는 순간
- 의도: 사무적 도장음과 마법 침식의 재·유리 질감을 결합해 게임 고유의 ‘심사’ 테마를 살린다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.4–0.6초

**사운드 설명**

```text
Single isolated gray-judgment stamp sound effect: one firm rubber-stamp contact on paper followed immediately by a dry magical-ash crackle and tiny glass fragment, bureaucratic and uncanny. No voice, music, gunshot, explosion, bass boom, repeated stamps, wet splatter, or long reverb.
```

## 전달 규칙

1. P0부터 생성한다. 일반 타격은 개선폼을 먼저 확인한 뒤 나머지 항목으로 넘어간다.
2. 각 결과에서 가장 좋은 후보만 WAV로 다운로드한다. 비교가 필요하면 계약명 뒤에 `_a`, `_b`를 붙인다.
3. 파일은 `C:\Users\user\Downloads\judge_magical_girl_sfx_work\user_generated\`에 모은다.
4. 원본은 자르거나 음량을 바꾸지 않는다. 선택이 애매하면 후보를 모두 남긴다.
5. 파일 전달 뒤 트림 구간, 페이드, True Peak, 최종 계약명은 별도 검수한다. runtime 연결은 개발자에게 맡긴다.
