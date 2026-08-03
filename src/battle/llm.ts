import { z } from "zod";
import type { BattlePhase } from "../data/schema";
import {
  parseBattleJudgement,
  type BattleJudgementResult,
} from "../judge/schema";
import type { LlmDebugMode } from "../judge/llm";

export interface BattleJudgeContext {
  phase: BattlePhase;
  transcript: string;
}

export interface BattleLlmPort {
  judgeBattle(
    context: BattleJudgeContext,
    signal: AbortSignal,
  ): Promise<BattleJudgementResult>;
}

export interface BattleLlmFailureTracker {
  getFailureCount(): number;
  recordFailure(): { forcedLocalMode: boolean };
  recordSuccess(): unknown;
}

export type BattleLlmOutcome =
  | { kind: "judged"; judgement: BattleJudgementResult }
  | {
      kind: "fallback";
      reason: "disabled" | "failure";
      forcedLocalMode: boolean;
      error?: unknown;
    };

interface WorkerBattleLlmOptions {
  workerUrl: string;
  fetcher?: (request: Request) => Promise<Response>;
}

interface RetryOptions {
  timeoutMs: number;
  retries: number;
}

const WorkerErrorSchema = z.object({ error: z.string().min(1) });

export async function judgeBattleWithFailureGate(
  port: BattleLlmPort,
  context: BattleJudgeContext,
  signal: AbortSignal,
  tracker: BattleLlmFailureTracker,
): Promise<BattleLlmOutcome> {
  if (tracker.getFailureCount() >= 3) {
    return {
      kind: "fallback",
      reason: "disabled",
      forcedLocalMode: true,
    };
  }

  try {
    const judgement = await port.judgeBattle(context, signal);
    if (signal.aborted) throw abortError(signal.reason);
    tracker.recordSuccess();
    return { kind: "judged", judgement };
  } catch (error) {
    if (signal.aborted) throw error;
    const failure = tracker.recordFailure();
    return {
      kind: "fallback",
      reason: "failure",
      forcedLocalMode: failure.forcedLocalMode,
      error,
    };
  }
}

export function createWorkerBattleLlmPort(
  options: WorkerBattleLlmOptions,
): BattleLlmPort {
  const fetcher = options.fetcher ?? fetch;
  return {
    async judgeBattle({ phase, transcript }, signal) {
      const response = await fetcher(
        new Request(new URL("/judge/battle", ensureTrailingSlash(options.workerUrl)), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            transcript,
            enemyPrompt: phase.enemyPrompt,
            llmContext: phase.llmContext,
          }),
        }),
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const parsed = WorkerErrorSchema.safeParse(body);
        throw new Error(
          parsed.success ? parsed.data.error : `전투 LLM 요청 실패 (${response.status})`,
        );
      }
      return parseBattleJudgement(body, transcript);
    },
  };
}

export function createRetryingBattleLlmPort(
  inner: BattleLlmPort,
  options: RetryOptions,
): BattleLlmPort {
  return {
    async judgeBattle(context, parentSignal) {
      let lastError: unknown;
      for (let attempt = 0; attempt <= options.retries; attempt += 1) {
        if (parentSignal.aborted) throw abortError(parentSignal.reason);
        const controller = new AbortController();
        const abortFromParent = (): void => controller.abort(parentSignal.reason);
        parentSignal.addEventListener("abort", abortFromParent, { once: true });
        const timer = setTimeout(
          () => controller.abort(new Error("Battle LLM timeout")),
          options.timeoutMs,
        );
        try {
          return await inner.judgeBattle(context, controller.signal);
        } catch (error) {
          lastError = error;
          if (parentSignal.aborted) throw abortError(parentSignal.reason);
        } finally {
          clearTimeout(timer);
          parentSignal.removeEventListener("abort", abortFromParent);
        }
      }
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    },
  };
}

export function createDebugBattleLlmPort(
  inner: BattleLlmPort,
  mode: LlmDebugMode,
): BattleLlmPort {
  if (mode === "normal") return inner;
  return {
    async judgeBattle(context, signal) {
      if (mode === "delay") {
        await waitForAbortableDelay(4_500, signal);
        return inner.judgeBattle(context, signal);
      }
      if (mode === "bad-json") throw new SyntaxError("Debug: 잘못된 battle LLM JSON");
      if (mode === "offline") throw new TypeError("Debug: 네트워크 오프라인");
      throw new Error("Debug: battle LLM HTTP 오류");
    },
  };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function abortError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error("요청이 취소되었습니다.");
}

function waitForAbortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = (): void => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(abortError(signal.reason));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}
