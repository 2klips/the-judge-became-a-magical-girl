# 장면별 에셋 매핑 명세

이 문서는 「심사역은 마법소녀가 되었다」 본편의 **장면 → 배경·인물·표정·음악·컷·런타임 연출** 연결 계약이다. 외부 에셋 제작자는 이 문서로 제작 수량과 정확한 파일명을 확인하고, 개발자는 같은 표로 각 런타임 장면에 승인 에셋을 연결한다.

## 1. 문서 책임과 우선순위

- 스토리·감정선·장면 내용: [완성대본 v2](../심사역은_마법소녀가_되었다_완성대본_v2.md)
- 현재 M5 노드·배경 beat 매핑: [DECISIONS.md](../dev/DECISIONS.md)의 DEC-020·DEC-024·DEC-032·DEC-036
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
2. 납품 원본은 `assets/source/{background|doyun|juno}/`의 해당 담당 폴더에 둔다. `assets/runtime/`, `public/scenario/`, `src/`, `docs/`는 제작자가 수정하지 않는다.
3. 개발 통합 기대 경로는 `assets/runtime/{bg|char|cut|bgm}/`다. 개발자가 규격·라이선스·사람 QA 후 계약명으로 복사하며, Vite가 빌드 때 `dist/assets/`로만 게시한다.
4. 파일명만 다르면 원본을 보존하고 채택 복사본을 계약명으로 정규화하며 원본명→계약명을 기록한다. 포맷·규격·장면 내용이 다르면 자동 변환·채택하지 않고 제작자에게 반환한다. DEC-034.
5. 이미지에 제목, 대사, 평가 문장, UI, 로고를 박아 넣지 않는다. 텍스트는 런타임 DOM/CSS가 표시한다.
6. 배경에는 사람·캐릭터를 넣지 않는다. 예외는 인물까지 포함하는 `cut_*.webp` 컷씬 일러스트뿐이다.
7. BGM은 STT를 방해하지 않는 instrumental 기준이다. 보컬·주문 음성은 production 파일에 넣지 않는다.
8. 생성 도구·모델, 프롬프트/작업 ID, 생성일, 사용 플랜·라이선스 확인 결과를 [AI_PRODUCTION_LOG.md](AI_PRODUCTION_LOG.md)에 전달한다. 확인되지 않은 출처는 추측하지 않고 [PROVENANCE.md](PROVENANCE.md)에 `미확인`으로 남긴다.

## 3. 제작 파일 마스터 목록

### 3.1 배경

