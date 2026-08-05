function paragraph(className: string, text: string): HTMLParagraphElement {
  const node = document.createElement("p");
  node.className = className;
  node.textContent = text;
  return node;
}

export class CaptionsView {
  readonly element = document.createElement("section");
  private readonly label = paragraph("caption-label", "음성 입력");
  private readonly text = paragraph("caption-text", "버튼 또는 T 키를 누른 채 말해 줘.");

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

  showAccepted(): void {
    this.element.dataset.state = "accepted";
    this.label.textContent = "음성 입력 완료";
    this.text.textContent = "응답 판정 중…";
  }

  showMessage(message: string): void {
    this.element.dataset.state = "message";
    this.label.textContent = "음성 안내";
    this.text.textContent = message;
  }
}
