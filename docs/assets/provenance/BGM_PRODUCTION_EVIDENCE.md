# BGM 제작·편집 증빙

## 확인 상태

- 생성 도구: Suno
- 현재 사용 플랜: Suno Pro — 사용자 확인, 2026-08-06
- 생성 당시 플랜: 증빙 캡처 또는 영수증으로 보완 필요
- 생성 모델/버전: 사용자 확인 필요
- 생성일·곡 URL·작업 ID: 사용자 확인 필요
- 보컬: Instrumental ON 생성폼 기준
- 후처리: FFmpeg 8.1.1, 구간 절단, EBU R128 loudness normalization, MP3 128kbps 인코딩
- 목표 음량: 약 -17 LUFS, True Peak -1 dBTP 이하
- 라이선스·대회 제출 허용: 사람의 약관·생성 시점 플랜 확인 전 `approved` 금지

현재 Pro 플랜 확인은 중요한 권리 자료지만 그 자체를 저작권 보증으로 기록하지 않는다. 생성 시점의 플랜과 해당 곡의 계정 기록을 함께 보존한다.

## 소스와 최종 파일

| 최종 파일 | Suno 제목·소스 파일 | 사용 구간 | 소스 SHA-256 | 최종 SHA-256 |
|---|---|---:|---|---|
| `bgm_daily.mp3` | `야근 끝의 작은 별.mp3` | `00:05.71~01:32.00` | `A5980E6EA8DDCCBAB0C2774454E5B7215B1E94FCB516CC3031FD50C906FAE1D4` | `57FECB8710933B6D8C030B9CE4B44640F875B17562EB24ECC154A477A28E15E1` |
| `bgm_battle.mp3` | `마법 심사 개시 .mp3` | `01:40.01~02:49.04` | `2F91AD9B3C835B4139D06DC5CA7740FBB14EB606970F9DD36491620F9E233D3F` | `A746F514A39EA6DC98C620256DCB499DC7A9FCF6FA1C3A96E3F58BB78B102749` |
| `bgm_transform.mp3` | `승인 완료, 변신! (1).mp3` | 최종 추천 A `00:00.35~00:19.80` | `3CF7492AD5735E95A98F3CC5838051831C8656943C3F88E1A22366548F64D761` | `05AB5C8BCE7E942C824A62F7E38267529B5DFD5DE2332F5BEE63BFAE5C645479` |
| `bgm_crisis.mp3` | `회색 침식.mp3` | `01:36.08~02:33.67` | `9C0452E3806E50A566D5666EE7D807FB3D24C465159497C5CC14D52148FAF3CA` | `D20037E1D8D9C24547F5F388BAD0573EB049FD3655A6E9286B2564341BDD9B10` |
| `bgm_ending.mp3` | `다시 판단할 아침.mp3` | `00:33.39~01:36.53` | `832AF4025395D2F87EB36E4A32CF7EB9F937BFC0B4FDE66D12C165487B0F7CC6` | `7F61D8FAA118314836FA86EE45C2F3BBE38B7A04F7C6974EC9F066A447EB0E1E` |

## 승인 생성폼 값

| 최종 파일 | 제목 | 기이함 | 스타일 영향 | 보컬 |
|---|---|---:|---:|---|
| `bgm_daily.mp3` | 야근 끝의 작은 별 | 18% | 82% | 없음, Instrumental ON |
| `bgm_battle.mp3` | 마법 심사 개시 | 24% | 80% | 없음, Instrumental ON |
| `bgm_transform.mp3` | 승인 완료, 변신! | 20% | 84% | 없음, Instrumental ON |
| `bgm_crisis.mp3` | 회색 침식 | 26% | 78% | 없음, Instrumental ON |
| `bgm_ending.mp3` | 다시 판단할 아침 | 16% | 84% | 없음, Instrumental ON |

## 생성 스타일 프롬프트

### `bgm_daily.mp3`

```text
Instrumental Korean indie visual novel game BGM, late-night office slice-of-life with gentle romantic curiosity, 88 BPM, 4/4, D major colored by B minor, felt piano, muted clean electric guitar, warm analog pad, tiny celesta accents, restrained brushed electronic percussion, simple original four-note motif, warm but slightly tired, sparse dialogue-friendly midrange, 60–90 second seamless loop-friendly structure, low-to-medium energy.
```

### `bgm_battle.mp3`

```text
Instrumental magical-girl action game BGM with subtle office-tech flavor, 128 BPM, 4/4, B minor with brief D-major flashes, tight electronic drums, controlled sub bass, staccato low strings, sparkling arpeggiated synth and celesta accents, original four-note motif converted into rhythmic ostinato, energetic compact arrangement, sparse 1–4 kHz dialogue band, 60–90 second seamless loop-friendly structure, medium-high energy.
```

### `bgm_transform.mp3`

```text
Instrumental 15-second magical transformation success jingle for a Korean visual novel, 144 BPM, 6/8, rapid rising harp and celesta arpeggio, bright synth shimmer, short snare lift, warm strings, compact brass resolution, original four-note motif landing on a confident sparkling final chord, sincere magical-girl tone with light situational comedy, immediate start, clean short ending, high but controlled energy.
```

### `bgm_crisis.mp3`

```text
Instrumental visual novel suspense BGM, gray fog invading a late-night office, 100 BPM, 4/4, B minor, fragmented version of an original four-note motif, muted synth pulse, low soft cello, filtered electronic texture, subtle clock-like percussion, restrained uncanny tension, sparse dialogue-first arrangement, 30–60 second seamless loop-friendly structure, medium-low energy.
```

### `bgm_ending.mp3`

```text
Instrumental visual novel ending BGM, 76 BPM, 4/4, D major colored by B minor and add9 chords, intimate felt piano, soft strings, warm analog pad, tiny celesta reprise of an original four-note motif, relief mixed with regret and quiet courage to judge again, understated emotional resolution suitable for good normal and bad endings, sparse dialogue-friendly arrangement, about 60 seconds with a gentle loop-friendly ending or clean natural tail, low energy.
```

## 사람이 보완할 증빙

- [ ] 생성 당시 Suno 구독 플랜 화면 또는 영수증
- [ ] 각 곡 Suno 페이지와 곡 ID/URL
- [ ] 각 곡 생성일과 사용 모델/버전
- [ ] 상업 이용 권한 안내 페이지 캡처
- [ ] 무료 플랜 생성물 미사용 확인
- [ ] 사람이 직접 들은 루프·대사 마스킹 QA 결과
