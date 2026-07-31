import type { Intent } from "../data/schema";

export interface InputPort {
  render(intents: Intent[], onSelect: (intentId: string) => void): void;
  disable(): void;
  clear(): void;
}

export class ClickInputPort implements InputPort {
  constructor(private readonly container: HTMLElement) {}

  render(intents: Intent[], onSelect: (intentId: string) => void): void {
    this.clear();
    for (const intent of intents) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = intent.clickLabel;
      button.dataset.intentId = intent.id;
      button.addEventListener(
        "click",
        () => {
          this.disable();
          onSelect(intent.id);
        },
        { once: true },
      );
      this.container.append(button);
    }
  }

  disable(): void {
    this.container
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((button) => {
        button.disabled = true;
      });
  }

  clear(): void {
    this.container.replaceChildren();
  }
}