| 우선순위 | 논리 ID | 정확한 파일명 | 제작 내용 | 장면 |
|---|---|---|---|---|
| `[확정·M5 필수]` | `bg_title` | `bg_title.webp` | NHN 사옥 외경 타이틀 베이스. 작품명·시작 버튼은 DOM/CSS. 현재 원본의 대형 NHN/HACKATHON 문구·로고는 `[임시 승인, DEC-037]`; clean 교체 요청 유지 | 타이틀 |
| `[확정·M5 폴백 가능]` | `bg_office_wide` | `bg_office_wide.webp` | 빈 메인 사무실 전경. N0 늦은 밤 조건은 CSS 야간 색보정으로 맞춘다 | N0 도입 establishing |
| `[확정·M5 필수]` | `bg_hall_day` | `bg_hall_day.webp` | **이름은 호환용 레거시 ID다. 실제 내용은 도윤 책상 1인칭 기본 배경.** 모니터·키보드·사원증이 보이는 구도 | N0 심사, N2 주노 등장·대화 |
| `[확정·M5 폴백 가능]` | `bg_hall_time_stop` | `bg_hall_time_stop.webp` | 정면 책상 구도에 푸른 정지광과 빛나는 사원증. 없으면 `bg_hall_day` + CSS 정지 효과 | N1 첫 목소리 |
| `[확정·M5 폴백 가능]` | `bg_hall_dark` | `bg_hall_dark.webp` | 정면 책상 구도에 색 빠짐·회색 침식·평가표 잔향 | N3~N5 도입, 전투 후 수렴 |
| `[확정·M5 폴백 가능]` | `bg_hall_good` | `bg_hall_good.webp` | 아침빛과 색이 완전히 회복된 도윤 책상 | GOOD 본 장면 |
| `[확정·M5 폴백 가능]` | `bg_hall_normal` | `bg_hall_normal.webp` | 일부 회색과 잔향이 남은 도윤 책상 | NORMAL 본 장면 |
| `[확정·M5 폴백 가능]` | `bg_hall_bad` | `bg_hall_bad.webp` | 색이 돌아오지 않고 화면 오류 잔향이 남은 도윤 책상 | BAD 본 장면 |
| `[확정·M5 폴백 가능]` | `bg_desk_closeup` | `bg_desk_closeup.webp` | 키보드·사원증 중심 데스크 클로즈업 | N5 사원증 부상·주문 게이트 |
| `[확정·M5 폴백 가능]` | `bg_transform_space` | `bg_transform_space.webp` | 사원증과 업무 UI 파편이 빛의 원형 마법진 위로 떠오르는 추상 변신 공간 | N5 영창 결과의 컷 하부 배경 |
| `[확정·M5 폴백 가능]` | `bg_battle_wide` | `bg_battle_wide.webp` | 넓은 빈 사무실 전투 stage. 변신 직후 색과 빛이 되돌아오는 p1 도입 | battle p1 |
| `[확정·M5 필수]` | `bg_hall_void` | `bg_hall_void.webp` | 같은 사무실 와이드 구도에 회색 안개·떠다니는 평가표가 침식한 상태 | battle p2 |
| `[확정·M5 폴백 가능]` | `bg_mind_archive` | `bg_mind_archive.webp` | 기록 UI·평가표가 떠다니는 심리/아카이브 공간 | battle p3의 N7 과거 기록·핵심 질문 |
| `[확정·M5 폴백 가능]` | `bg_battle_core` | `bg_battle_core.webp` | 회색 벽이 갈라지고 빛과 회색이 대치하는 최종전 공간 | battle p3 최종 주문·정화 직전 |
| `[컷 가능]` | `bg_corridor_day` | `bg_corridor_day.webp` | 밝은 빈 사무실 복도 | GOOD 후속 훅 도입, HIDDEN 전환 |
| `[컷 가능]` | `bg_corridor_blacklight` | `bg_corridor_blacklight.webp` | 같은 복도 계열의 검은빛·보랏빛 침식 상태. 검은 마법소녀 인물은 별도 컷/스프라이트 | GOOD 후속 검은빛, HIDDEN 크레딧 이후 |
| `[확장]` | `bg_lounge_day` | `bg_lounge_day.webp` | 10~30분 확장판 일상 제2장소 | 현재 M5 미사용 |
| `[확장]` | `bg_street_evening` | `bg_street_evening.webp` | 10~30분 확장판 챕터2 거리 | 현재 M5 미사용 |

`bg_hall_dark.webp`가 없거나 불량이면 DEC-019대로 `bg_hall_day.webp`에 회색 필터·비네트·안개 오버레이를 적용한다. 현재 `BG-02`와 `BG-02B`는 카메라·화면비가 달라 같은 구도 파생 계약을 충족하지 않는다. 채택 시 N2→N3 hard cut으로만 전환하고 crop·합성 QA를 거친다. 픽셀 연속 전환이 필요하면 같은 구도 재작업본을 요청한다.

`bg_hall_good/normal/bad`, `bg_hall_time_stop`, `bg_office_wide`, `bg_desk_closeup`, `bg_transform_space`, `bg_battle_wide`, `bg_mind_archive`, `bg_battle_core`가 없거나 불량이면 DEC-032의 기존 4개 배경과 CSS/DOM 연출로 폴백한다. 추가 배경 하나의 실패가 완주를 막지 않는다.

