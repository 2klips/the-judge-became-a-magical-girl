import type {
  BattleNode,
  BattlePhase,
  Character,
  CutsceneNode,
  DialogueNode,
  Emotion,
  EndingNode,
} from "../data/schema";
import {
  assetUrl,
  isAssetPathUnavailable,
  reportAssetLoadFailure,
  resolveBackgroundAsset,
  resolveCharacterAsset,
  resolveImageAsset,
  resolveImageAssetFallback,
} from "../assets/catalog";
import { resolvePresentationBackground } from "../assets/presentationBackground";
import { resolveDoyunVisual } from "../assets/presentationDoyun";
import type { BattleGrade, BattleState } from "../battle/state";
import {
  M5_SCENE_PREVIEWS,
  type DevScenePreview,
} from "../dev/scenePreview";
import { ClickInputPort } from "../input/click";
import {
  MicrophoneCalibrationAccumulator,
  resolveMicrophoneMeterPresentation,
  type AudioLevelMetrics,
  type MicrophoneCalibration,
} from "../input/audioLevel";
import type {
  MicrophoneConnection,
  MicrophoneInputDevice,
} from "../input/microphoneSetup";
import type {
  OpenAiSttModel,
  RecordedVoiceResult,
  TranscriptionObservation,
  VoiceInputFailure,
} from "../input/transcription";
import {
  classifyVoiceInputError,
  OpenAiSttModelSchema,
} from "../input/transcription";
import {
  PushToTalkShortcutController,
  type PushToTalkShortcutBinding,
} from "../input/keyboardPtt";
import type { GameState, InputMode } from "../state";
import { DIALOGUE_ADVANCE_DELAY_MS, DelayedActionGate } from "./advanceGate";
import { applySceneEffect } from "./effects";
import { createGauge } from "./gauge";
import { mountParticleBurst } from "./particles";
import { enterGameFromTitle } from "./titleStart";

export const VOICE_TITLE_SUBTITLE =
  "마이크를 누른 채 말하고 놓아, 정체불명의 목소리와 호흡을 맞춰 보자.";

export interface DialogueIdentity {
  speaker: string;
  brand: string;
}

export interface DialoguePresentation {
  readonly side: "left" | "right" | "center";
  readonly tone: "juno" | "doyun" | "wraith" | "voice" | "narration";
  readonly showName: boolean;
}

export function resolveDialoguePresentation(speakerId: string): DialoguePresentation {
  switch (speakerId) {
    case "juno":
      return { side: "center", tone: "juno", showName: true };
    case "doyun":
      return { side: "center", tone: "doyun", showName: true };
    case "gray_wraith":
      return { side: "center", tone: "wraith", showName: true };
    case "narration":
      return { side: "center", tone: "narration", showName: false };
    default:
      return { side: "center", tone: "voice", showName: true };
  }
}

export type SpriteSlot = "doyun" | "juno" | "gray_wraith";

export function resolveSpriteSlot(logicalId: string): SpriteSlot | null {
  if (logicalId.startsWith("doyun.")) return "doyun";
  if (logicalId.startsWith("juno.")) return "juno";
  if (logicalId.startsWith("gray_wraith.")) return "gray_wraith";
  return null;
}

export const TYPEWRITER_BASE_DELAY_MS = 24;

export function typewriterDelayFor(character: string): number {
  if (/[.!?。！？…]/u.test(character)) return 92;
  if (/[,，]/u.test(character)) return 48;
  return TYPEWRITER_BASE_DELAY_MS;
}

export function formatDialogueText(text: string, speakerId: string): string {
  if (speakerId !== "narration") return text;
  const normalized = text.trim();
  return normalized.startsWith("(") && normalized.endsWith(")")
    ? normalized
    : `(${normalized})`;
}

export function resolveSttModelControlVisibility(
  debugEnabled: boolean,
): "hidden" | "select" {
  return debugEnabled ? "select" : "hidden";
}

export interface VoiceInputPresentation {
  readonly buttonLabel: "누르고 말하기 (T)";
  readonly showInstruction: false;
  readonly showStatusRegion: false;
}

export const VOICE_PROCESSING_LABEL = "목소리 전달 중…";

export function resolveVoiceInputPresentation(): VoiceInputPresentation {
  return {
    buttonLabel: "누르고 말하기 (T)",
    showInstruction: false,
    showStatusRegion: false,
  };
}

const BATTLE_PHASE_IDS = ["p1_defend", "p2_attack", "p3_answer"] as const;

export interface BattleStagePresentation {
  readonly phaseIndex: number;
  readonly phaseTotal: 3;
  readonly doyunLogicalId: string;
  readonly junoEmotion: Emotion;
}

export function resolveBattleStagePresentation(
  phaseId: string,
): BattleStagePresentation {
  const phaseIndex = Math.max(0, BATTLE_PHASE_IDS.indexOf(phaseId as (typeof BATTLE_PHASE_IDS)[number]));
  return {
    phaseIndex,
    phaseTotal: 3,
    doyunLogicalId:
      resolveDoyunVisual({ kind: "battle", phaseId }) ?? "doyun.magical_finish",
    junoEmotion: phaseIndex === 1 ? "happy" : "neutral",
  };
}

export type BattlePresentationAction =
  | "spell"
  | "failed-spell"
  | "guard"
  | "freeform"
  | "debug";

export interface BattleActionPresentation {
  readonly className: string;
  readonly doyunLogicalId: string;
  readonly particles: boolean;
  readonly guardBarrier: boolean;
  readonly wraithTransition: "none" | "weaken" | "recover";
  readonly phaseCallout: string | null;
  readonly gradeLabel: string | null;
}

export function resolveBattleActionPresentation(options: {
  readonly phaseId: string;
  readonly action: BattlePresentationAction;
  readonly delta: number;
  readonly previousEnemyState: BattleState["enemyState"];
  readonly enemyState: BattleState["enemyState"];
  readonly phaseChanged: boolean;
  readonly completed: boolean;
  readonly grade: BattleGrade | null;
}): BattleActionPresentation {
  const phase = resolveBattleStagePresentation(options.phaseId);
  const success = options.delta > 0;
  const spellSuccess = options.action === "spell" && options.delta >= 15;
  const className =
    options.action === "guard"
      ? "battle-action-guard"
      : options.action === "failed-spell" || (options.action === "spell" && !success)
        ? "battle-action-failed"
        : spellSuccess
          ? "battle-action-spell-success"
          : options.action === "freeform" && success
            ? "battle-action-freeform-success"
            : options.action === "freeform"
              ? "battle-action-freeform-failed"
              : "battle-action-debug";
  const wraithTransition =
    options.previousEnemyState === options.enemyState
      ? "none"
      : options.enemyState === "weakened"
        ? "weaken"
        : "recover";
  const phaseCallout = options.phaseChanged
    ? options.phaseId === "p1_defend"
      ? "좋아! 중심을 정확히 노려!"
      : options.phaseId === "p2_attack"
        ? "……도윤. 이번에는 네 대답을 듣고 싶어."
        : null
    : null;
  const gradeLabel = options.completed
    ? options.grade === "S"
      ? "완전한 언령"
      : options.grade === "A"
        ? "빛을 되찾은 언령"
        : "끝까지 닿은 목소리"
    : null;
  return {
    className,
    doyunLogicalId:
      options.action === "guard" ? "doyun.magical_defend" : phase.doyunLogicalId,
    particles: spellSuccess || options.completed,
    guardBarrier: options.action === "guard",
    wraithTransition,
    phaseCallout,
    gradeLabel,
  };
}

export interface MissingAssetPresentation {
  readonly className: "asset-black-placeholder";
  readonly ariaLabel: string;
  readonly preservesInteractiveUi: true;
}

export function resolveMissingAssetPresentation(
  label: string,
): MissingAssetPresentation {
  return {
    className: "asset-black-placeholder",
    ariaLabel: `${label} 에셋 준비 중`,
    preservesInteractiveUi: true,
  };
}

export function resolveSceneBrand(nodeId: string): string {
  return nodeId === "n0_review" || nodeId === "n1_first_voice"
    ? "VOICE // LINK"
    : "JUNO // LINK";
}

export function resolveDialogueIdentity(
  nodeId: string,
  characterName: string,
): DialogueIdentity {
  return nodeId === "n1_first_voice"
    ? { speaker: "정체불명의 목소리", brand: resolveSceneBrand(nodeId) }
    : { speaker: characterName, brand: resolveSceneBrand(nodeId) };
}

export type BackgroundTransition = "initial" | "same" | "change";

export function resolveBackgroundTransition(
  previousBackgroundId: string | null,
  nextBackgroundId: string,
): BackgroundTransition {
  if (previousBackgroundId === null) return "initial";
  return previousBackgroundId === nextBackgroundId ? "same" : "change";
}

export function isActBoundaryTransition(
  previousContext: string | null,
  nextContext: string,
): boolean {
  return (
    (previousContext === "title" && nextContext === "n0_review") ||
    (previousContext === "n5_transform_result" && nextContext === "battle_wraith") ||
    (previousContext === "battle_wraith" && nextContext === "ch3_gray_answer") ||
    (previousContext === "ch3_gray_answer" && nextContext.startsWith("ending_"))
  );
}

export function resolveEndingLines(
  node: EndingNode,
  battleGrade: GameState["battleGrade"],
): EndingNode["lines"] {
  if (!battleGrade) return node.lines;
  const variant = node.gradeVariants?.[battleGrade];
  return variant ? [...node.lines, ...variant] : node.lines;
}

