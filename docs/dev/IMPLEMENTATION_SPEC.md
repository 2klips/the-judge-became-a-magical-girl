# 구현 계약

제품 시스템 의미는 [메인 기획서](../음성_미연시_기획서_v2_A안확정.md), 스토리·캐릭터 방향은 [완성대본 v2](../심사역은_마법소녀가_되었다_완성대본_v2.md), JSON 필드는 [별첨1](../별첨1_스토리_작가_가이드라인.md)이 단일 진실 공급원이다. 이 문서는 런타임 책임만 정의한다.

`[확정]`은 기준 문서의 직접 계약, `[제안]`은 구현을 위해 도출한 계약, `[미결정]`은 승인·실측 전 빈칸이다.

## 1. 불변식

- `[확정]` 상태는 검증된 판정 결과로만 바뀐다.
- `[확정]` LLM 델타와 플래그는 허용 범위·노드 화이트리스트로 제한한다.
- `[확정]` 입력·네트워크 실패는 진행 실패가 아니다. 클릭·로컬 경로로 끝까지 간다.
- `[확정]` 모든 대화·페이즈는 턴 상한으로 수렴한다.
- `[확정]` 전투에 패배·게임오버가 없다. 최종 결과는 S/A/B다.
- `[확정]` 시나리오와 외부 응답은 사용 전에 zod 검증한다.

## 1.1 최우선 1차 MVP — 주노 음성 자유대화

`[확정, DEC-023]` Asset 통합 전 첫 제품 검증 목표를 “마이크로 주노와 자유롭게 대화하는 Test 플레이 화면”으로 둔다. 새 마일스톤을 만들거나 M1→M6 순서를 바꾸지 않는다. M1→M3가 같은 vertical slice를 누적 완성하고, M3 종료를 MVP-1 게이트로 삼는다.

### 화면 계약

- 실제 이미지·BGM·SFX를 요구하지 않는다.
- CSS 단색·그라데이션 배경과 하단 미연시 대화창만 사용한다.
- 하단 이름표에 `주노`를 표시하고, 대화 본문·마이크 상태·실시간 transcript를 표시한다.
- Asset 경로를 임시 파일명으로 만들지 않는다. 누락 요청·404 없이 실행한다.

### 대화 계약

- 완성대본 v2의 N2와 §4~§6을 주노 persona 근거로 사용한다.
- 주노는 반말을 쓰고 한 응답을 최대 두 문장·80자 이내로 제한한다.
- 플레이어 표현을 받아치되 말하지 않은 감정을 단정하지 않는다.
- 밝고 자신만만한 기본 태도를 유지하되, 진지한 발화에는 농담으로 회피하지 않는다.
- 세계관을 한 번에 설명하지 않고 현재 질문에 필요한 내용만 답한다.
- 검은 마법소녀의 이름·정체를 공개하거나 확정하지 않는다.
- LLM 응답은 대화 판정 스키마, 허용 intent·flag, delta clamp를 통과한 뒤 렌더한다.

### 입력·실패 계약

- M1은 같은 화면을 클릭·고정 응답으로 실행한다.
- M2는 Web Speech 기반 PTT, `ko-KR`, interim transcript, 로컬 intent 판정을 연결해 UI·폴백·상태 경계를 검증한다. Web Speech transcript는 M3 이후 최종 권위가 아니다.
- M3는 버튼 release까지 녹음한 동일 WAV를 Cloudflare Workers의 OpenAI `gpt-transcribe` 또는 Gemini audio transcription 어댑터 하나에 보내고, 검증된 최종 transcript를 화면에 먼저 표시한 뒤 LLM 자유대화를 호출한다.
- `[확정, DEC-028]` MVP-1까지 GPT/Gemini STT를 개발·QA 설정으로 전환할 수 있어야 한다. 일반 플레이 한 턴에서 두 공급자를 동시에 호출하지 않는다. 로컬 Whisper는 게임 경로에 연결하지 않는다.
- 마이크 거부·STT 실패·LLM 지연·오프라인에서도 클릭·로컬 고정 응답으로 대화를 계속하고 테스트 종료 지점까지 도달한다.

