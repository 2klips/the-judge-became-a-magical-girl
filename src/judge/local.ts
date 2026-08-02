import type { Intent } from "../data/schema";

export interface LocalIntentMatch {
  kind: "matched";
  intentId: string;
  normalizedText: string;
  score: number;
}

export interface LocalIntentMiss {
  kind: "unmatched";
  normalizedText: string;
  reason: "empty" | "no_match" | "tie";
  candidateIds: string[];
}

export type LocalIntentResult = LocalIntentMatch | LocalIntentMiss;

export function normalizeTranscript(text: string): string {
  return text
    .normalize("NFC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

export function matchLocalIntent(
  transcript: string,
  intents: readonly Intent[],
): LocalIntentResult {
  const normalizedText = normalizeTranscript(transcript);
  if (!normalizedText) {
    return {
      kind: "unmatched",
      normalizedText,
      reason: "empty",
      candidateIds: [],
    };
  }

  const scores = intents.map((intent) => ({
    intentId: intent.id,
    score: [...new Set(intent.keywords.map(normalizeTranscript))].filter(
      (keyword) => keyword.length > 0 && normalizedText.includes(keyword),
    ).length,
  }));
  const highestScore = Math.max(0, ...scores.map(({ score }) => score));
  const candidates = scores.filter(({ score }) => score === highestScore);

  if (highestScore === 0) {
    return {
      kind: "unmatched",
      normalizedText,
      reason: "no_match",
      candidateIds: [],
    };
  }
  if (candidates.length !== 1) {
    return {
      kind: "unmatched",
      normalizedText,
      reason: "tie",
      candidateIds: candidates.map(({ intentId }) => intentId),
    };
  }

  const match = candidates[0];
  if (!match) {
    throw new Error("로컬 intent 후보 계산에 실패했습니다.");
  }
  return {
    kind: "matched",
    intentId: match.intentId,
    normalizedText,
    score: match.score,
  };
}