`bg_corridor_day/blacklight`는 GOOD 후속 훅·HIDDEN 확장용 컷 가능 배경이다. 미통합이어도 GOOD/NORMAL/BAD 본편 완료를 막지 않는다.

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
| `[확정·M5 필수]` | `doyun.normal_tired` | `char_doyun_normal_tired.png` | 야근으로 지친 평상복 도윤 | N0 3~4번째 대사 |
| `[확정·M5 필수]` | `doyun.normal_startled` | `char_doyun_normal_startled.png` | 갑작스러운 목소리·주노·망령에 놀란 도윤 | N0 5번째 이후, N1, N2 도입, N3 |
| `[확정·M5 필수]` | `doyun.normal` | `char_doyun_normal.png` | 평상복 기본 도윤 | N2 후속, N4-B |
| `[확정·M5 필수]` | `doyun.normal_smile` | `char_doyun_normal_smile.png` | 관계가 회복되거나 결말을 받아들이는 도윤 | N4-A, GOOD·NORMAL 본 장면 |
| `[확정·M5 필수]` | `doyun.normal_shy` | `char_doyun_normal_shy.png` | 어색함·주문 직전의 도윤 | N4-C, N5 도입·주문 게이트 |
| `[확정·M5 필수]` | `doyun.normal_empty` | `char_doyun_normal_empty.png` | 감정과 색이 빠진 도윤 | BAD 엔딩 |
| `[확정·M5 필수]` | `doyun.magical` | `char_doyun_magical.png` | `[임시 승인, DEC-035]` 정면 변신 완료 기본 포즈 | 변신 완료·전투 공통 폴백 |
| `[확정·M5 필수]` | `doyun.magical_pose` | `char_doyun_magical_pose.png` | 변신 직후·전투 후 수렴 포즈 | N5 변신 결과, 수렴 |
| `[확정·M5 필수]` | `doyun.magical_defend` | `char_doyun_magical_defend.png` | 방어 주문 포즈 | battle p1 |
| `[확정·M5 필수]` | `doyun.magical_attack` | `char_doyun_magical_attack.png` | 공격 주문 포즈 | battle p2 |
| `[확정·M5 필수]` | `doyun.magical_finish` | `char_doyun_magical_finish.png` | 마지막 판정 주문 포즈 | battle p3 |
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
| 타이틀 | 마이크 연결·테스트 후 시작 | `bg_title` | 없음 | 무음 | `마이크가 연결되어야 플레이 가능해요` 안내, 입력 장치 선택, 실시간 dBFS 미터, 테스트 진행률을 DOM/CSS로 표시한다. 테스트 통과 전 시작·이어하기 비활성. baked NHN/HACKATHON 문구·로고는 DEC-037 임시 승인 |
| N0 `n0_review` | 반복되는 심사 | 도입 `bg_office_wide` → 책상 `bg_hall_day` | 첫 두 대사는 도윤 미표시. 3~4번째 `doyun.normal_tired`, 5번째 이후 `doyun.normal_startled` | `bgm_daily` | 첫 두 대사만 1인칭 독백 클리셰로 숨기고 곧바로 도윤을 표시한다. 평가 문장·커서는 DOM/CSS |
| N1 `n1_first_voice` | 모니터 속 첫 목소리 | `bg_hall_time_stop` | `doyun.normal_startled`. **주노 실물 미노출** | 계속 `bgm_daily` | NPC가 주노여도 N2 전까지 주노 스프라이트는 숨긴다. 사원증 빛·시간 정지는 배경+CSS |
| N2 `n2_juno_intro` | 주노가 키보드 위로 등장 | `bg_hall_day` | 도윤 `normal_startled` + 주노 `surprised → happy`; 반응에 따라 `neutral/upset` | 계속 `bgm_daily` | 등장 순간 짧은 CSS 빛·낙하. 자유 대화 결과 표정 사용 |
| N2 `n2_juno_followup` | 정체·선택 이유 확인 | `bg_hall_day` | 도윤 `normal` + 주노 `neutral`; 선택 이유 질문 `shy`, 냉담 `upset` | 계속 `bgm_daily` | 각 캐릭터는 한 번에 한 표정만 표시 |
| N3 `n3_wraith_choice` | 회색 망령 등장 | `bg_hall_dark` | 도윤 `normal_startled` + `gray_wraith.normal` 중앙/후면 + `juno.upset` 측면 | 선호 `bgm_crisis`; MVP 폴백 `bgm_battle` | 세 인물을 동시에 표시. 평가표·안개·방어막 균열은 CSS/Canvas |
| N4-A `n4_team` | 죽이 맞는 콤비 | `bg_hall_dark` | 도윤 `normal_smile` + `juno.happy`; 망령 유지 | 계속 crisis/폴백 | 주노 한 바퀴 회전은 CSS |
| N4-B `n4_cooperate` | 마지못한 협력 | `bg_hall_dark` | 도윤 `normal` + `juno.neutral`; 망령 유지 | 계속 crisis/폴백 | 주노를 N4-A보다 작고 차분하게 배치 |
| N4-C `n4_awkward` | 서먹함·회복 기회 | `bg_hall_dark` | 도윤 `normal_shy` + 주노 시작 `upset`, 회복 `shy`, 거리 유지 `neutral`; 망령 유지 | 계속 crisis/폴백 | 주노 발광량 감소는 CSS. 별도 어두운 스프라이트 금지 |

