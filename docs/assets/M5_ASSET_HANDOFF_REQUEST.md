# M5 외부 에셋 작업 요청서

## 1. 목적과 현재 개발 상태

`[확정]` M5 개발은 외부 필수 에셋을 기다리지 않고 진행한다. 아직 없는 이미지·컷은 검은 presentation으로, 아직 없는 BGM은 무음으로 대체한다. 대사·자막·버튼·PTT·게이지는 계속 표시해 클릭·음성·오프라인 완주 경로를 유지한다.

현재 배경 16장과 도윤 11장은 runtime에 통합됐다. 주노 5장은 source 납품·자동 규격 검사가 끝났지만 레퍼런스 권한·생성 서비스 공개 사용 허용과 runtime 통합 승인이 남았다. 주노를 중복 제작하지 말고 아래 증빙을 먼저 보완한다.

실파일이 도착하면 아래 계약 파일명과 논리 ID를 유지한 채 교체한다. 외부 납품 원본은 수정·삭제·rename하지 않는다. 실제 파일명이 다르면 개발자가 원본명→계약명을 기록하고 채택 복사본만 runtime 경로에 정규화한다.

- 상세 장면 사용처: [`SCENE_ASSET_MAPPING.md`](SCENE_ASSET_MAPPING.md)
- 논리 ID·규격·상태: [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md)
- 확인된 출처·미확인 항목: [`PROVENANCE.md`](PROVENANCE.md)
- 제작 기준: [`../별첨2_에셋_제작_가이드라인.md`](../별첨2_에셋_제작_가이드라인.md)

## 2. 최우선 필수 납품

### 2.1 주노 표정 5종 — 실파일 존재, 증빙·통합 승인 필요

| 우선순위 | 논리 ID | 계약 파일명 | 장면 |
|---:|---|---|---|
| P0 | `juno.neutral` | `char_juno_neutral.png` | N2, N4-B, N7, NORMAL, battle 보조 |
| P0 | `juno.happy` | `char_juno_happy.png` | N2 호의, N3 사람 우선, N4-A, GOOD |
| P0 | `juno.shy` | `char_juno_shy.png` | 관계 회복, 일부 N5 |
| P0 | `juno.upset` | `char_juno_upset.png` | N2 거절, N3, N4-C, BAD |
| P0 | `juno.surprised` | `char_juno_surprised.png` | N2 등장, N5, GOOD 후속 |

현재 파일 위치는 `assets/source/juno/delivery/`다. 재제작 요청이 아니라 다음 P0 확인 요청이다.

- 첨부 레퍼런스의 사용·파생·공개 저장소 게시 권한.
- 생성 서비스 플랜의 해커톤 제출·공개 사용 허용.
- 사람 시각 검수와 runtime 통합 승인.

납품 규격:

- 1200×2000 투명 PNG, 파일당 800KB 이하.
- `neutral` 한 장에서 얼굴 표정만 편집 파생한다.
- 몸·의상·포즈·비율·캔버스 좌표를 5장 모두 동일하게 유지한다.
- 니샷, 정면~반측면, 단순 포즈. 화면 하단 대화 UI와 겹치지 않게 한다.
- 표정 외 요소가 움직이거나 투명 배경이 없으면 재납품 대상이다.

### 2.2 회색 망령 2상태

| 우선순위 | 논리 ID | 계약 파일명 | 장면 |
|---:|---|---|---|
| P0 | `gray_wraith.normal` | `char_gray_wraith_normal.png` | N3~N6, battle momentum 64 이하 |
| P0 | `gray_wraith.weakened` | `char_gray_wraith_weakened.png` | N7~N8, battle momentum 65 이상 |

납품 규격:

- 1200×2000 투명 PNG, 파일당 800KB 이하.
- `normal`에서 `weakened`를 편집 파생한다.
- 같은 개체·포즈·크기·좌표를 유지한다.
- `weakened`는 안개가 갈라지고 내부 빛이 보이되 다른 캐릭터처럼 바뀌면 안 된다.

### 2.3 변신 컷 2장

| 우선순위 | 논리 ID | 계약 파일명 | 내용 |
|---:|---|---|---|
| P0 | `transform.cast` | `cut_transform_01.webp` | 사원증이 떠오르고 도윤·주노가 영창하는 순간 |
| P0 | `transform.complete` | `cut_transform_02.webp` | 변신 완료. 도윤 뒷모습 또는 반측면, 주노 동행 |

납품 규격:

- 1920×1080 WebP, 파일당 700KB 이하.
- 이미지 내부 대사·주문·버튼·UI 텍스트 금지.
- 완전·표준·자동 구제 변신이 같은 두 컷을 사용한다.
- `cut_transform_02.webp`의 도윤 의상·실루엣은 battle용 도윤 최종본과 일치해야 한다.

### 2.4 필수 BGM 3종

