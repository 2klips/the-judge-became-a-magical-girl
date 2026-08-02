import type {
  Character,
  DialogueNode,
  EndingNode,
} from "../data/schema";
import { ClickInputPort } from "../input/click";
import type { VoiceCaptureResult } from "../input/voice";
import type { GameState, InputMode } from "../state";
import { CaptionsView } from "./captions";
import { MicIndicatorView } from "./micIndicator";

interface TitleOptions {
  hasSave: boolean;
  warning: string | null;
  onNewGame: (inputMode: InputMode) => void;
  onResume: () => void;
}

export interface DialogueInputOptions {
  speechSupported: boolean;
  notice?: string;
  forceClickForTurn?: boolean;
  capture(onInterim: (text: string) => void): Promise<VoiceCaptureResult>;
  stop(): void;
  cancel(): void;
  onTranscript(transcript: string): boolean;
  onTurnFailed(): void;
  onUnavailable(message: string): void;
  onModeChange(inputMode: InputMode): void;
}

interface LineViewOptions {
  sceneId: string;
  speaker: string;
  text: string;
  progress: string;
  continueLabel: string;
  state: GameState;
  onContinue: () => void;
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

  constructor(
    private readonly root: HTMLElement,
    private readonly speechSupported: boolean,
  ) {
    this.debugEnabled = new URLSearchParams(window.location.search).has("debug");
  }

  renderLoading(): void {
    const shell = this.createShell("bg_hall_day");
    shell.append(element("p", "loading", "게임 데이터를 검증하는 중…"));
    this.commit(shell);
  }

  renderTitle(options: TitleOptions): void {
    const shell = this.createShell("bg_hall_day");
    shell.classList.add("title-screen");

    const titleBlock = element("section", "title-block");
    titleBlock.append(
      element("p", "eyebrow", "VOICE VISUAL NOVEL · M2"),
      element("h1", "game-title", "심사역은 마법소녀가 되었다"),
      element(
        "p",
        "title-subtitle",
        this.speechSupported
          ? "마이크를 누른 채 말하고 놓아, 주노와 목소리로 호흡을 맞춰 보자."
          : "음성 인식을 지원하지 않는 환경이야. 클릭으로 끝까지 진행할 수 있어.",
      ),
    );

    const actions = element("div", "title-actions");
    const startButton = element("button", "primary-button", "새 게임");
    startButton.type = "button";
    startButton.addEventListener(
      "click",
      () => options.onNewGame(this.speechSupported ? "voice" : "click"),
      { once: true },
    );
    actions.append(startButton);

    if (this.speechSupported) {
      const clickStartButton = element(
        "button",
        "secondary-button",
        "클릭으로 시작",
      );
      clickStartButton.type = "button";
      clickStartButton.addEventListener(
        "click",
        () => options.onNewGame("click"),
        { once: true },
      );
      actions.append(clickStartButton);
    }

    if (options.hasSave) {
      const resumeButton = element("button", "secondary-button", "이어하기");
      resumeButton.type = "button";
      resumeButton.addEventListener("click", options.onResume, { once: true });
      actions.append(resumeButton);
    }
    titleBlock.append(actions);

    if (options.warning) {
      titleBlock.append(element("p", "warning-message", options.warning));
    }

    shell.append(titleBlock, this.inputStatus());
    this.commit(shell);
  }

  renderLine(options: LineViewOptions): void {
    const shell = this.createShell(options.sceneId);
    shell.append(this.topStatus(options.state, options.progress));

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

  renderDialogue(
    node: DialogueNode,
    character: Character,
    state: GameState,
    onSelect: (intentId: string) => void,
    inputOptions: DialogueInputOptions,
  ): void {
    const shell = this.createShell(node.scene.bg);
    shell.append(this.topStatus(state, `대화 ${state.nodeTurn + 1}/${node.maxTurns}`));

    const panel = this.dialoguePanel(character.name, node.opening);
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
    sceneId: string;
    speaker: string;
    selectedLabel: string;
    reply: string;
    state: GameState;
    advanced: boolean;
    onContinue: () => void;
  }): void {
    const shell = this.createShell(options.sceneId);
    shell.append(this.topStatus(options.state, `누적 ${options.state.totalTurn}턴`));
    const panel = this.dialoguePanel(options.speaker, options.reply);
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
    const shell = this.createShell(node.scene.bg);
    shell.classList.add("ending-screen");
    const card = element("section", "ending-card");
    card.append(
      element("p", "eyebrow", `${node.endingId.toUpperCase()} ENDING`),
      element("h2", "ending-title", node.lines[0]?.text ?? "엔딩"),
    );

    for (const line of node.lines.slice(1)) {
      const speaker =
        line.speaker === "narration"
          ? ""
          : `${characterNames.get(line.speaker) ?? line.speaker} · `;
      card.append(element("p", "ending-line", `${speaker}${line.text}`));
    }

    card.append(
      element(
        "p",
        "ending-summary",
        `호감도 ${state.affinity} · 플래그 ${[...state.flags].join(", ") || "없음"}`,
      ),
    );
    const restart = element("button", "primary-button", "처음부터");
    restart.type = "button";
    restart.addEventListener("click", onNewGame, { once: true });
    card.append(restart);
    shell.append(card, this.debugPanel(state));
    this.commit(shell);
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
    shell.append(
      element("div", "ambient ambient-one"),
      element("div", "ambient ambient-two"),
      element("div", "scene-grid"),
    );
    return shell;
  }

