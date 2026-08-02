import { describe, expect, it, vi } from "vitest";
import {
  createWorkerTranscriptionPort,
  resolveSttProvider,
} from "../src/input/transcription";

describe("M3 선택형 STT", () => {
  it.each([
    ["openai", "/transcribe/openai"],
    ["gemini", "/transcribe/gemini"],
  ] as const)("%s 선택 시 해당 공급자만 한 번 호출한다", async (provider, path) => {
    const fetcher = vi.fn(async (_request: Request) =>
      Response.json({ model: `${provider}-model`, text: "  주노 맞지?  " }),
    );
    const port = createWorkerTranscriptionPort({
      provider,
      workerUrl: "http://127.0.0.1:8787",
      fetcher,
      timeoutMs: 100,
    });

    await expect(
      port.transcribe(new Blob(["wav"], { type: "audio/wav" }), new AbortController().signal),
    ).resolves.toBe("주노 맞지?");

    expect(fetcher).toHaveBeenCalledTimes(1);
    const request = fetcher.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe(`http://127.0.0.1:8787${path}`);
    const form = await (request as Request).formData();
    expect(form.get("audio")).toBeInstanceOf(File);
  });

  it("쿼리 공급자만 허용하고 기본값은 OpenAI로 둔다", () => {
    expect(resolveSttProvider(new URLSearchParams("stt=gemini"))).toBe("gemini");
    expect(resolveSttProvider(new URLSearchParams("stt=invalid"))).toBe("openai");
    expect(resolveSttProvider(new URLSearchParams())).toBe("openai");
  });

  it("Worker 응답이 계약과 다르면 차단한다", async () => {
    const port = createWorkerTranscriptionPort({
      provider: "openai",
      workerUrl: "http://127.0.0.1:8787",
      fetcher: vi.fn(async (_request: Request) => Response.json({ transcript: "잘못된 필드" })),
    });

    await expect(
      port.transcribe(new Blob(["wav"], { type: "audio/wav" }), new AbortController().signal),
    ).rejects.toThrow();
  });
});
