import type {
  Character,
  DialogueNode,
  EndingNode,
} from "../data/schema";
import { ClickInputPort } from "../input/click";
import type { GameState } from "../state";

interface TitleOptions {
  hasSave: boolean;
  warning: string | null;
  onNewGame: () => void;
  onResume: () => void;
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

  constructor(private readonly root: HTMLElement) {
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
      element("p", "eyebrow", "VOICE VISUAL NOVEL · M1"),
      element("h1", "game-title", "심사역은 마법소녀가 되었다"),
      element(
        "p",
        "title-subtitle",
        "아직 목소리는 닿지 않는다. 먼저 클릭으로 주노와 호흡을 맞춰 보자.",
      ),
    );

    const actions = element("div", "title-actions");
    const startButton = element("button", "primary-button", "새 게임");
    startButton.type = "button";
    startButton.addEventListener("click", options.onNewGame, { once: true });
    actions.append(startButton);

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
    shell.append(panel, this.inputStatus(), this.debugPanel(options.state));
    this.commit(shell);
  }

  renderDialogue(
    node: DialogueNode,
    character: Character,
    state: GameState,
    onSelect: (intentId: string) => void,
  ): void {
    const shell = this.createShell(node.scene.bg);
    shell.append(this.topStatus(state, `대화 ${state.nodeTurn + 1}/${node.maxTurns}`));

    const panel = this.dialoguePanel(character.name, node.opening);
    panel.append(
      element("p", "prompt-label", "주노에게 어떻게 답할까?"),
    );
    const choices = element("div", "choice-list");
    panel.append(choices);
    const input = new ClickInputPort(choices);
    input.render(node.intents, onSelect);

    shell.append(panel, this.inputStatus(), this.debugPanel(state));
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
    shell.append(panel, this.inputStatus(), this.debugPanel(options.state));
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

  private inputStatus(): HTMLElement {
    const status = element("div", "input-status");
    status.append(
      element("span", "input-dot"),
      element("span", undefined, "클릭 테스트 모드"),
      element("span", "input-divider", "·"),
      element("span", "muted", "마이크 연결은 M2 예정"),
    );
    return status;
  }

  private debugPanel(state: GameState): HTMLElement {
    if (!this.debugEnabled) {
      return element("div", "debug-panel hidden");
    }
    const panel = element("details", "debug-panel") as HTMLDetailsElement;
    panel.open = true;
    panel.append(element("summary", undefined, "M1 상태"));
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
}
