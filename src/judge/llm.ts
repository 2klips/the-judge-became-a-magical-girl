import { z } from "zod";
import type { Character, DialogueNode } from "../data/schema";
import { readWorkerJson } from "../network/workerResponse";
import {
  parseDialogueJudgementForNode,
  type DialogueJudgementResult,
} from "./schema";

export interface RecentDialogueTurn {
  role: "player" | "juno";
  text: string;
}

export interface DialogueJudgeContext {
  node: DialogueNode;
  transcript: string;
  recentTurns: readonly RecentDialogueTurn[];
  character?: Character;
}

export interface LlmPort {
  judgeDialogue(
    context: DialogueJudgeContext,
    signal: AbortSignal,
  ): Promise<DialogueJudgementResult>;
}

export type LlmDebugMode = "normal" | "delay" | "error" | "bad-json" | "offline";

interface WorkerLlmOptions {
  workerUrl: string;
  fetcher?: (request: Request) => Promise<Response>;
}

interface RetryOptions {
  timeoutMs: number;
  retries: number;
}

const WorkerErrorSchema = z.object({ error: z.string().min(1) });

export function createWorkerLlmPort(options: WorkerLlmOptions): LlmPort {
  const fetcher = options.fetcher ?? fetch;
  return {
    async judgeDialogue(context, signal) {
      const { node, transcript, character } = context;
      const response = await fetcher(
        new Request(new URL("/judge/dialogue", ensureTrailingSlash(options.workerUrl)), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            transcript,
            objective: node.objective,
            llmContext: node.llmContext,
            persona: character
              ? {
                  id: character.id,
                  name: character.name,
                  role: character.role,
                  traits: character.traits,
                  speechRules: character.speechRules,
                  taboos: character.taboos,
                  sampleLines: character.sampleLines,
                }
              : undefined,
            intents: node.intents.map((intent) => ({
              id: intent.id,
              examples: intent.examples,
              keywords: intent.keywords,
            })),
            allowedFlags: node.allowedFlags,
            recentTurns: context.recentTurns.slice(-6),
          }),
        }),
      );
      const body = await readWorkerJson(response, "LLM Worker");
      if (!response.ok) {
        const parsed = WorkerErrorSchema.safeParse(body);
        throw new Error(parsed.success ? parsed.data.error : `LLM 요청 실패 (${response.status})`);
      }
      return parseDialogueJudgementForNode(body, node, transcript);
    },
  };
}

export function createRetryingLlmPort(inner: LlmPort, options: RetryOptions): LlmPort {
  return {
    async judgeDialogue(context, parentSignal) {
      let lastError: unknown;
      for (let attempt = 0; attempt <= options.retries; attempt += 1) {
        if (parentSignal.aborted) throw abortError(parentSignal.reason);
        try {
          return await runTimedAttempt(inner, context, parentSignal, options.timeoutMs);
        } catch (error) {
          lastError = error;
          if (parentSignal.aborted) throw abortError(parentSignal.reason);
        }
      }
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    },
  };
}

export function createDebugLlmPort(inner: LlmPort, mode: LlmDebugMode): LlmPort {
  if (mode === "normal") return inner;
  return {
    async judgeDialogue(context, signal) {
      if (mode === "delay") {
        await waitForAbortableDelay(4_500, signal);
        return inner.judgeDialogue(context, signal);
      }
      if (mode === "bad-json") throw new SyntaxError("Debug: 잘못된 LLM JSON");
      if (mode === "offline") throw new TypeError("Debug: 네트워크 오프라인");
      throw new Error("Debug: LLM HTTP 오류");
    },
  };
}

export function resolveLlmDebugMode(params: URLSearchParams): LlmDebugMode {
  const value = params.get("llm");
  return value === "delay" || value === "error" || value === "bad-json" || value === "offline"
    ? value
    : "normal";
}

async function runTimedAttempt(
  inner: LlmPort,
  context: DialogueJudgeContext,
  parentSignal: AbortSignal,
  timeoutMs: number,
): Promise<DialogueJudgementResult> {
  const controller = new AbortController();
  const abortFromParent = (): void => controller.abort(parentSignal.reason);
  parentSignal.addEventListener("abort", abortFromParent, { once: true });
  const timer = setTimeout(() => controller.abort(new Error("LLM timeout")), timeoutMs);
  try {
    return await inner.judgeDialogue(context, controller.signal);
  } finally {
    clearTimeout(timer);
    parentSignal.removeEventListener("abort", abortFromParent);
  }
}

function abortError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error("요청이 취소되었습니다.");
}

function waitForAbortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    const abort = (): void => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(abortError(signal.reason));
    };
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
