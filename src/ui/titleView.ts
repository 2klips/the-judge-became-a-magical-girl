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
import type { InputMode } from "../state";
import { presentTitleMic, reduceTitleMic, type TitleMicState } from "./titleMicState";
import {
  enterGameFromTitle,
  installFirstTitleGesture,
  resolveTitleResume,
  resolveTitleStart,
} from "./titleStart";

export const TITLE_MENU_COPY = {
  start: { label: "게임 시작", description: "목소리로 이어지는 이야기를 처음부터 시작합니다." },
  continueWithSave: { label: "이어하기", description: "마지막으로 저장된 장면부터 이야기를 이어갑니다." },
  continueWithoutSave: { label: "이어하기", description: "아직 저장된 이야기가 없습니다." },
  settings: { label: "설정", description: "음량과 마이크 등 플레이 환경을 설정합니다." },
} as const;

export const TITLE_HEADING_LINES = ["심사역은", "마법소녀가 되었다"] as const;

export interface TitleAudioOptions {
  getVolume(): number;
  isMuted(): boolean;
  onVolumeChange(volume: number): void;
  onMutedChange(muted: boolean): void;
}

export interface TitleMicrophoneOptions {
  readonly supported: boolean;
  connect(deviceId: string | undefined, onLevel: (metrics: AudioLevelMetrics) => void): Promise<MicrophoneConnection>;
  disconnect(): Promise<void>;
  queryPermission(): Promise<PermissionState | "unknown">;
  subscribeDeviceChange(listener: () => void): () => void;
}

export interface TitleMicrophoneSnapshot {
  readonly state: TitleMicState;
  readonly devices: readonly MicrophoneInputDevice[];
  readonly selectedDeviceId: string;
  readonly deviceLabel: string | undefined;
  readonly canRequestAgain: boolean;
  readonly calibration: MicrophoneCalibration | null;
  readonly level: { readonly percent: number; readonly tone: "quiet" | "good" | "loud" };
}

export interface TitleViewOptions {
  readonly hasSave: boolean;
  readonly savedInputMode: InputMode | null;
  readonly warning: string | null;
  readonly audio: TitleAudioOptions;
  readonly microphone: TitleMicrophoneOptions;
  onFirstUserGesture(): void;
  onNewGame(mode: InputMode, calibration: MicrophoneCalibration | null): void;
  onResume(mode: InputMode, calibration: MicrophoneCalibration | null): void;
}

export class TitleMicrophoneSession {
  private state: TitleMicState;
  private devices: readonly MicrophoneInputDevice[] = [];
  private selectedDeviceId = "";
  private deviceLabel: string | undefined;
  private canRequestAgain = true;
  private calibration: MicrophoneCalibration | null = null;
  private level: TitleMicrophoneSnapshot["level"] = { percent: 0, tone: "quiet" };
  private accumulator = new MicrophoneCalibrationAccumulator();
  private lastReadingAt = 0;
  private hasActiveConnection = false;
  private unsubscribeDeviceChange: (() => void) | null = null;
  private connectionPromise: Promise<void> | null = null;
  private destroyed = false;

  constructor(
    private readonly microphone: TitleMicrophoneOptions,
    private readonly onChange: (snapshot: TitleMicrophoneSnapshot) => void,
    private readonly now: () => number = () => performance.now(),
  ) {
    this.state = microphone.supported ? "UNKNOWN" : "UNSUPPORTED";
  }

  start(): void {
    if (this.destroyed || this.unsubscribeDeviceChange) return;
    this.unsubscribeDeviceChange = this.microphone.subscribeDeviceChange(this.handleDeviceChange);
    this.emit();
  }

  snapshot(): TitleMicrophoneSnapshot {
    return {
      state: this.state,
      devices: this.devices,
      selectedDeviceId: this.selectedDeviceId,
      deviceLabel: this.deviceLabel,
      canRequestAgain: this.canRequestAgain,
      calibration: this.calibration,
      level: this.level,
    };
  }