#### 대화 응답 직후 도윤 감정 매핑

시나리오 작가 JSON은 수정하지 않는다. NPC 응답 화면에서 판정된 `intentId`만 presentation 계층에 전달해 다음 표를 적용한다. 표에 없는 opening·폴백 상태는 위 장면 기본값을 유지한다.

| 노드 | 플레이어 의도 | 도윤 논리 ID | 대본 감정 근거 |
|---|---|---|---|
| `n2_juno_intro` | `curious_magic` / `realistic_objection` / `reject_juno` | `normal_smile` / `normal` / `normal_tired` | 호기심 / 현실적 확인 / 피로한 거절 |
| `n2_juno_followup` | `ask_identity` / `ask_why_chosen` / `stay_cold` | `normal` / `normal_shy` / `normal_tired` | 정체 확인 / 자신이 선택된 이유에 대한 당혹 / 냉담 유지 |
| `n3_wraith_choice` | `protect_others` / `seek_method` / `withdraw_or_agree` | `normal_startled` / `normal` / `normal_tired` | 위기 속 타인 걱정 / 해결법 탐색 / 철수·체념 |
| `n4_team` | `match_rhythm`, `tease_juno` / `focus_action` | `normal_smile` / `normal` | 콤비 호흡·농담 / 즉시 행동 집중 |
| `n4_cooperate` | `follow_steps`, `demand_answers` / `complain_then_help` | `normal` / `normal_shy` | 제한적 협력·추궁 / 투덜거리며 주문 수용 |
| `n4_awkward` | `repair_relation` / `limited_cooperation` / `keep_distance` | `normal_smile` / `normal` / `normal_tired` | 관계 회복 / 제한적 협력 / 거리 유지 |

### 4.2 N5 변신·N6~N8 전투

| 순서·런타임 | 장면 | 배경 | 화면 인물·컷 | 음악 | 추가 연출·개발 주의 |
|---|---|---|---|---|---|
| N5 `n5_transform` 도입 | 사원증 부상·망령 압박 | `bg_hall_dark` → `bg_desk_closeup` | 도윤 `normal_shy` + `gray_wraith.normal` + 직전 관계의 주노 표정 | crisis/폴백 유지 | `juno.surprised`는 망령 공격 순간에만 사용. 도입은 직전 N4 관계 표정을 이어받음 |
| N5 주문 게이트 | 두 문장 한 번에 낭독 | `bg_desk_closeup` | 도윤 `normal_shy`; 주문 UI 중심, 주노는 작게 유지 | 입력 중 기존 곡 duck | 주문 전문은 DOM. BGM·SFX가 STT에 섞이지 않도록 입력 중 음량 낮춤 |
| N5 변신 결과 | 영창→완료 | `bg_transform_space` 위 컷 전면 | 도윤 `magical_pose` + `transform.cast → transform.complete` | `bgm_transform` one-shot | 컷 누락 시 배경+도윤+CSS 플래시/파티클로 강등. 완전/표준/구제는 효과 강도만 다름 |
| `battle_wraith` / p1 `p1_defend` | 직원·게임 보호 | `bg_battle_wide` | 도윤 `magical_defend` + `gray_wraith.normal` + `juno.neutral` | `bgm_battle` | 방어막은 CSS/Canvas. 실패 시 `bg_hall_void` |
| `battle_wraith` / p2 `p2_attack` | 망령 중심 공격 | `bg_hall_void` | 도윤 `magical_attack` + momentum별 망령 + `juno.happy` | 계속 `bgm_battle` | 공격 플래시 뒤에도 같은 캔버스 정렬 유지 |
| `battle_wraith` / p3 `p3_answer` 질문 | 과거 기록·핵심 질문 | `bg_mind_archive` | 도윤 `magical_finish` + 현재 망령 상태 + `juno.neutral` | 계속 `bgm_battle`, 질문 중 일시 duck | `/project_archive/`, 소개 문구는 DOM/CSS |
| `battle_wraith` / p3 `p3_answer` 주문 | 마지막 주문·회색 핵 노출 | `bg_battle_core` | 도윤 `magical_finish` + 현재 망령 상태 + `juno.neutral` | 계속 `bgm_battle` | 주문 음성은 제목에서 보정한 dBFS 범위도 판정. 너무 작거나 크면 문서 지정 재시도/턴 소모 분기를 적용 |

