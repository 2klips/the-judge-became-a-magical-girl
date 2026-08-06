# M5 UI·BGM 작업 매핑

- 최종 갱신: 2026-08-06
- 현재 요청: 코드 생성 UI·SFX 추가 외부 파일 0건. BGM 5종은 runtime `ready`이며 사람 청각·권리 QA가 남았다. 라이선스 확인 전 `approved` 승격 금지.

## 1. 담당 경계

| 영역 | 담당 | 외부 파일 요청 |
|---|---|---|
| 대화창·이름표·버튼·게이지·자막·dev selector | Codex, HTML/CSS | 없음 |
| 마이크 상태·입력 장치·dBFS 테스트 UI | Codex, DOM/SVG/CSS | 없음 |
| 결정·시전·크리티컬·타격·인식 실패 SFX | Codex, Web Audio | 없음 |
| BGM·변신 징글 | 외부 음악 작업자 | 있음 |
| 캐릭터·배경·컷 | 외부 이미지 작업자 | [`M5_ASSET_HANDOFF_REQUEST.md`](M5_ASSET_HANDOFF_REQUEST.md) |

외부 작업자는 UI 프레임, 대화창, 버튼, 게이지, 주문 글자 이미지를 제작하지 않는다. 해상도 대응과 상태 표시를 위해 runtime 코드가 소유한다.

## 2. 코드 생성 UI 매핑

| UI | 구현 | 표시 위치·상태 | 완료 기준 |
|---|---|---|---|
| `mic.idle` | SVG/CSS | 입력 대기 | 정지 상태, 클릭 가능 여부 식별 |
| `mic.setup` | DOM/SVG/CSS | 타이틀 필수 테스트 | 장치 선택, 실시간 dBFS 막대, 테스트 진행률, 통과 상태 |
| `mic.tooQuiet` | DOM/CSS | 타이틀·battle 주문 | 너무 작은 입력을 수치와 함께 안내 |
| `mic.tooLoud` | DOM/CSS | 타이틀·battle 주문 | 너무 큰 입력을 수치와 함께 안내 |
| `mic.listening` | SVG/CSS pulse | PTT 누르는 동안 | 맥동·청취 문구·interim 자막 동시 표시 |
| `mic.processing` | SVG/CSS | release 뒤 판정 중 | 처리 상태 표시, 중복 입력 차단 |
| 호감도 게이지 | CSS | 대화·엔딩 수렴 | affinity 변화가 즉시 보임 |
| 기세 게이지 | CSS | battle p1~p3 | momentum 변화가 즉시 보임 |
| 실시간 자막 | CSS/DOM | 음성 입력 | interim 뒤 final로 교체 |
| 클릭 폴백 | CSS button | 게임 진입 뒤 대화·변신·battle | 타이틀 마이크 테스트 통과 후 음성 실패와 오프라인에서도 완주 |
| 장면 dev selector | DOM/CSS | `?debug=1` | 22개 장면·16개 배경 직접 검수 |

검은 화면 placeholder에서도 모든 UI는 유지한다. 검은 presentation이 입력 상태나 대사를 가리면 실패다.

## 3. 코드 생성 SFX 매핑

| 논리 ID | 트리거 | 방식 | 외부 파일 |
|---|---|---|---|
| `sfx.confirm` | 선택 확정 | 2층 짧은 상승 tone | 없음 |
| `sfx.cast` | 주문 성공 | 2층 상승 sweep | 없음 |
| `sfx.critical` | 완창·크리티컬 | 3음 상승 arpeggio | 없음 |
| `sfx.impact` | 전투 타격·플래시 | square+triangle 저역 타격 | 없음 |
| `sfx.recognition_fail` | STT·주문 실패 | 2음 부드러운 하강 | 없음 |
| `sfx.advance` | 대사·컷 진행 | 매우 작은 2음 페이지 tone | 없음 |
| `sfx.guard` | 전투 버티기 | 낮고 둥근 2층 방어 tone | 없음 |
| `sfx.wraith_shift` | momentum 65 최초 상향 통과 | 안개가 갈라지는 2층 상승 shimmer | 없음 |
| `sfx.ending` | ending 노드 진입 | 3음 부드러운 화음 | 없음 |

`[구현, DEC-064]` 모든 cue는 0.4초 이하 Web Audio tone이다. 같은 cue 40ms 이내 중복을 막고 PTT press~release 동안 전 cue를 억제한다. `AudioContext` 생성·resume 실패는 무음으로 강등한다. 최종 QA에서 실제 스피커·헤드폰으로 크기와 피로도를 청감한다. 파일 SFX로 교체하지 않는다.

## 4. BGM 납품 매핑

