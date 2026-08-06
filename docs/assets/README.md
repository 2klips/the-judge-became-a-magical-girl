# 에셋 문서 지도

물리 에셋은 저장소 루트 [`assets/`](../../assets/) 한 곳에서 관리한다. 문서만 이 폴더에서 관리한다.

## 디렉터리 계약

```text
assets/
  runtime/                 # 게임이 직접 사용하는 채택본; 빌드·Pages 포함
    bg/
    char/
    cut/
    bgm/
  source/                  # 외부 납품 원본·중간본; 빌드 제외
    background/
    bgm/
      delivery/            # 최종 BGM 납품본; runtime 미연결
    doyun/
    juno/

docs/assets/
  README.md
  ASSET_MANIFEST.md
  SCENE_ASSET_MAPPING.md
  PROVENANCE.md
  AI_PRODUCTION_LOG.md
  M5_ASSET_HANDOFF_REQUEST.md
  M5_UI_BGM_REQUEST_MAPPING.md
  provenance/
  validation/
```

- 외부 원본은 `assets/source/`에서 이름과 바이트를 보존한다.
- 실제 파일명이 계약명과 다르면 `PROVENANCE.md`에 원본명→계약명을 기록하고 `assets/runtime/` 복사본만 정규화한다.
- `vite.config.ts`가 개발 서버에서 `assets/runtime/`을 `/assets/`로 제공하고, 빌드 때 `dist/assets/`만 복사한다. `assets/source/`는 배포 산출물에 포함하지 않는다.
- runtime 논리 ID·상태는 [에셋 매니페스트](ASSET_MANIFEST.md), 장면별 사용처는 [장면별 매핑](SCENE_ASSET_MAPPING.md)이 소유한다.
- 제작 도구·작성자·라이선스는 추정하지 않는다. Git에서 확인되는 것은 `업로드`, 제작 증빙에서 확인되는 것은 `제작`으로 구분한다.

## 문서 책임

| 문서 | 책임 |
|---|---|
| [ASSET_MANIFEST.md](ASSET_MANIFEST.md) | 논리 ID, runtime 파일, 규격, 상태, QA |
| [SCENE_ASSET_MAPPING.md](SCENE_ASSET_MAPPING.md) | 장면별 배경·도윤·주노·망령·컷·BGM 사용처 |
| [PROVENANCE.md](PROVENANCE.md) | 납품 출처, commit, SHA-256, 제작 증빙 확인 상태, 원본→runtime 관계 |
| [AI_PRODUCTION_LOG.md](AI_PRODUCTION_LOG.md) | 생성·편집·통합 작업 이력 |
| [M5_ASSET_HANDOFF_REQUEST.md](M5_ASSET_HANDOFF_REQUEST.md) | 누락·교체 에셋 작업자 요청 |
| [M5_UI_BGM_REQUEST_MAPPING.md](M5_UI_BGM_REQUEST_MAPPING.md) | UI·BGM 담당 경계와 장면별 음악 요청 |
| [`provenance/`](provenance/) | 작업자가 전달한 원문 증빙·인계 문서 |
| [`validation/`](validation/) | 자동 규격 검사 보고서 |

BGM 납품·효과음 제작 준비 문서는 각각 [BGM_HANDOFF.md](provenance/BGM_HANDOFF.md), [BGM_PRODUCTION_EVIDENCE.md](provenance/BGM_PRODUCTION_EVIDENCE.md), [SFX_PRODUCTION_PLAN.md](provenance/SFX_PRODUCTION_PLAN.md)를 따른다.

## 정리 이력

- 2026-08-04: `asset/`, `docs/Asset/assets/`, `public/assets/`에 흩어진 물리 파일을 `assets/source/`와 `assets/runtime/`으로 통합했다.
- `asset/doyoon-hero-sprites/` 6장은 보관 ZIP entry와 SHA-256이 같은 압축 해제 중복본이어서 제거했다. ZIP은 `assets/source/doyun/doyoon-hero-sprites.zip`에 보존한다.
- 도윤 23장 납품본, 주노 원본·중간본·납품본, 배경 원본 ZIP은 삭제하지 않고 역할별 하위 폴더로 이동했다.
- 주노 과거 `docs/Asset/juno-reference-v2/` 파일은 commit `6940236`에서 `assets/source/juno/`로 `R100` 이동된 것으로 확인했다. delivery 5장은 2026-08-04 `assets/runtime/char/`에 동일 바이트로 채택했다.
- 2026-08-06: 최종 편집 BGM 5종을 `assets/source/bgm/delivery/`에 외부 납품본으로 추가했다. runtime 채택과 효과음 파일 제작은 사람 검수·개발자 통합 뒤 진행한다.