| 우선순위 | 논리 ID | 계약 파일명 | 규격 |
|---:|---|---|---|
| P0 | `bgm_daily` | `bgm_daily.mp3` | 60~90초 seamless loop, MP3 128kbps, 3MB 이하 |
| P0 | `bgm_battle` | `bgm_battle.mp3` | 60~90초 seamless loop, MP3 128kbps, 3MB 이하 |
| P0 | `bgm_transform` | `bgm_transform.mp3` | 10~20초 one-shot, MP3 128kbps, 3MB 이하 |

세부 음악 지시는 [`M5_UI_BGM_REQUEST_MAPPING.md`](M5_UI_BGM_REQUEST_MAPPING.md)를 따른다.

## 3. 교체 요청 — 현재 임시 사용 가능

| 우선순위 | 대상 | 현재 상태 | 요청 |
|---:|---|---|---|
| P1 | `doyun.magical` / `char_doyun_magical.png` | 정면 fallback 포즈 runtime 임시 사용. p1~p3은 별도 defend/attack/finish 포즈 사용 | 변신 기본·fallback용 뒷모습 또는 반측면 포즈로 교체 |
| P1 | `bg_title` / `bg_title.webp` | baked NHN/HACKATHON 문구·로고 포함본 임시 승인 | 문구·로고가 없는 clean 배경 재납품 |

교체 전에도 M5 개발과 기능 QA는 진행한다. 교체 파일은 같은 계약명으로 전달한다.

## 4. 확인 또는 선택 납품

| 우선순위 | 대상 | 요청 | M5 차단 여부 |
|---:|---|---|---|
| P2 | 과거 17번째 배경 | 파일명·용도·실제 누락 여부만 확인 | 비차단. 현재 확정 16장만 사용 |
| P2 | `ending.black_magical_girl` / `cut_black_magical_girl_01.webp` | 얼굴·이름 비노출 GOOD 후속 훅 컷 | 컷 가능 |
| P2 | `bgm_crisis` / `bgm_crisis.mp3` | N3~N5 사건 루프 | 컷 가능. `bgm_battle` 폴백 |
| P2 | `bgm_ending` / `bgm_ending.mp3` | 수렴~엔딩 음악 | 컷 가능. `bgm_daily` 폴백 |

현재 누락된 17번째 배경은 임의로 생성·추정·매핑하지 않는다.

## 5. 납품 폴더와 파일명

권장 납품 구조:

```text
delivery/
  char/
    char_juno_neutral.png
    char_juno_happy.png
    char_juno_shy.png
    char_juno_upset.png
    char_juno_surprised.png
    char_gray_wraith_normal.png
    char_gray_wraith_weakened.png
    char_doyun_magical.png
  cut/
    cut_transform_01.webp
    cut_transform_02.webp
    cut_black_magical_girl_01.webp
  bg/
    bg_title.webp
  bgm/
    bgm_daily.mp3
    bgm_battle.mp3
    bgm_transform.mp3
    bgm_crisis.mp3
    bgm_ending.mp3
  PRODUCTION_EVIDENCE.md
```

필수 파일만 먼저 납품해도 된다. 부분 납품마다 변경 파일 목록을 함께 기록한다.

## 6. 생성·라이선스 증빙

`PRODUCTION_EVIDENCE.md`에 파일별로 아래 정보를 기록한다.

- 실제 파일명과 대응 논리 ID.
- 생성 도구와 모델/버전.
- 프롬프트 또는 작업 ID.
- 생성·편집일.
- 사용한 스타일 앵커와 레퍼런스 관계.
- 사용 플랜과 해커톤 제출·공개 사용 허용 여부를 확인한 사람·날짜·근거 링크.
- AI 생성 뒤 수행한 crop·배경 제거·압축 등 후처리.

약관을 추정해 `승인`으로 표시하지 않는다. 증빙 미전달 파일은 자동 규격을 통과해도 `ready`까지만 가능하다.

## 7. 인수 검사와 재납품 조건

개발자는 다음 순서로 검사한다.

1. 파일명·확장자·수량.
2. 이미지 해상도·투명도·개별 용량.
3. BGM codec·bitrate·길이·개별 용량.
4. 전체 runtime 에셋 30MB 이하.
5. 논리 ID와 장면 resolver 연결.
6. 주노 5종·망령 2종 오니언 스킨 일관성.
7. 실제 장면 합성, 발 위치·원근·조명.
8. BGM loop·duck·crossfade·변신 one-shot 청감.
9. 라이선스 증빙.

다음은 재납품 대상이다.

- 계약 규격이나 파일명 불일치.
- 투명 캐릭터 배경에 불투명 잔여물 존재.
- 표정 전환 때 몸·의상·좌표가 움직임.
- 망령 두 상태가 다른 개체처럼 보임.
- BGM에 보컬·주문 콜이 있거나 루프 경계가 끊김.
- 이미지에 요청하지 않은 글자·로고·UI가 baked됨.
- 생성·라이선스 증빙이 없음.

불합격 원본은 개발자가 수정하지 않는다. 오류와 기대 규격을 기록해 작업자에게 반환한다.