  requestSetup(deviceId?: string): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    if (!this.microphone.supported) {
      this.state = reduceTitleMic(this.state, { type: "UNSUPPORTED" });
      this.emit();
      return Promise.resolve();
    }
    if (this.connectionPromise) return this.connectionPromise;
    this.connectionPromise = this.connect(deviceId, false).finally(() => {
      this.connectionPromise = null;
    });
    return this.connectionPromise;
  }

  startTest(): void {
    if (!this.hasActiveConnection) return;
    const next = this.state === "TEST_SUCCESS"
      ? reduceTitleMic(this.state, { type: "RETEST" })
      : reduceTitleMic(this.state, { type: "START_TEST" });
    if (next !== "TESTING") return;
    this.state = next;
    this.accumulator = new MicrophoneCalibrationAccumulator();
    this.calibration = null;
    this.level = { percent: 0, tone: "quiet" };
    this.lastReadingAt = this.now();
    this.emit();
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.unsubscribeDeviceChange?.();
    this.unsubscribeDeviceChange = null;
    if (this.hasActiveConnection || this.connectionPromise) {
      this.hasActiveConnection = false;
      await this.microphone.disconnect().catch(() => undefined);
    }
  }

  private readonly handleLevel = (metrics: AudioLevelMetrics): void => {
    if (this.destroyed) return;
    const meterState = this.state === "TESTING" ? this.accumulator.state : "waiting";
    this.level = resolveMicrophoneMeterPresentation(metrics, meterState);
    if (this.state === "TESTING") {
      const now = this.now();
      const state = this.accumulator.add(metrics, Math.min(100, Math.max(16, now - this.lastReadingAt)));
      this.lastReadingAt = now;
      if (state === "passed") {
        const measured = this.accumulator.calibration();
        this.calibration = measured ? { ...measured, inputDeviceId: this.selectedDeviceId || undefined } : null;
        this.state = reduceTitleMic(this.state, { type: "TEST_PASSED" });
      }
    }
    this.emit();
  };

  private readonly handleDeviceChange = (): void => {
    if (this.destroyed || this.connectionPromise || !this.hasActiveConnection) return;
    if (this.state !== "READY" && this.state !== "TESTING" && this.state !== "TEST_SUCCESS") return;
    this.connectionPromise = this.connect(this.selectedDeviceId || undefined, true).finally(() => {
      this.connectionPromise = null;
    });
  };

  private async connect(deviceId: string | undefined, reconnect: boolean): Promise<void> {
    this.state = reduceTitleMic(this.state, { type: "REQUEST_SETUP" });
    this.calibration = null;
    this.level = { percent: 0, tone: "quiet" };
    this.emit();
    try {
      if (reconnect) {
        this.hasActiveConnection = false;
        await this.microphone.disconnect();
      }
      const connection = await this.microphone.connect(deviceId, this.handleLevel);
      if (this.destroyed) {
        await this.microphone.disconnect().catch(() => undefined);
        return;
      }
      if (connection.devices.length === 0) {
        await this.microphone.disconnect().catch(() => undefined);
        this.state = reduceTitleMic(this.state, { type: "NO_DEVICE" });
        this.emit();
        return;
      }
      this.devices = connection.devices;
      this.selectedDeviceId = connection.selectedDeviceId;
      this.deviceLabel = connection.devices.find(({ deviceId: id }) => id === connection.selectedDeviceId)?.label ?? connection.devices[0]?.label;
      this.hasActiveConnection = true;
      this.canRequestAgain = true;
      this.state = reduceTitleMic(this.state, { type: "PERMISSION_GRANTED" });
      this.emit();
    } catch (error) {
      if (this.destroyed) return;
      this.hasActiveConnection = false;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        const permission = await this.microphone.queryPermission();
        this.canRequestAgain = permission === "prompt";
        this.state = reduceTitleMic(this.state, { type: "PERMISSION_DENIED", canRequestAgain: this.canRequestAgain });
      } else if (error instanceof DOMException && (error.name === "NotFoundError" || error.name === "OverconstrainedError")) {
        this.state = reduceTitleMic(this.state, { type: "NO_DEVICE" });
      } else {
        this.state = reduceTitleMic(this.state, { type: "FAILED" });
      }
      this.emit();
    }
  }

  private emit(): void {
    if (!this.destroyed) this.onChange(this.snapshot());
  }
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setAriaDisabled(button: HTMLButtonElement, disabled: boolean): void {
  button.setAttribute("aria-disabled", String(disabled));
  button.dataset.inactive = String(disabled);
}

function dialogFocusables(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hidden);
}

export class TitleView {
  private destroyed = false;
  private microphoneSession: TitleMicrophoneSession | null = null;
  private cleanupFirstGesture: (() => void) | null = null;

