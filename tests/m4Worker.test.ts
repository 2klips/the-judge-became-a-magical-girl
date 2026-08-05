import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../worker/index";

const LOCAL_ORIGIN = "http://127.0.0.1:5173";

describe("M4 battle Worker 경계", () => {
  it("검증된 battle structured output을 중계한다", async () => {
    let upstream: Request | undefined;
    const worker = createWorker(async (request) => {
      upstream = request;
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    reply: "그 확신도 곧 흐려질 거다.",
                    intent: "persuade",
                    momentumDelta: 8,
                    narration: "망령의 윤곽이 흔들린다.",
                  }),
                },
              ],
            },
          },
        ],
      });
    });

    const response = await worker.fetch(battleRequest(), env());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      intent: "persuade",
      momentumDelta: 8,
    });
    const body = (await upstream?.json()) as {
      systemInstruction?: { parts?: Array<{ text?: string }> };
      generationConfig?: { responseJsonSchema?: unknown };
    };
    expect(body.systemInstruction?.parts?.[0]?.text).toContain("-5에서 +10");
    expect(body.generationConfig?.responseJsonSchema).toBeTruthy();
  });

  it("공개 QA에서는 OpenAI Responses structured output을 battle 판정으로 중계한다", async () => {
    let upstream: Request | undefined;
    const worker = createWorker(async (request) => {
      upstream = request;
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  reply: "그 확신도 곧 흐려질 거다.",
                  intent: "persuade",
                  momentumDelta: 8,
                  narration: "망령의 윤곽이 흔들린다.",
                }),
              },
            ],
          },
        ],
      });
    });

    const response = await worker.fetch(
      battleRequest(),
      env({ LLM_PROVIDER: "openai", OPENAI_LLM_MODEL: "gpt-5.6-luna" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      intent: "persuade",
      momentumDelta: 8,
    });
    expect(upstream?.url).toBe("https://api.openai.com/v1/responses");
    const body = (await upstream?.json()) as {
      input?: string;
      reasoning?: { effort?: string };
      text?: {
        format?: {
          name?: string;
          strict?: boolean;
          schema?: { required?: string[] };
        };
      };
    };
    expect(body.reasoning?.effort).toBe("low");
    expect(body.input).toContain("주노와 함께라면 포기하지 않아.");
    expect(body.text?.format).toMatchObject({
      name: "battle_judgement",
      strict: true,
    });
    expect(body.text?.format?.schema?.required).toContain("narration");
  });

  it("잘못된 battle 요청은 upstream 전에 400으로 거부한다", async () => {
    const upstream = vi.fn();
    const worker = createWorker(upstream);
    const response = await worker.fetch(
      new Request("http://worker.local/judge/battle", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN, "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: "누락된 context" }),
      }),
      env(),
    );

    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("허용 범위 밖 momentumDelta 공급자 응답은 502로 거부한다", async () => {
    const worker = createWorker(async () =>
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    reply: "끝이다.",
                    intent: "other",
                    momentumDelta: 99,
                  }),
                },
              ],
            },
          },
        ],
      }),
    );

    expect((await worker.fetch(battleRequest(), env())).status).toBe(502);
  });
});

function battleRequest(): Request {
  return new Request("http://worker.local/judge/battle", {
    method: "POST",
    headers: { Origin: LOCAL_ORIGIN, "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "주노와 함께라면 포기하지 않아.",
      enemyPrompt: "네 목소리는 아무도 듣지 않아.",
      llmContext: "확신에 찬 긍정과 곁에 있는 존재의 언급에 흔들린다.",
    }),
  });
}

function env(overrides: Record<string, string> = {}): Env {
  return {
    OPENAI_API_KEY: "test-openai-key",
    GEMINI_API_KEY: "test-gemini-key",
    ALLOWED_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
    OPENAI_TRANSCRIBE_MODEL: "gpt-transcribe",
    GEMINI_TRANSCRIBE_MODEL: "gemini-2.5-flash",
    LLM_PROVIDER: "gemini",
    GEMINI_LLM_MODEL: "gemini-3.1-flash-lite",
    ...overrides,
  } as Env;
}
