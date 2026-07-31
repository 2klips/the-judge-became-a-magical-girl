# 에셋 매니페스트

규격·제작법·네이밍의 단일 진실 공급원은 [별첨2. Asset 제작 가이드라인](../별첨2_에셋_제작_가이드라인.md)이다.

상태:

- `missing`: 필수지만 실파일 없음.
- `planned`: 선택 항목 또는 코드 생성 예정.
- `ready`: 파일 존재·기본 규격 통과.
- `approved`: 사람 QA·라이선스 확인까지 완료.

현재 실게임 에셋과 `public/`이 없으므로 필수 실파일은 모두 `missing`이다. 파일명 앞 `[제안]`은 별첨2가 패턴만 정하고 정확한 이름은 정하지 않은 항목이다.

## 이미지

| 논리 ID | 파일명 | 종류 | 규격 | 용량 상한 | 우선순위 | 상태 | 생성 도구 | 라이선스 | 시나리오 참조 위치 | QA |
|---|---|---|---|---:|---|---|---|---|---|---|
| `juno.neutral` | `char_juno_neutral.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image | 미확인 | `characters.json` emotion + dialogue NPC | 대기 |
| `juno.happy` | `char_juno_happy.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image 편집 | 미확인 | 동일 | 대기 |
| `juno.shy` | `char_juno_shy.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image 편집 | 미확인 | 동일 | 대기 |
| `juno.upset` | `char_juno_upset.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image 편집 | 미확인 | 동일 | 대기 |
| `juno.surprised` | `char_juno_surprised.png` | 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image 편집 | 미확인 | 동일 | 대기 |
| `gray_wraith.normal` | `char_gray_wraith_normal.png` | 적 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image | 미확인 | battle `enemy.id` + state | 대기 |
| `gray_wraith.weakened` | `char_gray_wraith_weakened.png` | 적 캐릭터 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image 편집 | 미확인 | battle `enemy.id` + state | 대기 |
| `doyun.magical` | `[제안] char_doyun_magical.png` | 플레이어 전투 | 1200×2000 PNG 투명 | 800KB | 필수 | missing | GPT Image | 미확인 | battle presentation | 파일명 결정 대기 |
| `transform.cast` | `[제안] cut_transform_01.webp` | 컷씬 | 1920×1080 WebP | 700KB | 필수 | missing | GPT Image | 미확인 | `[미결정 DEC-016]` | 참조 계약 대기 |
| `transform.complete` | `[제안] cut_transform_02.webp` | 컷씬 | 1920×1080 WebP | 700KB | 필수 | missing | GPT Image | 미확인 | `[미결정 DEC-016]` | 참조 계약 대기 |
| `doyun.normal` | `[제안] char_doyun_normal.png` | 프롤로그 | 1200×2000 PNG 투명 | 800KB | 컷 가능 | planned | GPT Image | 미확인 | prologue presentation | 파일명 결정 대기 |
| `juno.climax` | `[제안] char_juno_climax.png` | 추가 포즈 | 1200×2000 PNG 투명 | 800KB | 컷 가능 | planned | GPT Image | 미확인 | climax presentation | 파일명 결정 대기 |
| `bg_hall_day` | `bg_hall_day.webp` | 배경 | 1920×1080 WebP | 500KB | 필수 | missing | 미드저니 | 미확인 | `scenario.json scene.bg` | 대기 |
| `bg_lounge_day` | `bg_lounge_day.webp` | 배경 | 1920×1080 WebP | 500KB | 필수 | missing | 미드저니 | 미확인 | `scenario.json scene.bg` | 대기 |
| `bg_street_evening` | `bg_street_evening.webp` | 배경 | 1920×1080 WebP | 500KB | 필수 | missing | 미드저니 | 미확인 | `scenario.json scene.bg` | 대기 |
| `bg_hall_dark` | `bg_hall_dark.webp` 또는 scene recipe | 배경/파생 | 1920×1080 WebP 또는 CSS | 500KB/0 | 필수 | missing | 미드저니/Codex | 미확인/N/A | `scenario.json scene.bg` | DEC-019 대기 |
| `bg_hall_void` | `bg_hall_void.webp` | 배경 | 1920×1080 WebP | 500KB | 필수 | missing | 미드저니 | 미확인 | `scenario.json scene.bg` | 대기 |
| `bg_title` | `bg_title.webp` | 배경 | 1920×1080 WebP | 500KB | 필수 | missing | 미드저니 | 미확인 | title config/presentation | 대기 |
| `bg_ch2_branch` | `[제안] bg_{장소}_{상태}.webp` | 배경 | 1920×1080 WebP | 500KB | 컷 가능 | planned | 미드저니 | 미확인 | chapter 2 `scene.bg` | 이름·장면 대기 |

