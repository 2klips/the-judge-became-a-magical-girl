# 장면별 에셋 매핑 명세

이 문서는 「심사역은 마법소녀가 되었다」 본편의 **장면 → 배경·인물·표정·음악·컷·런타임 연출** 연결 계약이다. 외부 에셋 제작자는 이 문서로 제작 수량과 정확한 파일명을 확인하고, 개발자는 같은 표로 각 런타임 장면에 승인 에셋을 연결한다.

## 1. 문서 책임과 우선순위

- 스토리·감정선·장면 내용: [완성대본 v2](../심사역은_마법소녀가_되었다_완성대본_v2.md)
- 현재 M5 노드 매핑: [DECISIONS.md](DECISIONS.md)의 DEC-020·DEC-024·DEC-032
- 포맷·크기·제작 방식: [별첨2](../별첨2_에셋_제작_가이드라인.md)
- 논리 ID·실파일·제작/QA 상태: [ASSET_MANIFEST.md](ASSET_MANIFEST.md)
- **장면별 사용처와 표시 상태: 이 문서**

충돌 시 사용자 최신 결정 → 메인 기획서 → 완성대본 v2 → 별첨2 → 승인된 결정 → 이 문서 → 코드 순서로 처리한다.

상태 표기:

- `[확정·M5 필수]`: 본편 3엔딩 완주에 필요한 에셋.
- `[확정·M5 폴백 가능]`: 장면 계약은 확정. 실파일이 없으면 지정된 파생/CSS 폴백 허용.
- `[컷 가능]`: 있으면 연출 강화. 없어도 M5 완료 가능.
- `[확장]`: 10~30분 확장판 또는 HIDDEN 복원 때만 제작.

## 2. 외부 에셋 제작자 인계 규칙

1. 아래 **정확한 파일명**으로 제작한다. 파일명 의미를 추측하지 말고 장면 설명을 따른다.
2. 납품 원본은 루트 `asset/`에 둔다. `public/scenario/`, `src/`, `docs/dev/`는 수정하지 않는다.
3. 개발 통합 기대 경로는 `public/assets/{bg|char|cut|bgm}/`다. 개발자가 규격·라이선스·사람 QA 후 복사한다.
4. 파일명·규격이 다르면 개발자가 자동 rename·변환하지 않는다. 기대 이름과 오류를 제작자에게 반환한다.
5. 이미지에 제목, 대사, 평가 문장, UI, 로고를 박아 넣지 않는다. 텍스트는 런타임 DOM/CSS가 표시한다.
6. 배경에는 사람·캐릭터를 넣지 않는다. 예외는 인물까지 포함하는 `cut_*.webp` 컷씬 일러스트뿐이다.
7. BGM은 STT를 방해하지 않는 instrumental 기준이다. 보컬·주문 음성은 production 파일에 넣지 않는다.
8. 생성 도구·모델, 프롬프트/작업 ID, 생성일, 사용 플랜·라이선스 확인 결과를 `AI_PRODUCTION_LOG.md`에 전달한다.

## 3. 제작 파일 마스터 목록

### 3.1 배경

| 우선순위 | 논리 ID | 정확한 파일명 | 제작 내용 | 장면 |
|---|---|---|---|---|
| `[확정·M5 필수]` | `bg_title` | `bg_title.webp` | 늦은 밤 심사 사무실과 모니터 빛을 이용한 타이틀 키아트. 인물·텍스트 없음 | 타이틀 |
| `[확정·M5 필수]` | `bg_hall_day` | `bg_hall_day.webp` | **이름은 호환용 레거시 ID다. 실제 내용은 늦은 밤 게임 심사 사무실.** 중앙 모니터와 도윤 자리, 주변 빈 좌석, 차가운 실내등과 모니터광 | N0~N2, GOOD/NORMAL의 회복 베이스 |
| `[확정·M5 폴백 가능]` | `bg_hall_dark` | `bg_hall_dark.webp` | `bg_hall_day`와 같은 카메라·가구 배치. 색이 빠지고 모니터가 꺼지며 회색 안개가 침범한 상태 | N3~N5, 전투 후 수렴, BAD |
| `[확정·M5 필수]` | `bg_hall_void` | `bg_hall_void.webp` | 사무실 구조가 남아 있으나 망령 내부처럼 회색 공허로 변형. 떠다니는 평가표와 모니터 잔해. 인물 없음 | battle p1~p3 |
| `[확장]` | `bg_lounge_day` | `bg_lounge_day.webp` | 10~30분 확장판 일상 제2장소 | 현재 M5 미사용 |
| `[확장]` | `bg_street_evening` | `bg_street_evening.webp` | 10~30분 확장판 챕터2 거리 | 현재 M5 미사용 |