### 4.3 수렴·엔딩

| 순서·런타임 | 장면 | 배경 | 화면 인물·컷 | 음악 | 추가 연출·개발 주의 |
|---|---|---|---|---|---|
| 수렴 `ch3_gray_answer` | 작은 회색 빛의 질문 | `bg_hall_dark` + 색 회복 오버레이 | 도윤 `magical_pose` + 주노 `neutral`; 긍정 `happy`, 냉소 `upset`; 망령 제거 | 선호 `bgm_ending`; 폴백 `bgm_daily` | 작은 회색 핵은 Canvas/CSS 파티클 |
| GOOD `ending_good` | 다시 플레이·평가 수정 | `bg_hall_good` | 도윤 `normal_smile` + `juno.happy` | ending/폴백 daily | 평가표 문장은 DOM. 실패 시 `bg_hall_day` + 아침빛 |
| GOOD 후속 훅 도입 | 1,024개 잔향·복도 전환 | `bg_corridor_day` | `juno.surprised` 반응 | ending 유지 | 복도 끝 검은빛 직전까지 사용. 컷 가능 배경이므로 없으면 기존 검은 화면 전환 |
| GOOD 후속 훅 검은빛 | 검은 마법소녀 암시 | `bg_corridor_blacklight` + 컷 가능 `ending.black_magical_girl` | 인물은 컷에 포함. 주노 별도 표시 금지 | 마지막 순간 정지/감쇠 | 배경 자체는 인물 대체물이 아니다. 컷 없으면 복도+픽셀 흡수 CSS+대사. 본편 이름 `노아` 노출 금지 |
| NORMAL `ending_normal` | 판단 보류·한 번 더 | `bg_hall_normal` | 도윤 `normal_smile` + `juno.neutral` | ending/폴백 daily | `UNKNOWN USER CONNECTED`는 DOM. 검은 마법소녀 실루엣 금지 |
| BAD `ending_bad` | 회색 업무일지 | `bg_hall_bad` | 도윤 `normal_empty` + `juno.upset` | ending/폴백 daily | 회색 원형·반복 평가표는 DOM/CSS. 검은 마법소녀 직접 등장 금지 |
| HIDDEN `[확장]` | 완벽한 호흡, 완벽한 사고 | `bg_hall_good` → `bg_corridor_blacklight` | `juno.surprised`; `ending.black_magical_girl` 재사용 | ending | M5 제외. 전용 신규 물리 에셋 만들지 않음 |

## 5. 런타임 매핑 규칙

- 시나리오 `scene.bg`, `scene.bgm`은 확장자 없는 논리 ID만 저장한다.
- 캐릭터 경로는 `{characterId}.{emotion}`으로 중앙 resolver가 찾는다.
- 도윤은 `presentationDoyun` 고정 매핑으로 표시한다. 타이틀과 N0 첫 두 대사만 숨기고, 이후 독백을 포함한 본편 장면에서는 위 표의 도윤 상태를 표시한다.
- `[확정, DEC-049]` 도윤은 화면 오른쪽 영역 안에서 중심 쪽으로 더 옮기고, 확대·하향해 하반신 crop을 허용한다. PNG 상단을 기준으로 상반신을 보존한다. 작은 주노는 도윤 쪽으로 붙여 같은 인물군으로 읽히게 한다. 대화·컷씬·엔딩·battle·dev 프리뷰 모두 같은 좌우 방향을 유지하며 원본 파일을 물리 crop하지 않는다.
- 전투 적 상태는 `momentum >= 65`면 `gray_wraith.weakened`, 아니면 `gray_wraith.normal`이다.
- N1의 주노 미노출, N3/N4/N5의 주노+망령 동시 표시, battle의 주노 보조 표시는 노드 타입 기본 렌더만으로 추론하지 않는다. 이 문서의 장면 규칙을 presentation 계층에서 적용한다.
- `[확정, DEC-036]` scenario의 단일 `scene.bg`는 저장·복구용 베이스 ID다. N0 line beat, N5 주문 단계, battle phase/p3 spell, ending 후속 beat의 세부 배경 교체는 새 JSON 필드 없이 presentation 계층의 고정 매핑으로 적용한다.
- 세부 배경 로드 실패 시 같은 행의 기존 베이스 배경을 유지한다. 배경 실패가 dialogue·주문·battle·ending 진행을 다시 실행하거나 막아서는 안 된다.
- 이전과 다음 논리 배경 ID가 같으면 전환 애니메이션을 적용하지 않는다. ID가 바뀔 때만 420ms crossfade를 적용하고, `prefers-reduced-motion: reduce`에서는 즉시 전환한다.
- `bgm_transform`은 loop 금지. `bgm_daily`, `bgm_battle`, `bgm_crisis`, `bgm_ending`은 loop 가능하다.
- 마이크 청취 중 BGM을 낮추고 판정 뒤 복구한다. 음악 자체에 음성·주문 콜을 넣어 해결하지 않는다.
- 물리 에셋 로드 실패는 `physical → 지정 파생 → 검은 presentation` 순서로 강등한다. 누락 BGM은 무음이다. 대사·자막·입력 UI는 유지해 진행을 막지 않는다(DEC-040).
- 컷 가능 자산이 없다는 이유로 GOOD/NORMAL/BAD 완주를 막지 않는다.

