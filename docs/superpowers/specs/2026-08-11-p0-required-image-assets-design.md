# P0 필수 누락 이미지 3종 설계

## 1. 목적

- `[확정]` 현재 `missing`인 필수 이미지 3종을 실제 runtime 파일로 채운다.
- `[확정]` 사용자가 선택한 **C 하이브리드** 방향으로 변신 컷의 품질과 기존 캐릭터 일관성을 함께 지킨다.
- `[확정]` 기존 논리 ID, 파일명, 시나리오, 엔진 재생 순서와 폴백은 변경하지 않는다.
- `[확정]` 사람 시각 QA 전 상태는 `ready`로만 기록하고 `approved`로 승격하지 않는다.

## 2. 작업 기준

| 항목 | 값 |
|---|---|
| 기준 날짜 | 2026-08-11 KST |
| 시작 커밋 | `204b619d838ea9c54482925f93de44fb4a665bc1` |
| 작업 브랜치 | `codex/p0-required-image-assets` |
| 기존 인수 기준 | `2a5821d8429d88208cb415b06992e7f6fe4dfabf` |
| 선택 방향 | C 하이브리드 |

계약 근거는 [ASSET_MANIFEST.md](../../assets/ASSET_MANIFEST.md), [SCENE_ASSET_MAPPING.md](../../assets/SCENE_ASSET_MAPPING.md), [IMAGE_REWORK_REQUEST.md](../../assets/IMAGE_REWORK_REQUEST.md), `DEC-016`, `DEC-060`이다.

## 3. 산출물 계약

| 논리 ID | runtime 파일 | 규격 | 장면 |
|---|---|---|---|
| `gray_wraith.weakened` | `assets/runtime/char/char_gray_wraith_weakened.png` | 1200×2000 투명 PNG, 800KB 이하 | battle momentum 65 이상, N7~N8 우세 연출 |
| `transform.cast` | `assets/runtime/cut/cut_transform_01.webp` | 1920×1080 WebP, 700KB 이하 | N5 주문 성공 직후 첫 컷 |
| `transform.complete` | `assets/runtime/cut/cut_transform_02.webp` | 1920×1080 WebP, 700KB 이하 | N5 변신 완료 두 번째 컷 |

이미지 안에는 대사, 주문, 버튼, 로고, 워터마크 등 UI 텍스트를 넣지 않는다.

## 4. 이미지별 연출

### 4.1 회색 망령 약화

- `char_gray_wraith_normal.png`와 같은 캔버스, 위치, 구도, 스케일, 실루엣을 유지한다.
- 회색 안개 표면에 크고 작은 균열을 추가하고 내부에서 청백색·시안 빛이 새어 나오게 한다.
- 몸 안에 갇힌 게임 캐릭터의 빛이 비친다는 설정만 암시한다. 별도 인물 얼굴이나 글자는 만들지 않는다.
- 과장된 비명·통증 포즈 대신 무겁고 체념한 인상을 유지한다.
- 기존 `hit` 파일은 균열과 빛의 시각 참고로만 사용하고 포즈는 복제하지 않는다.
- 투명 배경과 가장자리 알파를 보존한다.

### 4.2 변신 영창 — 하이브리드의 기존 자산 중심 컷

- `bg_transform_space.webp`를 공간·색채 기준으로 사용한다.
- 기존 도윤과 주노 자산의 의상, 체형, 색상, 실루엣을 기준으로 삼아 정체성 변형을 최소화한다.
- 떠오른 사원증을 시선 중심으로 배치하고 도윤과 주노가 함께 영창하는 한순간으로 구성한다.
- 사원증 표면에는 읽을 수 있는 개인정보나 문자를 넣지 않는다.
- 기존 자산을 중심으로 합성·편집하되, 빛·입자·깊이감은 신규 생성으로 보강한다.

### 4.3 변신 완료 — 하이브리드의 신규 키아트 컷

- 기존 마법소녀 도윤의 흰색·검정·주황·청록 의상과 별 지팡이 디자인을 유지한다.
- 도윤은 뒷모습 또는 반측면으로 보여 주고 주노는 곁에 둔다.
- 기존 변신 공간의 청색·금색 마법광과 사무실 세계관을 유지한다.
- 완전·표준·자동 구제 결과가 함께 사용하는 장면이므로 승패나 등급을 특정하는 표식은 넣지 않는다.
- 신규 키아트 생성 후 기존 도윤·주노 파일과 나란히 비교해 의상 색, 주요 장식, 비율의 drift를 검수한다.