### MVP-1 비범위

- 실제 캐릭터·배경 Asset, 표정 이미지, BGM, 파티클
- N0~N8 전체 본편, 변신, 전투, 엔딩 통합
- TTS, 모바일·Safari, GitHub Pages 배포

## 2. FSM

```text
TITLE → PROLOGUE → DIALOGUE ⇄ CUTSCENE → BATTLE → DIALOGUE → ENDING
```

| 상태 | 진입 계약 | 종료 계약 |
|---|---|---|
| `TITLE` | 설정·시나리오 로드 성공, 새 게임/복구 선택 준비 | 사용자 동작 후 `PROLOGUE` 또는 저장된 노드 |
| `PROLOGUE` | 고정 연출 표시 | 시작 노드로 이동 |
| `DIALOGUE` | 노드·캐릭터 검증, opening 렌더 | intent의 `next`, 턴 상한 분기, 전역 턴 상한 중 하나 |
| `CUTSCENE` | 고정 lines 순차 렌더 | 주문 게이트가 있으면 처리 후, 없으면 바로 `next` |
| `BATTLE` | `playerForm === "magical"`, 전투 상태 생성 | 3페이즈 종료 후 등급 반영, `next` |
| `ENDING` | 엔딩 lines와 등급 변형 렌더 | 완료 상태. 새 게임 외 자동 이동 없음 |

노드 `type`이 런타임 FSM 상태를 결정한다. `[제안]` 잘못된 전이는 사용자에게 한국어 진단 화면을 보여주고 실행을 중단하되, 원본 JSON을 자동 수정하지 않는다.

## 3. 런타임 상태

```ts
type Emotion = "neutral" | "happy" | "shy" | "upset" | "surprised";
type InputMode = "voice" | "click";
type PlayerForm = "normal" | "magical";
type BattleGrade = "S" | "A" | "B" | null;

interface GameState {
  affinity: number;              // 0..100, initial 50
  npcEmotion: Emotion;
  flags: Set<string>;
  playerForm: PlayerForm;
  battleGrade: BattleGrade;
  nodeTurn: number;
  totalTurn: number;
  currentNodeId: string;
  history: string[];
  inputMode: InputMode;
  sttFailCount: number;
  llmFailCount: number;
}

interface BattleState {
  momentum: number;              // 20..100
  phaseIndex: number;
  phaseTurn: number;
  enemyState: "normal" | "weakened";
}
```

- `GameState`는 실행 중 단일 인스턴스다.
- `BattleState`는 battle 진입 때 만들고 종료 때 `battleGrade`와 등급 플래그로 환산 후 폐기한다.
- 완전 변신 여부는 `flags.has("perfect_transform")`로 판정해 초기 momentum 60, 나머지는 50으로 둔다.
- `[제안, DEC-014]` 스냅샷에는 `schemaVersion`을 넣고 `Set`은 `string[]`로 직렬화한다. 런타임 필드를 제품 상태에 추가하지 않는다.

## 4. 노드 실행 계약

### Dialogue

한 턴의 고정 순서:

```text
PTT release → 선택된 STT 전사 → 최종 transcript 선표시 → 정규화
→ 로컬 intent 판정 → 미매칭이면 LLM 판정
→ 판정 검증/클램프 → 응답 연출 → 상태 적용 → 턴 증가 → 분기 평가
```

- `[확정, DEC-050]` 게임 내 PTT는 포인터·포커스된 Space/Enter와 전역 `T` 홀드/릴리스를 지원한다. 입력·선택 컨트롤 편집 중에는 전역 `T`를 가로채지 않는다.
- `[확정, DEC-050]` 대사·판정 응답·엔딩의 다음 페이지 진행 버튼은 화면 렌더 후 2초 동안 비활성화하고, 준비 뒤 한 번만 진행한다.