`bg_hall_dark.webp`가 없거나 불량이면 `bg_hall_day.webp`에 회색 필터·비네트·안개 오버레이를 적용한다. 두 파일을 모두 제작한다면 구도와 원근을 픽셀 수준으로 맞춰 전환 시 화면이 튀지 않게 한다.

GOOD/NORMAL의 아침·부분 회복은 새 배경을 필수화하지 않는다. `bg_hall_day.webp` 위에 색온도·명도·회색 잔존량을 런타임에서 조절한다.

### 3.2 캐릭터·적

| 우선순위 | 논리 ID | 정확한 파일명 | 제작 내용 | 장면 |
|---|---|---|---|---|
| `[확정·M5 필수]` | `juno.neutral` | `char_juno_neutral.png` | 주노 기준 포즈. 빠르고 자신감 있는 기본 표정 | N2, N4-B, N7, NORMAL |
| `[확정·M5 필수]` | `juno.happy` | `char_juno_happy.png` | 베이스에서 얼굴 표정만 기쁨으로 파생 | N2 호의, N3 사람 우선, N4-A, GOOD |
| `[확정·M5 필수]` | `juno.shy` | `char_juno_shy.png` | 진심이 드러나 시선을 피하는 표정 | N4 관계 회복, 일부 N5 |
| `[확정·M5 필수]` | `juno.upset` | `char_juno_upset.png` | 빛이 약해지고 상처·조급함이 드러난 표정 | N2 거절, N3, N4-C, BAD |
| `[확정·M5 필수]` | `juno.surprised` | `char_juno_surprised.png` | 날갯짓이 멈춘 예상 밖 반응 | N2 등장 직전/등장, N5, GOOD 후속 훅 |
| `[확정·M5 필수]` | `gray_wraith.normal` | `char_gray_wraith_normal.png` | 거대한 회색 실루엣. 과장된 분노보다 무겁고 체념한 인상 | N3~N6, momentum 64 이하 |
| `[확정·M5 필수]` | `gray_wraith.weakened` | `char_gray_wraith_weakened.png` | normal과 같은 개체·구도. 안개가 갈라지고 내부 게임 캐릭터 빛이 비치는 상태 | momentum 65 이상, N7~N8 우세 연출 |
| `[확정·M5 필수]` | `doyun.magical` | `char_doyun_magical.png` | 플레이어 몰입을 지키는 뒷모습 또는 반측면. 전투용 단일 포즈 | battle p1~p3 |
| `[확장]` | `doyun.normal` | `char_doyun_normal.png` | 평상복 도윤. 현재 1인칭 프롤로그에서는 미사용 | 확장판 전용 |
| `[확장]` | `juno.climax` | `char_juno_climax.png` | 클라이맥스 추가 포즈 | 확장판 전용 |

주노 5종은 같은 1200×2000 캔버스·좌표·몸·의상·구도를 유지한다. 회색 망령 2종도 같은 캔버스·실루엣 중심·스케일을 유지한다.

### 3.3 컷씬 일러스트

| 우선순위 | 논리 ID | 정확한 파일명 | 제작 내용 | 장면 |
|---|---|---|---|---|
| `[확정·M5 필수]` | `transform.cast` | `cut_transform_01.webp` | 사원증이 떠오르고 도윤과 주노가 주문을 외치는 영창 순간. 텍스트 없음 | N5 주문 성공 직후 1번 |
| `[확정·M5 필수]` | `transform.complete` | `cut_transform_02.webp` | 변신 완료. 마법소녀 도윤은 뒷모습/반측면, 주노는 곁에 위치. 완전·표준·구제 공용 | N5 주문 성공 직후 2번 |
| `[컷 가능]` | `ending.black_magical_girl` | `cut_black_magical_girl_01.webp` | 어두운 복도, 긴 검은 지팡이를 든 성인 여성 실루엣, 회색 픽셀이 지팡이로 흡수됨. 얼굴·이름·정체 노출 금지 | GOOD 후속 장면, HIDDEN 크레딧 이후 재사용 |

완전·표준·자동 구제 변신은 같은 두 컷을 사용한다. 차이는 CSS 플래시·파티클·색 강도와 결과 문구로 표현한다. 불완전 변신 전용 물리 이미지는 M5 필수가 아니다.