export interface EndingPage {
  readonly line: EndingNode["lines"][number];
  readonly lineIndex: number;
  readonly total: number;
  readonly sceneId: string;
  readonly isLast: boolean;
}

export function resolveEndingPages(
  node: EndingNode,
  battleGrade: GameState["battleGrade"],
): readonly EndingPage[] {
  const lines = resolveEndingLines(node, battleGrade);
  return lines.map((line, lineIndex) => ({
    line,
    lineIndex,
    total: lines.length,
    sceneId: resolvePresentationBackground({
      kind: "ending",
      endingId: node.endingId,
      baseBackground: node.scene.bg,
      lineIndex,
    }),
    isLast: lineIndex === lines.length - 1,
  }));
}

export interface EndingVisual {
  readonly characterId: "juno";
  readonly emotion: Emotion;
}

export interface IncantationCompanionVisual {
  readonly characterId: "juno";
  readonly emotion: Emotion;
}

export function resolveIncantationCompanionVisual(
  state: Pick<GameState, "npcEmotion">,
): IncantationCompanionVisual {
  return { characterId: "juno", emotion: state.npcEmotion };
}

export function resolveEndingVisual(
  endingId: string,
  lineIndex: number,
): EndingVisual | null {
  if (endingId === "good") {
    if (lineIndex >= 6) return null;
    return {
      characterId: "juno",
      emotion: lineIndex === 5 ? "surprised" : "happy",
    };
  }
  if (endingId === "normal") {
    return { characterId: "juno", emotion: "neutral" };
  }
  if (endingId === "bad") {
    return { characterId: "juno", emotion: "upset" };
  }
  return null;
}

interface TitleOptions {
  hasSave: boolean;
  warning: string | null;
  microphoneSupported: boolean;
  connectMicrophone(
    deviceId: string | undefined,
    onLevel: (metrics: AudioLevelMetrics) => void,
  ): Promise<MicrophoneConnection>;
  disconnectMicrophone(): Promise<void>;
  onNewGame: (calibration: MicrophoneCalibration) => void;
  onResume: (calibration: MicrophoneCalibration) => void;
}

export interface DialogueInputOptions {
  speechSupported: boolean;
  notice?: string;
  forceClickForTurn?: boolean;
  startCapture(): Promise<void>;
  finishCapture(): Promise<RecordedVoiceResult>;
  cancel(): void;
  onTranscript(
    transcript: string,
    observation?: TranscriptionObservation,
  ): Promise<boolean>;
  onTurnFailed(failure: VoiceInputFailure): void;
  onUnavailable(failure: VoiceInputFailure): void;
  onModeChange(inputMode: InputMode): void;
}

interface LineViewOptions {
  nodeId: string;
  sceneId: string;
  lineIndex: number;
  speaker: string;
  speakerId?: string;
  emotion?: Emotion;
  text: string;
  continueLabel: string;
  state: GameState;
  onContinue: () => void;
}

interface SharedVoiceOptions {
  speechSupported: boolean;
  notice?: string;
  forceClickForTurn?: boolean;
  startCapture(): Promise<void>;
  finishCapture(): Promise<RecordedVoiceResult>;
  cancel(): void;
  onTurnFailed(failure: VoiceInputFailure): void;
  onUnavailable(failure: VoiceInputFailure): void;
  onModeChange(inputMode: InputMode): void;
}

export function resolveVoiceControlContract(
  surface: "dialogue" | "incantation" | "battle",
  inputMode: InputMode,
  speechSupported: boolean,
  forceClickForTurn: boolean,
): {
  readonly surface: "dialogue" | "incantation" | "battle";
  readonly showVoiceCapture: boolean;
  readonly showClickActions: boolean;
  readonly showVoiceModeSwitch: boolean;
} {
  const showVoiceCapture = inputMode === "voice" && speechSupported && !forceClickForTurn;
  return {
    surface,
    showVoiceCapture,
    showClickActions: !showVoiceCapture,
    showVoiceModeSwitch: !showVoiceCapture && speechSupported && !forceClickForTurn,
  };
}

interface DebugSttOptions {
  readonly model: OpenAiSttModel;
  readonly onModelChange: (model: OpenAiSttModel) => void;
}

interface AudioControlOptions {
  readonly getVolume: () => number;
  readonly isMuted: () => boolean;
  readonly onVolumeChange: (volume: number) => void;
  readonly onMutedChange: (muted: boolean) => void;
}

export interface IncantationInputOptions extends SharedVoiceOptions {
  attempt: number;
  onTranscript(
    transcript: string,
    observation?: TranscriptionObservation,
  ): Promise<void>;
  onFallback(): void;
}

export interface BattleInputOptions extends SharedVoiceOptions {
  onTranscript(
    action: "spell" | "freeform",
    transcript: string,
    audioLevel?: AudioLevelMetrics,
    observation?: TranscriptionObservation,
  ): Promise<void>;
  onClickSpell(): void;
  onClickResponse(text: string, momentumDelta: number): void;
  onGuard(): void;
  onDebugMomentum(momentum: number): void;
  onDebugGrade(grade: BattleGrade): void;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

export function resetMicrophoneMeterPresentation(
  meter: Pick<HTMLElement, "style" | "dataset" | "setAttribute">,
  dbOutput: Pick<HTMLOutputElement, "textContent">,
): void {
  meter.style.setProperty("--microphone-level", "0%");
  meter.dataset.tone = "quiet";
  meter.setAttribute("aria-valuenow", "0");
  dbOutput.textContent = "-∞ dBFS";
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select"))
  );
}

type PttButtonState = "idle" | "listening" | "processing";

function setPttButtonState(button: HTMLButtonElement, state: PttButtonState): void {
  const idleLabel = button.dataset.idleLabel ?? "누르고 말하기 (T)";
  button.dataset.voiceState = state;
  button.setAttribute("aria-pressed", state === "listening" ? "true" : "false");
  button.disabled = state === "processing";
  if (state === "processing") {
    button.setAttribute("aria-busy", "true");
    button.textContent = VOICE_PROCESSING_LABEL;
    return;
  }
  button.removeAttribute("aria-busy");
  button.textContent = state === "listening" ? "듣는 중… 놓으면 전송" : idleLabel;
}

