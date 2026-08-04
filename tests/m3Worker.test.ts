import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../worker/index";

const LOCAL_ORIGIN = "http://127.0.0.1:5173";

describe("M3 Worker 경계", () => {
  it("허용되지 않은 Origin과 잘못된 콘텐츠형을 거부한다", async () => {
    const worker = createWorker(vi.fn());
    const forbidden = await worker.fetch(
      new Request("http://worker.local/health", {
        headers: { Origin: "https://evil.example" },
      }),
      env(),
    );
    expect(forbidden.status).toBe(403);

    const invalidContent = await worker.fetch(
      new Request("http://worker.local/judge/dialogue", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN, "Content-Type": "text/plain" },
        body: "bad",
      }),
      env(),
    );
    expect(invalidContent.status).toBe(415);
  });

  it("지원하지 않는 메서드와 14MB 초과 오디오를 upstream 전에 거부한다", async () => {
    const upstream = vi.fn();
    const worker = createWorker(upstream);
    const invalidMethod = await worker.fetch(
      new Request("http://worker.local/transcribe/openai", {
        headers: { Origin: LOCAL_ORIGIN },
      }),
      env(),
    );
    expect(invalidMethod.status).toBe(404);

    const oversized = await worker.fetch(
      new Request("http://worker.local/transcribe/openai", {
        method: "POST",
        headers: {
          Origin: LOCAL_ORIGIN,
          "Content-Type": "multipart/form-data; boundary=test",
          "Content-Length": String(15 * 1024 * 1024),
        },
        body: "--test--\r\n",
      }),
      env(),
    );
    expect(oversized.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("production Worker는 Gemini STT 경로를 upstream 전에 거부한다", async () => {
    const upstream = vi.fn();
    const worker = createWorker(upstream);
    const form = new FormData();
    form.append("audio", new File(["wav"], "speech.wav", { type: "audio/wav" }));

    const response = await worker.fetch(
      new Request("http://worker.local/transcribe/gemini", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN },
        body: form,
      }),
      env(),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "비활성화된 STT 공급자입니다." });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("잘못된 클라이언트 JSON은 400, 공급자 JSON은 502로 분리한다", async () => {
    const upstream = vi.fn(async () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: "not-json" }] } }],
      }),
    );
    const worker = createWorker(upstream);
    const invalidClient = await worker.fetch(
      new Request("http://worker.local/judge/dialogue", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN, "Content-Type": "application/json" },
        body: "{",
      }),
      env(),
    );
    expect(invalidClient.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();

    const invalidUpstream = await worker.fetch(dialogueRequest(), env());
    expect(invalidUpstream.status).toBe(502);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("Gemini structured output을 검증된 대화 판정으로 중계한다", async () => {
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
                    intentId: "ask_conditions",
                    affinityDelta: 0,
                    emotion: "neutral",
                    flags: [],
                    reply: "좋아, 조건부터 확인하자!",
                  }),
                },
              ],
            },
          },
        ],
      });
    });

    const response = await worker.fetch(dialogueRequest(), env());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      intentId: "ask_conditions",
      reply: "좋아, 조건부터 확인하자!",
    });
    expect(upstream?.url).toContain("gemini-3.1-flash-lite:generateContent");
    expect(upstream?.headers.get("x-goog-api-key")).toBe("test-gemini-key");
    const body = (await upstream?.json()) as {
      systemInstruction?: { parts?: Array<{ text?: string }> };
      generationConfig?: {
        responseJsonSchema?: unknown;
        thinkingConfig?: { thinkingLevel?: string };
      };
    };
    expect(body.systemInstruction?.parts?.[0]?.text).toContain(
      "reply는 intent 예시를 반복하지 말고 플레이어의 실제 말에 직접 답하라",
    );
    expect(body.systemInstruction?.parts?.[0]?.text).toContain(
      "불안·두려움·분노·진지한 고민",
    );
    expect(body.systemInstruction?.parts?.[0]?.text).toContain(
      "단순 질문·감정 표현·농담에서는 빈 배열",
    );
    expect(body.generationConfig?.responseJsonSchema).toBeTruthy();
    expect(body.generationConfig).toMatchObject({
      thinkingConfig: { thinkingLevel: "minimal" },
    });
  });
});

function dialogueRequest(): Request {
  return new Request("http://worker.local/judge/dialogue", {
    method: "POST",
    headers: { Origin: LOCAL_ORIGIN, "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "근로 조건부터 알고 싶어",
      objective: "첫 관계 온도를 정한다",
      llmContext: "주노가 처음 나타난 시점",
      persona: {
        id: "juno",
        name: "주노",
        role: "안내자",
        traits: ["밝다", "기다린다", "진지함을 존중한다"],
        speechRules: ["반말", "두 문장 이내"],
        taboos: ["감정 단정 금지", "검은 마법소녀 정체 금지"],
        sampleLines: ["조건부터 확인하자!"],
      },
      intents: [
        {
          id: "ask_conditions",
          examples: ["수당은 나와?"],
          keywords: ["수당"],
        },
      ],
      allowedFlags: ["promise"],
      recentTurns: [],
    }),
  });
}

function env(): Env {
  return {
    OPENAI_API_KEY: "test-openai-key",
    GEMINI_API_KEY: "test-gemini-key",
    ALLOWED_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
    OPENAI_TRANSCRIBE_MODEL: "gpt-transcribe",
    GEMINI_TRANSCRIBE_MODEL: "gemini-2.5-flash",
    GEMINI_LLM_MODEL: "gemini-3.1-flash-lite",
  };
}