### 3.4 음악

| 우선순위 | 논리 ID | 정확한 파일명 | 길이/재생 | 감정·편곡 방향 | 장면 |
|---|---|---|---|---|---|
| `[확정·M5 필수]` | `bgm_daily` | `bgm_daily.mp3` | 60~90초 seamless loop | 야근의 피로와 아직 남은 작은 설렘. 가벼운 전자음·맑은 포인트, 과도한 활기 금지 | N0~N2, 수렴/엔딩 폴백 |
| `[확정·M5 필수]` | `bgm_battle` | `bgm_battle.mp3` | 60~90초 seamless loop | 말과 주문이 중심인 긴장감. 리듬은 명확하되 음성 대역을 가리지 않음 | battle p1~p3, crisis 폴백 |
| `[확정·M5 필수]` | `bgm_transform` | `bgm_transform.mp3` | 10~20초 one-shot | 짧고 상승하는 변신 징글. production 파일은 보컬·주문 콜 없음 | N5 영창 성공~변신 완료 |
| `[컷 가능]` | `bgm_crisis` | `bgm_crisis.mp3` | 30~60초 loop | 회색 안개, 정지한 모니터, 망령 등장. 저역 압박은 쓰되 대사를 덮지 않음 | N3~N5. 없으면 `bgm_battle` |
| `[컷 가능]` | `bgm_ending` | `bgm_ending.mp3` | 약 60초 loop 또는 자연스러운 tail | 씁쓸함과 다시 판단할 용기가 공존. BAD에서도 과도한 승리감 금지 | 전투 후 수렴~엔딩. 없으면 `bgm_daily` |

## 4. 장면별 런타임 매핑

### 4.1 타이틀·N0~N4

| 순서·런타임 | 장면 | 배경 | 화면 인물 | 음악 | 추가 연출·개발 주의 |
|---|---|---|---|---|---|
| 타이틀 | 작품명·시작 선택 | `bg_title` | 없음 | 무음 | 브라우저 autoplay 제한 때문에 사용자 시작 전 BGM 재생 금지. 제목·버튼은 CSS/DOM |
| N0 `n0_review` | 반복되는 심사 | `bg_hall_day` | 없음. 도윤은 1인칭 | `bgm_daily` | 평가 문장·커서·시계 정지는 DOM/CSS. 배경에 직원이나 글자 삽입 금지 |
| N1 `n1_first_voice` | 모니터 속 첫 목소리 | `bg_hall_day` | **주노 실물 미노출**. 작은 빛만 CSS | 계속 `bgm_daily` | 현재 dialogue NPC가 주노여도 스프라이트는 N2 전까지 숨긴다 |
| N2 `n2_juno_intro` | 주노가 키보드 위로 등장 | `bg_hall_day` | `juno.surprised → happy`; 반응에 따라 `neutral/upset` | 계속 `bgm_daily` | 등장 순간 짧은 CSS 빛·낙하. 자유 대화 결과 표정 사용 |
| N2 `n2_juno_followup` | 정체·선택 이유 확인 | `bg_hall_day` | `juno.neutral`; 선택 이유 질문은 `shy`, 냉담은 `upset` | 계속 `bgm_daily` | 한 번에 한 표정만 표시 |
| N3 `n3_wraith_choice` | 회색 망령 등장 | `bg_hall_dark` | `gray_wraith.normal` 중앙/후면 + `juno.upset` 측면 | 선호 `bgm_crisis`; MVP 폴백 `bgm_battle` | 두 인물을 동시 표시. 평가표·안개·방어막 균열은 CSS/Canvas |
| N4-A `n4_team` | 죽이 맞는 콤비 | `bg_hall_dark` | `juno.happy`; `gray_wraith.normal`은 배경 쪽 유지 | 계속 crisis/폴백 | 주노 한 바퀴 회전은 CSS |
| N4-B `n4_cooperate` | 마지못한 협력 | `bg_hall_dark` | `juno.neutral`; `gray_wraith.normal` 유지 | 계속 crisis/폴백 | 주노를 N4-A보다 작고 차분하게 배치 |
| N4-C `n4_awkward` | 서먹함·회복 기회 | `bg_hall_dark` | 시작 `juno.upset`; 회복 `shy`; 거리 유지 `neutral`; 망령 유지 | 계속 crisis/폴백 | 주노 발광량 감소는 CSS. 별도 어두운 스프라이트 금지 |