## 6. 현재 구현 상태

- `[구현]` `n1_first_voice`는 주노 스프라이트를 숨기고 CSS 빛만 표시한다. 이름표와 상단 링크도 `정체불명의 목소리`·`VOICE // LINK`로 마스킹한다.
- `[구현]` N3~N5는 주노와 `gray_wraith.normal`을 동시에 배치한다. 고정 대사의 망령도 `gray_wraith.neutral`이 아니라 상태 에셋으로 해석한다.
- `[구현]` battle은 도윤·현재 망령 상태·주노 보조 인물을 같은 stage에 배치한다.
- `[구현]` N4의 마지막 주노 표정은 `GameState.npcEmotion`으로 N5 도입까지 이어지고, N5의 명시 표정 대사에서만 전환한다.
- `[구현]` `bgm_transform`은 주문 결과 뒤 one-shot으로 재생한다. N5 도입은 `bgm_battle` crisis 폴백을 유지하고, PTT 청취 중 현재 BGM을 duck한다.
- `[구현]` 물리 파일은 기본 핵심분만 preload하고 나머지는 장면 진입 시 지연 로드한다. 실패는 `physical → 지정 파생 → 검은 presentation`으로 강등하며 `[ASSET_HANDOFF]`를 경로별 한 번 기록한다. BGM 실패는 무음으로 계속한다.
- `[구현]` 도윤 11종을 `assets/runtime/char/`에 계약명으로 배치하고 N0 세 번째 대사부터 N5·battle·수렴·3엔딩에 연결했다. 원본은 `assets/source/doyun/delivery/`에 보존한다.
- `[구현·QA PASS, DEC-047]` 도윤 전용 presentation class를 적용해 데스크톱·모바일에서 오른쪽 확대·상반신 crop으로 표시한다. 주노는 중앙/왼쪽 보조 위치를 유지한다.
- `[구현·QA PASS, DEC-048]` 과거 `docs/Asset/juno-reference-v2/`에서 현재 source로 `R100` 이동된 주노 5표정을 동일 바이트로 `assets/runtime/char/`에 채택했다. N2·battle dev 장면의 투명 합성과 표정 로드를 확인했다.
- `[구현·QA PASS, DEC-049]` N2~N4 응답 `intentId`별 도윤 표정 resolver를 적용했다. 도윤은 더 크게·낮게·왼쪽으로, 주노는 도윤 쪽으로 보정했으며 desktop N2/N4/battle과 390×844 N2에서 crop·겹침·가로 overflow를 확인했다.
- `[구현]` 같은 배경 ID는 정지 표시하고 다른 ID만 420ms crossfade한다. 감소 모션 환경에서는 전환을 제거한다.
- `[구현]` 타이틀에서 마이크 연결·장치 선택·실시간 dBFS 테스트를 통과해야 시작·이어하기가 열린다. 게임 진입 뒤 STT 실패 시 클릭 폴백은 유지한다.
- `[구현]` battle 주문은 보정 범위보다 너무 작거나 큰 목소리를 실패 처리한다. 같은 턴 첫 음량 실패는 무료 재시도, 두 번째 실패는 `+0`으로 턴을 소비한다.
- `[구현·QA PASS, DEC-036~039]` 배경 원본 16장을 `1920×1080 WebP ≤500KB` runtime 파일로 변환하고 catalog·node line·변신 stage·battle phase/p3 spell·ending line 고정 전환을 연결했다. `?debug=1` 장면 선택기와 22개 비파괴 프리뷰가 16개 배경을 모두 검수한다.
- `[대기]` `bgm_crisis`, `bgm_ending`, `ending.black_magical_girl`은 컷 가능이다. 승인 파일을 채택하기 전에는 현재 필수곡·narration·CSS 폴백을 사용한다.
- `[대기]` 모든 필수 물리 에셋의 시각·청각·라이선스 QA는 외부 담당자 전달 후 진행한다.