`[확정, DEC-051]` 공개 QA와 production 게임은 OpenAI `gpt-transcribe`로 고정한다. 공급자 ID를 `GameState`나 시나리오 JSON에 저장하지 않는다. Gemini STT 전환·동시 비교는 격리된 로컬 비교 Lab에서만 허용하고 production Worker route와 게임 UI에는 노출하지 않는다. `[확정, DEC-052]` 공개 QA 대화·전투 LLM은 OpenAI Responses API `gpt-5.6-luna`, `reasoning.effort: low`를 사용한다. 로컬 M3 회귀 기본값과 M6 production LLM 결정은 별도다.

분기 우선순위:

1. 매칭 intent에 `next`가 있으면 즉시 이동.
2. `nodeTurn >= maxTurns`면 `exitOnMaxTurns`를 위에서부터 평가.
3. 그 외 같은 노드에서 다음 입력 대기.

`totalTurn` 전역 상한에 닿으면 메인 기획서 §7의 최종 분기 점프로 수렴한다. 실제 점프 대상은 `config.json` 계약 확정 전까지 `[미결정, DEC-013]`이다.

`local.ts`는 텍스트 정규화와 intent 후보 계산만 담당한다. `[제안, DEC-012]` 키워드 점수가 유일하게 가장 높은 intent를 로컬 매칭하고, 동점·0점은 LLM으로 넘긴다. 로컬 전용 상태의 동점 처리 규칙은 승인 전 구현하지 않는다.

### Cutscene와 변신

- `lines`를 순서대로 보여준다.
- `incantationGate`가 없으면 `next`로 이동한다.
- 게이트가 있으면 전문 표시 → PTT 낭독 → NFC/공백/문장부호 정규화 → 키워드 부분 포함 채점.
- 전 키워드: `perfect_transform`, 강화 연출, 전투 초기 momentum 60.
- `minMatch` 이상: 표준 연출, momentum 50.
- 최대 시도 미달: `failLines`로 자동 구제, 페널티 없이 momentum 50.
- 클릭 모드·마이크 불능: “주문 외우기”로 표준 결과.
- `[확정, DEC-016·040]` 주문 결과 적용 뒤 엔진이 `transform.cast` → `transform.complete`와 `bgm_transform`을 고정 재생한다. 현 `cutscene` JSON 스키마를 유지하고, 컷 누락·불량이면 검은 presentation, BGM 누락·불량이면 무음으로 진행한다.

### Battle

- 정확히 3페이즈. 페이즈별 데이터 계약은 별첨1 §4.3을 따른다.
- spell: 전체 키워드 `+25`, `minMatch` 이상 `+15`, 미달 `0`.
- freeform: Workers 응답을 검증해 `-5..+10`으로 클램프.
- guard: 로컬 판정, `+3`, 실패 없음.
- momentum은 `20..100`; `>=65`면 `enemyState = "weakened"`.
- 임계 도달 즉시 또는 페이즈 턴 상한에서 다음 페이즈. 전체 최대 9턴.
- 최종 momentum `>=80`: S, `>=55`: A, 나머지 B.
- 등급 반영은 원자적으로 처리: `battleGrade`, 해당 `battle_*` 하나만 설정, 호감도 `+10/+5/0`, battle 상태 폐기, 다음 노드 저장.

### Ending

- 챕터3 최종 분기가 ending 노드를 선택한다.
- 기본 lines 뒤 해당 등급의 `gradeVariants`가 있으면 추가한다.
- `[확정, DEC-039]` GOOD/NORMAL/BAD는 문장별 `계속` 페이지로 표시한다. GOOD line 0~4/5/6+에서 회복 책상→밝은 복도→검은빛 복도로 전환하고 마지막 페이지에만 재시작을 노출한다.
- GOOD/NORMAL/BAD는 MVP 필수. HIDDEN은 목표 범위지만 MVP 컷 1순위다.

## 5. 판정 포트 `[제안]`

