import { describe, expect, it } from "vitest";
import { createSttLabWorker, type SttLabEnv } from "../worker/sttLab";

const LOCAL_ORIGIN = "http://127.0.0.1:5173";

describe("STT Lab Worker", () => {
  it("A 요청의 WAV를 OpenAI gpt-transcribe multipart 요청으로 중계한다", async () => {
    let upstreamRequest: Request | undefined;
    const worker = createSttLabWorker(async (request) => {
      upstreamRequest = request;
      return Response.json({ text: "마법소녀 주노입니다" });
    });

    const response = await worker.fetch(
      transcriptionRequest("/transcribe/openai"),
      env({ OPENAI_API_KEY: "test-openai-key" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      model: "gpt-transcribe",
      text: "마법소녀 주노입니다",
    });
    expect(upstreamRequest?.url).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect(upstreamRequest?.headers.get("authorization")).toBe("Bearer test-openai-key");
    const upstreamForm = await upstreamRequest?.formData();
    expect(upstreamForm?.get("model")).toBe("gpt-transcribe");
    expect(upstreamForm?.get("languages[]")).toBe("ko");
    expect(upstreamForm?.get("language")).toBeNull();
    expect(upstreamForm?.get("file")).toBeInstanceOf(File);
  });

  it("B 요청의 같은 WAV를 Gemini inline audio 요청으로 중계한다", async () => {
    let upstreamRequest: Request | undefined;
    const worker = createSttLabWorker(async (request) => {
      upstreamRequest = request;
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ text: "마법소녀 주노입니다" }) }],
            },
          },
        ],
      });
    });

    const response = await worker.fetch(
      transcriptionRequest("/transcribe/gemini"),
      env({ GEMINI_API_KEY: "test-gemini-key" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      model: "gemini-2.5-flash",
      text: "마법소녀 주노입니다",
    });
    expect(upstreamRequest?.url).toContain("/v1beta/models/gemini-2.5-flash:generateContent");
    expect(upstreamRequest?.headers.get("x-goog-api-key")).toBe("test-gemini-key");
    const body = (await upstreamRequest?.json()) as {
      contents: Array<{ parts: Array<{ inline_data?: { mime_type: string; data: string } }> }>;
    };
    expect(body.contents[0]?.parts[1]?.inline_data).toEqual({
      mime_type: "audio/wav",
      data: "c2FtZS13YXY=",
    });
  });
});

function transcriptionRequest(path: string): Request {
  const form = new FormData();
  form.append("audio", new Blob(["same-wav"], { type: "audio/wav" }), "speech.wav");
  return new Request(`http://worker.local${path}`, {
    method: "POST",
    headers: { Origin: LOCAL_ORIGIN },
    body: form,
  });
}

function env(overrides: Partial<SttLabEnv>): SttLabEnv {
  return {
    ALLOWED_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
    OPENAI_API_KEY: "test-openai-key",
    GEMINI_API_KEY: "test-gemini-key",
    OPENAI_TRANSCRIBE_MODEL: "gpt-transcribe",
    GEMINI_TRANSCRIBE_MODEL: "gemini-2.5-flash",
    LLM_PROVIDER: "gemini",
    GEMINI_LLM_MODEL: "gemini-3.1-flash-lite",
    ...overrides,
  };
}
