export interface VoiceTurnFailureDecision {
  readonly nextAttemptInTurn: number;
  readonly countInputFailure: boolean;
  readonly forceClickForTurn: boolean;
  readonly forceGlobalClick: boolean;
}

export function formatVoiceTurnFailureMessage(
  baseMessage: string,
  next: "retry" | "click",
): string {
  return next === "retry"
    ? `${baseMessage} 같은 턴에서 한 번 더 말해 줘.`
    : `${baseMessage} 이 턴은 클릭으로 진행해 줘.`;
}

export function resolveVoiceTurnFailure(
  attemptInTurn: number,
  accumulatedInputFailures: number,
): VoiceTurnFailureDecision {
  if (accumulatedInputFailures + 1 >= 5) {
    return {
      nextAttemptInTurn: 0,
      countInputFailure: true,
      forceClickForTurn: true,
      forceGlobalClick: true,
    };
  }
  if (attemptInTurn <= 0) {
    return {
      nextAttemptInTurn: 1,
      countInputFailure: true,
      forceClickForTurn: false,
      forceGlobalClick: false,
    };
  }
  return {
    nextAttemptInTurn: 0,
    countInputFailure: true,
    forceClickForTurn: true,
    forceGlobalClick: false,
  };
}

export function resolveUnavailableVoiceFailure(
  recordingSupported: boolean,
  attemptInTurn: number,
  accumulatedInputFailures: number,
): VoiceTurnFailureDecision & { readonly capabilityUnavailable: boolean } {
  if (!recordingSupported) {
    return {
      nextAttemptInTurn: 0,
      countInputFailure: false,
      forceClickForTurn: true,
      forceGlobalClick: true,
      capabilityUnavailable: true,
    };
  }
  return {
    ...resolveVoiceTurnFailure(attemptInTurn, accumulatedInputFailures),
    capabilityUnavailable: false,
  };
}

export function clearVoiceFailureAttempts(attempts: Map<string, number>): void {
  attempts.clear();
}
