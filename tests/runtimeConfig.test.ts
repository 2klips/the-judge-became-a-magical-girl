import { describe, expect, it } from "vitest";
import { resolveWorkerUrl } from "../src/runtimeConfig";

describe("runtime Worker URL", () => {
  it("QA는 명시된 HTTPS Worker URL을 사용한다", () => {
    expect(
      resolveWorkerUrl({
        explicitUrl: "https://nhn-voice-m5-qa-worker.example.workers.dev/",
        isQaPreview: true,
        origin: "https://2klips.github.io",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toBe("https://nhn-voice-m5-qa-worker.example.workers.dev");
  });

  it("일반 로컬 빌드는 기존 로컬 Worker 기본값을 유지한다", () => {
    expect(
      resolveWorkerUrl({
        isQaPreview: false,
        origin: "http://127.0.0.1:4173",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toBe("http://127.0.0.1:8787");
  });

  it("QA Worker URL이 없거나 HTTPS가 아니면 시작을 거부한다", () => {
    expect(() =>
      resolveWorkerUrl({
        isQaPreview: true,
        origin: "https://2klips.github.io",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toThrow("QA Worker HTTPS URL이 필요합니다");

    expect(() =>
      resolveWorkerUrl({
        explicitUrl: "http://worker.example.test",
        isQaPreview: true,
        origin: "https://2klips.github.io",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toThrow("QA Worker는 HTTPS URL이어야 합니다");
  });

  it("일반 빌드에서는 명시된 Worker URL을 사용한다", () => {
    expect(
      resolveWorkerUrl({
        explicitUrl: "https://worker.example.test",
        isQaPreview: false,
        origin: "https://2klips.github.io",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toBe("https://worker.example.test");
  });
});
