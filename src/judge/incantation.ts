export interface IncantationGateContract {
  requiredKeywords: readonly string[];
  minMatch: number;
  maxAttempts: number;
}

export type IncantationOutcome = "perfect" | "standard" | "retry" | "rescued";

export interface IncantationResult {
  outcome: IncantationOutcome;
  matchedKeywords: string[];
  matchCount: number;
  attempt: number;
  initialMomentum?: 50 | 60;
}

export function normalizeIncantation(value: string): string {
  return value.normalize("NFC").replace(/[\p{P}\p{S}\s]+/gu, "");
}

export function evaluateIncantationAttempt(
  transcript: string,
  gate: IncantationGateContract,
  attempt: number,
): IncantationResult {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new Error("주문 시도 횟수는 1 이상의 정수여야 합니다.");
  }

  const normalizedTranscript = normalizeIncantation(transcript);
  const matchedKeywords = gate.requiredKeywords.filter((keyword) =>
    normalizedTranscript.includes(normalizeIncantation(keyword)),
  );
  const matchCount = matchedKeywords.length;

  if (matchCount === gate.requiredKeywords.length) {
    return {
      outcome: "perfect",
      matchedKeywords: [...matchedKeywords],
      matchCount,
      attempt,
      initialMomentum: 60,
    };
  }
  if (matchCount >= gate.minMatch) {
    return {
      outcome: "standard",
      matchedKeywords: [...matchedKeywords],
      matchCount,
      attempt,
      initialMomentum: 50,
    };
  }
  return {
    outcome: attempt >= gate.maxAttempts ? "rescued" : "retry",
    matchedKeywords: [...matchedKeywords],
    matchCount,
    attempt,
    ...(attempt >= gate.maxAttempts ? { initialMomentum: 50 as const } : {}),
  };
}

export function resolveClickIncantation(): IncantationResult {
  return {
    outcome: "standard",
    matchedKeywords: [],
    matchCount: 0,
    attempt: 0,
    initialMomentum: 50,
  };
}
