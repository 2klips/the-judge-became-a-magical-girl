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
- 의도: LoL 소환사 주문 Barrier처럼 즉시 발동과 보호 상태가 명확히 읽히는 구조를 참고하되, 원본 음원·고유 음색은 복제하거나 재사용하지 않는다. 밝고 단단한 활성화음 뒤에 팽창과 짧은 보호막 공명을 붙인다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.8–1.1초

**사운드 설명**

```text
Single isolated magical shield activation sound effect with the fast, decisive readability of a competitive-game defensive spell, using original sound design: immediate bright protective snap, compact white-pink energy surge expanding around the heroine, dense magical membrane resonance, short confident decay. Strong and clearly defensive on laptop speakers. No copied game audio, glass breaking, explosion, weapon hit, voice, music, deep bass boom, repetition, or long ambience.
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
- 의도: 기존의 빠른 완드 휘두름은 유지한다. 발사부의 둔탁한 에너지 버스트는 제거하고, 작고 귀여운 별 모양 투사체가 가볍게 출발하는 고음 비보컬 `뿅`으로 바꾼다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.65–0.9초

**사운드 설명**

```text
Single isolated magical wand attack sound effect: keep a fast clean wand-swing whoosh, then launch one tiny cute star-shaped projectile with a high-pitched springy electronic pyong, bubbly twinkle and light sparkling trail. The projectile must sound bright, playful, weightless and non-vocal, never blunt. No dull thud, heavy energy burst, bass punch, explosion, gunshot, human voice, music, repeated shots, or long reverb.
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

### 7. 최종 빔 충전

- 계약명: `sfx_final_beam_charge.wav`
- 사용 장면: B3, 최종 공격 직전 에너지가 두 번 맥동하며 안쪽으로 모이는 컷
- 의도: 낮은 첫 번째 합성 `우웅`과 더 높고 빠른 두 번째 `우웅`으로 충전을 명확히 읽힌다. 발사음 없이 짧은 power-lock에서 끝내고 `sfx_final_beam_fire.wav`를 바로 이어 사용한다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.9–1.2초

**사운드 설명**

```text
Single isolated sci-fi magical beam charging sound effect, no firing: two clearly separated synthetic energy pulses, "woong... woong," first low and broad, second higher, faster and more intense, rising pitch and accelerating amplitude modulation, particles pulling inward, compact power-lock at the end. The woong pulses are non-vocal synthesized hums, not speech. No laser shot, impact, explosion, voice, chant, music, melody, long drone, or fade-out.
```

### 8. 최종 빔 발사

- 계약명: `sfx_final_beam_fire.wav`
- 사용 장면: B3, 충전 직후 레이저가 발사되어 회색 결정에 닿기 직전까지
- 의도: 밝은 방출 스냅, 빠른 하강 피치, 집중된 빔 몸통을 한 번에 들려준다. 충전음은 포함하지 않으며 실제 충돌 프레임에는 `sfx_final_crystal_break.wav`를 겹친다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.6–0.9초

**사운드 설명**

```text
Single isolated magical laser firing sound effect, no charging: immediate bright energy-release snap, powerful focused pink-white laser launch, fast downward pitch sweep, crisp high-frequency bite, compact sustained beam body and short clean tail. Strong and readable but not an explosion or gunshot. No charge-up, woong hum, impact, crystal break, debris, voice, chant, music, huge sub-bass, repeated shots, or long reverb.
```

### 9. 최종 결정 파괴

- 계약명: `sfx_final_crystal_break.wav`
- 사용 장면: B3, 최종 빔이 회색 결정에 닿아 결정이 깨지는 정확한 프레임
- 의도: 실제 대형 유리 파쇄를 주음으로 사용한다. 큰 최초 균열, 불규칙한 고주파 파편, 단단한 바닥의 짧은 낙하를 필수로 하고 맑은 크리스탈 공명은 보조로 제한한다. 결정이 깨지는 프레임에서 `sfx_final_beam_fire.wav` 끝부분에 겹친다.
- 생성: 2회, 후보 4개. 파쇄 트랜지언트가 약하면 같은 폼으로 1회 추가
- 목표 사용 길이: 0.7–1.0초