  private topStatus(state: GameState, progress: string): HTMLElement {
    const status = element("header", "top-status");
    status.append(
      element("span", "brand-mark", "JUNO // LINK"),
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
        state ? `STT 실패 턴 ${state.sttFailCount}/5` : "STT 우선 · 클릭 폴백",
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
    panel.append(element("summary", undefined, "M2 상태"));
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
    this.root.replaceChildren(shell);
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
    this.appendDebugTranscript(utilities, (transcript) => {
      const matched = options.onTranscript(transcript);
      if (!matched && this.root.contains(container)) {
        this.renderClickInput(
          container,
          node,
          onSelect,
          options,
          "로컬 intent를 확정하지 못했어. 클릭으로 골라 줘.",
          allowVoiceSwitch,
        );
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
    controls.append(indicator.element, ptt, clickButton);
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
    const beginCapture = (): void => {
      if (capturing) {
        return;
      }
      capturing = true;
      ptt.setAttribute("aria-pressed", "true");
      ptt.textContent = "듣는 중… 놓아서 전송";
      indicator.setState("listening");
      captions.showInterim("");

      void options.capture((transcript) => captions.showInterim(transcript)).then(
        (result) => {
          capturing = false;
          if (!this.root.contains(container)) {
            return;
          }
          ptt.setAttribute("aria-pressed", "false");
          ptt.textContent = "누르고 말하기";
          this.handleVoiceResult(
            result,
            captions,
            indicator,
            options,
            showClickFallback,
          );
        },
      );
    };
    const stopCapture = (): void => {
      if (!capturing) {
        return;
      }
      indicator.setState("processing");
      options.stop();
    };

    ptt.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      ptt.setPointerCapture(event.pointerId);
      beginCapture();
    });
    ptt.addEventListener("pointerup", stopCapture);
    ptt.addEventListener("pointercancel", stopCapture);
    ptt.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        beginCapture();
      }
    });
    ptt.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        stopCapture();
      }
    });

    const utilities = element("div", "input-utilities");
    this.appendDebugTranscript(utilities, (transcript) => {
      options.cancel();
      captions.showFinal(transcript);
      indicator.setState("processing", "debug transcript");
      if (!options.onTranscript(transcript) && this.root.contains(container)) {
        showClickFallback("로컬 intent를 확정하지 못했어. 클릭으로 골라 줘.");
      }
    });
    container.append(utilities);
  }

  private handleVoiceResult(
    result: VoiceCaptureResult,
    captions: CaptionsView,
    indicator: MicIndicatorView,
    options: DialogueInputOptions,
    showClickFallback: (message: string) => void,
  ): void {
    if (result.kind === "transcript") {
      captions.showFinal(result.transcript);
      indicator.setState("processing", "로컬 intent 판정");
      if (!options.onTranscript(result.transcript)) {
        showClickFallback("로컬 intent를 확정하지 못했어. 클릭으로 골라 줘.");
      }
      return;
    }
    if (result.kind === "retry") {
      captions.showMessage("잘 못 들었어. 한 번만 다시 말해 줘.");
      indicator.setState("error", result.error.code);
      return;
    }
    if (result.kind === "fallback") {
      options.onTurnFailed();
      return;
    }
    if (result.kind === "unavailable") {
      options.onUnavailable(
        result.error.code === "not-allowed" ||
          result.error.code === "service-not-allowed"
          ? "마이크 권한이 거부됐어. 클릭 모드로 계속할게."
          : "음성 인식을 사용할 수 없어. 클릭 모드로 계속할게.",
      );
    }
  }

  private appendDebugTranscript(
    container: HTMLElement,
    onSubmit: (transcript: string) => void,
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
        onSubmit(transcript);
      }
    });
    container.append(form);
  }
}
