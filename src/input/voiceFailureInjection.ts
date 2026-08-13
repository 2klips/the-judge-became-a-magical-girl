import type { VoiceInputFailure } from "./transcription";

const DEBUG_VOICE_FAILURES = [
  "permission",
  "recording",
  "no-speech",
  "timeout",
  "http",
  "schema",
  "network",
] as const;

export type DebugVoiceFailure = (typeof DEBUG_VOICE_FAILURES)[number];

export interface PendingDebugVoiceFailure {
  kind: DebugVoiceFailure | null;
  remaining: number;
}

export function resolveDebugVoiceFailure(
  search: string,
  debugEnabled: boolean,
): DebugVoiceFailure | null {
  if (!debugEnabled) return null;
  const value = new URLSearchParams(search).get("voiceFailure");
  return DEBUG_VOICE_FAILURES.find((kind) => kind === value) ?? null;
}

export function createPendingDebugVoiceFailure(
  search: string,
  debugEnabled: boolean,
  developmentBuild: boolean,
): PendingDebugVoiceFailure {
  if (!developmentBuild) return { kind: null, remaining: 0 };
  const kind = resolveDebugVoiceFailure(search, debugEnabled);
  if (!kind) return { kind: null, remaining: 0 };
  const requestedCount = Number(
    new URLSearchParams(search).get("voiceFailureCount") ?? "1",
  );
  return {
    kind,
    remaining: requestedCount === 2 ? 2 : 1,
  };
}

export function consumeDebugVoiceFailure(
  pending: PendingDebugVoiceFailure,
): VoiceInputFailure | null {
  if (!pending.kind || pending.remaining <= 0) return null;
  const kind = pending.kind;
  pending.remaining -= 1;
  if (pending.remaining === 0) pending.kind = null;
  return { kind, debugMessage: `debug injected ${kind}` };
}