  constructor(private readonly shell: HTMLElement, private readonly options: TitleViewOptions) {}

  render(): void {
    const content = node("main", "title-content");
    const hero = node("header", "title-hero");
    const subtitle = node("p", "title-kicker", "목소리로 이어지는 이야기");
    const heading = node("h1", "title-heading");
    const firstLine = node("span", "title-heading-line", TITLE_HEADING_LINES[0]);
    const secondLine = node("span", "title-heading-line");
    secondLine.append(node("span", "title-heading-accent", "마법소녀"), document.createTextNode(TITLE_HEADING_LINES[1].slice("마법소녀".length)));
    heading.append(firstLine, secondLine);
    hero.append(subtitle, heading);

    const descriptionId = "title-menu-description";
    const menu = node("nav", "title-menu");
    menu.setAttribute("aria-label", "메인 메뉴");
    const description = node("p", "title-menu-description");
    description.id = descriptionId;
    description.setAttribute("aria-live", "polite");
    const createMenuButton = (icon: string, copy: { readonly label: string; readonly description: string }): HTMLButtonElement => {
      const button = node("button", "title-menu-item");
      button.type = "button";
      button.setAttribute("aria-describedby", descriptionId);
      const iconNode = node("span", "title-menu-icon", icon);
      iconNode.setAttribute("aria-hidden", "true");
      button.append(iconNode, node("span", "title-menu-label", copy.label));
      const showDescription = (): void => {
        description.textContent = copy.description;
        description.dataset.for = button.dataset.menu ?? "";
        description.dataset.visible = "true";
      };
      const hideDescription = (): void => {
        if (document.activeElement === button || button.matches(":hover")) return;
        description.dataset.visible = "false";
      };
      button.addEventListener("pointerenter", showDescription);
      button.addEventListener("pointerleave", hideDescription);
      button.addEventListener("focus", showDescription);
      button.addEventListener("blur", hideDescription);
      return button;
    };
    const startButton = createMenuButton("✦", TITLE_MENU_COPY.start);
    startButton.dataset.menu = "start";
    const continueCopy = this.options.hasSave ? TITLE_MENU_COPY.continueWithSave : TITLE_MENU_COPY.continueWithoutSave;
    const continueButton = createMenuButton("▷", continueCopy);
    continueButton.dataset.menu = "continue";
    continueButton.dataset.noSave = String(!this.options.hasSave);
    const settingsButton = createMenuButton("⚙", TITLE_MENU_COPY.settings);
    settingsButton.dataset.menu = "settings";
    settingsButton.setAttribute("aria-haspopup", "dialog");
    setAriaDisabled(startButton, false);
    setAriaDisabled(continueButton, !this.options.hasSave);
    menu.append(startButton, continueButton, settingsButton, description);

    const microphone = node("section", "title-mic");
    microphone.setAttribute("aria-labelledby", "title-mic-heading");
    const micMark = node("span", "title-mic-mark", "○");
    micMark.setAttribute("aria-hidden", "true");
    const micCopy = node("div", "title-mic-copy");
    const micHeading = node("h2", "title-mic-heading");
    micHeading.id = "title-mic-heading";
    const micBody = node("p", "title-mic-body");
    micBody.setAttribute("data-title-mic-body", "");
    micBody.setAttribute("aria-live", "polite");
    micCopy.append(micHeading, micBody);
    const micAction = node("button", "title-mic-action");
    micAction.type = "button";
    microphone.append(micMark, micCopy, micAction);
    if (this.options.warning) microphone.append(node("p", "title-warning", this.options.warning));

    const audioBindings: Array<{ readonly mute: HTMLButtonElement; readonly slider: HTMLInputElement; readonly output: HTMLOutputElement }> = [];
    let muted = this.options.audio.isMuted();
    let currentVolume = this.options.audio.getVolume();
    const syncAudio = (): void => {
      const percent = Math.round(currentVolume * 100);
      for (const binding of audioBindings) {
        binding.slider.value = String(percent);
        binding.output.value = `${percent}%`;
        binding.output.textContent = `${percent}%`;
        binding.mute.dataset.muted = String(muted);
        binding.mute.setAttribute("aria-pressed", String(muted));
        binding.mute.setAttribute("aria-label", muted ? "BGM 음소거 해제" : "BGM 음소거");
      }
    };
    const bindAudio = (mute: HTMLButtonElement, slider: HTMLInputElement, output: HTMLOutputElement): void => {
      audioBindings.push({ mute, slider, output });
      mute.addEventListener("click", () => {
        muted = !muted;
        this.options.audio.onMutedChange(muted);
        syncAudio();
      });
      slider.addEventListener("input", () => {
        currentVolume = Number(slider.value) / 100;
        this.options.audio.onVolumeChange(currentVolume);
        syncAudio();
      });
    };
    const makeSlider = (className: string): HTMLInputElement => {
      const slider = document.createElement("input");
      slider.className = className;
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.step = "1";
      slider.setAttribute("aria-label", "BGM 볼륨");
      return slider;
    };
    const audio = node("aside", "title-bgm");
    audio.setAttribute("aria-label", "배경 음악 설정");
    const hudMute = node("button", "title-bgm-mute", "BGM");
    hudMute.type = "button";
    const hudSlider = makeSlider("title-bgm-slider");
    const hudVolume = node("output", "title-bgm-volume");
    bindAudio(hudMute, hudSlider, hudVolume);
    audio.append(hudMute, hudSlider, hudVolume);

    const settingsDialog = document.createElement("dialog");
    settingsDialog.className = "title-settings-dialog";
    settingsDialog.setAttribute("aria-labelledby", "title-settings-heading");
    settingsDialog.setAttribute("aria-modal", "true");
    const settingsHeader = node("header", "title-dialog-header");
    const settingsHeading = node("h2", undefined, "설정");
    settingsHeading.id = "title-settings-heading";
    const settingsX = node("button", "title-dialog-x", "×");
    settingsX.type = "button";
    settingsX.setAttribute("aria-label", "설정 닫기");
    settingsHeader.append(settingsHeading, settingsX);
    const settingsAudio = node("section", "title-settings-section");
    settingsAudio.append(node("h3", undefined, "BGM"));
    const settingsAudioRow = node("div", "title-settings-audio");
    const settingsMute = node("button", "title-settings-mute", "음소거");
    settingsMute.type = "button";
    const settingsSlider = makeSlider("title-settings-slider");
    const settingsVolume = node("output", "title-settings-volume");
    bindAudio(settingsMute, settingsSlider, settingsVolume);
    settingsAudioRow.append(settingsMute, settingsSlider, settingsVolume);
    settingsAudio.append(settingsAudioRow);
    const settingsMic = node("section", "title-settings-section");
    settingsMic.append(node("h3", undefined, "마이크"));
    const deviceSelect = document.createElement("select");
    deviceSelect.className = "title-mic-device";
    deviceSelect.setAttribute("aria-label", "입력 장치");
    deviceSelect.disabled = true;
    deviceSelect.append(node("option", undefined, "마이크 설정 후 장치를 선택할 수 있어요"));
    const settingsMicHeading = node("p", "title-settings-mic-heading");
    const settingsMicBody = node("p", "title-settings-mic-body");
    settingsMicBody.setAttribute("data-title-mic-body", "");
    settingsMicBody.setAttribute("aria-live", "polite");
    const settingsMeter = node("div", "title-mic-meter");
    settingsMeter.setAttribute("aria-hidden", "true");
    settingsMeter.append(node("span", "title-mic-meter-fill"));
    const settingsMicAction = node("button", "title-settings-mic-action");
    settingsMicAction.type = "button";
    settingsMic.append(deviceSelect, settingsMicHeading, settingsMicBody, settingsMeter, settingsMicAction);
    const settingsClose = node("button", "title-dialog-close", "닫기");
    settingsClose.type = "button";
    settingsDialog.append(settingsHeader, settingsAudio, settingsMic, settingsClose);

    const setBackgroundInert = (inert: boolean): void => {
      content.inert = inert;
      audio.inert = inert;
    };
    const trapDialogFocus = (dialog: HTMLDialogElement, event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = dialogFocusables(dialog);
      const first = focusables[0];
      const last = focusables.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const openSettings = (): void => {
      setBackgroundInert(true);
      settingsDialog.showModal();
      queueMicrotask(() => settingsX.focus());
    };
    const finishSettingsClose = (): void => {
      setBackgroundInert(false);
      settingsButton.focus();
    };
    settingsButton.addEventListener("click", openSettings);
    settingsX.addEventListener("click", () => settingsDialog.close());
    settingsClose.addEventListener("click", () => settingsDialog.close());
    settingsDialog.addEventListener("keydown", (event) => trapDialogFocus(settingsDialog, event));
    settingsDialog.addEventListener("close", finishSettingsClose);

    const modeDialog = document.createElement("dialog");
    modeDialog.className = "title-mode-dialog";
    modeDialog.setAttribute("aria-modal", "true");
    modeDialog.setAttribute("aria-labelledby", "title-mode-heading");
    const modeHeading = node("h2");
    modeHeading.id = "title-mode-heading";
    const modeBody = node("p", "title-mode-body");
    const modePrimary = node("button", "title-mode-primary");
    modePrimary.type = "button";
    const modeSecondary = node("button", "title-mode-secondary");
    modeSecondary.type = "button";
    const modeCancel = node("button", "title-dialog-x", "×");
    modeCancel.type = "button";
    modeCancel.setAttribute("aria-label", "선택 닫기");
    modeDialog.append(modeCancel, modeHeading, modeBody, modePrimary, modeSecondary);
    let modeTrigger: HTMLButtonElement = startButton;
    const closeMode = (): void => {
      if (modeDialog.open) modeDialog.close();
    };
    modeDialog.addEventListener("keydown", (event) => trapDialogFocus(modeDialog, event));
    modeDialog.addEventListener("close", () => {
      setBackgroundInert(false);
      modeTrigger.focus();
    });
    modeCancel.addEventListener("click", closeMode);

    let renderedDeviceSignature = "";
    const renderDevices = (snapshot: TitleMicrophoneSnapshot): void => {
      const signature = `${snapshot.state === "REQUESTING_PERMISSION"}:${snapshot.selectedDeviceId}:${snapshot.devices.map(({ deviceId, label }) => `${deviceId}:${label}`).join("|")}`;
      if (signature === renderedDeviceSignature) return;
      renderedDeviceSignature = signature;
      deviceSelect.replaceChildren();
      if (snapshot.devices.length === 0) {
        deviceSelect.append(node("option", undefined, "마이크 설정 후 장치를 선택할 수 있어요"));
        deviceSelect.disabled = true;
        return;
      }
      for (const device of snapshot.devices) {
        const option = node("option", undefined, device.label);
        option.value = device.deviceId;
        option.selected = device.deviceId === snapshot.selectedDeviceId;
        deviceSelect.append(option);
      }
      deviceSelect.disabled = snapshot.state === "REQUESTING_PERMISSION";
    };
    const syncText = (element: HTMLElement, text: string): void => {
      if (element.textContent !== text) element.textContent = text;
    };
    const renderMicrophone = (snapshot: TitleMicrophoneSnapshot): void => {
      const presentation = presentTitleMic(snapshot.state, { deviceLabel: snapshot.deviceLabel, canRequestAgain: snapshot.canRequestAgain });
      microphone.dataset.state = snapshot.state;
      syncText(micMark, snapshot.state === "READY" || snapshot.state === "TEST_SUCCESS" ? "●" : snapshot.state === "REQUESTING_PERMISSION" || snapshot.state === "TESTING" ? "◌" : "○");
      syncText(micHeading, presentation.heading);
      syncText(micBody, presentation.body);
      micBody.setAttribute("aria-live", presentation.live);
      micAction.hidden = presentation.action === null;
      micAction.disabled = snapshot.state === "REQUESTING_PERMISSION";
      syncText(micAction, presentation.action ?? "");
      syncText(settingsMicHeading, presentation.heading);
      syncText(settingsMicBody, presentation.body);
      settingsMicBody.setAttribute("aria-live", presentation.live);
      settingsMicAction.hidden = presentation.action === null;
      settingsMicAction.disabled = snapshot.state === "REQUESTING_PERMISSION";
      syncText(settingsMicAction, presentation.action ?? "");
      settingsMeter.style.setProperty("--title-mic-level", `${snapshot.level.percent}%`);
      settingsMeter.dataset.tone = snapshot.level.tone;
      renderDevices(snapshot);
    };
    this.microphoneSession = new TitleMicrophoneSession(this.options.microphone, renderMicrophone);
    const runMicAction = (): void => {
      const state = this.microphoneSession?.snapshot().state;
      if (!state) return;
      if (state === "READY" || state === "TEST_SUCCESS") this.microphoneSession?.startTest();
      else void this.microphoneSession?.requestSetup(deviceSelect.value || undefined);
    };
    micAction.addEventListener("click", runMicAction);
    settingsMicAction.addEventListener("click", runMicAction);
    deviceSelect.addEventListener("change", () => void this.microphoneSession?.requestSetup(deviceSelect.value || undefined));
    this.microphoneSession.start();

    const finishNewGame = (mode: InputMode): void => {
      const calibration = this.microphoneSession?.snapshot().calibration ?? null;
      setAriaDisabled(startButton, true);
      enterGameFromTitle(() => this.options.onNewGame(mode, calibration), () => this.microphoneSession?.destroy() ?? Promise.resolve());
    };
    const finishResume = (mode: InputMode): void => {
      const calibration = this.microphoneSession?.snapshot().calibration ?? null;
      setAriaDisabled(continueButton, true);
      enterGameFromTitle(() => this.options.onResume(mode, calibration), () => this.microphoneSession?.destroy() ?? Promise.resolve());
    };
    const openModeDialog = (
      trigger: HTMLButtonElement,
      headingText: string,
      bodyText: string,
      primaryText: string,
      secondaryText: string,
      primaryAction: () => void,
      secondaryAction: () => void,
    ): void => {
      modeTrigger = trigger;
      modeHeading.textContent = headingText;
      modeBody.textContent = bodyText;
      modePrimary.textContent = primaryText;
      modeSecondary.textContent = secondaryText;
      modePrimary.onclick = primaryAction;
      modeSecondary.onclick = secondaryAction;
      setBackgroundInert(true);
      modeDialog.showModal();
      queueMicrotask(() => modePrimary.focus());
    };
    startButton.addEventListener("click", () => {
      if (startButton.getAttribute("aria-disabled") === "true") return;
      const micState = this.microphoneSession?.snapshot().state ?? "UNSUPPORTED";
      const activation = resolveTitleStart(micState);
      if (activation.kind === "start") {
        finishNewGame(activation.mode);
        return;
      }
      openModeDialog(
        startButton,
        "목소리로 플레이하시겠어요?",
        "직접 목소리로 대답하고 주문을 외칠 수 있습니다.",
        "음성으로 시작",
        "마이크 없이 시작",
        () => {
          closeMode();
          void this.microphoneSession?.requestSetup().then(() => {
            const state = this.microphoneSession?.snapshot().state;
            if (state === "READY" || state === "TEST_SUCCESS") finishNewGame("voice");
          });
        },
        () => {
          closeMode();
          finishNewGame("click");
        },
      );
    });
    const blockNoSaveKey = (event: KeyboardEvent): void => {
      if (!this.options.hasSave && (event.key === "Enter" || event.key === " ")) event.preventDefault();
    };
    continueButton.addEventListener("keydown", blockNoSaveKey);
    continueButton.addEventListener("click", () => {
      const micState = this.microphoneSession?.snapshot().state ?? "UNSUPPORTED";
      const activation = resolveTitleResume(this.options.hasSave, this.options.savedInputMode, micState);
      if (activation.kind === "blocked-no-save") return;
      if (activation.kind === "resume") {
        finishResume(activation.mode);
        return;
      }
      openModeDialog(
        continueButton,
        "음성 플레이로 저장된 이야기입니다.",
        "마이크를 설정하거나 클릭 모드로 이어갈 수 있습니다.",
        "음성 설정 후 이어하기",
        "클릭 모드로 이어하기",
        () => {
          closeMode();
          void this.microphoneSession?.requestSetup().then(() => {
            const state = this.microphoneSession?.snapshot().state;
            if (state === "READY" || state === "TEST_SUCCESS") finishResume("voice");
          });
        },
        () => {
          closeMode();
          finishResume("click");
        },
      );
    });

    syncAudio();
    content.append(hero, menu, microphone);
    this.shell.append(content, audio, settingsDialog, modeDialog);
    this.cleanupFirstGesture = installFirstTitleGesture(this.shell, this.options.onFirstUserGesture);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cleanupFirstGesture?.();
    this.cleanupFirstGesture = null;
    void this.microphoneSession?.destroy();
    this.microphoneSession = null;
  }
}