```ts
interface DialogueJudgement {
  reply: string;
  intent: string | "freeform";
  affinityDelta: number;
  emotion: Emotion;
  flags: string[];
}

interface BattleJudgement {
  reply: string;
  intent: "persuade" | "taunt" | "encourage" | "other";
  momentumDelta: number;
  narration?: string;
}

interface SpeechPort {
  isSupported(): boolean;
  listen(onInterim: (text: string) => void): Promise<string>;
  cancel(): void;
}

type SttProviderId = "openai" | "gemini";

interface PttRecordingPort {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  cancel(): void;
}

interface TranscriptionPort {
  readonly provider: SttProviderId;
  transcribe(audio: Blob, signal: AbortSignal): Promise<string>;
}

interface LlmPort {
  judgeDialogue(input: unknown, signal: AbortSignal): Promise<DialogueJudgement>;
  judgeBattle(input: unknown, signal: AbortSignal): Promise<BattleJudgement>;
}

interface SaveRepository {
  load(): unknown | null;
  save(snapshot: unknown): void;
  clear(): void;
}
```

구체 JSON 노드 타입은 별첨1을 옮겨 적지 않고 zod 스키마에서 `z.infer`로 만든다. UI는 `GameView`, 데이터는 `ScenarioRepository` 포트 뒤에 둔다.

## 6. 실패 사다리

| 실패 | 즉시 처리 | 누적 처리 |
|---|---|---|
| 같은 턴 STT 1회 실패 | 재시도 안내 | 없음 |
| 같은 턴 STT 2회 실패 | 해당 턴 클릭 선택지 | 전역 실패 수 증가 |
| STT 누적 5회 | `inputMode = "click"` | 사용자가 지원 환경에서 음성 복귀 가능 |
| LLM 타임아웃/오류 | 4초 후 1회 재시도 | 실패 카운트 증가 |
| 재시도도 실패 | `fallbackReplies` + 중립 판정 | 3연속이면 로컬 모드 |
| 마이크 미지원/권한 거부 | 클릭 모드 | 설정 변경 후 명시적 재시도만 |
| Worker가 HTML·비 JSON 응답 반환 | 서비스별 한국어 연결 오류 | 원문 HTML·`Unexpected token '<'` 미노출, 기존 클릭·로컬 폴백 |
| 시나리오 검증 실패 | 진단 화면, 게임 시작 차단 | 자동 수정 없음 |
| 저장 데이터 검증 실패 | 손상 스냅샷 무시, 새 게임 제공 | 원인 로그 |

LLM 로컬 모드는 런타임 어댑터 상태다. 제품 `GameState`에 새 필드를 추가할지는 `[미결정]`이다.

## 7. 저장·복구

- `[확정]` 노드 이동마다 스냅샷을 저장한다. `[제안]` 상태 적용 후 대상 노드 렌더 전에 수행한다.
- 저장 대상: `GameState`와 진행 복구에 필요한 최소 메타데이터. `BattleState` 중간 저장은 `[미결정, DEC-014]`.
- `[제안]` 복구 시 스키마·범위·`currentNodeId` 존재를 검증한다.
- `[제안]` 버전 불일치·손상은 예외를 노출하지 않고 새 게임/저장 초기화 선택을 보여준다.
- 저장은 편의 기능이 아닌 새로고침 복구 전용이다. 세이브 슬롯 UI는 MVP 컷 범위다.

## 8. 모듈 책임과 의존 방향 `[제안]`

| 모듈 | 책임 | 의존 금지 |
|---|---|---|
| `main.ts` | 조립·부트스트랩 | 도메인 규칙 직접 구현 |
| `fsm.ts` | 장면 전이 | DOM·네트워크 |
| `state.ts` | 상태 생성·클램프·스냅샷 변환 | UI·Speech API |
| `engine/nodeRunner.ts` | 공통 노드 실행 오케스트레이션 | 외부 API 직접 호출 |
| `engine/branch.ts` | 허용 조건 문법 평가 | `eval`, DOM |
| `battle/*` | 페이즈·momentum·등급 | 시나리오 로드·DOM |
| `input/*` | STT/클릭 어댑터 | 상태 직접 변경 |
| `judge/*` | 정규화·로컬·LLM 검증 | 화면 렌더 |
| `ui/*` | 렌더·사용자 이벤트 전달 | 상태 규칙 |
| `audio/*` | BGM/SFX 재생 | 분기 규칙 |
| `data/loader.ts` | fetch, zod, 참조 무결성 | 자동 JSON 수정 |
| `worker/` | Origin 검증, GPT/Gemini STT 라우팅, OpenAI/Gemini LLM 어댑터, 요청·응답 제한 | 게임 상태·시나리오 소유 |

