function paragraph(className: string, text: string): HTMLParagraphElement {
  const node = document.createElement("p");
  node.className = className;
  node.textContent = text;
  return node;
}

export class CaptionsView {
  readonly element = document.createElement("section");
  private readonly label = paragraph("caption-label", "최종 transcript");
  private readonly text = paragraph("caption-text", "버튼을 놓으면 전사문이 먼저 표시돼.");

  constructor() {
    this.element.className = "captions";
    this.element.setAttribute("aria-live", "polite");
    this.element.append(this.label, this.text);
  }

  showInterim(transcript: string): void {
    this.element.dataset.state = "interim";
    this.label.textContent = "듣는 중 · interim";
    this.text.textContent = transcript || "…";
  }

  showFinal(transcript: string): void {
    this.element.dataset.state = "final";
    this.label.textContent = "인식 완료 · final";
    this.text.textContent = transcript;
  }

  showMessage(message: string): void {
    this.element.dataset.state = "message";
    this.label.textContent = "음성 안내";
    this.text.textContent = message;
  }
}
