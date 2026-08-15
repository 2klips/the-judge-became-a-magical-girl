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
import { enterGameFromTitle } from "./titleStart";

export const TITLE_MENU_COPY = {
  start: {
    label: "게임 시작",
    description: "목소리로 이어지는 이야기를 처음부터 시작합니다.",
  },
  continueWithSave: {
    label: "이어하기",
    description: "마지막으로 저장된 장면부터 이야기를 이어갑니다.",
  },
  continueWithoutSave: {
    label: "이어하기",
    description: "아직 저장된 이야기가 없습니다.",
  },
  settings: {
    label: "설정",
    description: "음량과 마이크 등 플레이 환경을 설정합니다.",
  },
} as const;

export const TITLE_HEADING_LINES = ["심사역은", "마법소녀가 되었다"] as const;

export interface TitleAudioOptions {
  getVolume(): number;
  isMuted(): boolean;
  onVolumeChange(volume: number): void;
  onMutedChange(muted: boolean): void;
}

export interface TitleViewOptions {
  hasSave: boolean;
  warning: string | null;
  microphoneSupported: boolean;
  audio: TitleAudioOptions;
  connectMicrophone(
    deviceId: string | undefined,
    onLevel: (metrics: AudioLevelMetrics) => void,
  ): Promise<MicrophoneConnection>;
  disconnectMicrophone(): Promise<void>;
  onNewGame(calibration: MicrophoneCalibration): void;
  onResume(calibration: MicrophoneCalibration): void;
}

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setAriaDisabled(button: HTMLButtonElement, disabled: boolean): void {
  button.setAttribute("aria-disabled", String(disabled));
  button.dataset.inactive = String(disabled);
}

function setupErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "주소창의 사이트 설정에서 마이크 권한을 허용해 주세요.";
    }
    if (error.name === "NotFoundError") {
      return "사용 가능한 마이크를 찾지 못했어요.";
    }
    if (error.name === "OverconstrainedError") {
      return "선택한 마이크를 사용할 수 없어요. 다른 입력 장치를 확인해 주세요.";
    }
  }
  return "마이크를 확인할 수 없어요. 잠시 후 다시 시도해 주세요.";
}

export class TitleView {
  private destroyed = false;
  private connectionSequence = 0;

  constructor(
    private readonly shell: HTMLElement,
    private readonly options: TitleViewOptions,
  ) {}

