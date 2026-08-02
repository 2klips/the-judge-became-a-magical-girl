export type SpeechErrorCode =
  | "aborted"
  | "audio-capture"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed"
  | "start-failed"
  | "unsupported"
  | string;

export class SpeechInputError extends Error {
  constructor(readonly code: SpeechErrorCode, message?: string) {
    super(message ?? `음성 인식 오류: ${code}`);
    this.name = "SpeechInputError";
  }
}

export interface SpeechPort {
  isSupported(): boolean;
  listen(onInterim: (text: string) => void): Promise<string>;
  stop(): void;
  cancel(): void;
}

interface SpeechAlternativeLike {
  transcript: string;
}

interface SpeechResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternativeLike;
}

interface SpeechResultEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionFactory = () => unknown;

interface ActiveRecognition {
  recognition: SpeechRecognitionLike;
  reject: (error: SpeechInputError) => void;
}

function browserRecognitionFactory(): SpeechRecognitionFactory | null {
  if (typeof window === "undefined") {
    return null;
  }
  const speechWindow = window as Window & {
    SpeechRecognition?: new () => unknown;
    webkitSpeechRecognition?: new () => unknown;
  };
  const Constructor =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  return Constructor ? () => new Constructor() : null;
}

export class BrowserSpeechPort implements SpeechPort {
  private active: ActiveRecognition | null = null;

  constructor(
    private readonly factory: SpeechRecognitionFactory | null =
      browserRecognitionFactory(),
  ) {}

  isSupported(): boolean {
    return this.factory !== null;
  }

  listen(onInterim: (text: string) => void): Promise<string> {
    this.cancel();
    if (!this.factory) {
      return Promise.reject(
        new SpeechInputError("unsupported", "이 브라우저는 음성 인식을 지원하지 않습니다."),
      );
    }

    const recognition = this.factory() as SpeechRecognitionLike;
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = true;

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const finish = (): boolean => {
        if (settled) {
          return false;
        }
        settled = true;
        if (this.active?.recognition === recognition) {
          this.active = null;
        }
        return true;
      };
      const resolveOnce = (text: string): void => {
        if (finish()) {
          resolve(text);
        }
      };
      const rejectOnce = (error: SpeechInputError): void => {
        if (finish()) {
          reject(error);
        }
      };

      recognition.onresult = (event) => {
        if (settled) {
          return;
        }
        let interimText = "";
        let finalText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript ?? "";
          if (result?.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
        if (interimText) {
          onInterim(interimText);
        }
        if (finalText.trim()) {
          resolveOnce(finalText.trim());
        }
      };
      recognition.onerror = (event) => {
        rejectOnce(new SpeechInputError(event.error));
      };
      recognition.onend = () => {
        rejectOnce(new SpeechInputError("no-speech", "음성이 감지되지 않았습니다."));
      };
      this.active = { recognition, reject: rejectOnce };

      try {
        recognition.start();
      } catch (error) {
        rejectOnce(
          new SpeechInputError(
            "start-failed",
            error instanceof Error ? error.message : String(error),
          ),
        );
      }
    });
  }

  stop(): void {
    this.active?.recognition.stop();
  }

  cancel(): void {
    const active = this.active;
    if (!active) {
      return;
    }
    active.reject(new SpeechInputError("aborted", "음성 인식이 취소되었습니다."));
    active.recognition.abort();
  }
}

export function isPermissionDenied(error: unknown): boolean {
  return (
    error instanceof SpeechInputError &&
    (error.code === "not-allowed" || error.code === "service-not-allowed")
  );
}
