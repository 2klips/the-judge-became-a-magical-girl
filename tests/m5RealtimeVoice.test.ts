import { describe, expect, it, vi } from "vitest";
import {
  createWorkerRealtimeVoicePort,
  type RealtimeVoiceRequest,
} from "../src/input/transcription";
import { createWorker } from "../worker/index";

const LOCAL_ORIGIN = "http://127.0.0.1:5173";

describe("M5 gpt-realtime-2.1-mini 직접 음성 판정", () => {
  it("클라이언트는 WAV와 대화 context를 한 요청으로 보내고 검증된 판정을 보존한다", async () => {
    let received: Request | undefined;
    const request = dialogueVoiceRequest();
    const port = createWorkerRealtimeVoicePort({
      request,
      workerUrl: "http://127.0.0.1:8787",
      fetcher: vi.fn(async (input: Request) => {
        received = input;
        return Response.json({
          mode: "dialogue",
          model: "gpt-realtime-2.1-mini",
          text: "주노, 같이 가자.",
          judgement: {
            intentId: "accept",
            affinityDelta: 2,
            emotion: "happy",
            flags: ["accepted_partnership"],
            reply: "좋아, 그 말 기다렸어!",
          },
          metrics: { upstreamMs: 620, firstDeltaMs: 410 },
        });
      }),
    });

    await expect(
      port.transcribe(
        new Blob(["wav"], { type: "audio/wav" }),
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      text: "주노, 같이 가자.",
      model: "gpt-realtime-2.1-mini",
      upstreamMs: 620,
      firstDeltaMs: 410,
      analysis: {
        kind: "dialogue",
        judgement: { intentId: "accept", affinityDelta: 2 },
      },
    });

    const form = await received?.formData();
    expect(form?.get("mode")).toBe("dialogue");
    expect(JSON.parse(String(form?.get("context")))).toMatchObject({
      objective: "주노와 동행을 결정한다.",
      persona: { id: "juno" },
    });
  });

  it("Worker는 24kHz PCM을 Realtime reasoning 세션에 보내고 함수 판정만 수용한다", async () => {
    const socket = new FakeRealtimeVoiceSocket({
      transcript: "주노, 같이 가자.",
      intentId: "accept",
      affinityDelta: 2,
      emotion: "happy",
      flags: ["accepted_partnership"],
      reply: "좋아, 그 말 기다렸어!",
    });
    const upgradeResponse = Response.json(null);
    Object.defineProperties(upgradeResponse, {
      status: { value: 101 },
      webSocket: { value: socket },
    });
    let upgradeRequest: Request | undefined;
    const worker = createWorker(
      vi.fn(async (request: Request) => {
        upgradeRequest = request;
        return upgradeResponse;
      }),
    );
    const form = new FormData();
    form.append("audio", pcmWavFile(24_000), "speech.wav");
    form.append("mode", "dialogue");
    form.append("context", JSON.stringify(dialogueVoiceRequest().context));

    const response = await worker.fetch(
      new Request("http://worker.local/voice/realtime", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN },
        body: form,
      }),
      env(),
    );

    expect(response.status).toBe(200);
    expect(upgradeRequest?.url).toBe(
      "https://api.openai.com/v1/realtime?model=gpt-realtime-2.1-mini",
    );
    await expect(response.json()).resolves.toMatchObject({
      mode: "dialogue",
      model: "gpt-realtime-2.1-mini",
      text: "주노, 같이 가자.",
      judgement: {
        intentId: "accept",
        affinityDelta: 2,
        reply: "좋아, 그 말 기다렸어!",
      },
      metrics: {
        upstreamMs: expect.any(Number),
        firstDeltaMs: expect.any(Number),
      },
    });
    expect(socket.accepted).toBe(true);
    const events = socket.sent.map((message) => JSON.parse(message));
    expect(events.map(({ type }) => type)).toEqual([
      "session.update",
      "input_audio_buffer.append",
      "input_audio_buffer.commit",
      "response.create",
    ]);
    expect(events[0]).toMatchObject({
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1-mini",
        output_modalities: ["text"],
        reasoning: { effort: "low" },
        audio: {
          input: {
            format: { type: "audio/pcm", rate: 24_000 },
            turn_detection: null,
          },
        },
        tools: [{ name: "submit_dialogue_judgement" }],
        tool_choice: "required",
      },
    });
  });

  it("Realtime dialogue Worker도 malformed Korean reply를 거부한다", async () => {
    const socket = new FakeRealtimeVoiceSocket({
      transcript: "정면으로 맞서자",
      intentId: "accept",
      affinityDelta: 1,
      emotion: "neutral",
      flags: [],
      reply: "좋아, 정면으로 맞설 연다.",
    });
    const upgradeResponse = Response.json(null);
    Object.defineProperties(upgradeResponse, {
      status: { value: 101 },
      webSocket: { value: socket },
    });
    const worker = createWorker(vi.fn(async () => upgradeResponse));
    const form = new FormData();
    form.append("audio", pcmWavFile(24_000), "speech.wav");
    form.append("mode", "dialogue");
    form.append("context", JSON.stringify(dialogueVoiceRequest().context));

    const response = await worker.fetch(
      new Request("http://worker.local/voice/realtime", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN },
        body: form,
      }),
      env(),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "주노 응답이 안전 규칙을 위반했습니다." });
  });

  it("지원하지 않는 Realtime 모델 설정은 upstream 연결 전에 차단한다", async () => {
    const upstream = vi.fn();
    const worker = createWorker(upstream);
    const form = new FormData();
    form.append("audio", pcmWavFile(24_000), "speech.wav");
    form.append("mode", "transcript");

    const response = await worker.fetch(
      new Request("http://worker.local/voice/realtime", {
        method: "POST",
        headers: { Origin: LOCAL_ORIGIN },
        body: form,
      }),
      env({ OPENAI_REALTIME_MODEL: "unapproved-model" }),
    );

    expect(response.status).toBe(500);
    expect(upstream).not.toHaveBeenCalled();
  });
});

