import { describe, expect, it } from "vitest";
import { QA_DISABLED_WORKER_PATH, resolveWorkerUrl } from "../src/runtimeConfig";

describe("runtime Worker URL", () => {
  it("QA 기본값은 Pages와 같은 origin의 비활성 경로를 사용한다", () => {
    expect(
      resolveWorkerUrl({
        isQaPreview: true,
        origin: "https://2klips.github.io",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toBe(
      `https://2klips.github.io/the-judge-became-a-magical-girl/${QA_DISABLED_WORKER_PATH}`,
    );
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

  it("QA에서는 명시된 환경 URL도 무시해 Worker를 강제로 비활성화한다", () => {
    expect(
      resolveWorkerUrl({
        explicitUrl: "https://worker.example.test",
        isQaPreview: true,
        origin: "https://2klips.github.io",
        baseUrl: "/the-judge-became-a-magical-girl/",
      }),
    ).toBe(
      `https://2klips.github.io/the-judge-became-a-magical-girl/${QA_DISABLED_WORKER_PATH}`,
    );
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
