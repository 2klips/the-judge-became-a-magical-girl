# Playtest Systemic Polish Execution Index

> 2026-08-14 승인으로 기존 Wave 2 TITLE 계획과 음성 실패 후속 작업의 active routing을 교체한다. 2026-08-13 설계의 서사·변신·전투·엔딩 묶음은 폐기하지 않지만, 아래 Phase A~E를 먼저 완료·검토하기 전 실행하지 않는다.

## 승인 근거와 SSOT

- 제품 결정: `docs/dev/DECISIONS.md` DEC-071, DEC-072, DEC-073
- 런타임 계약: `docs/dev/IMPLEMENTATION_SPEC.md`
- 완료 gate: `docs/dev/MILESTONES.md` M5
- 수동 QA: `docs/dev/QA_AND_DEMO.md`
- Phase A: [2026-08-14-voice-failure-threshold.md](2026-08-14-voice-failure-threshold.md)
- Phase B: [2026-08-14-ptt-live-meter.md](2026-08-14-ptt-live-meter.md)
- Phase C/D/E: [2026-08-14-pc-title-ui-ux.md](2026-08-14-pc-title-ui-ux.md)
- 과거 계획: [2026-08-13-ui-foundation.md](2026-08-13-ui-foundation.md). Task 4와 TITLE acceptance는 교체됐고 Task 1~3·5~6은 별도 rebase 승인까지 deferred다. 새 TITLE plan이 필요한 font/CSS 조각을 독립 재정의한다.

## 작업 브랜치·worktree 전략

Phase 0 문서 전용 rollback commit만 현재 `codex/p0-required-image-assets`에 남긴다. review fix는 별도 docs-only follow-up commit으로 허용하되, 현재 branch의 feature code는 0으로 유지한다. 문서안 승인 뒤 아래를 순서대로 만들며, 각 다음 branch는 이전 Phase의 사용자 승인 commit을 base로 한다. 이 serial stack은 공유 파일 `src/main.ts`, `src/ui/gameView.ts`, CSS의 cherry-pick 충돌을 줄이면서 각 commit을 독립적으로 rollback할 수 있게 한다.

| 단계 | branch | worktree | base | commit 경계 |
|---|---|---|---|---|
| Phase 0 | `codex/p0-required-image-assets` | `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\project-takeover-baseline` | `3317eb1efee557163bc62da63117cc6d42de4072` | 문서 전용 rollback commits; review fix 별도 follow-up 허용; feature code 0 |
| Phase A | `codex/voice-five-failure-policy` | `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\voice-five-failure-policy` | 승인된 Phase 0 tip | A 테스트·구현 1 rollback commit, 검증 사실 문서 follow-up commit 허용 |
| Phase B | `codex/ptt-live-meter` | `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\ptt-live-meter` | 승인된 Phase A tip | B 테스트·구현 1 rollback commit, browser QA 사실 문서 follow-up commit 허용 |
| Phase C~E | `codex/pc-title-ui-ux` | `F:\codex\NHN_HACKTON\worktrees\the-judge-became-a-magical-girl\pc-title-ui-ux` | 승인된 Phase B tip | C visual, D interaction, E QA/docs를 각각 commit |

worktree/branch는 각 선행 Phase 승인 뒤에만 생성한다. 원격 push, main merge, 기존 branch 변경, reset, revert, amend는 별도 사용자 승인 전 금지한다. 각 worktree 생성 전 `git status --short`, branch, HEAD, `git worktree list`와 기준 commit 관계를 다시 확인한다.

## 실행 순서

### Phase 0 — 계약·계획 교체

1. DEC-046 필수 마이크 gate, DEC-067 Settings rejected, DEC-070 실패한 턴 누적, DEC-055 버튼 상태 제한을 DEC-071~073으로 명시적으로 supersede한다.
2. 메인 기획·구현 계약·M5 완료 gate·QA·asset mapping의 current contract를 맞춘다. 역사적 완료 근거는 구현 완료로 다시 쓰지 않는다.
3. A/B/TITLE 상세 TDD 계획과 worktree 경계를 작성한다.
4. `git diff --check`, 링크·stale current fact·placeholder scan, allowlist와 clean status를 확인하고 docs-only commit을 만든다.
5. 사용자 문서 검토 승인을 받는다. 승인 전 기능 코드를 시작하지 않는다.