class FakeRealtimeVoiceSocket extends EventTarget {
  readonly sent: string[] = [];
  accepted = false;

  constructor(private readonly result: Record<string, unknown>) {
    super();
  }

  accept(): void {
    this.accepted = true;
  }

  send(message: string): void {
    this.sent.push(message);
    const event = JSON.parse(message) as { type?: string };
    if (event.type !== "response.create") return;
    queueMicrotask(() => {
      this.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "response.function_call_arguments.delta",
            delta: "{",
          }),
        }),
      );
      this.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "response.done",
            response: {
              status: "completed",
              output: [
                {
                  type: "function_call",
                  name: "submit_dialogue_judgement",
                  arguments: JSON.stringify(this.result),
                },
              ],
            },
          }),
        }),
      );
    });
  }

  close(): void {
    // 테스트에서는 원격 close 이벤트를 발생시키지 않는다.
  }
}

function dialogueVoiceRequest(): Extract<RealtimeVoiceRequest, { mode: "dialogue" }> {
  return {
    mode: "dialogue",
    context: {
      objective: "주노와 동행을 결정한다.",
      llmContext: "주노가 도윤의 선택을 기다린다.",
      persona: {
        id: "juno",
        name: "주노",
        role: "안내자",
        traits: ["자신감"],
        speechRules: ["반말"],
        taboos: ["검은 마법소녀의 정체"],
        sampleLines: ["좋아, 따라와!"],
      },
      intents: [
        {
          id: "accept",
          examples: ["같이 갈게"],
          keywords: ["같이", "갈게"],
        },
      ],
      allowedFlags: ["accepted_partnership"],
      recentTurns: [],
    },
  };
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

function env(overrides: Record<string, string> = {}): Env {
  return {
    OPENAI_API_KEY: "test-openai-key",
    ALLOWED_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
    OPENAI_TRANSCRIBE_MODEL: "gpt-transcribe",
    OPENAI_REALTIME_MODEL: "gpt-realtime-2.1-mini",
    ENABLE_OPENAI_STT_MODEL_SELECTOR: "true",
    GEMINI_TRANSCRIBE_MODEL: "gemini-2.5-flash",
    LLM_PROVIDER: "openai",
    OPENAI_LLM_MODEL: "gpt-5.6-luna",
    GEMINI_LLM_MODEL: "gemini-3.1-flash-lite",
    ...overrides,
  } as Env;
}