  render(): void {
    const content = node("main", "title-content");
    const hero = node("header", "title-hero");
    const subtitle = node("p", "title-kicker", "목소리로 이어지는 이야기");
    const heading = node("h1", "title-heading");
    const firstLine = node("span", "title-heading-line", TITLE_HEADING_LINES[0]);
    const secondLine = node("span", "title-heading-line");
    secondLine.append(
      node("span", "title-heading-accent", "마법소녀"),
      document.createTextNode(TITLE_HEADING_LINES[1].slice("마법소녀".length)),
    );
    heading.append(firstLine, secondLine);
    hero.append(subtitle, heading);

    const descriptionId = "title-menu-description";
    const menu = node("nav", "title-menu");
    menu.setAttribute("aria-label", "메인 메뉴");
    const description = node("p", "title-menu-description");
    description.id = descriptionId;
    description.setAttribute("aria-live", "polite");

    const createMenuButton = (
      icon: string,
      copy: { readonly label: string; readonly description: string },
    ): HTMLButtonElement => {
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
    const continueCopy = this.options.hasSave
      ? TITLE_MENU_COPY.continueWithSave
      : TITLE_MENU_COPY.continueWithoutSave;
    const continueButton = createMenuButton("▷", continueCopy);
    continueButton.dataset.menu = "continue";
    continueButton.dataset.noSave = String(!this.options.hasSave);
    const settingsButton = createMenuButton("⚙", TITLE_MENU_COPY.settings);
    settingsButton.dataset.menu = "settings";
    settingsButton.setAttribute("aria-haspopup", "dialog");
    setAriaDisabled(startButton, true);
    setAriaDisabled(continueButton, true);
    menu.append(startButton, continueButton, settingsButton, description);

    const microphone = node("section", "title-mic");
    microphone.dataset.state = this.options.microphoneSupported ? "waiting" : "unsupported";
    microphone.setAttribute("aria-labelledby", "title-mic-heading");
    const micMark = node("span", "title-mic-mark", "○");
    micMark.setAttribute("aria-hidden", "true");
    const micCopy = node("div", "title-mic-copy");
    const micHeading = node("h2", "title-mic-heading", "음성 플레이");
    micHeading.id = "title-mic-heading";
    const micBody = node(
      "p",
      "title-mic-body",
      this.options.microphoneSupported
        ? "목소리로 대답하고 직접 주문을 외칠 수 있습니다."
        : "이 환경에서는 음성 입력을 사용할 수 없습니다.",
    );
    const micStatus = node(
      "p",
      "title-mic-status",
      "마이크 없이도 플레이할 수 있습니다.",
    );
    micStatus.setAttribute("aria-live", "polite");
    micCopy.append(micHeading, micBody, micStatus);

    const deviceSelect = document.createElement("select");
    deviceSelect.className = "title-mic-device";
    deviceSelect.setAttribute("aria-label", "입력 장치");
    deviceSelect.hidden = true;
    deviceSelect.disabled = true;
    const defaultDevice = node("option", undefined, "연결 후 장치를 선택할 수 있어요");
    defaultDevice.value = "";
    deviceSelect.append(defaultDevice);

    const meter = node("div", "title-mic-meter");
    meter.setAttribute("aria-hidden", "true");
    meter.append(node("span", "title-mic-meter-fill"));
    const connectButton = node(
      "button",
      "title-mic-action",
      this.options.microphoneSupported ? "마이크 설정" : "마이크 사용 불가",
    );
    connectButton.type = "button";
    connectButton.disabled = !this.options.microphoneSupported;
    microphone.append(micMark, micCopy, deviceSelect, meter, connectButton);

    const audio = node("aside", "title-bgm");
    audio.setAttribute("aria-label", "배경 음악 설정");
    const mute = node("button", "title-bgm-mute", "BGM");
    mute.type = "button";
    const slider = document.createElement("input");
    slider.className = "title-bgm-slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(Math.round(this.options.audio.getVolume() * 100));
    slider.setAttribute("aria-label", "BGM 볼륨");
    const volume = node("output", "title-bgm-volume");
    let muted = this.options.audio.isMuted();
    const updateAudio = (): void => {
      const percent = Math.round(Number(slider.value));
      volume.value = `${percent}%`;
      volume.textContent = `${percent}%`;
      mute.dataset.muted = String(muted);
      mute.setAttribute("aria-pressed", String(muted));
      mute.setAttribute("aria-label", muted ? "BGM 음소거 해제" : "BGM 음소거");
    };
    mute.addEventListener("click", () => {
      muted = !muted;
      this.options.audio.onMutedChange(muted);
      updateAudio();
    });
    slider.addEventListener("input", () => {
      this.options.audio.onVolumeChange(Number(slider.value) / 100);
      updateAudio();
    });
    updateAudio();
    audio.append(mute, slider, volume);

    const settingsDialog = document.createElement("dialog");
    settingsDialog.className = "title-settings-dialog";
    settingsDialog.setAttribute("aria-labelledby", "title-settings-heading");
    settingsDialog.append(node("h2", undefined, "설정"));
    settingsDialog.querySelector("h2")!.id = "title-settings-heading";

    if (this.options.warning) {
      micStatus.textContent = this.options.warning;
    }
    content.append(hero, menu, microphone);
    this.shell.append(content, audio, settingsDialog);

    let accumulator = new MicrophoneCalibrationAccumulator();
    let calibration: MicrophoneCalibration | null = null;
    let lastReadingAt = performance.now();

    const updateActivation = (): void => {
      setAriaDisabled(startButton, calibration === null);
      setAriaDisabled(continueButton, !this.options.hasSave || calibration === null);
    };
    const setDevices = (
      devices: readonly MicrophoneInputDevice[],
      selectedDeviceId: string,
    ): void => {
      deviceSelect.replaceChildren();
      for (const device of devices) {
        const option = node("option", undefined, device.label);
        option.value = device.deviceId;
        option.selected = device.deviceId === selectedDeviceId;
        deviceSelect.append(option);
      }
      deviceSelect.hidden = devices.length === 0;
      deviceSelect.disabled = devices.length < 2;
    };
    const updateLevel = (metrics: AudioLevelMetrics): void => {
      if (this.destroyed || !this.shell.isConnected) return;
      const now = performance.now();
      const state = accumulator.add(metrics, Math.min(100, Math.max(16, now - lastReadingAt)));
      lastReadingAt = now;
      const presentation = resolveMicrophoneMeterPresentation(metrics, state);
      meter.style.setProperty("--title-mic-level", `${presentation.percent}%`);
      meter.dataset.tone = presentation.tone;
      microphone.dataset.state = state;
      if (state === "too-quiet") {
        micStatus.textContent = "입력 신호가 작아요. 평소 목소리로 다시 말해 주세요.";
      } else if (state === "too-loud") {
        micStatus.textContent = "입력이 너무 커요. 마이크와 거리를 조금 벌려 주세요.";
      } else if (state === "sampling") {
        micStatus.textContent = "목소리를 확인하고 있어요…";
      } else if (state === "passed") {
        const measured = accumulator.calibration();
        calibration = measured
          ? { ...measured, inputDeviceId: deviceSelect.value || undefined }
          : null;
        micMark.textContent = "●";
        micHeading.textContent = "마이크 준비됨";
        micStatus.textContent = "목소리가 정상적으로 확인되었습니다.";
        connectButton.textContent = "다시 테스트";
        updateActivation();
      }
    };
    const connect = async (deviceId?: string): Promise<void> => {
      const sequence = ++this.connectionSequence;
      accumulator = new MicrophoneCalibrationAccumulator();
      calibration = null;
      updateActivation();
      connectButton.disabled = true;
      deviceSelect.disabled = true;
      meter.style.setProperty("--title-mic-level", "0%");
      meter.dataset.tone = "quiet";
      microphone.dataset.state = "connecting";
      micHeading.textContent = "마이크 확인 중";
      micStatus.textContent = "사용 가능한 입력 장치를 확인하고 있습니다…";
      lastReadingAt = performance.now();
      try {
        const connection = await this.options.connectMicrophone(deviceId, updateLevel);
        if (this.destroyed || sequence !== this.connectionSequence || !this.shell.isConnected) return;
        setDevices(connection.devices, connection.selectedDeviceId);
        if (accumulator.state !== "passed") {
          microphone.dataset.state = "listening";
          micHeading.textContent = "목소리를 확인하고 있어요";
          micStatus.textContent = "평소 목소리로 ‘심사를 시작합니다.’라고 말해 주세요.";
          connectButton.textContent = "테스트 초기화";
        }
      } catch (error) {
        if (this.destroyed || sequence !== this.connectionSequence || !this.shell.isConnected) return;
        microphone.dataset.state = "error";
        micHeading.textContent = "마이크를 확인할 수 없습니다";
        micStatus.textContent = setupErrorMessage(error);
      } finally {
        if (!this.destroyed && sequence === this.connectionSequence) {
          connectButton.disabled = !this.options.microphoneSupported;
        }
      }
    };

    connectButton.addEventListener("click", () => void connect(deviceSelect.value || undefined));
    deviceSelect.addEventListener("change", () => void connect(deviceSelect.value || undefined));
    startButton.addEventListener("click", () => {
      if (!calibration) return;
      setAriaDisabled(startButton, true);
      enterGameFromTitle(
        () => this.options.onNewGame(calibration!),
        this.options.disconnectMicrophone,
      );
    });
    continueButton.addEventListener("click", () => {
      if (!this.options.hasSave || !calibration) return;
      setAriaDisabled(continueButton, true);
      enterGameFromTitle(
        () => this.options.onResume(calibration!),
        this.options.disconnectMicrophone,
      );
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.connectionSequence += 1;
  }
}