```text
main(composition root)
  → engine/battle orchestration
    → pure domain(state, branch, local judge, grade)
    → ports
      ← adapters(UI, STT, LLM HTTP, storage, audio, data loader)
```

도메인 모듈은 브라우저 전역 없이 단위 테스트 가능해야 한다. 상위 오케스트레이터가 포트를 주입한다.

## 9. 자산 해석

- 시나리오의 `scene.bg`, `scene.bgm`은 확장자 없는 논리 ID다.
- 장면별 배경·표시 인물·표정·음악·컷 사용처는 [SCENE_ASSET_MAPPING.md](../assets/SCENE_ASSET_MAPPING.md)를 따른다. [ASSET_MANIFEST.md](../assets/ASSET_MANIFEST.md)는 파일명과 제작·QA 상태만 소유한다.
- `[제안]` 에셋 매니페스트가 논리 ID를 실제 파일명과 연결한다.
- `[제안]` 확장자·폴더 결합은 중앙 resolver 한 곳에서 수행한다.
- `[확정, DEC-019·040]` `bg_hall_dark`는 정확한 물리 파일을 우선하고, 로드 실패 시 `bg_hall_day.webp` 기반 CSS 파생, 이후 검은 presentation 순으로 강등한다.
- `[확정, DEC-034]` resolver는 실패한 논리 ID·기대 경로를 진단한다. 외부 원본은 자동 이동·변환·rename하지 않고, 채택 파일의 runtime 복사본만 계약명으로 정규화하며 원본명→계약명을 기록한다.
- `[확정, DEC-036·039]` node line, 변신 stage, battle phase/p3 spell, ending line의 세부 배경은 scenario 스키마를 늘리지 않고 presentation 고정 cue resolver가 해석한다.
- `[확정]` 타이틀은 마이크 연결·입력 장치 선택·실시간 dBFS 테스트를 통과해야 새 게임/이어하기를 허용한다. 시작 뒤 STT 실패는 기존 클릭·로컬 폴백으로 완주한다.
- `[확정]` battle의 `spell` 입력만 보정된 dBFS 범위를 검사한다. 너무 작거나 큰 첫 실패는 턴을 보존하고, 같은 턴 두 번째 실패는 `failed-spell` `+0`으로 턴을 소비한다. `freeform`에는 음량 게이트를 적용하지 않는다.
- `[확정]` 동일 배경 논리 ID는 재렌더만 하고 애니메이션하지 않는다. 논리 ID 변경에만 420ms crossfade를 적용한다.
- `[확정, DEC-038]` `?debug=1&scene=<장면ID>`는 저장·FSM과 격리된 장면 프리뷰다. 정상 URL에는 선택기·프리뷰가 없다.
- `[확정, DEC-053]` 본편 대화 UI는 화자별 색과 화면 방향을 갖는 하단 미연시 프레임이다. 주노·회색 망령은 좌측, 도윤은 우측, 익명 voice·내레이션은 중앙이며 내레이션 이름표는 렌더하지 않는다. 진행 버튼은 문구를 바꾸지 않고 렌더 후 2초 동안 disabled다. 상단에는 `?debug=1` 장면 선택기 외 상태·QA 표식을 렌더하지 않는다.
- `[제안]` 누락 에셋은 로더 진단에 포함하되 M1~M4 더미 placeholder 허용 여부는 마일스톤 계약을 따른다.