| 우선순위 | 논리 ID·파일명 | 길이·재생 | 장면 | 음악 방향 | 폴백 |
|---:|---|---|---|---|---|
| P0 | `bgm_daily` / `bgm_daily.mp3` | 60~90초 seamless loop | N0~N2, 수렴, 엔딩 기본 | 야근의 피로 + 작은 설렘. 가벼운 전자음·맑은 포인트, 과도한 활기 금지 | 무음 |
| P0 | `bgm_battle` / `bgm_battle.mp3` | 60~90초 seamless loop | N3~N5 위기 폴백, battle p1~p3 | 말과 주문 중심 긴장. 명확한 리듬, 음성 대역을 가리지 않음 | 무음 |
| P0 | `bgm_transform` / `bgm_transform.mp3` | 10~20초 one-shot | N5 주문 성공→변신 완료 | 짧게 상승하고 확정되는 마법소녀 변신 징글 | 무음 + Web Audio SFX |
| P2 | `bgm_crisis` / `bgm_crisis.mp3` | 30~60초 seamless loop | N3~N5 사건 | daily와 battle 사이의 불안·회색 침식 | `bgm_battle` |
| P2 | `bgm_ending` / `bgm_ending.mp3` | 약 60초 loop 또는 자연 tail | 수렴~GOOD/NORMAL/BAD | 안도와 작은 여운. 엔딩 색 회복량을 방해하지 않음 | `bgm_daily` |

## 5. 공통 음악 제작 계약

- MP3 128kbps, 파일당 3MB 이하.
- instrumental. 보컬·가사·주문 콜 없음.
- `bgm_daily`, `bgm_battle`, `bgm_crisis`는 루프 경계에서 클릭·무음·박자 점프가 없어야 한다.
- `bgm_transform`은 반복 재생하지 않는 one-shot이다.
- 세 필수곡은 악기 편성과 공간감 키워드를 공유해 같은 작품처럼 들려야 한다.
- 대사·STT가 핵심이다. 중역대가 과밀하거나 강한 리드가 발화를 가리면 재작업한다.
- 곡 자체에 긴 fade-out을 넣지 않는다. crossfade·duck은 게임 엔진이 처리한다.
- 제출 전 trim·loop·볼륨 정규화 후 최종 파일을 전달한다.
- 원본 생성곡과 최종 runtime 파일을 구분하고, 게임에는 최종 파일만 채택한다.

## 6. 장면별 재생 계약

| 구간 | 재생 | 전환·duck |
|---|---|---|
| TITLE | 기본 무음 | 사용자 입력 전 autoplay 금지 |
| N0~N2 | `bgm_daily` | PTT 청취 중 duck |
| N3~N5 도입 | `bgm_crisis`, 없으면 `bgm_battle` | 장면 진입 crossfade, PTT duck |
| N5 변신 결과 | `bgm_transform` | 결과 뒤 한 번만 재생, loop 금지 |
| battle p1~p3 | `bgm_battle` | phase 이동 때 재시작 금지, PTT duck |
| 전투 후 수렴·엔딩 | `bgm_ending`, 없으면 `bgm_daily` | ending 진입 crossfade |

`[구현]` 기본 BGM 음량은 `0.62`, PTT duck은 기본값의 `0.18배`다. 로드 실패 경로는 세션에서 다시 요청하지 않으며, 브라우저 autoplay 거부는 다음 `pointerdown`에서 최신 요청을 한 번 재시도한다. `bgm_transform` 동일 ID 재렌더는 중복 재생하지 않는다.

## 7. 청감 인수 기준

다음 조건을 모두 확인한다.

- 헤드폰과 일반 노트북 스피커에서 대사가 음악보다 명확하다.
- PTT 시작 때 음악이 즉시 낮아지고 종료 뒤 자연스럽게 복귀한다.
- loop를 3회 이상 반복해도 경계가 드러나지 않는다.
- N5 변신 재시도·결과 화면 재렌더에서 징글이 중복 재생되지 않는다.
- battle p1→p2→p3에서 같은 곡이 처음부터 반복 재시작하지 않는다.
- 네트워크·파일 로드 실패 시 무음으로 계속 진행하며 console exception이 없다.
- GOOD/NORMAL/BAD 모두 엔딩 대사 마지막까지 음악 상태가 안정적이다.

## 8. 납품 기록

각 곡과 함께 아래 정보를 전달한다.

- 생성 도구·모델/버전.
- 프롬프트·작업 ID.
- 생성일과 편집일.
- runtime 파일로 자른 구간과 후처리 내용.
- 사용 플랜·라이선스·해커톤 제출 허용 확인 근거.
- 원본 길이, 최종 길이, bitrate, 최종 파일 크기.
