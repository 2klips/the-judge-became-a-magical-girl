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
  meterPercent,
  MicrophoneCalibrationAccumulator,
  type AudioLevelMetrics,
  type MicrophoneCalibration,
} from "../input/audioLevel";
import type {
  MicrophoneConnection,
  MicrophoneInputDevice,
} from "../input/microphoneSetup";
import type {
  RecordedVoiceResult,
  SttProviderId,
} from "../input/transcription";
import { sttProviderLabel } from "../input/transcription";
import { afterTranscriptVisible } from "../engine/dialogueTurn";
import type { GameState, InputMode } from "../state";
import { CaptionsView } from "./captions";
import { MicIndicatorView } from "./micIndicator";
import { applySceneEffect, type SceneEffect } from "./effects";
import { createGauge } from "./gauge";
import { mountParticleBurst } from "./particles";

export const VOICE_TITLE_SUBTITLE =
  "마이크를 누른 채 말하고 놓아, 정체불명의 목소리와 호흡을 맞춰 보자.";

export interface DialogueIdentity {
  speaker: string;
  brand: string;
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
  sttProvider: SttProviderId;
  notice?: string;
  forceClickForTurn?: boolean;
  startCapture(): Promise<void>;
  finishCapture(): Promise<RecordedVoiceResult>;
  cancel(): void;
  onTranscript(transcript: string): Promise<boolean>;
  onTurnFailed(message: string): void;
  onUnavailable(message: string): void;
  onModeChange(inputMode: InputMode): void;
  onProviderChange(provider: SttProviderId): void;
}

interface LineViewOptions {
  nodeId: string;
  sceneId: string;
  lineIndex: number;
  speaker: string;
  speakerId?: string;
  emotion?: Emotion;
  text: string;
  progress: string;
  continueLabel: string;
  state: GameState;
  onContinue: () => void;
}

interface SharedVoiceOptions {
  speechSupported: boolean;
  sttProvider: SttProviderId;
  notice?: string;
  startCapture(): Promise<void>;
  finishCapture(): Promise<RecordedVoiceResult>;
  cancel(): void;
  onTurnFailed(message: string): void;
  onUnavailable(message: string): void;
  onModeChange(inputMode: InputMode): void;
  onProviderChange(provider: SttProviderId): void;
}

export interface IncantationInputOptions extends SharedVoiceOptions {
  attempt: number;
  onTranscript(transcript: string): Promise<void>;
  onFallback(): void;
}

export interface BattleInputOptions extends SharedVoiceOptions {
  onTranscript(
    action: "spell" | "freeform",
    transcript: string,
    audioLevel?: AudioLevelMetrics,
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

export class GameView {
  private readonly debugEnabled: boolean;
  private currentBackgroundId: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly speechSupported: boolean,
  ) {
    this.debugEnabled = new URLSearchParams(window.location.search).has("debug");
  }

  renderLoading(): void {
    const shell = this.createShell("bg_title");
    shell.append(element("p", "loading", "게임 데이터를 검증하는 중…"));
    this.commit(shell);
  }

  renderDevScenePreview(
    preview: DevScenePreview,
    onPlayBgm?: () => void,
  ): void {
    const shell = this.createShell(preview.backgroundId);
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
          `asset-visual dev-preview-visual dev-role-${visual.role}`,
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
    const shell = this.createShell("bg_title");
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
    const shell = this.createShell("bg_title");
    shell.classList.add("title-screen");

    const titleBlock = element("section", "title-block");
    titleBlock.append(
      element("p", "eyebrow", "VOICE VISUAL NOVEL · INPUT CHECK"),
      element("h1", "game-title", "심사역은 마법소녀가 되었다"),
      element("p", "title-subtitle", "마이크가 연결되어야 플레이 가능해요"),
    );

    const setup = element("section", "microphone-setup");
    setup.dataset.state = options.microphoneSupported ? "waiting" : "unsupported";
    const setupHeader = element("div", "microphone-setup-header");
    setupHeader.append(
      element("span", "microphone-step", "01 / INPUT"),
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
      const percent = meterPercent(metrics.rmsDbfs);
      meter.style.setProperty("--microphone-level", `${percent}%`);
      meter.setAttribute("aria-valuenow", String(percent));
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
        progressOutput.textContent = "READY";
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
      setup.dataset.state = "connecting";
      status.textContent = "마이크 권한과 입력 장치를 확인하고 있어요…";
      progressOutput.textContent = "CONNECTING";
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
          progressOutput.textContent = "LISTENING";
          setup.dataset.state = "listening";
        }
      } catch (error) {
        if (sequence !== connectionSequence || !this.root.contains(shell)) return;
        setup.dataset.state = "error";
        status.textContent = microphoneSetupErrorMessage(error);
        progressOutput.textContent = "BLOCKED";
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
      void options
        .disconnectMicrophone()
        .finally(() => options.onNewGame(acceptedCalibration));
    });
    resumeButton?.addEventListener("click", () => {
      const acceptedCalibration = calibration;
      if (!acceptedCalibration) return;
      resumeButton!.disabled = true;
      void options
        .disconnectMicrophone()
        .finally(() => options.onResume(acceptedCalibration));
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
    );
    shell.append(
      this.topStatus(
        options.state,
        options.progress,
        resolveSceneBrand(options.nodeId),
      ),
    );

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
          "character-visual scene-player-visual",
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

    const panel = this.dialoguePanel(options.speaker, options.text);
    const button = element("button", "primary-button compact", options.continueLabel);
    button.type = "button";
    button.addEventListener("click", options.onContinue, { once: true });
    panel.append(button);
    shell.append(
      panel,
      this.inputStatus(options.state),
      this.debugPanel(options.state),
    );
    this.commit(shell);
  }