### Phase A — 실제 음성 입력 실패 총 5회

- [Phase A 계획](2026-08-14-voice-failure-threshold.md)의 RED→GREEN→전체 검증을 실행한다.
- 7종 typed 실제 시도 실패마다 총계를 먼저 +1하고 다섯 번째가 same-turn retry보다 우선한다.
- transient attempt와 persisted total의 reset/save 경계를 분리하며 새 GameState 필드를 만들지 않는다.
- A만 독립 commit하고 검토 승인 뒤 Phase B base로 사용한다.

### Phase B — PTT 버튼 내부 live meter

- [Phase B 계획](2026-08-14-ptt-live-meter.md)의 RED→GREEN→browser QA를 실행한다.
- 기존 recording stream과 analyser만 공유하고 두 번째 `getUserMedia`를 금지한다.
- dialogue·incantation·battle PTT, pointer·T·Space·Enter, release/cancel/error cleanup을 검증한다.
- B만 독립 commit하고 검토 승인 뒤 TITLE base로 사용한다.

### Phase C — PC TITLE Visual Skeleton

- `titleView.ts`, `title.css`, local fonts, 왼쪽 gradient, title/menu, hover/focus/active, 접근 가능한 Continue, compact BGM HUD를 구현한다.
- 1920×1080, 1600×900, 1366×768 no-scroll과 NHN banner 노출을 먼저 닫는다.
- C만 독립 commit한다.

### Phase D — PC TITLE Interaction

- `titleMicState.ts`, 아홉 상태 FSM, 지속 TEST_SUCCESS, Settings focus/ESC, voice/click start와 resume, first-gesture `bgm_daily`를 기존 controller·save·mic abstraction에 연결한다.
- TITLE/Settings는 한 `BrowserMicrophoneTester`를 공유하고 GameState schema를 늘리지 않는다.
- D만 독립 commit한다.

### Phase E — Final QA·문서

- `npm run check`, `npm test`, `npm run build`, 기존 QA build를 실행한다.
- 세 viewport, mouse, keyboard, save/no-save, mic ready/denied/no-device/unsupported/error, voice/click start, voice-save click resume, BGM persistence, no-scroll을 실제 browser에서 검증한다.
- 구현 결과만 `IMPLEMENTATION_LOG.md`, 초보자 설명만 `LEARNING_LOG.md`에 기록한다. DEC/MILESTONES는 새 결정·gate 변경이 추가되지 않으면 다시 쓰지 않는다.
- E 증거·문서만 독립 commit하고 `git diff`, `git status`를 확인한다.

## 역할 분리와 검토 gate

- 구현 담당은 한 Phase의 plan·tests·production files만 수정한다.
- 검토 담당은 동일 구현을 작성하지 않고 spec 준수와 code quality를 순서대로 검토한다.
- 각 Phase는 RED 증거, targeted PASS, 전체 3명령, browser 증거, diff/status를 남긴 뒤에만 다음 Phase로 간다.
- 예상 밖 파일·dirty 상태·공유 파일 충돌이 보이면 작업을 멈추고 범위를 보고한다.

## 비용·시간 절감

- A/B/TITLE을 serial stacked worktree로 분리해 rollback 지점은 보존하고 공유 파일 conflict는 줄인다.
- 순수 정책과 기존 stream/controller/save abstraction을 재사용해 장면별 중복 구현·두 번째 mic stream·새 state schema를 피한다.
- TITLE 시각 skeleton을 interaction보다 먼저 닫아 1600×900 overflow 같은 레이아웃 실패를 비싼 상태 통합 전에 발견한다.
- 전체 회귀는 Phase별 targeted 검증 뒤 실행하고, 최종 browser matrix는 Phase E에서 한 번 체계적으로 수집한다.
