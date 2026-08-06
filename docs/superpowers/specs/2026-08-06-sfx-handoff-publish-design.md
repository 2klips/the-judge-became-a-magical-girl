# SFX 5종 인계·게시 설계

- 날짜: 2026-08-06
- 상태: `[확정]`
- 사용자 승인: 2026-08-06 대화에서 source-only 인계안 승인
- 게시 대상: `origin/codex/m5-asset-handoff-docs`

## 목표

사용자가 채택한 Suno WAV 5종만 개발 저장소에 넣는다. 긴 생성 파일명은 ASCII 계약명으로 바꾸고, 개발자가 Codex로 후속 통합할 때 장면·트리거·기존 Web Audio 교체 지점을 바로 찾을 수 있게 문서화한다.

## 선택 범위

| 계약 파일명 | 효과 | 장면·트리거 |
|---|---|---|
| `sfx_transform_complete.wav` | 변신 완료 | `n5_transform` 주문 판정 성공 뒤 변신 결과가 표시되는 순간. 완전·표준·구제 공통, 결과 렌더당 1회 |
| `sfx_critical.wav` | 치명타 | `battle_wraith`에서 주문 결과 `delta >= 25`인 순간. 기존 `SfxPlayer.play("critical")` 파일 교체 후보 |
| `sfx_barrier.wav` | 방어막 신버전 | `p1_defend` 성공 결과에서 방어막이 펼쳐지는 순간. `Magical Shield Activation` 채택본 |
| `sfx_star_attack.wav` | 별빛 공격 | `p2_attack` 주문 성공 뒤 지팡이 휘두름과 별 투사체 발사 순간 |
| `sfx_juno_appear.wav` | 주노 등장 | `n2_juno_intro` 첫 진입에서 주노 스프라이트가 모니터 밖으로 나타나는 순간. 장면 진입당 1회 |

회색 침식, 방어막 구버전 `Magical Shield Deployment`, 일반 타격, 최종 빔 충전은 미반영한다. 이전에 선별한 시간정지 A와 주문 시작 B도 이번 게시 범위에는 포함하지 않는다.

## 파일 배치

원본 WAV의 바이트는 변경하지 않고 다음 경로로 이름만 정규화해 복사한다.

```text
assets/source/sfx/delivery/
  sfx_barrier.wav
  sfx_critical.wav
  sfx_juno_appear.wav
  sfx_star_attack.wav
  sfx_transform_complete.wav
```

`assets/runtime/`, `src/`, `public/scenario/`는 수정하지 않는다. 즉, 이 변경은 납품과 통합 계약만 제공하며 게임 재생 연결은 개발자 후속 작업이다.

## 문서 계약

- `docs/assets/provenance/SFX_HANDOFF.md`: 파일별 원본·SHA-256·규격·사용 시점·통합 주의사항을 소유한다.
- `docs/assets/ASSET_MANIFEST.md`: 5개 파일을 `ready`, runtime 미연결 상태로 기록한다.
- `docs/assets/SCENE_ASSET_MAPPING.md`: N2, N5, battle p1, p2, critical 결과의 SFX 사용처를 기록한다.
- `docs/assets/PROVENANCE.md`: Suno Pro 사용자 확인과 원본 해시를 기록한다.
- `docs/assets/AI_PRODUCTION_LOG.md`: 생성·사용자 선택·무후처리 상태를 기록한다.
- `docs/assets/provenance/SFX_PRODUCTION_EVIDENCE.md`: 채택 5종과 미반영 4종 결정을 유지한다.
- `docs/assets/README.md`: `assets/source/sfx/delivery/`와 인계 문서 링크를 추가한다.
- `docs/dev/DECISIONS.md`: 기존 코드 생성 SFX 방침보다 최신 사용자 결정을 우선한 source-only 예외를 기록한다.

## 개발 통합 경계

현재 `src/audio/sfx.ts`의 오실레이터 구현은 그대로 둔다. 후속 개발자는 다음을 별도 변경으로 수행한다.

1. 승인 파일만 `assets/runtime/sfx/`로 복사하거나 빌드 경로에 맞게 채택한다.
2. `SfxPlayer`에 파일 재생과 로드 실패 시 기존 Web Audio 폴백을 추가한다.
3. `n2_juno_intro`, `n5_transform`, `p1_defend`, `p2_attack`, battle 결과 이벤트에 1회성 트리거를 연결한다.
4. STT 청취 중 신규 SFX를 재생하지 않고, 중복 렌더·재시도에서 이중 재생을 막는다.

## 오류 처리

- 원본 또는 대상 파일이 이미 예상과 다르면 덮어쓰지 않고 중단한다.
- 복사 뒤 SHA-256이 원본과 다르면 커밋하지 않는다.
- WAV 로드 실패가 향후 런타임 진행을 막지 않도록 기존 오실레이터 또는 무음 폴백을 유지한다.
- 새 파일은 source-only이므로 현재 Pages 빌드 산출물에 포함하지 않는다.

## 검증

- 5개 WAV 각각 원본과 저장소 복사본의 SHA-256 일치
- WAV 48kHz, stereo, 16-bit PCM 규격 확인
- 미반영 파일이 Git 변경에 없는지 확인
- 문서의 계약 파일명·장면 ID·해시가 실제 파일과 일치하는지 검사
- `git diff --check`
- 저장소 규칙에 따라 `npm run check`, `npm test`, `npm run build`
- 커밋 뒤 대상 원격 브랜치가 해당 commit을 가리키는지 확인

## 게시 방식

현재 작업 브랜치는 `origin/codex/m5-asset-handoff-docs`보다 직선 이력으로 앞서 있다. force push 없이 `HEAD:codex/m5-asset-handoff-docs` fast-forward만 허용한다. PR과 `main` 변경은 범위 밖이다.

## 검토한 대안

- runtime 즉시 통합: 코드 충돌 위험과 사용자의 개발자 위임 지시에 어긋나 제외한다.
- 문서만 게시: 실제 WAV 전달이 빠져 개발자 재탐색 비용이 생기므로 제외한다.
- source-only 인계: 파일 보존, 코드 비간섭, 사용처 명시를 동시에 만족해 채택한다.