## 오디오

| 논리 ID | 파일명 | 종류 | 규격 | 용량 상한 | 우선순위 | 상태 | 생성 도구 | 라이선스 | 시나리오 참조 위치 | QA |
|---|---|---|---|---:|---|---|---|---|---|---|
| `bgm_daily` | `bgm_daily.mp3` | BGM | MP3 128kbps, 60~90초 loop | 3MB | 필수 | missing | Suno | 미확인 | `scenario.json scene.bgm` | loop 대기 |
| `bgm_battle` | `bgm_battle.mp3` | BGM | MP3 128kbps, 60~90초 loop | 3MB | 필수 | missing | Suno | 미확인 | battle `scene.bgm` | loop 대기 |
| `bgm_transform` | `bgm_transform.mp3` | 징글 | MP3 128kbps, 10~20초 | 3MB | 필수 | missing | Suno | 미확인 | incantation presentation | 참조 계약 대기 |
| `bgm_crisis` | `bgm_crisis.mp3` | BGM | MP3 128kbps, 30~60초 | 3MB | 컷 가능 | planned | Suno | 미확인 | cutscene `scene.bgm` | 대기 |
| `bgm_ending` | `bgm_ending.mp3` | BGM | MP3 128kbps, 약 60초 | 3MB | 컷 가능 | planned | Suno | 미확인 | ending `scene.bgm` | 대기 |

## 코드 생성 UI·SFX

| 논리 ID | 파일명/구현 | 종류 | 규격 | 용량 상한 | 우선순위 | 상태 | 생성 도구 | 라이선스 | 참조 위치 | QA |
|---|---|---|---|---:|---|---|---|---|---|---|
| `mic.idle` | `[제안] ui_mic_idle.svg` | UI 아이콘 | SVG | N/A | 필수 | planned | Codex | N/A | mic indicator | 대기 |
| `mic.listening` | `[제안] ui_mic_listening.svg` | UI 아이콘 | SVG + CSS 맥동 | N/A | 필수 | planned | Codex | N/A | mic indicator | 대기 |
| `mic.processing` | `[제안] ui_mic_processing.svg` | UI 아이콘 | SVG | N/A | 필수 | planned | Codex | N/A | mic indicator | 대기 |
| `sfx.confirm` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | planned | Codex | N/A | 선택 확정 | 대기 |
| `sfx.cast` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | planned | Codex | N/A | 주문 성공 | 대기 |
| `sfx.critical` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | planned | Codex | N/A | 완창/크리티컬 | 대기 |
| `sfx.impact` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | planned | Codex | N/A | 전투 플래시 | 대기 |
| `sfx.recognition_fail` | Web Audio 코드 | SFX | oscillator synth | 0 | 필수 | planned | Codex | N/A | STT 실패 | 대기 |

대화창, 이름표, 버튼, 자막, 호감도·momentum 게이지는 CSS 컴포넌트다. 파일 에셋 매니페스트에 추가하지 않는다.

## 통합 게이트

- 논리 ID는 시나리오에서 확장자 없이 사용한다.
- 실파일명 변경은 시나리오 참조·resolver·이 표를 같은 변경에서 갱신한다.
- 캐릭터 5표정은 같은 1200×2000 좌표와 몸 윤곽을 유지한다.
- 이미지 production 전 팀 스타일 앵커를 확정한다.
- `ready` 전 규격·투명도·용량 자동 검사, `approved` 전 사람 시각/청각 QA와 라이선스 확인.
- 전체 물리 에셋 30MB 이하. 첫 화면 필수분만 preload, 나머지는 lazy load.
- 생성·편집 이력은 [AI_PRODUCTION_LOG.md](AI_PRODUCTION_LOG.md)에 기록한다.
