import { describe, expect, it, vi } from "vitest";
import type { BattlePhase } from "../src/data/schema";
import {
  createRetryingBattleLlmPort,
  createWorkerBattleLlmPort,
  type BattleLlmPort,
} from "../src/battle/llm";

const phase: BattlePhase = {
  phaseId: "p1",
  enemyPrompt: "네 목소리는 아무도 듣지 않아.",
  llmContext: "확신에 찬 긍정과 곁에 있는 존재의 언급에 흔들린다.",
  spell: {
    displayText: "물러나라 잿빛 그림자여!",
    requiredKeywords: ["물러나", "잿빛", "그림자"],
    minMatch: 2,
  },
  guardLine: "빛의 장막이 압박을 밀어낸다.",
  clickResponses: [
    { text: "나는 포기하지 않아.", momentumDelta: 8 },
    { text: "아직 끝나지 않았어.", momentumDelta: 3 },
  ],
  maxTurns: 3,
  advanceAt: 60,
};

describe("M4 battle LLM port", () => {
  it("phase context와 transcript를 /judge/battle에 보내고 검증한다", async () => {
    let requestBody: unknown;
    const port = createWorkerBattleLlmPort({
      workerUrl: "https://worker.example",
      fetcher: async (request) => {
        requestBody = await request.json();
        return Response.json({
          reply: "그 확신도 곧 흐려질 거다.",
          intent: "persuade",
          momentumDelta: 8,
          narration: "망령의 윤곽이 흔들린다.",
        });
      },
    });

    const result = await port.judgeBattle(
      { phase, transcript: "주노와 함께라면 포기하지 않아." },
      new AbortController().signal,
    );

    expect(requestBody).toMatchObject({
      transcript: "주노와 함께라면 포기하지 않아.",
      enemyPrompt: phase.enemyPrompt,
      llmContext: phase.llmContext,
    });
    expect(result).toMatchObject({ intent: "persuade", momentumDelta: 8 });
  });

  it("허용 범위 밖 momentumDelta를 거부한다", async () => {
    const port = createWorkerBattleLlmPort({
      workerUrl: "https://worker.example",
      fetcher: async () =>
        Response.json({ reply: "흔들린다.", intent: "other", momentumDelta: 99 }),
    });

    await expect(
      port.judgeBattle({ phase, transcript: "자유 발화" }, new AbortController().signal),
    ).rejects.toThrow();
  });

  it("실패 뒤 1회 재시도한다", async () => {
    const inner: BattleLlmPort = {
      judgeBattle: vi
        .fn()
        .mockRejectedValueOnce(new Error("temporary"))
        .mockResolvedValueOnce({
          reply: "두 번째 응답",
          intent: "other",
          momentumDelta: 0,
        }),
    };
    const port = createRetryingBattleLlmPort(inner, { timeoutMs: 100, retries: 1 });

    await expect(
      port.judgeBattle({ phase, transcript: "자유 발화" }, new AbortController().signal),
    ).resolves.toMatchObject({ reply: "두 번째 응답" });
    expect(inner.judgeBattle).toHaveBeenCalledTimes(2);
  });
});