export class GameView {
  private readonly debugEnabled: boolean;
  private readonly keyboardPtt = new PushToTalkShortcutController();
  private readonly keyboardPttBindings = new WeakMap<
    HTMLButtonElement,
    PushToTalkShortcutBinding
  >();
  private currentBackgroundId: string | null = null;
  private currentPresentationContext: string | null = null;
  private readonly enteredPresentationContexts = new Set<string>();
  private readonly spriteLogicalIds = new Map<SpriteSlot, string>();
  private activeTypewriter: {
    complete(): boolean;
    cancel(): void;
  } | null = null;
  private debugSttModel: OpenAiSttModel;
  private latestTranscription: TranscriptionObservation | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly debugSttOptions: DebugSttOptions,
    private readonly audioControlOptions: AudioControlOptions,
    private readonly onAdvance?: () => void,
  ) {
    this.debugEnabled = new URLSearchParams(window.location.search).has("debug");
    this.debugSttModel = debugSttOptions.model;
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.altKey || event.metaKey || isEditableKeyboardTarget(event.target)) {
        return;
      }
      if (
        (event.key === " " || event.key === "Enter") &&
        this.activeTypewriter?.complete()
      ) {
        event.preventDefault();
        return;
      }
      const target = this.resolveKeyboardPttTarget();
      if (target && this.keyboardPtt.keyDown(event.key, event.repeat, target.binding)) {
        target.button.focus({ preventScroll: true });
        event.preventDefault();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (this.keyboardPtt.keyUp(event.key)) event.preventDefault();
    });
  }

  renderLoading(): void {
    const shell = this.createShell("bg_title", "loading");
    shell.append(element("p", "loading", "게임 데이터를 검증하는 중…"));
    this.commit(shell);
  }

  renderDevScenePreview(
    preview: DevScenePreview,
    onPlayBgm?: () => void,
  ): void {
    const shell = this.createShell(preview.backgroundId, `dev:${preview.id}`);
    shell.classList.add("dev-scene-preview", `dev-layout-${preview.layout}`);
    shell.dataset.previewId = preview.id;

    if (preview.showVoiceOrb) {
      shell.append(element("div", "first-voice-orb"));
    }
    if (preview.visuals.length > 0) {
      const stage = element("section", "dev-preview-stage");
      stage.setAttribute("aria-label", "장면 에셋 프리뷰");
      for (const visual of preview.visuals) {
        const figure = this.createAssetVisual(
          visual.logicalId,
          visual.label,
          `asset-visual dev-preview-visual dev-role-${visual.role}${visual.role === "player" ? " doyun-visual" : ""}`,
        );
        figure.dataset.logicalId = visual.logicalId;
        stage.append(figure);
      }
      shell.append(stage);
    }

    const card = element("section", "dev-preview-card");
    card.append(
      element("p", "eyebrow", "M5 SCENE PREVIEW · SAVE/FSM ISOLATED"),
      element("h1", "dev-preview-title", preview.label),
      element("p", "dev-preview-meta", `scene=${preview.id}`),
      element("p", "dev-preview-meta", `node=${preview.nodeId} · beat=${preview.beat}`),
      element("p", "dev-preview-meta", `background=${preview.backgroundId}`),
      element("p", "dev-preview-meta", `bgm=${preview.bgmId ?? "none"}`),
    );
    if (preview.bgmId && onPlayBgm) {
      const play = element("button", "secondary-button compact", "BGM 테스트");
      play.type = "button";
      play.addEventListener("click", onPlayBgm);
      card.append(play);
    }
    shell.append(card);
    this.commit(shell);
  }

  renderDevSceneError(requestedId: string): void {
    const shell = this.createShell("bg_title", "dev:error");
    shell.classList.add("dev-scene-preview");
    const card = element("section", "dev-preview-card");
    card.append(
      element("p", "eyebrow", "M5 SCENE PREVIEW"),
      element("h1", "dev-preview-title", "장면 ID를 찾을 수 없습니다"),
      element("p", "dev-preview-meta", `scene=${requestedId}`),
      element("p", "dev-preview-meta", "상단 장면 선택기에서 유효한 장면을 선택하세요."),
    );
    shell.append(card);
    this.commit(shell);
  }

  renderTitle(options: TitleOptions): void {
    const shell = this.createShell("bg_title", "title");
    shell.classList.add("title-screen");

    const titleBlock = element("section", "title-block");
    titleBlock.append(
      element("p", "eyebrow", "목소리로 이어지는 이야기"),
      element("h1", "game-title", "심사역은 마법소녀가 되었다"),
      element("p", "title-subtitle", "마이크가 연결되어야 플레이 가능해요"),
    );

    const setup = element("section", "microphone-setup");
    setup.dataset.state = options.microphoneSupported ? "waiting" : "unsupported";
    const setupHeader = element("div", "microphone-setup-header");
    setupHeader.append(
      element("span", "microphone-step", "마이크 준비"),
      element("h2", "microphone-title", "마이크 테스트"),
      element("p", "microphone-copy", "마이크를 연결하고 평소 목소리로 한 문장을 말해 주세요."),
    );
    const deviceLabel = element("label", "microphone-device");
    deviceLabel.append(element("span", undefined, "입력 장치"));
    const deviceSelect = element("select", "microphone-device-select");
    deviceSelect.disabled = true;
    const defaultDevice = element("option", undefined, "연결 후 장치를 선택할 수 있어요");
    defaultDevice.value = "";
    deviceSelect.append(defaultDevice);
    deviceLabel.append(deviceSelect);

    const meter = element("div", "microphone-meter");
    meter.setAttribute("role", "meter");
    meter.setAttribute("aria-label", "마이크 입력 레벨");
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "100");
    meter.setAttribute("aria-valuenow", "0");
    const meterFill = element("div", "microphone-meter-fill");
    meter.append(meterFill);
    const readout = element("div", "microphone-readout");
    const dbOutput = element("output", "microphone-db", "-∞ dBFS");
    const progressOutput = element("span", "microphone-progress", "테스트 대기");
    readout.append(dbOutput, progressOutput);
    const status = element(
      "p",
      "microphone-status",
      options.microphoneSupported
        ? "연결을 누르면 브라우저가 마이크 권한을 요청해요."
        : "이 환경에서는 마이크 테스트를 사용할 수 없어 게임을 시작할 수 없어요.",
    );
    status.setAttribute("aria-live", "polite");
    const testPrompt = element("p", "microphone-test-prompt", "테스트 문장 · “심사를 시작합니다.”");
    const connectButton = element(
      "button",
      "secondary-button microphone-connect",
      "마이크 연결",
    );
    connectButton.type = "button";
    connectButton.disabled = !options.microphoneSupported;
    setup.append(setupHeader, deviceLabel, meter, readout, testPrompt, status, connectButton);

    const actions = element("div", "title-actions");
    const startButton = element("button", "primary-button", "시작");
    startButton.type = "button";
    startButton.disabled = true;
    actions.append(startButton);

    let resumeButton: HTMLButtonElement | null = null;
    if (options.hasSave) {
      resumeButton = element("button", "secondary-button", "이어하기");
      resumeButton.type = "button";
      resumeButton.disabled = true;
      actions.append(resumeButton);
    }
    titleBlock.append(setup, actions);

    if (options.warning) {
      titleBlock.append(element("p", "warning-message", options.warning));
    }

    let accumulator = new MicrophoneCalibrationAccumulator();
    let calibration: MicrophoneCalibration | null = null;
    let lastReadingAt = performance.now();
    let connectionSequence = 0;

    const setDevices = (
      devices: readonly MicrophoneInputDevice[],
      selectedDeviceId: string,
    ): void => {
      deviceSelect.replaceChildren();
      for (const device of devices) {
        const option = element("option", undefined, device.label);
        option.value = device.deviceId;
        option.selected = device.deviceId === selectedDeviceId;
        deviceSelect.append(option);
      }
      deviceSelect.disabled = devices.length < 2;
    };
    const updateLevel = (metrics: AudioLevelMetrics): void => {
      if (!this.root.contains(shell)) return;
      const now = performance.now();
      const state = accumulator.add(metrics, Math.min(100, Math.max(16, now - lastReadingAt)));
      lastReadingAt = now;
      const presentation = resolveMicrophoneMeterPresentation(metrics, state);
      meter.style.setProperty("--microphone-level", `${presentation.percent}%`);
      meter.dataset.tone = presentation.tone;
      meter.setAttribute("aria-valuenow", String(presentation.percent));
      dbOutput.textContent = `${metrics.rmsDbfs.toFixed(1)} dBFS`;
      setup.dataset.state = state;
      if (state === "too-quiet") {
        status.textContent = "입력 신호가 너무 작아요. 마이크를 가까이 두고 말해 주세요.";
        progressOutput.textContent = "신호 부족";
      } else if (state === "too-loud") {
        status.textContent = "입력이 너무 커서 소리가 깨져요. 거리를 벌리거나 입력 볼륨을 낮춰 주세요.";
        progressOutput.textContent = "입력 과다";
      } else if (state === "sampling") {
        status.textContent = "목소리를 확인하고 있어요. 테스트 문장을 끝까지 말해 주세요.";
        progressOutput.textContent = `${Math.round(accumulator.progress * 100)}%`;
      } else if (state === "passed") {
        const measured = accumulator.calibration();
        calibration = measured
          ? { ...measured, inputDeviceId: deviceSelect.value || undefined }
          : null;
        status.textContent = "마이크 테스트 완료. 이제 게임을 시작할 수 있어요.";
        progressOutput.textContent = "테스트 완료";
        startButton.disabled = calibration === null;
        if (resumeButton) resumeButton.disabled = calibration === null;
        connectButton.textContent = "다시 테스트";
      }
    };
    const connect = async (deviceId?: string): Promise<void> => {
      const sequence = ++connectionSequence;
      accumulator = new MicrophoneCalibrationAccumulator();
      calibration = null;
      startButton.disabled = true;
      if (resumeButton) resumeButton.disabled = true;
      connectButton.disabled = true;
      deviceSelect.disabled = true;
      resetMicrophoneMeterPresentation(meter, dbOutput);
      setup.dataset.state = "connecting";
      status.textContent = "마이크 권한과 입력 장치를 확인하고 있어요…";
      progressOutput.textContent = "연결 중";
      lastReadingAt = performance.now();
      try {
        const connection = await options.connectMicrophone(deviceId, updateLevel);
        if (sequence !== connectionSequence || !this.root.contains(shell)) return;
        setDevices(connection.devices, connection.selectedDeviceId);
        if (accumulator.state === "passed") {
          const measured = accumulator.calibration();
          calibration = measured
            ? { ...measured, inputDeviceId: connection.selectedDeviceId || undefined }
            : null;
          connectButton.textContent = "다시 테스트";
        } else {
          connectButton.textContent = "테스트 초기화";
          status.textContent = "연결 완료. 테스트 문장을 평소 목소리로 말해 주세요.";
          progressOutput.textContent = "듣는 중";
          setup.dataset.state = "listening";
        }
      } catch (error) {
        if (sequence !== connectionSequence || !this.root.contains(shell)) return;
        setup.dataset.state = "error";
        status.textContent = microphoneSetupErrorMessage(error);
        progressOutput.textContent = "연결 차단";
      } finally {
        if (sequence === connectionSequence) connectButton.disabled = false;
      }
    };

    connectButton.addEventListener("click", () => void connect(deviceSelect.value || undefined));
    deviceSelect.addEventListener("change", () => void connect(deviceSelect.value || undefined));
    startButton.addEventListener("click", () => {
      const acceptedCalibration = calibration;
      if (!acceptedCalibration) return;
      startButton.disabled = true;
      enterGameFromTitle(
        () => options.onNewGame(acceptedCalibration),
        options.disconnectMicrophone,
      );
    });
    resumeButton?.addEventListener("click", () => {
      const acceptedCalibration = calibration;
      if (!acceptedCalibration) return;
      resumeButton!.disabled = true;
      enterGameFromTitle(
        () => options.onResume(acceptedCalibration),
        options.disconnectMicrophone,
      );
    });

    shell.append(titleBlock);
    this.commit(shell);
  }

  renderLine(options: LineViewOptions): void {
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "node",
        nodeId: options.nodeId,
        baseBackground: options.sceneId,
        lineIndex: options.lineIndex,
      }),
      options.nodeId,
    );
    shell.dataset.activeSpeaker = options.speakerId ?? "narration";
    const doyunVisual = resolveDoyunVisual({
      kind: "node",
      nodeId: options.nodeId,
      lineIndex: options.lineIndex,
    });
    if (doyunVisual) {
      shell.append(
        this.createAssetVisual(
          doyunVisual,
          "한도윤",
          "character-visual scene-player-visual doyun-visual",
        ),
      );
    }

    if (options.nodeId === "n5_transform") {
      shell.append(
        this.createAssetVisual(
          "gray_wraith.normal",
          "회색 망령",
          "character-visual scene-enemy-visual",
        ),
        this.createCharacterVisual(
          "juno",
          options.speakerId === "juno"
            ? (options.emotion ?? options.state.npcEmotion)
            : options.state.npcEmotion,
          "주노",
          "character-visual cutscene-character has-companion",
        ),
      );
    } else if (options.speakerId && options.speakerId !== "narration") {
      shell.append(
        this.createCharacterVisual(
          options.speakerId,
          options.emotion ?? "neutral",
          options.speaker,
          "character-visual cutscene-character",
        ),
      );
    }

    const panel = this.dialoguePanel(
      options.speaker,
      options.text,
      options.speakerId ?? "narration",
    );
    const button = this.delayedAdvanceButton(
      "primary-button compact",
      options.continueLabel,
      options.onContinue,
    );
    panel.append(button);
    shell.append(panel);
    this.commit(shell);
  }

  renderIncantation(
    node: CutsceneNode & { incantationGate: NonNullable<CutsceneNode["incantationGate"]> },
    state: GameState,
    options: IncantationInputOptions,
  ): void {
    const gate = node.incantationGate;
    const controlContract = resolveVoiceControlContract(
      "incantation",
      state.inputMode,
      options.speechSupported,
      options.forceClickForTurn ?? false,
    );
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "node",
        nodeId: node.nodeId,
        baseBackground: node.scene.bg,
        stage: "incantation",
      }),
      node.nodeId,
    );
    shell.dataset.activeSpeaker = "juno";
    shell.classList.add("incantation-screen");
    shell.append(
      this.createAssetVisual(
        resolveDoyunVisual({ kind: "node", nodeId: node.nodeId, stage: "incantation" }) ??
          "doyun.normal_shy",
        "한도윤",
        "character-visual scene-player-visual incantation-player-visual doyun-visual",
      ),
    );
    const companion = resolveIncantationCompanionVisual(state);
    shell.append(
      this.createCharacterVisual(
        companion.characterId,
        companion.emotion,
        "주노",
        "character-visual cutscene-character incantation-juno-visual has-companion",
      ),
    );
    const card = element("section", "incantation-card");
    card.append(
      element("p", "eyebrow", "변신 주문"),
      element("p", "incantation-copy", gate.displayText),
    );
    if (state.inputMode !== "voice") {
      card.append(
        element("p", "incantation-guide", "클릭 주문은 표준 변신으로 안전하게 진행돼."),
      );
    }
    if (options.notice) card.append(element("p", "input-notice", options.notice));
    const inputArea = element("section", "incantation-input");
    const fallback = element("button", "secondary-button", "주문 없이 변신하기");
    fallback.type = "button";
    fallback.addEventListener("click", options.onFallback, { once: true });

    if (controlContract.showVoiceCapture) {
      const controls = element("div", "voice-controls");
      const ptt = element("button", "ptt-button", "누르고 주문 읽기 (T)");
      ptt.type = "button";
      ptt.setAttribute("aria-pressed", "false");
      controls.append(ptt);
      controls.append(fallback);
      inputArea.append(controls);
      this.bindHoldToTalk(ptt, options, async (transcript) => {
        await options.onTranscript(transcript.text, transcript.observation);
      });
      const utilities = element("div", "input-utilities");
      this.appendDebugTranscript(utilities, async (transcript) => {
        await options.onTranscript(transcript);
      });
      inputArea.append(utilities);
    } else if (controlContract.showClickActions) {
      inputArea.append(fallback);
      if (controlContract.showVoiceModeSwitch) {
        const voice = element("button", "secondary-button compact-input", "음성 입력으로 전환");
        voice.type = "button";
        voice.addEventListener("click", () => options.onModeChange("voice"), { once: true });
        inputArea.append(voice);
      }
    }
    card.append(inputArea);
    shell.append(card);
    this.commit(shell);
  }

  renderTransformationResult(options: {
    sceneId: string;
    outcome: "perfect" | "standard" | "rescued";
    state: GameState;
    lines: readonly string[];
    onContinue(): void;
  }): void {
    const shell = this.createShell(options.sceneId, "n5_transform_result");
    shell.dataset.activeSpeaker = "narration";
    applySceneEffect(shell, options.outcome === "perfect" ? "transform" : "flash");
    shell.append(
      this.createAssetVisual(
        resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", stage: "transformation" }) ??
          "doyun.magical_pose",
        "마법소녀 도윤",
        "character-visual transformation-player-visual doyun-visual",
      ),
    );
    const cutStage = element("section", "transform-cut-stage");
    cutStage.setAttribute("aria-label", "변신 연출");
    cutStage.append(
      this.createAssetVisual(
        "transform.cast",
        "변신 주문",
        "asset-visual transform-cut transform-cut-cast",
      ),
      this.createAssetVisual(
        "transform.complete",
        "변신 완료",
        "asset-visual transform-cut transform-cut-complete",
      ),
    );
    shell.append(cutStage);
    mountParticleBurst(shell);
    const card = element("section", "transformation-result");
    const title =
      options.outcome === "perfect"
        ? "완전한 변신"
        : options.outcome === "rescued"
          ? "함께 완성한 변신"
          : "빛으로 완성한 변신";
    card.append(element("p", "eyebrow", "변신 완료"), element("h2", "ending-title", title));
    options.lines.forEach((line) => card.append(element("p", "ending-line", line)));
    const button = this.delayedAdvanceButton(
      "primary-button",
      "언령 배틀 시작",
      options.onContinue,
    );
    card.append(button);
    shell.append(card);
    this.commit(shell);
  }

  renderBattle(
    node: BattleNode,
    phase: BattlePhase,
    battleState: BattleState,
    state: GameState,
    options: BattleInputOptions,
  ): void {
    const controlContract = resolveVoiceControlContract(
      "battle",
      state.inputMode,
      options.speechSupported,
      options.forceClickForTurn ?? false,
    );
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "battle",
        phaseId: phase.phaseId,
        beat: "prompt",
        baseBackground: node.scene.bg,
      }),
      "battle_wraith",
    );
    shell.classList.add("battle-screen", `enemy-${battleState.enemyState}`);
    shell.dataset.activeSpeaker = "gray_wraith";
    const stage = this.createBattleStage(
      phase.phaseId,
      node.enemy.name,
      phase.enemyPrompt,
      battleState,
    );
    const command = element("section", "battle-control-dock battle-command");
    command.append(
      element("p", "battle-spell-label", "이번 언령"),
      element("p", "battle-spell", phase.spell.displayText),
    );
    if (options.notice) command.append(element("p", "input-notice", options.notice));

    if (controlContract.showVoiceCapture) {
      const controls = element("div", "battle-actions");
      const spell = element("button", "ptt-button", "주문 · 누르고 말하기 (T)");
      const freeform = element("button", "ptt-button freeform-button", "자유 대응 · 누르고 말하기 (T)");
      const guard = element("button", "secondary-button", "버티기");
      for (const button of [spell, freeform, guard]) button.type = "button";
      guard.addEventListener("click", options.onGuard, { once: true });
      controls.append(spell, freeform, guard);
      command.append(controls);
      this.bindHoldToTalk(spell, options, (transcript) =>
        options.onTranscript(
          "spell",
          transcript.text,
          transcript.audioLevel,
          transcript.observation,
        ),
      );
      this.bindHoldToTalk(freeform, options, (transcript) =>
        options.onTranscript(
          "freeform",
          transcript.text,
          transcript.audioLevel,
          transcript.observation,
        ),
      );
      const clickMode = element("button", "secondary-button compact-input", "클릭으로 전환");
      clickMode.type = "button";
      clickMode.addEventListener("click", () => options.onModeChange("click"), { once: true });
      command.append(clickMode);
    } else if (controlContract.showClickActions) {
      const choices = element("div", "choice-list battle-choice-list");
      const spell = element("button", "primary-button", "주문을 외친다");
      spell.type = "button";
      spell.addEventListener("click", options.onClickSpell, { once: true });
      choices.append(spell);
      phase.clickResponses.forEach((response) => {
        const button = element("button", "secondary-button", response.text);
        button.type = "button";
        button.addEventListener(
          "click",
          () => options.onClickResponse(response.text, response.momentumDelta),
          { once: true },
        );
        choices.append(button);
      });
      const guard = element("button", "secondary-button", "버티기");
      guard.type = "button";
      guard.addEventListener("click", options.onGuard, { once: true });
      choices.append(guard);
      command.append(choices);
      if (controlContract.showVoiceModeSwitch) {
        const voice = element("button", "secondary-button compact-input", "음성 입력으로 전환");
        voice.type = "button";
        voice.addEventListener("click", () => options.onModeChange("voice"), { once: true });
        command.append(voice);
      }
    }
    const utilities = element("div", "input-utilities");
    this.appendDebugTranscript(utilities, async (transcript) => {
      await options.onTranscript("spell", transcript);
    });
    command.append(utilities, this.battleDebugControls(options, battleState));
    stage.append(command);
    shell.append(stage);
    this.commit(shell);
  }

  renderBattleReply(options: {
    sceneId: string;
    phaseId: string;
    enemyName: string;
    actionLabel: string;
    reply: string;
    narration?: string;
    action: BattlePresentationAction;
    previousMomentum: number;
    previousEnemyState: BattleState["enemyState"];
    phaseChanged: boolean;
    battleState: BattleState;
    state: GameState;
    completed: boolean;
    grade: BattleGrade | null;
    onContinue(): void;
  }): void {
    const shell = this.createShell(options.sceneId, "battle_wraith");
    shell.classList.add("battle-screen", `enemy-${options.battleState.enemyState}`);
    shell.dataset.activeSpeaker = "gray_wraith";
    const delta = options.battleState.momentum - options.previousMomentum;
    const actionPresentation = resolveBattleActionPresentation({
      phaseId: options.phaseId,
      action: options.action,
      delta,
      previousEnemyState: options.previousEnemyState,
      enemyState: options.battleState.enemyState,
      phaseChanged: options.phaseChanged,
      completed: options.completed,
      grade: options.grade,
    });
    shell.classList.add(actionPresentation.className);
    if (actionPresentation.wraithTransition !== "none") {
      shell.classList.add(`battle-wraith-${actionPresentation.wraithTransition}`);
    }
    if (options.phaseChanged) shell.classList.add("battle-phase-change");
    if (options.completed) shell.classList.add("battle-purification");
    const stage = this.createBattleStage(
      options.phaseId,
      options.enemyName,
      options.reply,
      options.battleState,
      options.previousMomentum,
      actionPresentation.doyunLogicalId,
    );
    stage.classList.add("battle-stage-result");
    const dialogue = stage.querySelector<HTMLElement>(".battle-dialogue");
    dialogue?.insertBefore(
      element("p", "player-line", `도윤 · ${options.actionLabel}`),
      dialogue.firstChild,
    );
    const result = element("section", "battle-control-dock battle-result-controls");
    if (options.narration) {
      result.append(
        element("p", "battle-result-narration", formatDialogueText(options.narration, "narration")),
      );
    }
    if (actionPresentation.phaseCallout) {
      const callout = element("p", "battle-phase-callout");
      callout.append(
        element("strong", undefined, "주노"),
        document.createTextNode(` ${actionPresentation.phaseCallout}`),
      );
      result.append(callout);
    }
    if (actionPresentation.guardBarrier) {
      stage.append(element("div", "battle-guard-barrier"));
    }
    if (actionPresentation.gradeLabel) {
      const grade = element("section", "battle-grade-reveal");
      grade.append(
        element("span", "battle-grade-mark", options.grade ?? "B"),
        element("strong", undefined, actionPresentation.gradeLabel),
      );
      stage.append(grade);
    }
    if (actionPresentation.particles) {
      mountParticleBurst(stage, {
        count: options.completed ? 84 : 48,
        originXRatio: options.completed ? 0.5 : 0.3,
        originYRatio: 0.44,
      });
    }
    const button = this.delayedAdvanceButton(
      "primary-button",
      options.completed ? "계속" : "다음 행동",
      options.onContinue,
    );
    result.append(button);
    stage.append(result);
    shell.append(stage);
    this.commit(shell);
  }

  renderDialogue(
    node: DialogueNode,
    character: Character,
    state: GameState,
    onSelect: (intentId: string) => void,
    inputOptions: DialogueInputOptions,
  ): void {
    const controlContract = resolveVoiceControlContract(
      "dialogue",
      state.inputMode,
      inputOptions.speechSupported,
      inputOptions.forceClickForTurn ?? false,
    );
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "node",
        nodeId: node.nodeId,
        baseBackground: node.scene.bg,
      }),
      node.nodeId,
    );
    shell.dataset.activeSpeaker = node.nodeId === "n1_first_voice" ? "voice" : character.id;
    const identity = resolveDialogueIdentity(node.nodeId, character.name);
    this.appendDialogueVisuals(
      shell,
      node.nodeId,
      character,
      node.npc.startEmotion,
    );

    const panel = this.dialoguePanel(
      identity.speaker,
      node.opening,
      node.nodeId === "n1_first_voice" ? "voice" : character.id,
    );
    const inputArea = element("section", "dialogue-input");
    inputArea.dataset.inputMode = state.inputMode;
    panel.append(inputArea);
    if (controlContract.showVoiceCapture) {
      this.renderVoiceInput(inputArea, node, onSelect, inputOptions);
    } else if (controlContract.showClickActions) {
      this.renderClickInput(
        inputArea,
        node,
        onSelect,
        inputOptions,
        inputOptions.notice,
        controlContract.showVoiceModeSwitch,
      );
    }

    shell.append(panel);
    this.commit(shell);
  }

  renderDialogueReply(options: {
    nodeId: string;
    sceneId: string;
    characterId: string;
    emotion: Emotion;
    intentId?: string;
    speaker: string;
    selectedLabel: string;
    reply: string;
    state: GameState;
    advanced: boolean;
    onContinue: () => void;
  }): void {
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "node",
        nodeId: options.nodeId,
        baseBackground: options.sceneId,
      }),
      options.nodeId,
    );
    shell.dataset.activeSpeaker =
      options.nodeId === "n1_first_voice" ? "voice" : options.characterId;
    const identity = resolveDialogueIdentity(options.nodeId, options.speaker);
    this.appendDialogueVisuals(
      shell,
      options.nodeId,
      { id: options.characterId, name: identity.speaker },
      options.emotion,
      options.intentId,
    );
    const panel = this.dialoguePanel(
      identity.speaker,
      options.reply,
      options.nodeId === "n1_first_voice" ? "voice" : options.characterId,
    );
    panel.insertBefore(
      element("p", "player-line", `도윤 · ${options.selectedLabel}`),
      panel.firstChild,
    );
    const button = this.delayedAdvanceButton(
      "primary-button compact",
      options.advanced ? "다음 장면" : "계속 대화",
      options.onContinue,
    );
    panel.append(button);
    shell.append(panel);
    this.commit(shell);
  }

  renderEnding(
    node: EndingNode,
    characterNames: ReadonlyMap<string, string>,
    state: GameState,
    onNewGame: () => void,
  ): void {
    const pages = resolveEndingPages(node, state.battleGrade);
    let pageIndex = 0;

    const renderPage = (): void => {
      const page = pages[pageIndex];
      if (!page) return;
      const shell = this.createShell(page.sceneId, node.nodeId);
      shell.dataset.activeSpeaker = page.line.speaker;
      shell.classList.add("ending-screen", `ending-tone-${node.endingId}`);
      const doyunVisual = resolveDoyunVisual({
        kind: "ending",
        endingId: node.endingId,
        lineIndex: page.lineIndex,
      });
      if (doyunVisual) {
        shell.append(
          this.createAssetVisual(
            doyunVisual,
            "한도윤",
            "character-visual ending-player-visual doyun-visual",
          ),
        );
      }
      const visual = resolveEndingVisual(node.endingId, page.lineIndex);
      if (visual) {
        shell.append(
          this.createCharacterVisual(
            visual.characterId,
            visual.emotion,
            characterNames.get(visual.characterId) ?? visual.characterId,
            "character-visual ending-character",
          ),
        );
      }

      const card = element("section", "ending-card");
      card.append(
        element("p", "eyebrow", "이야기의 결말"),
        element("h2", "ending-title", pages[0]?.line.text ?? "엔딩"),
      );
      if (page.lineIndex > 0) {
        const speaker =
          page.line.speaker === "narration"
            ? ""
            : `${characterNames.get(page.line.speaker) ?? page.line.speaker} · `;
        const lineText = formatDialogueText(page.line.text, page.line.speaker);
        card.append(element("p", "ending-line", `${speaker}${lineText}`));
      }

      const button = page.isLast
        ? element("button", "primary-button", "처음부터")
        : this.delayedAdvanceButton("primary-button", "계속", () => {
            pageIndex += 1;
            renderPage();
          });
      button.type = "button";
      if (page.isLast) {
        button.addEventListener("click", onNewGame, { once: true });
      }
      card.append(button);
      shell.append(card);
      this.commit(shell);
    };

    renderPage();
  }

  renderError(error: unknown): void {
    const shell = this.createShell("bg_hall_dark", "error");
    const panel = element("section", "error-panel");
    panel.append(
      element("p", "eyebrow", "데이터 확인 오류"),
      element("h1", "error-title", "게임을 시작할 수 없습니다"),
    );

    const list = element("ul", "error-list");
    const issues =
      typeof error === "object" && error !== null && "issues" in error
        ? (error as { issues: unknown }).issues
        : null;
    const messages = Array.isArray(issues)
      ? issues.map(String)
      : [error instanceof Error ? error.message : String(error)];
    messages.forEach((message) => list.append(element("li", undefined, message)));
    panel.append(list);
    shell.append(panel);
    this.commit(shell);
  }

  private createShell(sceneId: string, presentationContext = sceneId): HTMLElement {
    const shell = element("main", "game-shell");
    if (this.debugEnabled) shell.classList.add("debug-enabled");
    shell.dataset.scene = sceneId;
    shell.dataset.presentationContext = presentationContext;
    if (isActBoundaryTransition(this.currentPresentationContext, presentationContext)) {
      shell.classList.add("act-boundary-transition");
    }
    if (
      presentationContext === "n2_juno_intro" &&
      !this.enteredPresentationContexts.has(presentationContext)
    ) {
      shell.classList.add("juno-first-entrance");
      this.enteredPresentationContexts.add(presentationContext);
    }
    const transition = resolveBackgroundTransition(this.currentBackgroundId, sceneId);
    shell.dataset.backgroundTransition = transition;
    if (transition === "change" && this.currentBackgroundId) {
      this.appendBackground(shell, this.currentBackgroundId, "leaving");
    }
    this.appendBackground(shell, sceneId, transition === "change" ? "entering" : "static");
    shell.append(
      element("div", "ambient ambient-one"),
      element("div", "ambient ambient-two"),
      element("div", "scene-grid"),
    );
    return shell;
  }

  private appendBackground(
    shell: HTMLElement,
    sceneId: string,
    transitionRole: "static" | "entering" | "leaving",
  ): void {
    const contract = resolveBackgroundAsset(sceneId);
    if (!contract) {
      shell.classList.add("scene-asset-placeholder");
      return;
    }

    const usePath = (relativePath: string, isFallback: boolean): void => {
      if (isAssetPathUnavailable(relativePath)) {
        if (!isFallback && contract.fallbackPath) {
          usePath(contract.fallbackPath, true);
          return;
        }
        shell.classList.add("scene-asset-placeholder");
        return;
      }

      const image = element("img", "scene-background");
      image.classList.add(`scene-background-${transitionRole}`);
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.decoding = "async";
      image.src = assetUrl(relativePath);
      image.addEventListener(
        "error",
        () => {
          image.remove();
          reportAssetLoadFailure(contract.logicalId, relativePath);
          if (!isFallback && contract.fallbackPath) {
            usePath(contract.fallbackPath, true);
          } else {
            shell.classList.add("scene-asset-placeholder");
          }
        },
        { once: true },
      );
      if (transitionRole === "leaving") {
        const removeLeavingImage = (): void => image.remove();
        image.addEventListener("animationend", removeLeavingImage, { once: true });
        window.setTimeout(removeLeavingImage, 520);
      }
      if (isFallback && contract.fallbackClass) {
        shell.classList.add(contract.fallbackClass);
      }
      shell.prepend(image);
    };

    usePath(contract.primaryPath, false);
  }

  private createBattleStage(
    phaseId: string,
    enemyName: string,
    dialogueText: string,
    battleState: BattleState,
    previousMomentum?: number,
    doyunLogicalId?: string,
  ): HTMLElement {
    const presentation = resolveBattleStagePresentation(phaseId);
    const stage = element("section", "battle-stage");
    stage.dataset.phase = phaseId;
    stage.dataset.enemyState = battleState.enemyState;

    const phaseDots = element("div", "battle-phase-dots");
    phaseDots.setAttribute(
      "aria-label",
      `언령 ${presentation.phaseIndex + 1}/${presentation.phaseTotal}`,
    );
    for (let index = 0; index < presentation.phaseTotal; index += 1) {
      const dot = element("span", "battle-phase-dot");
      dot.classList.toggle("is-active", index === presentation.phaseIndex);
      dot.classList.toggle("is-complete", index < presentation.phaseIndex);
      dot.setAttribute("aria-hidden", "true");
      phaseDots.append(dot);
    }
    const hud = element("header", "battle-hud");
    hud.append(
      element("span", "battle-phase-label", `언령 ${presentation.phaseIndex + 1}`),
      phaseDots,
      createGauge("기세", battleState.momentum, 20, 100, previousMomentum),
    );

    const visualStage = element("section", "battle-character-stage");
    visualStage.setAttribute("aria-label", "언령 배틀 무대");
    visualStage.append(
      this.createAssetVisual(
        `gray_wraith.${battleState.enemyState}`,
        enemyName,
        "asset-visual battle-stage-character battle-stage-wraith enemy-visual",
      ),
      this.createAssetVisual(
        doyunLogicalId ?? presentation.doyunLogicalId,
        "마법소녀 도윤",
        "asset-visual battle-stage-character battle-stage-doyun doyun-visual",
      ),
      this.createCharacterVisual(
        "juno",
        presentation.junoEmotion,
        "주노",
        "asset-visual battle-stage-character battle-stage-juno",
      ),
    );

    const dialogue = this.dialoguePanel(enemyName, dialogueText, "gray_wraith");
    dialogue.classList.add("battle-dialogue");
    stage.append(hud, visualStage, dialogue);
    return stage;
  }

  private createCharacterVisual(
    characterId: string,
    emotion: Emotion,
    label: string,
    className: string,
  ): HTMLElement {
    const logicalId =
      characterId === "gray_wraith"
        ? "gray_wraith.normal"
        : `${characterId}.${emotion}`;
    const path =
      characterId === "gray_wraith"
        ? resolveImageAsset(logicalId)
        : resolveCharacterAsset(characterId, emotion);
    return this.createAssetVisual(logicalId, label, className, path);
  }

  private appendDialogueVisuals(
    shell: HTMLElement,
    nodeId: string,
    character: Pick<Character, "id" | "name">,
    emotion: Emotion,
    intentId?: string,
  ): void {
    const doyunVisual = resolveDoyunVisual({ kind: "node", nodeId, intentId });
    if (doyunVisual) {
      shell.append(
        this.createAssetVisual(
          doyunVisual,
          "한도윤",
          "character-visual scene-player-visual dialogue-player-visual doyun-visual",
        ),
      );
    }
    if (nodeId === "n1_first_voice") {
      shell.append(element("div", "first-voice-orb"));
      return;
    }

    const hasWraith =
      nodeId === "n3_wraith_choice" || nodeId.startsWith("n4_");
    if (hasWraith) {
      shell.append(
        this.createAssetVisual(
          "gray_wraith.normal",
          "회색 망령",
          "character-visual scene-enemy-visual",
        ),
      );
    }
    shell.append(
      this.createCharacterVisual(
        character.id,
        emotion,
        character.name,
        hasWraith
          ? "character-visual dialogue-character has-companion"
          : "character-visual dialogue-character",
      ),
    );
  }

  private createAssetVisual(
    logicalId: string,
    label: string,
    className: string,
    resolvedPath = resolveImageAsset(logicalId),
  ): HTMLElement {
    const figure = element("figure", className);
    figure.dataset.logicalId = logicalId;
    const spriteSlot = resolveSpriteSlot(logicalId);
    if (spriteSlot) figure.dataset.spriteSlot = spriteSlot;
    const fallback = resolveImageAssetFallback(logicalId);
    const showPlaceholder = (): void => {
      const presentation = resolveMissingAssetPresentation(label);
      const placeholder = element("div", presentation.className);
      placeholder.setAttribute("role", "img");
      placeholder.setAttribute("aria-label", presentation.ariaLabel);
      figure.replaceChildren(placeholder);
      figure.classList.add("is-placeholder", "is-black-placeholder");
    };

    const mountImage = (path: string, isFallback: boolean): void => {
      const image = element("img", "asset-image");
      image.alt = label;
      image.decoding = "async";
      image.src = assetUrl(path);
      image.addEventListener(
        "error",
        () => {
          image.remove();
          reportAssetLoadFailure(logicalId, path);
          if (
            !isFallback &&
            fallback &&
            !isAssetPathUnavailable(fallback.path)
          ) {
            mountImage(fallback.path, true);
            return;
          }
          showPlaceholder();
        },
        { once: true },
      );
      if (isFallback && fallback) {
        figure.classList.add("is-derived-asset", fallback.className);
      }
      figure.replaceChildren(image);
    };

    if (resolvedPath && !isAssetPathUnavailable(resolvedPath)) {
      mountImage(resolvedPath, false);
    } else if (fallback && !isAssetPathUnavailable(fallback.path)) {
      mountImage(fallback.path, true);
    } else {
      showPlaceholder();
    }
    return figure;
  }

  private dialoguePanel(speaker: string, text: string, speakerId: string): HTMLElement {
    const presentation = resolveDialoguePresentation(speakerId);
    const panel = element(
      "section",
      `dialogue-panel dialogue-side-${presentation.side} dialogue-tone-${presentation.tone}`,
    );
    panel.dataset.speaker = speakerId;
    panel.setAttribute("aria-live", "off");
    if (presentation.showName) panel.append(element("div", "nameplate", speaker));
    const dialogueText = element("p", "dialogue-text");
    dialogueText.dataset.typewriterText = formatDialogueText(text, speakerId);
    dialogueText.textContent = dialogueText.dataset.typewriterText;
    panel.append(dialogueText);
    return panel;
  }

  private applySpriteContinuity(container: HTMLElement): void {
    const nextSlots = new Set<SpriteSlot>();
    for (const sprite of container.querySelectorAll<HTMLElement>("[data-sprite-slot]")) {
      const slot = resolveSpriteSlot(sprite.dataset.logicalId ?? "");
      const logicalId = sprite.dataset.logicalId;
      if (!slot || !logicalId) continue;
      nextSlots.add(slot);
      sprite.classList.add(
        this.spriteLogicalIds.get(slot) === logicalId ? "sprite-static" : "sprite-entering",
      );
      this.spriteLogicalIds.set(slot, logicalId);
    }
    for (const slot of [...this.spriteLogicalIds.keys()]) {
      if (!nextSlots.has(slot)) this.spriteLogicalIds.delete(slot);
    }
  }

  private activateTypewriter(container: HTMLElement): void {
    const textNode = container.querySelector<HTMLElement>(".dialogue-text[data-typewriter-text]");
    if (!textNode) return;
    const panel = textNode.closest<HTMLElement>(".dialogue-panel");
    const fullText = textNode.dataset.typewriterText ?? "";
    const advanceButtons = [...container.querySelectorAll<HTMLButtonElement>("[data-timer-ready]")];
    const setTextReady = (ready: boolean): void => {
      for (const button of advanceButtons) {
        button.dataset.textReady = String(ready);
        if (ready) {
          button.dispatchEvent(new Event("typewritercomplete"));
        } else {
          button.disabled = true;
          button.dataset.advanceState = "waiting";
        }
      }
    };
    const revealImmediately =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (revealImmediately || fullText.length === 0) {
      textNode.textContent = fullText;
      panel?.setAttribute("aria-live", "polite");
      setTextReady(true);
      return;
    }

    const characters = Array.from(fullText);
    let index = 0;
    let timer = 0;
    let completed = false;
    textNode.textContent = "";
    textNode.setAttribute("aria-hidden", "true");
    setTextReady(false);

    const complete = (): boolean => {
      if (completed) return false;
      completed = true;
      window.clearTimeout(timer);
      textNode.textContent = fullText;
      textNode.removeAttribute("aria-hidden");
      panel?.setAttribute("aria-live", "polite");
      setTextReady(true);
      return true;
    };
    const tick = (): void => {
      if (completed) return;
      index += 1;
      textNode.textContent = characters.slice(0, index).join("");
      if (index >= characters.length) {
        complete();
        return;
      }
      const character = characters[index - 1] ?? "";
      timer = window.setTimeout(tick, typewriterDelayFor(character));
    };
    const controller = {
      complete,
      cancel: (): void => {
        completed = true;
        window.clearTimeout(timer);
      },
    };
    this.activeTypewriter = controller;
    panel?.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button, input, select, textarea, a")) {
        return;
      }
      controller.complete();
    });
    timer = window.setTimeout(tick, TYPEWRITER_BASE_DELAY_MS);
  }

  private delayedAdvanceButton(
    className: string,
    label: string,
    onContinue: () => void,
  ): HTMLButtonElement {
    const button = element("button", className, label);
    button.type = "button";
    button.disabled = true;
    button.dataset.advanceState = "waiting";
    button.dataset.timerReady = "false";
    button.dataset.textReady = "true";
    const updateReady = (): void => {
      const ready =
        button.dataset.timerReady === "true" && button.dataset.textReady === "true";
      button.disabled = !ready;
      button.dataset.advanceState = ready ? "ready" : "waiting";
    };
    const gate = new DelayedActionGate({
      delayMs: DIALOGUE_ADVANCE_DELAY_MS,
      onReadyChange: (ready) => {
        button.dataset.timerReady = String(ready);
        updateReady();
      },
      onAction: () => {
        this.onAdvance?.();
        onContinue();
      },
    });
    button.addEventListener("click", () => gate.trigger());
    button.addEventListener("typewritercomplete", () => {
      button.dataset.textReady = "true";
      updateReady();
    });
    gate.arm();
    return button;
  }

  private commit(shell: HTMLElement): void {
    this.keyboardPtt.cancel();
    this.activeTypewriter?.cancel();
    this.activeTypewriter = null;
    this.applySpriteContinuity(shell);
    shell.append(this.audioControlPanel());
    const currentShell = this.root.firstElementChild;
    if (
      currentShell instanceof HTMLElement &&
      currentShell.classList.contains("battle-screen") &&
      shell.classList.contains("battle-screen")
    ) {
      const currentStage = currentShell.querySelector<HTMLElement>(":scope > .battle-stage");
      const nextStage = shell.querySelector<HTMLElement>(":scope > .battle-stage");
      if (currentStage && nextStage) {
        currentShell.className = shell.className;
        for (const key of Object.keys(currentShell.dataset)) {
          delete currentShell.dataset[key];
        }
        Object.assign(currentShell.dataset, shell.dataset);
        for (const child of [...currentShell.children]) {
          if (child !== currentStage) child.remove();
        }
        for (const child of [...shell.children]) {
          if (child !== nextStage) currentShell.insertBefore(child, currentStage);
        }
        currentStage.className = nextStage.className;
        for (const key of Object.keys(currentStage.dataset)) {
          delete currentStage.dataset[key];
        }
        Object.assign(currentStage.dataset, nextStage.dataset);
        currentStage.replaceChildren(...nextStage.childNodes);
        if (this.debugEnabled) currentShell.append(this.devSceneNavigator());
        this.currentBackgroundId = currentShell.dataset.scene ?? null;
        this.currentPresentationContext =
          currentShell.dataset.presentationContext ?? null;
        this.activateTypewriter(currentShell);
        return;
      }
    }
    if (this.debugEnabled) {
      shell.append(this.devSceneNavigator());
    }
    this.root.replaceChildren(shell);
    this.currentBackgroundId = shell.dataset.scene ?? null;
    this.currentPresentationContext = shell.dataset.presentationContext ?? null;
    this.activateTypewriter(shell);
  }

  private audioControlPanel(): HTMLElement {
    const panel = element("aside", "bgm-controls");
    panel.setAttribute("aria-label", "배경 음악 설정");
    const mute = element("button", "bgm-mute-button");
    mute.type = "button";
    const slider = element("input", "bgm-volume-slider");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(Math.round(this.audioControlOptions.getVolume() * 100));
    slider.setAttribute("aria-label", "BGM 볼륨");
    const output = element("output", "bgm-volume-output");
    let muted = this.audioControlOptions.isMuted();
    const update = (): void => {
      const percent = Math.round(Number(slider.value));
      output.value = `${percent}%`;
      output.textContent = `${percent}%`;
      mute.textContent = muted ? "BGM 음소거" : "BGM 켬";
      mute.dataset.muted = String(muted);
      mute.setAttribute("aria-pressed", String(muted));
      mute.setAttribute(
        "aria-label",
        muted ? "BGM 음소거 해제" : "BGM 음소거",
      );
    };
    mute.addEventListener("click", () => {
      muted = !muted;
      this.audioControlOptions.onMutedChange(muted);
      update();
    });
    slider.addEventListener("input", () => {
      this.audioControlOptions.onVolumeChange(Number(slider.value) / 100);
      update();
    });
    update();
    panel.append(mute, slider, output);
    return panel;
  }

  private devSceneNavigator(): HTMLElement {
    const nav = element("aside", "dev-scene-nav");
    nav.setAttribute("aria-label", "M5 장면 선택기");
    const label = element("label", undefined, "DEBUG");
    const select = element("select");
    select.name = "devScene";
    const game = element("option", undefined, "실제 플레이");
    game.value = "";
    select.append(game);
    for (const preview of M5_SCENE_PREVIEWS) {
      const option = element("option", undefined, preview.label);
      option.value = preview.id;
      select.append(option);
    }
    select.value = new URLSearchParams(window.location.search).get("scene") ?? "";
    select.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("debug", "1");
      if (select.value) url.searchParams.set("scene", select.value);
      else url.searchParams.delete("scene");
      window.location.assign(url);
    });
    label.append(select);
    const sttLabel = element("label", "debug-stt-selector", "VOICE");
    const sttSelect = element("select");
    sttSelect.name = "debugSttModel";
    for (const model of [
      "gpt-realtime-2.1-mini",
      "gpt-transcribe",
      "gpt-live-transcribe",
    ] as const) {
      const option = element("option", undefined, model);
      option.value = model;
      option.selected = model === this.debugSttModel;
      sttSelect.append(option);
    }
    sttSelect.addEventListener("change", () => {
      const parsed = OpenAiSttModelSchema.safeParse(sttSelect.value);
      const model: OpenAiSttModel = parsed.success
        ? parsed.data
        : "gpt-realtime-2.1-mini";
      this.debugSttModel = model;
      this.latestTranscription = null;
      this.debugSttOptions.onModelChange(model);
    });
    sttLabel.append(sttSelect);
    const models = element("div", "debug-model-summary");
    models.append(
      sttLabel,
      element(
        "span",
        undefined,
        this.debugSttModel === "gpt-realtime-2.1-mini"
          ? "직접 음성 판정"
          : "전사 후 gpt-5.6-luna 판정",
      ),
    );
    nav.append(label, models, this.debugTranscriptionResult());
    return nav;
  }

  private renderClickInput(
    container: HTMLElement,
    node: DialogueNode,
    onSelect: (intentId: string) => void,
    options: DialogueInputOptions,
    notice = options.notice,
    allowVoiceSwitch = true,
  ): void {
    container.replaceChildren();
    container.dataset.inputMode = "click";
    if (notice) {
      container.append(element("p", "input-notice", notice));
    }
    container.append(element("p", "prompt-label", "클릭할 의도를 골라 줘."));
    const choices = element("div", "choice-list");
    const input = new ClickInputPort(choices);
    input.render(node.intents, onSelect);
    container.append(choices);

    const utilities = element("div", "input-utilities");
    if (allowVoiceSwitch && options.speechSupported) {
      const voiceButton = element(
        "button",
        "secondary-button compact-input",
        "음성 입력으로 전환",
      );
      voiceButton.type = "button";
      voiceButton.addEventListener("click", () => options.onModeChange("voice"), {
        once: true,
      });
      utilities.append(voiceButton);
    }
    this.appendDebugTranscript(utilities, async (transcript) => {
      const matched = await options.onTranscript(transcript);
      if (!matched && this.root.contains(container)) {
        this.renderClickInput(container, node, onSelect, options, "판정을 확정하지 못했어. 클릭으로 골라 줘.", allowVoiceSwitch);
      }
    });
    container.append(utilities);
  }

  private renderVoiceInput(
    container: HTMLElement,
    node: DialogueNode,
    onSelect: (intentId: string) => void,
    options: DialogueInputOptions,
  ): void {
    container.replaceChildren();
    container.dataset.inputMode = "voice";
    const presentation = resolveVoiceInputPresentation();
    if (options.notice) {
      container.append(element("p", "input-notice", options.notice));
    }
    const controls = element("div", "voice-controls");
    const ptt = element("button", "ptt-button", presentation.buttonLabel);
    ptt.type = "button";
    ptt.setAttribute("aria-pressed", "false");
    ptt.setAttribute("aria-keyshortcuts", "T Space Enter");
    ptt.dataset.idleLabel = presentation.buttonLabel;
    const clickButton = element(
      "button",
      "secondary-button compact-input",
      "클릭으로 전환",
    );
    clickButton.type = "button";
    clickButton.addEventListener("click", () => {
      options.cancel();
      options.onModeChange("click");
    });
    controls.append(ptt);
    controls.append(clickButton);
    container.append(controls);

    let capturing = false;
    const showClickFallback = (message: string): void => {
      this.renderClickInput(
        container,
        node,
        onSelect,
        options,
        message,
        false,
      );
    };
    const beginCapture = async (): Promise<void> => {
      if (capturing) {
        return;
      }
      capturing = true;
      setPttButtonState(ptt, "listening");
      try {
        await options.startCapture();
      } catch (error) {
        capturing = false;
        setPttButtonState(ptt, "idle");
        options.onUnavailable(classifyVoiceInputError(error));
      }
    };
    const stopCapture = async (): Promise<void> => {
      if (!capturing) {
        return;
      }
      capturing = false;
      setPttButtonState(ptt, "processing");
      const result = await options.finishCapture();
      if (!this.root.contains(container)) return;
      await this.handleVoiceResult(result, ptt, options, showClickFallback);
    };

    ptt.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      ptt.setPointerCapture(event.pointerId);
      void beginCapture();
    });
    ptt.addEventListener("pointerup", () => void stopCapture());
    ptt.addEventListener("pointercancel", () => void stopCapture());
    ptt.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        void beginCapture();
      }
    });
    ptt.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        void stopCapture();
      }
    });
    this.registerKeyboardPtt(ptt, beginCapture, stopCapture);

    const utilities = element("div", "input-utilities");
    this.appendDebugTranscript(utilities, async (transcript) => {
      options.cancel();
      setPttButtonState(ptt, "processing");
      const handled = await options.onTranscript(transcript);
      if (!handled && this.root.contains(container)) {
        showClickFallback("판정을 확정하지 못했어. 클릭으로 골라 줘.");
      } else if (this.root.contains(ptt)) {
        setPttButtonState(ptt, "idle");
      }
    });
    container.append(utilities);
  }

  private async handleVoiceResult(
    result: RecordedVoiceResult,
    button: HTMLButtonElement,
    options: DialogueInputOptions,
    showClickFallback: (message: string) => void,
  ): Promise<void> {
    if (result.kind === "transcript") {
      this.rememberTranscription(result.observation);
      const handled = await options.onTranscript(result.transcript, result.observation);
      if (!handled && this.root.contains(button)) {
        showClickFallback("판정을 확정하지 못했어. 클릭으로 골라 줘.");
      } else if (this.root.contains(button)) {
        setPttButtonState(button, "idle");
      }
      return;
    }
    if (result.kind === "error") {
      setPttButtonState(button, "idle");
      options.onTurnFailed(result.failure);
      return;
    }
    setPttButtonState(button, "idle");
  }

  private bindHoldToTalk(
    button: HTMLButtonElement,
    options: SharedVoiceOptions,
    onTranscript: (transcript: {
      readonly text: string;
      readonly audioLevel: AudioLevelMetrics;
      readonly observation: TranscriptionObservation;
    }) => void | Promise<void>,
  ): void {
    let capturing = false;
    button.setAttribute("aria-keyshortcuts", "T Space Enter");
    button.dataset.idleLabel = button.textContent ?? "누르고 말하기 (T)";
    const begin = async (): Promise<void> => {
      if (capturing) return;
      capturing = true;
      setPttButtonState(button, "listening");
      try {
        await options.startCapture();
      } catch (error) {
        capturing = false;
        setPttButtonState(button, "idle");
        options.onUnavailable(classifyVoiceInputError(error));
      }
    };
    const finish = async (): Promise<void> => {
      if (!capturing) return;
      capturing = false;
      setPttButtonState(button, "processing");
      const result = await options.finishCapture();
      if (result.kind === "error") {
        setPttButtonState(button, "idle");
        options.onTurnFailed(result.failure);
        return;
      }
      if (result.kind === "cancelled") {
        setPttButtonState(button, "idle");
        return;
      }
      this.rememberTranscription(result.observation);
      await onTranscript({
        text: result.transcript,
        audioLevel: result.audioLevel,
        observation: result.observation,
      });
      if (button.isConnected) setPttButtonState(button, "idle");
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      void begin();
    });
    button.addEventListener("pointerup", () => void finish());
    button.addEventListener("pointercancel", () => void finish());
    button.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        void begin();
      }
    });
    button.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        void finish();
      }
    });
    this.registerKeyboardPtt(button, begin, finish);
  }

  private rememberTranscription(observation: TranscriptionObservation): void {
    if (!this.debugEnabled) return;
    this.latestTranscription = observation;
  }

  private debugTranscriptionResult(): HTMLElement {
    const result = element("section", "debug-stt-result");
    result.setAttribute("aria-live", "polite");
    if (!this.latestTranscription) {
      result.append(element("span", undefined, "인식 결과 대기 중"));
      return result;
    }
    const observation = this.latestTranscription;
    const timings = [`왕복 ${observation.roundTripMs}ms`];
    if (observation.upstreamMs !== undefined) {
      timings.push(`Worker ${observation.upstreamMs}ms`);
    }
    if (observation.firstDeltaMs !== undefined) {
      timings.push(`첫 delta ${observation.firstDeltaMs}ms`);
    }
    result.append(
      element("strong", undefined, observation.model),
      element("span", undefined, timings.join(" · ")),
      element("p", undefined, observation.text),
    );
    return result;
  }

  private registerKeyboardPtt(
    button: HTMLButtonElement,
    begin: () => void | Promise<void>,
    finish: () => void | Promise<void>,
  ): void {
    this.keyboardPttBindings.set(button, { begin, finish });
  }

  private resolveKeyboardPttTarget(): {
    button: HTMLButtonElement;
    binding: PushToTalkShortcutBinding;
  } | null {
    const focused = document.activeElement;
    if (focused instanceof HTMLButtonElement && this.root.contains(focused)) {
      const binding = this.keyboardPttBindings.get(focused);
      if (binding && !focused.disabled) return { button: focused, binding };
    }

    for (const button of this.root.querySelectorAll<HTMLButtonElement>(".ptt-button")) {
      const binding = this.keyboardPttBindings.get(button);
      if (binding && !button.disabled) return { button, binding };
    }
    return null;
  }

  private battleDebugControls(
    options: BattleInputOptions,
    battleState: BattleState,
  ): HTMLElement {
    if (!this.debugEnabled) return element("div", "hidden");
    const panel = element("section", "battle-debug");
    const momentum = element("input");
    momentum.type = "number";
    momentum.min = "20";
    momentum.max = "100";
    momentum.value = String(battleState.momentum);
    const apply = element("button", "secondary-button compact-input", "momentum 적용");
    apply.type = "button";
    apply.addEventListener("click", () => options.onDebugMomentum(Number(momentum.value)));
    const grade = element("select");
    for (const value of ["S", "A", "B"] as const) {
      const option = element("option", undefined, `${value} 등급 종료`);
      option.value = value;
      grade.append(option);
    }
    const finish = element("button", "secondary-button compact-input", "등급 재현");
    finish.type = "button";
    finish.addEventListener("click", () =>
      options.onDebugGrade(grade.value === "S" || grade.value === "A" ? grade.value : "B"),
    );
    panel.append(element("span", "muted", "DEBUG"), momentum, apply, grade, finish);
    return panel;
  }

  private appendDebugTranscript(
    container: HTMLElement,
    onSubmit: (transcript: string) => void | Promise<void>,
  ): void {
    if (!this.debugEnabled) {
      return;
    }
    const form = element("form", "debug-transcript");
    const label = element("label", undefined, "Debug transcript");
    const input = element("input");
    input.type = "text";
    input.name = "debugTranscript";
    input.placeholder = "예: 수당은 나와?";
    label.append(input);
    const submit = element("button", "secondary-button compact-input", "주입");
    submit.type = "submit";
    form.append(label, submit);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const transcript = input.value.trim();
      if (transcript) {
        void onSubmit(transcript);
      }
    });
    container.append(form);
  }
}

function microphoneSetupErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "마이크 권한이 차단됐어요. 브라우저 주소창의 권한 설정에서 마이크를 허용해 주세요.";
    }
    if (error.name === "NotFoundError") {
      return "연결된 마이크를 찾지 못했어요. 입력 장치를 연결한 뒤 다시 시도해 주세요.";
    }
    if (error.name === "OverconstrainedError") {
      return "선택한 입력 장치를 사용할 수 없어요. 다른 마이크를 선택해 주세요.";
    }
  }
  return error instanceof Error
    ? `마이크 테스트를 시작하지 못했어요: ${error.message}`
    : "마이크 테스트를 시작하지 못했어요. 장치 연결과 브라우저 권한을 확인해 주세요.";
}
