export type MicVisualState = "idle" | "listening" | "processing" | "error";

export class MicIndicatorView {
  readonly element = document.createElement("div");
  private readonly dot = document.createElement("span");
  private readonly label = document.createElement("span");

  constructor() {
    this.element.className = "mic-indicator";
    this.element.setAttribute("role", "status");
    this.dot.className = "mic-indicator-dot";
    this.element.append(this.dot, this.label);
    this.setState("idle");
  }

  setState(state: MicVisualState, detail?: string): void {
    this.element.dataset.state = state;
    const labels: Record<MicVisualState, string> = {
      idle: "대기",
      listening: "청취 중",
      processing: "처리 중",
      error: "다시 시도",
    };
    this.label.textContent = detail ? `${labels[state]} · ${detail}` : labels[state];
  }
}