### 4.2 N5 변신·N6~N8 전투

| 순서·런타임 | 장면 | 배경 | 화면 인물·컷 | 음악 | 추가 연출·개발 주의 |
|---|---|---|---|---|---|
| N5 `n5_transform` 도입 | 사원증 부상·망령 압박 | `bg_hall_dark` | `gray_wraith.normal` + N4-A `juno.happy` / N4-B `juno.neutral` / N4-C 회복 `juno.shy` / 거리 유지 `juno.neutral` | crisis/폴백 유지 | 현재 JSON 대사 표정 `juno.surprised`는 망령 공격 순간에만 사용. 도입은 직전 N4 관계 표정을 이어받음 |
| N5 주문 게이트 | 두 문장 한 번에 낭독 | `bg_hall_dark` | 주문 UI 중심. 주노는 작게 유지 | 입력 중 기존 곡 duck | 주문 전문은 DOM. BGM·SFX가 STT에 섞이지 않도록 입력 중 음량 낮춤 |
| N5 변신 결과 | 영창→완료 | 배경 위 컷 전면 | `transform.cast → transform.complete` | `bgm_transform` one-shot | 두 컷 고정 순서. 완전은 강한 플래시·파티클, 표준/구제는 약한 강도 |
| `battle_wraith` / p1 `p1_defend` | 직원·게임 보호 | `bg_hall_void` | `doyun.magical` 전경 + `gray_wraith.normal` 후경 + `juno.neutral` 보조 | `bgm_battle` | 방어막은 CSS/Canvas. 캐릭터 크기·좌우 위치 고정 |
| `battle_wraith` / p2 `p2_attack` | 망령 중심 공격 | `bg_hall_void` | 도윤 유지 + momentum `<65` normal / `>=65` weakened + `juno.happy` 보조 | 계속 `bgm_battle` | 공격 플래시 뒤에도 같은 캔버스 정렬 유지 |
| `battle_wraith` / p3 `p3_answer` | 과거 기록·핵심 질문·최종 주문 | `bg_hall_void` | 도윤 유지 + 현재 망령 상태 + `juno.neutral` | 계속 `bgm_battle`, 질문 중 일시 duck | `/project_archive/`, 소개 문구, 낙하 평가 문장은 DOM/CSS. 주노는 답을 재촉하지 않는 낮은 위치/광량 |

### 4.3 수렴·엔딩

| 순서·런타임 | 장면 | 배경 | 화면 인물·컷 | 음악 | 추가 연출·개발 주의 |
|---|---|---|---|---|---|
| 수렴 `ch3_gray_answer` | 작은 회색 빛의 질문 | `bg_hall_dark` + 색 회복 오버레이 | `juno.neutral`; 긍정 `happy`, 냉소 `upset`; 망령 스프라이트 제거 | 선호 `bgm_ending`; 폴백 `bgm_daily` | 작은 회색 핵은 Canvas/CSS 파티클. 새 물리 이미지 불필요 |
| GOOD `ending_good` | 다시 플레이·평가 수정 | `bg_hall_day` + 아침빛/완전 회복 | `juno.happy` | ending/폴백 daily | 평가표 문장은 DOM. 도윤 스프라이트 없음 |
| GOOD 후속 훅 | 1,024개 잔향·검은 마법소녀 | 컷 가능 `ending.black_magical_girl` | 컷에 포함. 주노는 직전 `surprised` 반응만 별도 표시 가능 | ending 유지 후 마지막 순간 정지/감쇠 | 컷 없으면 검은 화면+픽셀 흡수 CSS+대사로 완주. 본편 이름 `노아` 노출 금지 |
| NORMAL `ending_normal` | 판단 보류·한 번 더 | `bg_hall_day` + 부분 회색 오버레이 | `juno.neutral` | ending/폴백 daily | `UNKNOWN USER CONNECTED`는 DOM. 검은 마법소녀 실루엣 금지 |
| BAD `ending_bad` | 회색 업무일지 | `bg_hall_dark` | `juno.upset` | ending/폴백 daily | 회색 원형·반복 평가표는 DOM/CSS. 검은 마법소녀 직접 등장 금지 |
| HIDDEN `[확장]` | 완벽한 호흡, 완벽한 사고 | GOOD 자산 재사용 | `juno.surprised`; `ending.black_magical_girl` 재사용 | ending | M5 제외. 전용 신규 물리 에셋 만들지 않음 |

