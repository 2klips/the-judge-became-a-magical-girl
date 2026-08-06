import { createWorker, type UpstreamFetch } from "./index";

export function createSttLabWorker(upstreamFetch: UpstreamFetch = fetch) {
  return createWorker(upstreamFetch, { enableGeminiStt: true });
}

export type SttLabEnv = Env;
export default createSttLabWorker();