  renderIncantation(
    node: CutsceneNode & { incantationGate: NonNullable<CutsceneNode["incantationGate"]> },
    state: GameState,
    options: IncantationInputOptions,
  ): void {
    const gate = node.incantationGate;
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "node",
        nodeId: node.nodeId,
        baseBackground: node.scene.bg,
        stage: "incantation",
      }),
    );
    shell.classList.add("incantation-screen");
    shell.append(
      this.topStatus(state, `변신 주문 ${options.attempt}/${gate.maxAttempts}`),
      this.createAssetVisual(
        resolveDoyunVisual({ kind: "node", nodeId: node.nodeId, stage: "incantation" }) ??
          "doyun.normal_shy",
        "한도윤",
        "character-visual scene-player-visual incantation-player-visual",
      ),
    );
    const card = element("section", "incantation-card");
    card.append(
      element("p", "eyebrow", "INCANTATION GATE"),
      element("p", "incantation-copy", gate.displayText),
      element(
        "p",
        "incantation-guide",
        state.inputMode === "voice"
          ? "마이크를 누른 채 주문을 읽고, 다 읽은 뒤 버튼을 놓아."
          : "클릭 주문은 표준 변신으로 안전하게 진행돼.",
      ),
    );
    if (options.notice) card.append(element("p", "input-notice", options.notice));
    const inputArea = element("section", "incantation-input");
    const fallback = element("button", "secondary-button", "주문 외우기 · 표준 변신");
    fallback.type = "button";
    fallback.addEventListener("click", options.onFallback, { once: true });

    if (state.inputMode === "voice" && options.speechSupported) {
      const captions = new CaptionsView();
      const indicator = new MicIndicatorView();
      const controls = element("div", "voice-controls");
      const ptt = element("button", "ptt-button", "누르고 주문 읽기");
      ptt.type = "button";
      ptt.setAttribute("aria-pressed", "false");
      const provider = this.providerControl(options);
      controls.append(indicator.element, ptt, provider, fallback);
      inputArea.append(captions.element, controls);
      this.bindHoldToTalk(ptt, captions, indicator, options, async (transcript) => {
        await options.onTranscript(transcript.text);
      });
      const utilities = element("div", "input-utilities");
      this.appendDebugTranscript(utilities, async (transcript) => {
        captions.showFinal(transcript);
        await nextPaint();
        await options.onTranscript(transcript);
      });
      inputArea.append(utilities);
    } else {
      inputArea.append(fallback);
      if (options.speechSupported) {
        const voice = element("button", "secondary-button compact-input", "음성 입력으로 전환");
        voice.type = "button";
        voice.addEventListener("click", () => options.onModeChange("voice"), { once: true });
        inputArea.append(voice);
      }
    }
    card.append(inputArea);
    shell.append(card, this.inputStatus(state), this.debugPanel(state));
    this.commit(shell);
  }

  renderTransformationResult(options: {
    sceneId: string;
    outcome: "perfect" | "standard" | "rescued";
    state: GameState;
    lines: readonly string[];
    onContinue(): void;
  }): void {
    const shell = this.createShell(options.sceneId);
    applySceneEffect(shell, options.outcome === "perfect" ? "transform" : "flash");
    shell.append(
      this.createAssetVisual(
        resolveDoyunVisual({ kind: "node", nodeId: "n5_transform", stage: "transformation" }) ??
          "doyun.magical_pose",
        "마법소녀 도윤",
        "character-visual transformation-player-visual",
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
        ? "완전 변신 · MOMENTUM 60"
        : options.outcome === "rescued"
          ? "함께 완성한 변신 · MOMENTUM 50"
          : "표준 변신 · MOMENTUM 50";
    card.append(element("p", "eyebrow", "TRANSFORMATION"), element("h2", "ending-title", title));
    options.lines.forEach((line) => card.append(element("p", "ending-line", line)));
    const button = element("button", "primary-button", "언령 배틀 시작");
    button.type = "button";
    button.addEventListener("click", options.onContinue, { once: true });
    card.append(button);
    shell.append(card, this.inputStatus(options.state), this.debugPanel(options.state));
    this.commit(shell);
  }

  renderBattle(
    node: BattleNode,
    phase: BattlePhase,
    battleState: BattleState,
    state: GameState,
    options: BattleInputOptions,
  ): void {
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "battle",
        phaseId: phase.phaseId,
        beat: "prompt",
        baseBackground: node.scene.bg,
      }),
    );
    shell.classList.add("battle-screen", `enemy-${battleState.enemyState}`);
    shell.append(
      this.topStatus(
        state,
        `전투 ${battleState.phaseIndex + 1}/3 · 턴 ${battleState.phaseTurn + 1}/${phase.maxTurns}`,
      ),
    );
    const arena = element("section", "battle-arena");
    const visualStage = element("section", "battle-visual-stage");
    visualStage.setAttribute("aria-label", "전투 인물");
    visualStage.append(
      this.createAssetVisual(
        `gray_wraith.${battleState.enemyState}`,
        node.enemy.name,
        "asset-visual battle-character enemy-visual",
      ),
      this.createAssetVisual(
        resolveDoyunVisual({ kind: "battle", phaseId: phase.phaseId }) ?? "doyun.magical",
        "마법소녀 도윤",
        "asset-visual battle-character player-visual",
      ),
      this.createCharacterVisual(
        "juno",
        battleState.phaseIndex === 1 ? "happy" : "neutral",
        "주노",
        "asset-visual battle-character battle-juno-visual",
      ),
    );
    const enemy = element("div", "enemy-card");
    enemy.append(
      element("p", "eyebrow", node.enemy.name),
      element("p", "enemy-prompt", phase.enemyPrompt),
      element(
        "span",
        "enemy-state",
        battleState.enemyState === "weakened" ? "흔들림" : "정상",
      ),
    );
    arena.append(
      visualStage,
      enemy,
      createGauge("MOMENTUM", battleState.momentum, 20, 100),
    );
    const command = element("section", "battle-command");
    command.append(
      element("p", "prompt-label", "페이즈 주문"),
      element("p", "battle-spell", phase.spell.displayText),
    );
    if (options.notice) command.append(element("p", "input-notice", options.notice));
    const captions = new CaptionsView();
    command.append(captions.element);

    if (state.inputMode === "voice" && options.speechSupported) {
      const indicator = new MicIndicatorView();
      const controls = element("div", "battle-actions");
      const spell = element("button", "ptt-button", "주문 · 누르고 말하기");
      const freeform = element("button", "ptt-button freeform-button", "자유 대응 · 누르고 말하기");
      const guard = element("button", "secondary-button", "버티기 +3");
      for (const button of [spell, freeform, guard]) button.type = "button";
      guard.addEventListener("click", options.onGuard, { once: true });
      controls.append(indicator.element, spell, freeform, guard, this.providerControl(options));
      command.append(controls);
      this.bindHoldToTalk(spell, captions, indicator, options, (transcript) =>
        options.onTranscript("spell", transcript.text, transcript.audioLevel),
      );
      this.bindHoldToTalk(freeform, captions, indicator, options, (transcript) =>
        options.onTranscript("freeform", transcript.text, transcript.audioLevel),
      );
      const clickMode = element("button", "secondary-button compact-input", "클릭으로 전환");
      clickMode.type = "button";
      clickMode.addEventListener("click", () => options.onModeChange("click"), { once: true });
      command.append(clickMode);
    } else {
      const choices = element("div", "choice-list battle-choice-list");
      const spell = element("button", "primary-button", "주문 시전 · 성공 +15");
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
      const guard = element("button", "secondary-button", "버티기 +3");
      guard.type = "button";
      guard.addEventListener("click", options.onGuard, { once: true });
      choices.append(guard);
      command.append(choices);
      if (options.speechSupported) {
        const voice = element("button", "secondary-button compact-input", "음성 입력으로 전환");
        voice.type = "button";
        voice.addEventListener("click", () => options.onModeChange("voice"), { once: true });
        command.append(voice);
      }
    }
    const utilities = element("div", "input-utilities");
    this.appendDebugTranscript(utilities, async (transcript) => {
      captions.showFinal(transcript);
      await nextPaint();
      await options.onTranscript("spell", transcript);
    });
    command.append(utilities, this.battleDebugControls(options, battleState));
    arena.append(command);
    shell.append(arena, this.inputStatus(state), this.debugPanel(state));
    this.commit(shell);
  }

  renderBattleReply(options: {
    sceneId: string;
    phaseId: string;
    enemyName: string;
    actionLabel: string;
    reply: string;
    narration?: string;
    battleState: BattleState;
    state: GameState;
    completed: boolean;
    grade: BattleGrade | null;
    effect: SceneEffect;
    onContinue(): void;
  }): void {
    const shell = this.createShell(options.sceneId);
    shell.classList.add("battle-screen");
    applySceneEffect(shell, options.effect);
    shell.append(
      this.topStatus(
        options.state,
        options.completed ? `전투 종료 · ${options.grade} 등급` : `전투 ${options.battleState.phaseIndex + 1}/3`,
      ),
    );
    const card = element("section", "battle-result-card");
    card.append(
      this.createAssetVisual(
        resolveDoyunVisual({ kind: "battle", phaseId: options.phaseId }) ?? "doyun.magical",
        "마법소녀 도윤",
        "asset-visual battle-reply-player",
      ),
      this.createAssetVisual(
        `gray_wraith.${options.battleState.enemyState}`,
        options.enemyName,
        "asset-visual battle-reply-character",
      ),
      this.createCharacterVisual(
        "juno",
        options.battleState.phaseIndex === 1 ? "happy" : "neutral",
        "주노",
        "asset-visual battle-reply-juno",
      ),
    );
    card.append(
      element("p", "player-line", `도윤 · ${options.actionLabel}`),
      createGauge("MOMENTUM", options.battleState.momentum, 20, 100),
      this.dialoguePanel(options.enemyName, options.reply),
    );
    if (options.narration) card.append(element("p", "ending-line", options.narration));
    const button = element(
      "button",
      "primary-button",
      options.completed ? `${options.grade} 등급으로 수렴` : "다음 행동",
    );
    button.type = "button";
    button.addEventListener("click", options.onContinue, { once: true });
    card.append(button);
    shell.append(card, this.inputStatus(options.state), this.debugPanel(options.state));
    this.commit(shell);
  }

  renderDialogue(
    node: DialogueNode,
    character: Character,
    state: GameState,
    onSelect: (intentId: string) => void,
    inputOptions: DialogueInputOptions,
  ): void {
    const shell = this.createShell(
      resolvePresentationBackground({
        kind: "node",
        nodeId: node.nodeId,
        baseBackground: node.scene.bg,
      }),
    );
    const identity = resolveDialogueIdentity(node.nodeId, character.name);
    shell.append(
      this.topStatus(
        state,
        `대화 ${state.nodeTurn + 1}/${node.maxTurns}`,
        identity.brand,
      ),
    );
    this.appendDialogueVisuals(
      shell,
      node.nodeId,
      character,
      node.npc.startEmotion,
    );

    const panel = this.dialoguePanel(identity.speaker, node.opening);
    const inputArea = element("section", "dialogue-input");
    inputArea.dataset.inputMode = state.inputMode;
    panel.append(inputArea);
    if (
      state.inputMode === "voice" &&
      inputOptions.speechSupported &&
      !inputOptions.forceClickForTurn
    ) {
      this.renderVoiceInput(inputArea, node, onSelect, inputOptions);
    } else {
      this.renderClickInput(
        inputArea,
        node,
        onSelect,
        inputOptions,
        inputOptions.notice,
        !inputOptions.forceClickForTurn,
      );
    }

    shell.append(panel, this.inputStatus(state), this.debugPanel(state));
    this.commit(shell);
  }

  renderDialogueReply(options: {
    nodeId: string;
    sceneId: string;
    characterId: string;
    emotion: Emotion;
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
    );
    const identity = resolveDialogueIdentity(options.nodeId, options.speaker);
    shell.append(
      this.topStatus(
        options.state,
        `누적 ${options.state.totalTurn}턴`,
        identity.brand,
      ),
    );
    this.appendDialogueVisuals(
      shell,
      options.nodeId,
      { id: options.characterId, name: identity.speaker },
      options.emotion,
    );
    const panel = this.dialoguePanel(identity.speaker, options.reply);
    panel.insertBefore(
      element("p", "player-line", `도윤 · ${options.selectedLabel}`),
      panel.firstChild,
    );
    const button = element(
      "button",
      "primary-button compact",
      options.advanced ? "다음 장면" : "계속 대화",
    );
    button.type = "button";
    button.addEventListener("click", options.onContinue, { once: true });
    panel.append(button);
    shell.append(
      panel,
      this.inputStatus(options.state),
      this.debugPanel(options.state),
    );
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
      const shell = this.createShell(page.sceneId);
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
            "character-visual ending-player-visual",
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
        element("p", "eyebrow", `${node.endingId.toUpperCase()} ENDING`),
        element("h2", "ending-title", pages[0]?.line.text ?? "엔딩"),
        element("p", "ending-progress", `${page.lineIndex + 1}/${page.total}`),
      );
      if (page.lineIndex > 0) {
        const speaker =
          page.line.speaker === "narration"
            ? ""
            : `${characterNames.get(page.line.speaker) ?? page.line.speaker} · `;
        card.append(element("p", "ending-line", `${speaker}${page.line.text}`));
      }

      const button = element(
        "button",
        "primary-button",
        page.isLast ? "처음부터" : "계속",
      );
      button.type = "button";
      if (page.isLast) {
        card.append(
          element(
            "p",
            "ending-summary",
            `호감도 ${state.affinity} · 플래그 ${[...state.flags].join(", ") || "없음"}`,
          ),
        );
        button.addEventListener("click", onNewGame, { once: true });
      } else {
        button.addEventListener(
          "click",
          () => {
            pageIndex += 1;
            renderPage();
          },
          { once: true },
        );
      }
      card.append(button);
      shell.append(card, this.debugPanel(state));
      this.commit(shell);
    };

    renderPage();
  }

  renderError(error: unknown): void {
    const shell = this.createShell("bg_hall_dark");
    const panel = element("section", "error-panel");
    panel.append(
      element("p", "eyebrow", "DATA VALIDATION ERROR"),
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

  private createShell(sceneId: string): HTMLElement {
    const shell = element("main", "game-shell");
    shell.dataset.scene = sceneId;
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
      if (isFallback && contract.fallbackClass) {
        shell.classList.add(contract.fallbackClass);
      }
      shell.prepend(image);
    };

    usePath(contract.primaryPath, false);
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
  ): void {
    const doyunVisual = resolveDoyunVisual({ kind: "node", nodeId });
    if (doyunVisual) {
      shell.append(
        this.createAssetVisual(
          doyunVisual,
          "한도윤",
          "character-visual scene-player-visual dialogue-player-visual",
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
    const showPlaceholder = (): void => {
      const presentation = resolveMissingAssetPresentation(label);
      const placeholder = element("div", presentation.className);
      placeholder.setAttribute("role", "img");
      placeholder.setAttribute("aria-label", presentation.ariaLabel);
      figure.replaceChildren(placeholder);
      figure.classList.add("is-placeholder", "is-black-placeholder");
    };

    if (!resolvedPath || isAssetPathUnavailable(resolvedPath)) {
      showPlaceholder();
      return figure;
    }

    const image = element("img", "asset-image");
    image.alt = label;
    image.decoding = "async";
    image.src = assetUrl(resolvedPath);
    image.addEventListener(
      "error",
      () => {
        reportAssetLoadFailure(logicalId, resolvedPath);
        showPlaceholder();
      },
      { once: true },
    );
    figure.append(image);
    return figure;
  }

  private topStatus(
    state: GameState,
    progress: string,
    brand = "JUNO // LINK",
  ): HTMLElement {
    const status = element("header", "top-status");
    status.append(
      element("span", "brand-mark", brand),
      element("span", "status-chip", `호감도 ${state.affinity}`),
      element("span", "status-chip", progress),
    );
    return status;
  }

  private dialoguePanel(speaker: string, text: string): HTMLElement {
    const panel = element("section", "dialogue-panel");
    panel.setAttribute("aria-live", "polite");
    panel.append(
      element("div", "nameplate", speaker),
      element("p", "dialogue-text", text),
    );
    return panel;
  }

  private inputStatus(state?: GameState): HTMLElement {
    const status = element("div", "input-status");
    const mode = state?.inputMode ?? (this.speechSupported ? "voice" : "click");
    status.append(
      element("span", "input-dot"),
      element("span", undefined, mode === "voice" ? "음성 모드" : "클릭 모드"),
      element("span", "input-divider", "·"),
      element(
        "span",
        "muted",
        state
          ? `STT 실패 ${state.sttFailCount}/5 · LLM 실패 ${state.llmFailCount}/3`
          : "STT 우선 · 클릭 폴백",
      ),
    );
    return status;
  }

  private debugPanel(state: GameState): HTMLElement {
    if (!this.debugEnabled) {
      return element("div", "debug-panel hidden");
    }
    const panel = element("details", "debug-panel") as HTMLDetailsElement;
    panel.open = true;
    panel.append(element("summary", undefined, "M5 상태"));
    const output = element("pre");
    output.textContent = JSON.stringify(
      {
        ...state,
        flags: [...state.flags],
      },
      null,
      2,
    );
    panel.append(output);
    return panel;
  }

  private commit(shell: HTMLElement): void {
    if (this.debugEnabled) {
      shell.append(this.devSceneNavigator());
    }
    this.root.replaceChildren(shell);
    this.currentBackgroundId = shell.dataset.scene ?? null;
  }

  private devSceneNavigator(): HTMLElement {
    const nav = element("aside", "dev-scene-nav");
    nav.setAttribute("aria-label", "M5 장면 선택기");
    const label = element("label", undefined, "DEV 장면");
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
    nav.append(label);
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
    if (options.notice) {
      container.append(element("p", "input-notice", options.notice));
    }
    container.append(
      element("p", "prompt-label", "마이크를 누른 채 말하고, 놓으면 판정해."),
    );
    const captions = new CaptionsView();
    const indicator = new MicIndicatorView();
    const controls = element("div", "voice-controls");
    const ptt = element("button", "ptt-button", "누르고 말하기");
    ptt.type = "button";
    ptt.setAttribute("aria-pressed", "false");
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
    const provider = element("label", "provider-control");
    provider.append(element("span", undefined, "STT"));
    const providerSelect = element("select", "provider-select");
    for (const id of ["openai", "gemini"] as const) {
      const option = element("option", undefined, sttProviderLabel(id));
      option.value = id;
      option.selected = id === options.sttProvider;
      providerSelect.append(option);
    }
    providerSelect.addEventListener("change", () => {
      options.cancel();
      options.onProviderChange(providerSelect.value === "gemini" ? "gemini" : "openai");
    });
    provider.append(providerSelect);
    controls.append(indicator.element, ptt, provider, clickButton);
    container.append(captions.element, controls);

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
      ptt.setAttribute("aria-pressed", "true");
      ptt.textContent = "듣는 중… 놓아서 전송";
      indicator.setState("listening");
      captions.showMessage("녹음 중 · 버튼을 떼면 종료");
      try {
        await options.startCapture();
      } catch (error) {
        capturing = false;
        ptt.setAttribute("aria-pressed", "false");
        ptt.textContent = "누르고 말하기";
        indicator.setState("error", "microphone");
        options.onUnavailable(microphoneErrorMessage(error));
      }
    };
    const stopCapture = async (): Promise<void> => {
      if (!capturing) {
        return;
      }
      capturing = false;
      indicator.setState("processing");
      captions.showMessage(`${sttProviderLabel(options.sttProvider)} 전사 중…`);
      const result = await options.finishCapture();
      if (!this.root.contains(container)) return;
      ptt.setAttribute("aria-pressed", "false");
      ptt.textContent = "누르고 말하기";
      await this.handleVoiceResult(result, captions, indicator, options, showClickFallback);
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

    const utilities = element("div", "input-utilities");
    this.appendDebugTranscript(utilities, async (transcript) => {
      options.cancel();
      indicator.setState("processing", "debug transcript");
      const handled = await afterTranscriptVisible(
        transcript,
        async (visibleTranscript) => {
          captions.showFinal(visibleTranscript);
          await nextPaint();
        },
        () => options.onTranscript(transcript),
      );
      if (!handled && this.root.contains(container)) {
        showClickFallback("판정을 확정하지 못했어. 클릭으로 골라 줘.");
      }
    });
    container.append(utilities);
  }

  private async handleVoiceResult(
    result: RecordedVoiceResult,
    captions: CaptionsView,
    indicator: MicIndicatorView,
    options: DialogueInputOptions,
    showClickFallback: (message: string) => void,
  ): Promise<void> {
    if (result.kind === "transcript") {
      indicator.setState("processing", "전사 확인");
      const handled = await afterTranscriptVisible(
        result.transcript,
        async (transcript) => {
          captions.showFinal(transcript);
          await nextPaint();
        },
        () => options.onTranscript(result.transcript),
      );
      if (!handled && this.root.contains(captions.element)) {
        showClickFallback("판정을 확정하지 못했어. 클릭으로 골라 줘.");
      }
      return;
    }
    if (result.kind === "error") {
      captions.showMessage(result.error.message);
      indicator.setState("error", "STT");
      options.onTurnFailed(result.error.message);
    }
  }

  private providerControl(options: SharedVoiceOptions): HTMLLabelElement {
    const provider = element("label", "provider-control");
    provider.append(element("span", undefined, "STT"));
    const select = element("select", "provider-select");
    for (const id of ["openai", "gemini"] as const) {
      const option = element("option", undefined, sttProviderLabel(id));
      option.value = id;
      option.selected = id === options.sttProvider;
      select.append(option);
    }
    select.addEventListener("change", () => {
      options.cancel();
      options.onProviderChange(select.value === "gemini" ? "gemini" : "openai");
    });
    provider.append(select);
    return provider;
  }

  private bindHoldToTalk(
    button: HTMLButtonElement,
    captions: CaptionsView,
    indicator: MicIndicatorView,
    options: SharedVoiceOptions,
    onTranscript: (transcript: {
      readonly text: string;
      readonly audioLevel: AudioLevelMetrics;
    }) => void | Promise<void>,
  ): void {
    let capturing = false;
    const begin = async (): Promise<void> => {
      if (capturing) return;
      capturing = true;
      button.setAttribute("aria-pressed", "true");
      const label = button.textContent ?? "누르고 말하기";
      button.dataset.idleLabel = label;
      button.textContent = "듣는 중… 놓아서 전송";
      indicator.setState("listening");
      captions.showMessage("녹음 중 · 버튼을 떼면 종료");
      try {
        await options.startCapture();
      } catch (error) {
        capturing = false;
        button.setAttribute("aria-pressed", "false");
        button.textContent = button.dataset.idleLabel ?? "누르고 말하기";
        indicator.setState("error", "microphone");
        options.onUnavailable(microphoneErrorMessage(error));
      }
    };
    const finish = async (): Promise<void> => {
      if (!capturing) return;
      capturing = false;
      indicator.setState("processing");
      captions.showMessage(`${sttProviderLabel(options.sttProvider)} 전사 중…`);
      const result = await options.finishCapture();
      button.setAttribute("aria-pressed", "false");
      button.textContent = button.dataset.idleLabel ?? "누르고 말하기";
      if (result.kind === "error") {
        captions.showMessage(result.error.message);
        indicator.setState("error", "STT");
        options.onTurnFailed(result.error.message);
        return;
      }
      if (result.kind === "cancelled") {
        captions.showMessage("입력이 취소됐어.");
        indicator.setState("idle");
        return;
      }
      indicator.setState("processing", "전사 확인");
      await afterTranscriptVisible(
        result.transcript,
        async (transcript) => {
          captions.showFinal(transcript);
          await nextPaint();
        },
        () => onTranscript({ text: result.transcript, audioLevel: result.audioLevel }),
      );
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
  }

  private battleDebugControls(
    options: BattleInputOptions,
    battleState: BattleState,
  ): HTMLElement {
    if (!this.debugEnabled) return element("div", "debug-panel hidden");
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

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "마이크 권한이 거부됐어. 클릭 모드로 계속할게.";
  }
  return "마이크 녹음을 시작할 수 없어. 클릭 모드로 계속할게.";
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
