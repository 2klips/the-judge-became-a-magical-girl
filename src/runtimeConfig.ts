export const QA_DISABLED_WORKER_PATH = "__qa_worker_disabled__";

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
  baseUrl,
}: WorkerUrlOptions): string {
  if (isQaPreview) {
    return new URL(`${baseUrl}${QA_DISABLED_WORKER_PATH}`, origin).toString();
  }

  if (explicitUrl) return explicitUrl;

  return "http://127.0.0.1:8787";
}