## 7. 현재 M5에서 제작하지 않을 항목

- `bg_lounge_day.webp`, `bg_street_evening.webp`, 챕터2 분기 배경
- `char_juno_climax.png`
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
- [ ] N0 첫 두 대사에는 도윤이 없고 세 번째부터 지정 표정으로 표시된다.
- [ ] N3에서 주노와 회색 망령이 함께 보인다.
- [ ] N4 관계별 주노 표정이 N5 도입까지 이어진다.
- [ ] 전투에서 도윤·망령·주노의 위치가 페이즈 전환 때 튀지 않는다.
- [ ] 같은 배경 ID에서 전환이 없고 다른 ID에서만 420ms crossfade가 발생한다.
- [ ] 제목 마이크 테스트를 통과하기 전 시작·이어하기가 불가능하다.
- [ ] battle 주문의 너무 작음·너무 큼이 각각 무료 1회 재시도 후 두 번째에 턴을 소비한다.
- [ ] `bgm_transform`이 반복 재생되지 않는다.
- [ ] GOOD/NORMAL/BAD의 색 회복량과 주노 표정이 구분된다.
- [ ] 누락·불량 이미지·컷은 검은 presentation, BGM은 무음으로 강등되며 클릭·음성·오프라인 완주된다.

## 10. 남은 위험·다음 단계

### 남은 위험

