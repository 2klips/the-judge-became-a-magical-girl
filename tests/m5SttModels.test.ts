import { describe, expect, it, vi } from "vitest";
import {
  createWorkerTranscriptionPort,
  resolveOpenAiSttModel,
  sttSampleRate,
} from "../src/input/transcription";
import { createWorker } from "../worker/index";

const LOCAL_ORIGIN = "http://127.0.0.1:5173";

describe("M5 debug STT 모델 비교", () => {
  it("debug에서만 허용 목록의 STT 모델 쿼리를 반영한다", () => {
    expect(resolveOpenAiSttModel(new URLSearchParams(), false)).toBe("gpt-transcribe");
    expect(
      resolveOpenAiSttModel(
        new URLSearchParams("sttModel=gpt-live-transcribe"),
        false,
      ),
    ).toBe("gpt-transcribe");
    expect(
      resolveOpenAiSttModel(
        new URLSearchParams("sttModel=gpt-live-transcribe"),
        true,
      ),
    ).toBe("gpt-live-transcribe");
    expect(
      resolveOpenAiSttModel(new URLSearchParams("sttModel=invalid"), true),
    ).toBe("gpt-transcribe");
  });

  it("모델별 API 입력 샘플 레이트를 고정한다", () => {
    expect(sttSampleRate("gpt-transcribe")).toBe(16_000);
    expect(sttSampleRate("gpt-live-transcribe")).toBe(24_000);
  });

  it("선택 모델을 한 개만 전송하고 왕복·upstream 측정값을 보존한다", async () => {
    let received: Request | undefined;
    const port = createWorkerTranscriptionPort({
      provider: "openai",
      model: "gpt-live-transcribe",
      workerUrl: "http://127.0.0.1:8787",
      fetcher: vi.fn(async (request: Request) => {
        received = request;
        return Response.json({
          model: "gpt-live-transcribe",
          text: "주노 맞지?",
          metrics: { upstreamMs: 420, firstDeltaMs: 180 },
        });
      }),
    });

    await expect(
      port.transcribe(
        new Blob(["wav"], { type: "audio/wav" }),
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      text: "주노 맞지?",
      model: "gpt-live-transcribe",
      upstreamMs: 420,
      firstDeltaMs: 180,
      roundTripMs: expect.any(Number),
    });

    const form = await received?.formData();
    expect(form?.get("model")).toBe("gpt-live-transcribe");
    expect(form?.getAll("model")).toHaveLength(1);
  });

  it("Worker는 selector가 켜진 환경에서만 live 모델을 허용한다", async () => {
    const liveTranscribe = vi.fn(async () => ({
      model: "gpt-live-transcribe" as const,
      text: "마법소녀",
      metrics: { upstreamMs: 310, firstDeltaMs: 140 },
    }));
    const worker = createWorker(vi.fn(), { liveTranscribe });

    const disabled = await worker.fetch(
      transcriptionRequest("gpt-live-transcribe"),
      env(),
    );
    expect(disabled.status).toBe(400);
    expect(liveTranscribe).not.toHaveBeenCalled();

    const enabled = await worker.fetch(
      transcriptionRequest("gpt-live-transcribe"),
      env({ ENABLE_OPENAI_STT_MODEL_SELECTOR: "true" }),
    );
    expect(enabled.status).toBe(200);
    await expect(enabled.json()).resolves.toEqual({
      model: "gpt-live-transcribe",
      text: "마법소녀",
      metrics: { upstreamMs: 310, firstDeltaMs: 140 },
    });
    expect(liveTranscribe).toHaveBeenCalledTimes(1);
  });

  it("live 모델은 24kHz PCM을 Realtime 세션에 append·commit하고 완료를 기다린다", async () => {
    const socket = new FakeRealtimeSocket();
    const upgradeResponse = Response.json(null);
    Object.defineProperties(upgradeResponse, {
      status: { value: 101 },
      webSocket: { value: socket },
    });
    let upgradeRequest: Request | undefined;
    const upstream = vi.fn(async (request: Request) => {
      upgradeRequest = request;
      return upgradeResponse;
    });
    const worker = createWorker(upstream);

    const form = new FormData();
    form.append("audio", pcmWavFile(24_000), "speech.wav");
    form.append("model", "gpt-live-transcribe");
    const response = await worker.fetch(
      new Request("http://worker.local/transcribe/openai", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN },
        body: form,
      }),
      env({ ENABLE_OPENAI_STT_MODEL_SELECTOR: "true" }),
    );

    expect(response.status).toBe(200);
    expect(upgradeRequest?.url).toBe(
      "https://api.openai.com/v1/realtime?intent=transcription",
    );
    await expect(response.json()).resolves.toMatchObject({
      model: "gpt-live-transcribe",
      text: "주노 맞지?",
      metrics: {
        upstreamMs: expect.any(Number),
        firstDeltaMs: expect.any(Number),
      },
    });
    expect(socket.accepted).toBe(true);
    const events = socket.sent.map((message) => JSON.parse(message) as Record<string, unknown>);
    expect(events.map(({ type }) => type)).toEqual([
      "session.update",
      "input_audio_buffer.append",
      "input_audio_buffer.commit",
    ]);
    expect(events[0]).toMatchObject({
      session: {
        type: "transcription",
        audio: {
          input: {
            format: { type: "audio/pcm", rate: 24_000 },
            transcription: {
              model: "gpt-live-transcribe",
              languages: ["ko"],
              delay: "low",
            },
            turn_detection: null,
          },
        },
      },
    });
    expect(events[1]?.audio).toBeTypeOf("string");
  });
});

class FakeRealtimeSocket extends EventTarget {
  readonly sent: string[] = [];
  accepted = false;

  accept(): void {
    this.accepted = true;
  }

  send(message: string): void {
    this.sent.push(message);
    const event = JSON.parse(message) as { type?: string };
    if (event.type !== "input_audio_buffer.commit") return;
    queueMicrotask(() => {
      this.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "conversation.item.input_audio_transcription.delta",
            delta: "주노 ",
          }),
        }),
      );
      this.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "conversation.item.input_audio_transcription.completed",
            transcript: "주노 맞지?",
          }),
        }),
      );
    });
  }

  close(): void {
    // 테스트에서는 원격 close 이벤트를 별도로 발생시키지 않는다.
  }
}

function pcmWavFile(sampleRate: number): File {
  const samples = 240;
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, samples * 2, true);
  return new File([buffer], "speech.wav", { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function transcriptionRequest(model: string): Request {
  const form = new FormData();
  form.append("audio", new File(["wav"], "speech.wav", { type: "audio/wav" }));
  form.append("model", model);
  return new Request("http://worker.local/transcribe/openai", {
    method: "POST",
    headers: { Origin: LOCAL_ORIGIN },
    body: form,
  });
}

function env(overrides: Record<string, string> = {}): Env {
  return {
    OPENAI_API_KEY: "test-openai-key",
    ALLOWED_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
    OPENAI_TRANSCRIBE_MODEL: "gpt-transcribe",
    GEMINI_TRANSCRIBE_MODEL: "gemini-2.5-flash",
    LLM_PROVIDER: "openai",
    OPENAI_LLM_MODEL: "gpt-5.6-luna",
    GEMINI_LLM_MODEL: "gemini-3.1-flash-lite",
    ...overrides,
  } as Env;
}
