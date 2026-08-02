import { describe, expect, it, vi } from "vitest";
import type { DialogueNode } from "../src/data/schema";
import {
  createRetryingLlmPort,
  createWorkerLlmPort,
} from "../src/judge/llm";
import { parseDialogueJudgementForNode } from "../src/judge/schema";
import { loadFixtureData } from "./fixtures";

function dialogueNode(): DialogueNode {
  const node = loadFixtureData().scenario.find((candidate) => candidate.type === "dialogue");
  if (!node || node.type !== "dialogue") throw new Error("fixture dialogue 없음");
  return node;
}

describe("M3 LLM 판정", () => {
  it("알 수 없는 intent와 80자 초과 응답을 차단한다", () => {
    const node = dialogueNode();
    expect(() =>
      parseDialogueJudgementForNode(
        {
          intentId: "unknown",
          affinityDelta: 0,
          emotion: "neutral",
          flags: [],
          reply: "응.",
        },
        node,
        "테스트",
      ),
    ).toThrow(/intent/);

    expect(() =>
      parseDialogueJudgementForNode(
        {
          intentId: node.intents[0]?.id,
          affinityDelta: 0,
          emotion: "neutral",
          flags: [],
          reply: "가".repeat(81),
        },
        node,
        "테스트",
      ),
    ).toThrow();
  });

  it("플레이어가 말하지 않은 감정 단정과 검은 마법소녀 공개를 차단한다", () => {
    const node = dialogueNode();
    const base = {
      intentId: node.intents[0]?.id,
      affinityDelta: 0,
      emotion: "neutral" as const,
      flags: [],
    };
    expect(() =>
      parseDialogueJudgementForNode(
        { ...base, reply: "너 지금 화났구나." },
        node,
        "수당은 나와?",
      ),
    ).toThrow(/감정/);
    expect(() =>
      parseDialogueJudgementForNode(
        { ...base, reply: "갑자기 나타나서 놀랐지?" },
        node,
        "너 진짜 짜증나.",
      ),
    ).toThrow(/감정/);
    expect(() =>
      parseDialogueJudgementForNode(
        { ...base, reply: "많이 무섭구나." },
        node,
        "수당은 나와?",
      ),
    ).toThrow(/감정/);
    expect(() =>
      parseDialogueJudgementForNode(
        { ...base, reply: "검은 마법소녀의 정체를 알려 줄게." },
        node,
        "누구와 싸워?",
      ),
    ).toThrow(/금기/);
  });

  it("4초 제한 단위 호출을 한 번 재시도한 뒤 성공한다", async () => {
    const context = { node: dialogueNode(), transcript: "처음 듣는 자유 발화", recentTurns: [] };
    const intentId = context.node.intents[1]!.id;
    const inner = {
      judgeDialogue: vi
        .fn()
        .mockRejectedValueOnce(new Error("temporary"))
        .mockResolvedValueOnce({
          intentId,
          affinityDelta: 0,
          emotion: "neutral",
          flags: [],
          reply: "좋아, 조건부터 하나씩 확인하자!",
        }),
    };
    const port = createRetryingLlmPort(inner, { timeoutMs: 4_000, retries: 1 });

    await expect(port.judgeDialogue(context, new AbortController().signal)).resolves.toMatchObject({
      intentId,
    });
    expect(inner.judgeDialogue).toHaveBeenCalledTimes(2);
  });

  it("각 호출을 4초에 중단하고 한 번만 재시도한다", async () => {
    vi.useFakeTimers();
    try {
      const context = { node: dialogueNode(), transcript: "응답이 늦는 자유 발화", recentTurns: [] };
      const inner = {
        judgeDialogue: vi.fn(
          (_context: unknown, signal: AbortSignal) =>
            new Promise<never>((_resolve, reject) => {
              const abort = (): void => reject(signal.reason);
              if (signal.aborted) abort();
              else signal.addEventListener("abort", abort, { once: true });
            }),
        ),
      };
      const port = createRetryingLlmPort(inner, { timeoutMs: 4_000, retries: 1 });
      const pending = port.judgeDialogue(context, new AbortController().signal);
      const rejected = expect(pending).rejects.toThrow("LLM timeout");

      await vi.advanceTimersByTimeAsync(4_000);
      expect(inner.judgeDialogue).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(4_000);

      await rejected;
      expect(inner.judgeDialogue).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("Worker JSON 경계를 검증한다", async () => {
    const context = { node: dialogueNode(), transcript: "수당은?", recentTurns: [] };
    const intentId = context.node.intents[1]!.id;
    const fetcher = vi.fn(async (_request: Request) =>
      Response.json({
        intentId,
        affinityDelta: 0,
        emotion: "neutral",
        flags: [],
        reply: "조건부터 확인하자!",
      }),
    );
    const port = createWorkerLlmPort({
      workerUrl: "http://127.0.0.1:8787",
      fetcher,
    });
    await expect(port.judgeDialogue(context, new AbortController().signal)).resolves.toMatchObject({
      reply: "조건부터 확인하자!",
    });
    const request = fetcher.mock.calls[0]?.[0] as Request;
    expect(request.url).toBe("http://127.0.0.1:8787/judge/dialogue");
    expect(request.headers.get("content-type")).toContain("application/json");
  });
});
