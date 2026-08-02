export type ProviderId = "A" | "B" | "C";

export interface LabAudio {
  wavBlob: Blob;
  samples: Float32Array;
  durationMs: number;
}

export interface EngineTranscript {
  model: string;
  text: string;
  metrics?: Record<string, number>;
}

export interface TranscriptionEngine {
  id: ProviderId;
  label: string;
  transcribe(audio: LabAudio): Promise<EngineTranscript>;
}

export interface SuccessfulComparisonResult extends EngineTranscript {
  id: ProviderId;
  label: string;
  status: "success";
  totalMs: number;
}

export interface FailedComparisonResult {
  id: ProviderId;
  label: string;
  status: "error";
  totalMs: number;
  error: string;
}

export type ComparisonResult = SuccessfulComparisonResult | FailedComparisonResult;

export interface ComparisonRunOptions {
  now?: () => number;
  onResult?: (result: ComparisonResult) => void;
}

export async function runComparison(
  audio: LabAudio,
  engines: readonly TranscriptionEngine[],
  options: ComparisonRunOptions = {},
): Promise<ComparisonResult[]> {
  const now = options.now ?? (() => performance.now());
  return Promise.all(
    engines.map(async (engine): Promise<ComparisonResult> => {
      const startedAt = now();
      try {
        const transcript = await engine.transcribe(audio);
        const result: SuccessfulComparisonResult = {
          id: engine.id,
          label: engine.label,
          status: "success",
          ...transcript,
          totalMs: Math.max(0, now() - startedAt),
        };
        options.onResult?.(result);
        return result;
      } catch (error) {
        const result: FailedComparisonResult = {
          id: engine.id,
          label: engine.label,
          status: "error",
          totalMs: Math.max(0, now() - startedAt),
          error: error instanceof Error ? error.message : String(error),
        };
        options.onResult?.(result);
        return result;
      }
    }),
  );
}