| ID | 상태 | 위험 | 영향 | 담당·해결 게이트 |
|---|---|---|---|---|
| AR-01 | `부분 통합·에셋 대기` | 배경 16개·도윤 11개·주노 5개는 `ready`; 망령·변신 컷·필수 BGM은 아직 `missing` | 주노 포함 장면 QA 가능. 남은 black/silent 장면의 최종 합성·청각·제출 QA는 불가 | 나머지 외부 제작자 납품 → 자동 규격 검사 → manifest `ready` |
| AR-02 | `OPEN` | 스타일 앵커와 사람 시각 검수 미완료 | 캐릭터·배경 화풍 불일치 가능 | 팀 스타일 앵커 승인 후 본생산 |
| AR-03 | `PASS` | N1 정체 마스킹과 `bg_hall_time_stop`→N2 실제 주노 공개 전환 구현 | 회귀 시 주노 등장 연출·대본 모순 | unit + Browser N2 실제 PNG 합성 QA PASS |
| AR-04 | `구현·QA 대기` | N3~N5 복수 인물과 N4→N5 표정 연속성 구현, 실에셋 사람 검증 전 | 관계 감정선과 망령 위협 약화 가능 | 장면별 인물·표정 수동 QA |
| AR-05 | `black 폴백 PASS·실파일 QA 대기` | `gray_wraith.normal/weakened` resolver와 누락 black presentation 구현 | 납품 전 검은 영역 노출. 최종 합성은 검증 불가 | 통합 뒤 요청 경로·404·상태 전환 검사 |
| AR-06 | `부분 PASS` | battle 주노 보조 위치와 도윤 우측 상반신 구도 구현 | 페이즈 전환 전체 플레이에서 위치가 튈 수 있음 | p1 dev 합성 PASS. p1→p2→p3 실제 전환 수동 QA 유지 |
| AR-07 | `구현·QA 대기` | `bgm_transform` 결과 뒤 one-shot 구현, 실음원 청각 검증 전 | 징글 반복·타이밍 오류 가능 | 통합 뒤 loop·진입 시점 청각 QA |
| AR-08 | `OPEN·비차단` | `bgm_crisis`, `bgm_ending`, 검은 마법소녀 컷 미제작/미연결 | 연출 밀도 감소 | 일정 여유 시 제작·연결. 없으면 문서 지정 폴백 사용 |
| AR-09 | `OPEN` | 생성물 라이선스·대회 제출 허용 확인 미완료 | `approved` 승격·제출 차단 | 제작 도구 플랜·약관·대회 규정 사람 확인 |
| AR-10 | `부분 해소` | 현재 `assets/runtime/` 총합은 30MB 이하이나 목표 환경 첫 화면 3초 실측 전 | 현장 장비에서 초기 로딩 목표 초과 가능 | preload/lazy load 유지, 최종 에셋 통합 후 Chrome 성능 실측 |
| AR-11 | `임시 통합·교체 대기` | 전달된 도윤 세트는 장면 표시를 지원하지만 생성 도구·라이선스가 미확인이고 `char_doyun_magical.png`은 정면 포즈다 | 제출 승인 차단, 전투 구도 약화 가능 | 현 runtime 사용. 증빙과 교체본 도착 후 같은 계약 경로에서 재검수 |
| AR-12 | `ready·교체 요청` | 배경 16개 runtime 규격·장면 로드 PASS. TITLE baked 문구·로고는 DEC-037 임시 승인, `BG-02`는 4:3 원본에서 16:9 crop | 제출 정책 변경 시 clean TITLE 필요. N2→N3 camera hard cut은 유지 | 원본 보존, clean TITLE 요청 유지. contact sheet·Playwright에서 BG-02 핵심 피사체와 hard cut 확인 |
| AR-13 | `OPEN·비차단` | 인계 문서가 과거 17종 대비 실제 16장이라고 기록했지만 누락된 1장의 식별자·장면이 없다 | 누락이 필수 장면이면 뒤늦은 재매핑 가능 | 현재 16장만 DEC-036으로 매핑. 제작자에게 과거 17번째 파일명·용도 확인 후 별도 추가 |
| AR-14 | `구현·회귀 QA 대기` | 16개 배경 매핑과 동일 ID 무전환·변경 ID crossfade 구현 | 회귀 시 잘못된 배경 또는 불필요한 깜박임 | presentation unit + 브라우저 장면 QA |
| AR-15 | `구현·실기기 QA 대기` | 제목 마이크 필수 게이트와 적응형 dBFS battle 판정 | 브라우저·마이크별 입력 편차로 오판 가능 | fake mic 자동 QA + 실제 심사 PC에서 장치 선택·보정·저/고음량 수동 QA |

### 다음 단계 순서

1. 제작자/사용자: 과거 17번째 배경 식별자와 생성·라이선스 증빙을 전달한다. clean TITLE은 현 임시본 교체용으로 요청 유지한다.
2. 제작자: 망령 2상태, 변신 컷 2장, 필수 BGM 3곡을 계약명·규격으로 납품한다. 주노는 재제작하지 않고 권리 증빙만 보완한다.
3. 개발자: AR-04~AR-07 자동 회귀와 검은 presentation·무음 수동 검증을 유지하고, 다른 실에셋 도착 뒤 남은 시각·청각 QA를 수행한다.
4. 통합 담당: 자동 규격 통과 파일만 `assets/runtime/`에 배치하고 catalog·scene/phase 매핑을 이 문서와 대조한다.
5. 문서 담당: 자동 규격 통과분만 `ASSET_MANIFEST.md`를 `ready`로 갱신하고 제작 증빙을 `AI_PRODUCTION_LOG.md`에 연결한다.
6. 사람 검수: 주노 표정 정렬, 망령 상태 일관성, 배경 합성·전환, BGM loop·duck·crossfade, 라이선스를 확인한 뒤 `approved`로 승격한다.
7. QA: 음성·클릭·오프라인으로 GOOD/NORMAL/BAD를 완주하고 M5 완료 조건을 판정한다.

AR-01·02·09·10·15와 필수 장면 QA가 닫히기 전에는 최종 에셋·현장 QA 포함 M5 완료로 보고하지 않는다. AR-08은 승인된 컷 가능 항목이라 열려 있어도 M5 완주를 막지 않는다.
