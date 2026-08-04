interface WorkerUrlOptions {
  explicitUrl?: string;
  isQaPreview: boolean;
  origin: string;
  baseUrl: string;
}

export function resolveWorkerUrl({
  explicitUrl,
  isQaPreview,
  origin,
}: WorkerUrlOptions): string {
  if (isQaPreview) {
    if (!explicitUrl) throw new Error("QA Worker HTTPS URL이 필요합니다.");
    const workerUrl = new URL(explicitUrl, origin);
    if (workerUrl.protocol !== "https:") {
      throw new Error("QA Worker는 HTTPS URL이어야 합니다.");
    }
    return workerUrl.toString().replace(/\/$/, "");
  }

  if (explicitUrl) return explicitUrl;

  return "http://127.0.0.1:8787";
}
