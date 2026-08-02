import type {
  BattleNode,
  BattlePhase,
  Character,
  CutsceneNode,
  DialogueNode,
  EndingNode,
} from "../data/schema";
import type { BattleGrade, BattleState } from "../battle/state";
import { ClickInputPort } from "../input/click";
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

interface TitleOptions {
  hasSave: boolean;
  warning: string | null;
  onNewGame: (inputMode: InputMode) => void;
  onResume: () => void;
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
  sceneId: string;
  speaker: string;
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
  onTranscript(action: "spell" | "freeform", transcript: string): Promise<void>;
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
      element("p", "eyebrow", "VOICE VISUAL NOVEL · M4"),
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

  renderIncantation(
    node: CutsceneNode & { incantationGate: NonNullable<CutsceneNode["incantationGate"]> },
    state: GameState,
    options: IncantationInputOptions,
  ): void {
    const gate = node.incantationGate;
    const shell = this.createShell(node.scene.bg);
    shell.classList.add("incantation-screen");
    shell.append(this.topStatus(state, `변신 주문 ${options.attempt}/${gate.maxAttempts}`));
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
        await options.onTranscript(transcript);
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
    const shell = this.createShell(node.scene.bg);
    shell.classList.add("battle-screen", `enemy-${battleState.enemyState}`);
    shell.append(
      this.topStatus(
        state,
        `전투 ${battleState.phaseIndex + 1}/3 · 턴 ${battleState.phaseTurn + 1}/${phase.maxTurns}`,
      ),
    );
    const arena = element("section", "battle-arena");
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
    arena.append(enemy, createGauge("MOMENTUM", battleState.momentum, 20, 100));
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
        options.onTranscript("spell", transcript),
      );
      this.bindHoldToTalk(freeform, captions, indicator, options, (transcript) =>
        options.onTranscript("freeform", transcript),
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
    panel.append(element("summary", undefined, "M4 상태"));
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
    onTranscript: (transcript: string) => void | Promise<void>,
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
        () => onTranscript(result.transcript),
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