## 5. 생성·편집 및 파일 흐름

1. Codex 내장 OpenAI 이미지 생성·편집 도구로 후보를 만든다.
2. 사용자 선택 C와 위 장면 계약에 맞지 않는 후보는 runtime에 넣지 않는다.
3. 채택 생성본을 `assets/source/p0-required-images/delivery/`에 보존한다.
4. 배포용 파일만 규격에 맞게 리사이즈·압축하여 `assets/runtime/char/`와 `assets/runtime/cut/`에 둔다.
5. source→runtime 관계, 생성일, 도구, 프롬프트 요약, SHA-256, 규격 검증을 `PROVENANCE.md`와 `AI_PRODUCTION_LOG.md`에 기록한다.

모델명·버전 또는 생성 작업 ID가 도구에서 노출되지 않으면 추정하지 않고 `미노출`로 기록한다.

## 6. 런타임 통합

- `src/assets/catalog.ts`의 기존 경로가 새 물리 파일을 자동 선택하므로 논리 ID나 코드 경로를 추가하지 않는다.
- `transform.cast` → `transform.complete` 순서와 `bgm_transform` 재생 계약은 그대로 유지한다.
- 새 파일 로드 실패에 대비한 기존 CSS 파생·검은 presentation 폴백을 삭제하지 않는다.
- `scenario.json`, 캐릭터 상태, battle momentum 임계값, UI 레이아웃은 수정하지 않는다.

## 7. 문서 갱신 경계

- `ASSET_MANIFEST.md`: 3종을 `missing`에서 `ready`로 갱신하고 실제 규격·SHA·QA 결과를 기록한다.
- `SCENE_ASSET_MAPPING.md`: 기존 장면 매핑은 유지하고 실제 파일 채택 및 사람 QA 대기 상태만 기록한다.
- `IMAGE_REWORK_REQUEST.md`: 제작 대기 3종이 납품되었음을 표시하되 기존 요구사항은 이력으로 보존한다.
- `PROVENANCE.md`, `AI_PRODUCTION_LOG.md`: 생성·편집·채택 증빙을 추가한다.
- `IMPLEMENTATION_LOG.md`: 사용자 지시, 변경 파일, 검증 결과, 남은 사람 QA를 사실 기록으로 추가한다.
- `LEARNING_LOG.md`: 초보자 관점에서 논리 ID와 물리 파일, source와 runtime, 폴백이 어떻게 연결되는지 설명한다.
- `DECISIONS.md`, `MILESTONES.md`: 기존 결정·범위가 바뀌지 않으므로 수정하지 않는다.

## 8. 검증

### 자동 검증

- 이미지 해상도, 포맷, 용량, PNG 알파 채널 확인
- 파일명과 `src/assets/catalog.ts` 경로 일치 확인
- source/runtime SHA-256 및 변환 관계 기록 확인
- `npm run check`
- `npm test`
- `npm run build`

### 브라우저·사람 검증

- N5에서 영창 컷 뒤 완료 컷이 순서대로 실제 이미지로 표시되는지 확인
- 완전·표준·자동 구제 결과에서 같은 두 컷이 정상 재사용되는지 확인
- battle momentum 65 전후로 normal→weakened 물리 이미지가 전환되는지 확인
- 데스크톱과 모바일 화면에서 핵심 피사체가 잘리지 않는지 확인
- 이미지 로드 오류, 콘솔 오류, 의도하지 않은 텍스트·워터마크가 없는지 확인

## 9. 테스트 URL

- 구현 중에는 별도 로컬 개발 서버 URL을 제공해 현재 공개 GitHub Pages와 분리한다.
- 최종 자동 검증과 브라우저 QA가 끝난 뒤 사용자가 직접 플레이할 수 있는 테스트 URL과 확인 장면을 함께 보고한다.
- 원격 push·Pages 배포는 별도 요청 전 수행하지 않는다. 따라서 공개 URL은 이번 로컬 작업만으로 변경되지 않는다.

## 10. 범위 제외

- 신규 이미지 논리 ID 또는 시나리오 필드 추가
- 기존 코드·대사·분기·DB 구조 변경
- `ending.black_magical_girl` 등 P0 3종 밖의 추가 이미지 제작
- 기존 캐릭터 전면 재디자인
- 원격 push, PR, `main` merge, 공개 Pages 배포