## 5. 런타임 매핑 규칙

- 시나리오 `scene.bg`, `scene.bgm`은 확장자 없는 논리 ID만 저장한다.
- 캐릭터 경로는 `{characterId}.{emotion}`으로 중앙 resolver가 찾는다.
- 전투 적 상태는 `momentum >= 65`면 `gray_wraith.weakened`, 아니면 `gray_wraith.normal`이다.
- N1의 주노 미노출, N3/N4/N5의 주노+망령 동시 표시, battle의 주노 보조 표시는 노드 타입 기본 렌더만으로 추론하지 않는다. 이 문서의 장면 규칙을 presentation 계층에서 적용한다.
- `bgm_transform`은 loop 금지. `bgm_daily`, `bgm_battle`, `bgm_crisis`, `bgm_ending`은 loop 가능하다.
- 마이크 청취 중 BGM을 낮추고 판정 뒤 복구한다. 음악 자체에 음성·주문 콜을 넣어 해결하지 않는다.
- 물리 에셋 로드 실패는 `physical → 지정 파생 → CSS placeholder` 순서로 강등한다. 진행을 막지 않는다.
- 컷 가능 자산이 없다는 이유로 GOOD/NORMAL/BAD 완주를 막지 않는다.

## 6. 현재 구현 상태

- `[구현]` `n1_first_voice`는 주노 스프라이트를 숨기고 CSS 빛만 표시한다.
- `[구현]` N3~N5는 주노와 `gray_wraith.normal`을 동시에 배치한다. 고정 대사의 망령도 `gray_wraith.neutral`이 아니라 상태 에셋으로 해석한다.
- `[구현]` battle은 도윤·현재 망령 상태·주노 보조 인물을 같은 stage에 배치한다.
- `[구현]` N4의 마지막 주노 표정은 `GameState.npcEmotion`으로 N5 도입까지 이어지고, N5의 명시 표정 대사에서만 전환한다.
- `[구현]` `bgm_transform`은 주문 결과 뒤 one-shot으로 재생한다. N5 도입은 `bgm_battle` crisis 폴백을 유지하고, PTT 청취 중 현재 BGM을 duck한다.
- `[구현]` 물리 파일은 기본 핵심분만 preload하고 나머지는 장면 진입 시 지연 로드한다. 실패는 `physical → 지정 파생 → CSS placeholder`로 강등하며 `[ASSET_HANDOFF]`를 경로별 한 번 기록한다.
- `[대기]` `bgm_crisis`, `bgm_ending`, `ending.black_magical_girl`은 컷 가능이다. 승인 파일을 채택하기 전에는 현재 필수곡·narration·CSS 폴백을 사용한다.
- `[대기]` 모든 필수 물리 에셋의 시각·청각·라이선스 QA는 외부 담당자 전달 후 진행한다.

## 7. 현재 M5에서 제작하지 않을 항목

- `bg_lounge_day.webp`, `bg_street_evening.webp`, 챕터2 분기 배경
- `char_doyun_normal.png`, `char_juno_climax.png`
- 불완전 변신 전용 컷·스프라이트
- HIDDEN 전용 신규 이미지·음악
- UI 프레임, 평가표 이미지, 주문 글자 이미지
- 파일 SFX. 결정음·시전음·크리티컬·타격·인식 실패음은 Web Audio 코드 생성

## 8. 제작자 제출 체크리스트

- [ ] 정확한 파일명과 포맷을 지켰다.
- [ ] 배경 1920×1080 WebP ≤500KB, 컷 1920×1080 WebP ≤700KB다.
- [ ] 캐릭터 1200×2000 투명 PNG ≤800KB다.
- [ ] 주노 5표정과 망령 2상태의 캔버스·좌표·몸 윤곽이 일치한다.
- [ ] 배경에 인물·텍스트·UI가 없다.
- [ ] BGM은 지정 길이·instrumental이며 loop 경계가 끊기지 않는다.
- [ ] 생성 도구·프롬프트/작업 ID·라이선스 확인 정보를 함께 전달했다.
- [ ] 전체 물리 에셋 합계 30MB 이하 목표를 지켰다.

## 9. 개발자 통합 체크리스트

