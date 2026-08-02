import {
  isPermissionDenied,
  SpeechInputError,
  type SpeechPort,
} from "./stt";

export type VoiceCaptureResult =
  | { kind: "transcript"; transcript: string }
  | { kind: "retry"; attempt: 1; error: SpeechInputError }
  | { kind: "fallback"; attempt: 2; error: SpeechInputError }
  | { kind: "unavailable"; error: SpeechInputError }
  | { kind: "cancelled" };

function toSpeechError(error: unknown): SpeechInputError {
  return error instanceof SpeechInputError
    ? error
    : new SpeechInputError(
        "start-failed",
        error instanceof Error ? error.message : String(error),
      );
}

export class VoiceTurnController {
  private failedAttempts = 0;
  private requestId = 0;

  constructor(private readonly speech: SpeechPort) {}

  async capture(onInterim: (text: string) => void): Promise<VoiceCaptureResult> {
    const requestId = ++this.requestId;
    try {
      const transcript = (await this.speech.listen(onInterim)).trim();
      if (requestId !== this.requestId) {
        return { kind: "cancelled" };
      }
      if (!transcript) {
        throw new SpeechInputError("no-speech", "음성이 감지되지 않았습니다.");
      }
      return { kind: "transcript", transcript };
    } catch (error) {
      if (requestId !== this.requestId) {
        return { kind: "cancelled" };
      }
      const speechError = toSpeechError(error);
      if (speechError.code === "aborted") {
        return { kind: "cancelled" };
      }
      if (speechError.code === "unsupported" || isPermissionDenied(speechError)) {
        return { kind: "unavailable", error: speechError };
      }
      this.failedAttempts += 1;
      if (this.failedAttempts === 1) {
        return { kind: "retry", attempt: 1, error: speechError };
      }
      return { kind: "fallback", attempt: 2, error: speechError };
    }
  }

  stop(): void {
    this.speech.stop();
  }

  cancel(): void {
    this.requestId += 1;
    this.speech.cancel();
  }
}
