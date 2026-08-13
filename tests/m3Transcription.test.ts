import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  classifyVoiceInputError,
  createWorkerRealtimeVoicePort,
  createWorkerTranscriptionPort,
  formatVoiceInputError,
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
    ).resolves.toMatchObject({
      text: "주노 맞지?",
      model: `${provider}-model`,
      roundTripMs: expect.any(Number),
    });

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

  it("공개 QA에서 GPT를 고정하면 Gemini 쿼리를 무시한다", () => {
    expect(resolveSttProvider(new URLSearchParams("stt=gemini"), "openai")).toBe("openai");
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

  it("Worker 대신 HTML이 반환되면 원문 파싱 오류를 숨기고 연결 오류로 안내한다", async () => {
    const port = createWorkerTranscriptionPort({
      provider: "openai",
      workerUrl: "https://pages.example/game/",
      fetcher: vi.fn(async (_request: Request) =>
        new Response("<html><head></head><body>Pages fallback</body></html>", {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    });

    await expect(
      port.transcribe(new Blob(["wav"], { type: "audio/wav" }), new AbortController().signal),
    ).rejects.toThrow("STT Worker 응답이 JSON이 아닙니다");
  });

  it("브라우저 디코드 오류를 recording 상태와 중립 문구로 안내한다", () => {
    const failure = classifyVoiceInputError(new Error("Unable to decode audio data"));

    expect(failure.kind).toBe("recording");
    expect(formatVoiceInputError(failure)).toBe("마이크 녹음을 처리하지 못했어.");
  });

  it.each([
    [new DOMException("denied", "NotAllowedError"), "permission", "마이크 권한"],
    [new TypeError("Failed to fetch"), "network", "음성 서버"],
    [new Error("STT timeout"), "timeout", "예상보다 오래"],
    [new Error("Realtime 음성 요청 실패 (503)"), "http", "음성 서버"],
    [new Error("STT Worker 응답이 JSON이 아닙니다: <html>"), "schema", "응답 형식"],
    [new Error("전사문이 비어 있습니다."), "no-speech", "목소리를 찾지"],
    [new Error("Unable to decode audio data"), "recording", "마이크 녹음"],
  ] as const)("%s 오류를 %s 상태와 안전한 문구로 바꾼다", (error, kind, phrase) => {
    const failure = classifyVoiceInputError(error);
    const message = formatVoiceInputError(failure);

    expect(failure.kind).toBe(kind);
    expect(message).toContain(phrase);
    expect(message).not.toMatch(/Failed to fetch|<html>|503|Realtime|STT Worker/i);
  });

  it.each([
    new DOMException("missing device", "NotFoundError"),
    new DOMException("device busy", "NotReadableError"),
    new Error("MediaRecorder start failed"),
  ])("%s 녹음 시작 오류는 너무 짧다고 단정하지 않는다", (error) => {
    const failure = classifyVoiceInputError(error);
    const message = formatVoiceInputError(failure);

    expect(failure.kind).toBe("recording");
    expect(message).toBe("마이크 녹음을 처리하지 못했어.");
    expect(message).not.toContain("너무 짧");
  });

  it.each([
    ["transcription", 401],
    ["transcription", 403],
    ["transcription", 429],
    ["transcription", 503],
    ["realtime", 401],
    ["realtime", 403],
    ["realtime", 429],
    ["realtime", 503],
  ] as const)("%s Worker의 HTTP %d 응답은 body와 무관하게 http 상태를 보존한다", async (portKind, status) => {
    const fetcher = vi.fn(async (_request: Request) =>
      Response.json({ error: "arbitrary upstream body" }, { status }),
    );
    const port =
      portKind === "transcription"
        ? createWorkerTranscriptionPort({
            provider: "openai",
            workerUrl: "http://127.0.0.1:8787",
            fetcher,
          })
        : createWorkerRealtimeVoicePort({
            request: { mode: "transcript" },
            workerUrl: "http://127.0.0.1:8787",
            fetcher,
          });
    let rejected: unknown;
    try {
      await port.transcribe(
        new Blob(["wav"], { type: "audio/wav" }),
        new AbortController().signal,
      );
    } catch (error) {
      rejected = error;
    }

    const failure = classifyVoiceInputError(rejected);
    expect(failure).toMatchObject({
      kind: "http",
      debugMessage: expect.stringContaining(String(status)),
    });
    expect(formatVoiceInputError(failure)).toBe("음성 서버에 연결하지 못했어.");
  });

  it("세 surface의 finished/start callback 모두 typed failure만 안전하게 format한다", () => {
    const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    const section = (start: string, end: string): string => {
      const startIndex = mainSource.indexOf(start);
      const endIndex = mainSource.indexOf(end, startIndex + start.length);
      expect(startIndex, start).toBeGreaterThanOrEqual(0);
      expect(endIndex, end).toBeGreaterThan(startIndex);
      return mainSource.slice(startIndex, endIndex);
    };
    const surfaces = [
      section("const renderIncantationNode", "const renderBattleNode"),
      section("const renderBattleNode", "renderCurrent ="),
      section("view.renderDialogue(node", 'if (node.type === "cutscene")'),
    ];

    for (const surface of surfaces) {
      expect(surface).toMatch(
        /onTurnFailed: \(failure\) => \{[\s\S]*?formatVoiceInputError\(failure\)/,
      );
      expect(surface).toMatch(
        /onUnavailable: \(failure\) => \{[\s\S]*?formatVoiceInputError\(failure\)/,
      );
      expect(surface).not.toMatch(
        /failure\.debugMessage|renderCurrent\(failure\)|\$\{failure\}/,
      );
    }
  });
});