**사운드 설명**

```text
Single isolated realistic physical shatter of one large thick glass crystal: immediate loud sharp primary crack, dense irregular high-frequency glass shards bursting outward, multiple brittle fragments bouncing and falling onto a hard surface, then a short clear crystalline harmonic ring. Big and unmistakably glass, with slight magical clarity. No lead-in whoosh, beam, explosion, stone collapse, ice crack, bottle or wine-glass clink, voice, music, repeated breaks, or long reverb.
```

## P1 — 장면 완성도용 추가 제작

### 10. 마이크 준비

- 계약명: `sfx_mic_ready.wav`
- 사용 장면: 음성 입력·마이크 버튼이 준비 상태로 바뀌는 UI
- 의도: 대사를 방해하지 않는 짧은 준비 확인음이다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.15–0.25초

**사운드 설명**

```text
Single isolated UI microphone-ready cue: one soft digital activation ping with a tiny clean air pulse, calm, precise and unobtrusive, clearly audible on laptop speakers. Extremely short and dry. No voice, recording-beep imitation, melody, music, alarm, bass, echo, or repeated notes.
```

### 11. 주노 등장

- 계약명: `sfx_juno_appear.wav`
- 사용 장면: N3, 작은 주노가 모니터 화면에서 바깥으로 튀어나오는 첫 프레임
- 의도: 짧은 CRT 래스터·데이터 소리 직후 비보컬 전자 `뺩!`을 붙인다. 공중에서 나타나는 마법음보다 모니터 출력감과 빠른 코믹 타이밍을 우선한다.
- 생성: 2회, 후보 4개
- 목표 사용 길이: 0.35–0.55초

**사운드 설명**

```text
Single isolated cute character pop-out sound effect from a CRT monitor: tiny raster-data zip, then one short springy electronic "bbyap!" pop, followed by a microscopic pixel sparkle. Fast, cheeky and clearly electronic, like a small mascot popping through the screen. The "bbyap" is a non-vocal synthesized pop, not speech. No human voice, mouth sound, spoken word, choir, harp, melody, heavy impact, long glitch, repetition, or reverb.
```

### 12. 수렴·복구

- 계약명: `sfx_convergence.wav`
- 사용 장면: 전투 종료 뒤 흩어진 마력이 수렴하고 사무실이 정상으로 돌아오는 컷
- 의도: 승리 팡파르가 아니라 긴장이 조용히 풀리는 복구 신호다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.8–1.2초

**사운드 설명**

```text
Single isolated magical convergence sound effect: scattered light particles fold inward, a soft reverse shimmer closes, then late-night office room tone settles back into place. Relief after battle, quiet and clean. No voice, melody, music, explosion, bass boom, repeated pulses, or long ambient tail.
```

### 13. 검은빛 흡수

- 계약명: `sfx_blacklight_absorb.wav`
- 사용 장면: 회색 마력이나 빛 조각이 검은빛 안으로 빨려 들어가는 컷
- 의도: 공포음이 아니라 통제된 흡수 현상을 표현한다. 안쪽으로 빨려드는 방향감이 핵심이다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 1.2–1.8초

**사운드 설명**

```text
Single isolated dark-magical absorption sound effect: a controlled inward suction pulls bright particles into black light, low airy vacuum, muted glass resonance and a short sealed ending. Unsettling but not horror. No voice, scream, music, huge bass drop, explosion, heartbeat, repetition, or long drone.
```

### 14. 알 수 없는 사용자

- 계약명: `sfx_unknown_user.wav`
- 사용 장면: 시스템이 정체불명의 사용자·심사 대상을 감지하는 UI 알림
- 의도: 정상 업무용 알림이 아주 살짝 깨지는 느낌으로 불신을 만든다.
- 생성: 1회, 후보 2개
- 목표 사용 길이: 0.4–0.7초

**사운드 설명**

```text
Single isolated unknown-user system cue: a brief office-terminal notification becomes subtly corrupted, clean digital chirp, tiny data glitch and unresolved glass tick. Suspicious, compact and readable. No voice, spoken ID, melody, music, alarm siren, harsh static, repeated beeps, or long tail.
```

### 15. 회색 판정 도장

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
