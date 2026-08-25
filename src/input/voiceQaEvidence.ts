import type { AudioLevelMetrics } from "./audioLevel";
import type {
  TranscriptionObservation,
  VoiceFailureKind,
  VoiceInputFailure,
} from "./transcription";

export type VoiceQaSurface = "dialogue" | "incantation" | "battle";

export interface VoiceQaKeywordMatch {
  readonly keyword: string;
  readonly matched: boolean;
}

export type VoiceQaEvidence =
  | {
      readonly kind: "success";
      readonly surface: VoiceQaSurface;
      readonly transcript: string;
      readonly model: string;
      readonly roundTripMs: number;
      readonly upstreamMs?: number;
      readonly firstDeltaMs?: number;
      readonly rmsDbfs?: number;
      readonly peakDbfs?: number;
      readonly clippingRatio?: number;
      readonly keywordMatches?: readonly VoiceQaKeywordMatch[];
    }
  | {
      readonly kind: "failure";
      readonly surface: VoiceQaSurface;
      readonly failureKind: VoiceFailureKind;
      readonly httpStatus?: number;
    };

interface VoiceQaSuccessInput {
  readonly surface: VoiceQaSurface;
  readonly observation: TranscriptionObservation;
  readonly audioLevel?: AudioLevelMetrics;
  readonly requiredKeywords?: readonly string[];
  readonly matchedKeywords?: readonly string[];
}

export function createVoiceQaSuccessEvidence(
  input: VoiceQaSuccessInput,
): Extract<VoiceQaEvidence, { kind: "success" }> {
  const keywordMatches = input.requiredKeywords?.map((keyword) => ({
    keyword,
    matched: input.matchedKeywords?.includes(keyword) ?? false,
  }));
  return {
    kind: "success",
    surface: input.surface,
    transcript: input.observation.text,
    model: input.observation.model,
    roundTripMs: input.observation.roundTripMs,
    upstreamMs: input.observation.upstreamMs,
    firstDeltaMs: input.observation.firstDeltaMs,
    rmsDbfs: input.audioLevel?.rmsDbfs,
    peakDbfs: input.audioLevel?.peakDbfs,
    clippingRatio: input.audioLevel?.clippingRatio,
    keywordMatches,
  };
}

export function createVoiceQaFailureEvidence(
  surface: VoiceQaSurface,
  failure: VoiceInputFailure,
): Extract<VoiceQaEvidence, { kind: "failure" }> {
  return {
    kind: "failure",
    surface,
    failureKind: failure.kind,
    httpStatus: failure.httpStatus,
  };
}

export function summarizeVoiceQaKeywordMatches(
  matches: readonly VoiceQaKeywordMatch[] | undefined,
): string {
  if (!matches) return "";
  return `${matches.filter(({ matched }) => matched).length}/${matches.length}`;
}

export function formatVoiceQaDbfs(value: number | undefined): string {
  return value === undefined ? "—" : `${value.toFixed(1)} dBFS`;
}

export function formatVoiceQaClippingRatio(value: number | undefined): string {
  return value === undefined ? "—" : `${(value * 100).toFixed(2)}%`;
}