- [ ] 이 문서의 각 런타임 node/phase가 실제 배경·인물·BGM과 일치한다.
- [ ] `ASSET_MANIFEST.md` 상태가 `missing → ready → approved` 순서로 갱신됐다.
- [ ] 파일명 변경 시 scenario 참조, resolver, manifest, 이 문서를 같은 변경에서 갱신했다.
- [ ] N1에서 주노가 미리 보이지 않는다.
- [ ] N3에서 주노와 회색 망령이 함께 보인다.
- [ ] N4 관계별 주노 표정이 N5 도입까지 이어진다.
- [ ] 전투에서 도윤·망령·주노의 위치가 페이즈 전환 때 튀지 않는다.
- [ ] `bgm_transform`이 반복 재생되지 않는다.
- [ ] GOOD/NORMAL/BAD의 색 회복량과 주노 표정이 구분된다.
- [ ] 누락·불량 에셋에서도 CSS placeholder로 클릭·오프라인 완주된다.

## 10. 남은 위험·다음 단계

### 남은 위험

| ID | 상태 | 위험 | 영향 | 담당·해결 게이트 |
|---|---|---|---|---|
| AR-01 | `OPEN` | 필수 물리 이미지·음악이 아직 `missing` | 실제 시각·청각 M5 QA 불가 | 외부 제작자 납품 → 자동 규격 검사 → manifest `ready` |
| AR-02 | `OPEN` | 스타일 앵커와 사람 시각 검수 미완료 | 캐릭터·배경 화풍 불일치 가능 | 팀 스타일 앵커 승인 후 본생산 |
| AR-03 | `OPEN` | N1에서 주노가 등장 전에 표시될 수 있음 | 주노 등장 연출·대본 모순 | 개발자 presentation 수정 + N1→N2 수동 QA |
| AR-04 | `OPEN` | N3~N5 복수 인물과 N4→N5 표정 연속성 미반영 | 관계 감정선과 망령 위협 약화 | 개발자 장면별 인물 레이어 적용 |
| AR-05 | `OPEN` | `gray_wraith.neutral` 잘못된 경로 요청 가능 | 망령 컷씬 placeholder 노출 | `gray_wraith.normal/weakened` 상태 resolver 적용 + 404 검사 |
| AR-06 | `OPEN` | battle의 주노 보조 위치 미반영 | N6~N8에서 동료 서사 약화 | phase presentation 적용 + 위치 고정 QA |
| AR-07 | `OPEN` | `bgm_transform` 진입 재생·loop 가능성 | 주문 전 음악 시작 또는 징글 반복 | 주문 결과 뒤 one-shot 계약 적용 + 청각 QA |
| AR-08 | `OPEN·비차단` | `bgm_crisis`, `bgm_ending`, 검은 마법소녀 컷 미제작/미연결 | 연출 밀도 감소 | 일정 여유 시 제작·연결. 없으면 문서 지정 폴백 사용 |
| AR-09 | `OPEN` | 생성물 라이선스·대회 제출 허용 확인 미완료 | `approved` 승격·제출 차단 | 제작 도구 플랜·약관·대회 규정 사람 확인 |
| AR-10 | `OPEN` | 총 용량·초기 로딩 실측 전 | 30MB·첫 화면 3초 목표 초과 가능 | 통합 후 크기 합계·preload/lazy load·Chrome 실측 |

### 다음 단계 순서

1. 외부 제작자: §3 필수 목록을 정확한 파일명으로 제작하고 루트 `asset/`에 전달한다.
2. 개발자: 에셋 도착을 기다리지 않고 AR-03~AR-07을 CSS placeholder로 먼저 해결한다.
3. 개발자: 전달 파일을 원본 수정 없이 규격·투명도·용량·파일명 검사한다. 오류면 제작자에게 반환한다.
4. 통합 담당: 통과 파일만 `public/assets/`에 배치하고 catalog·scene/phase 매핑을 이 문서와 대조한다.
5. 문서 담당: `ASSET_MANIFEST.md`를 `ready`로 갱신하고 제작 증빙을 `AI_PRODUCTION_LOG.md`에 연결한다.
6. 사람 검수: 주노 표정 정렬, 망령 상태 일관성, 배경 합성, BGM loop·duck·crossfade, 라이선스를 확인한 뒤 `approved`로 승격한다.
7. QA: 음성·클릭·오프라인으로 GOOD/NORMAL/BAD를 완주하고 M5 완료 조건을 판정한다.

AR-01·02·09·10과 필수 장면 QA가 닫히기 전에는 M5 완료로 보고하지 않는다. AR-08은 승인된 컷 가능 항목이라 열려 있어도 M5 완주를 막지 않는다.
