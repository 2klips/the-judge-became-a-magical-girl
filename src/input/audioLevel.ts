export interface AudioLevelMetrics {
  readonly rmsDbfs: number;
  readonly peakDbfs: number;
  readonly clippingRatio: number;
}

export interface MicrophoneCalibration {
  readonly targetRmsDbfs: number;
  readonly minimumRmsDbfs: number;
  readonly maximumRmsDbfs: number;
  readonly maximumPeakDbfs: number;
  readonly inputDeviceId?: string;
}

export type VoiceLevelResult = "acceptable" | "too-quiet" | "too-loud";
export type VoiceLevelFailureDisposition = "retry" | "consume-turn";
export type MicrophoneTestState = "waiting" | "too-quiet" | "too-loud" | "sampling" | "passed";

export interface MicrophoneMeterPresentation {
  readonly percent: number;
  readonly tone: "quiet" | "good" | "loud";
}

export type PttLiveLevelPresentation = MicrophoneMeterPresentation;

const SILENCE_DBFS = -96;
const SETUP_MINIMUM_RMS_DBFS = -48;
const SETUP_MAXIMUM_RMS_DBFS = -7;
const MAXIMUM_PEAK_DBFS = -0.75;
const MAXIMUM_CLIPPING_RATIO = 0.002;
const REQUIRED_SETUP_VOICE_MS = 900;

export function calculateAudioLevel(samples: Float32Array): AudioLevelMetrics {
  if (samples.length === 0) {
    return { rmsDbfs: SILENCE_DBFS, peakDbfs: SILENCE_DBFS, clippingRatio: 0 };
  }

  let squareSum = 0;
  let peak = 0;
  let clipped = 0;
  for (const value of samples) {
    const amplitude = Math.min(1, Math.abs(value));
    squareSum += amplitude * amplitude;
    peak = Math.max(peak, amplitude);
    if (amplitude >= 0.985) clipped += 1;
  }
  const rms = Math.sqrt(squareSum / samples.length);
  return {
    rmsDbfs: amplitudeToDbfs(rms),
    peakDbfs: amplitudeToDbfs(peak),
    clippingRatio: clipped / samples.length,
  };
}

export function meterPercent(rmsDbfs: number): number {
  return Math.round(clamp(((rmsDbfs + 60) / 60) * 100, 0, 100));
}

export function resolveMicrophoneMeterPresentation(
  metrics: AudioLevelMetrics,
  state: MicrophoneTestState,
): MicrophoneMeterPresentation {
  const currentLevel = evaluateMicrophoneTestSample(metrics);
  return {
    percent: meterPercent(metrics.rmsDbfs),
    tone:
      state === "waiting" || currentLevel === "too-quiet"
        ? "quiet"
        : currentLevel === "too-loud"
          ? "loud"
          : "good",
  };
}

export function resolvePttLiveLevelPresentation(
  metrics: AudioLevelMetrics,
): PttLiveLevelPresentation {
  return resolveMicrophoneMeterPresentation(metrics, "sampling");
}

export function evaluateVoiceLevel(
  metrics: AudioLevelMetrics,
  calibration: MicrophoneCalibration,
): VoiceLevelResult {
  if (
    metrics.rmsDbfs > calibration.maximumRmsDbfs ||
    metrics.peakDbfs > calibration.maximumPeakDbfs ||
    metrics.clippingRatio > MAXIMUM_CLIPPING_RATIO
  ) {
    return "too-loud";
  }
  if (metrics.rmsDbfs < calibration.minimumRmsDbfs) return "too-quiet";
  return "acceptable";
}

export function resolveVoiceLevelFailure(
  priorFailureCount: number,
): VoiceLevelFailureDisposition {
  return priorFailureCount <= 0 ? "retry" : "consume-turn";
}

export class MicrophoneCalibrationAccumulator {
  private acceptedDurationMs = 0;
  private readonly acceptedRms: number[] = [];
  private latestState: MicrophoneTestState = "waiting";

  add(metrics: AudioLevelMetrics, durationMs: number): MicrophoneTestState {
    if (this.latestState === "passed") return this.latestState;
    if (!Number.isFinite(durationMs) || durationMs <= 0) return this.latestState;
    const currentLevel = evaluateMicrophoneTestSample(metrics);
    if (currentLevel === "too-loud") {
      this.latestState = "too-loud";
      return this.latestState;
    }
    if (currentLevel === "too-quiet") {
      this.latestState = this.acceptedDurationMs > 0 ? "sampling" : "too-quiet";
      return this.latestState;
    }

    this.acceptedDurationMs += durationMs;
    this.acceptedRms.push(metrics.rmsDbfs);
    this.latestState = this.acceptedDurationMs >= REQUIRED_SETUP_VOICE_MS ? "passed" : "sampling";
    return this.latestState;
  }

  get state(): MicrophoneTestState {
    return this.latestState;
  }

  get progress(): number {
    return clamp(this.acceptedDurationMs / REQUIRED_SETUP_VOICE_MS, 0, 1);
  }

  calibration(): MicrophoneCalibration | null {
    if (this.latestState !== "passed" || this.acceptedRms.length === 0) return null;
    const sorted = [...this.acceptedRms].sort((left, right) => left - right);
    const targetRmsDbfs = sorted[Math.floor(sorted.length / 2)] ?? SETUP_MINIMUM_RMS_DBFS;
    return {
      targetRmsDbfs,
      minimumRmsDbfs: Math.max(-52, targetRmsDbfs - 12),
      maximumRmsDbfs: Math.min(-6, targetRmsDbfs + 10),
      maximumPeakDbfs: MAXIMUM_PEAK_DBFS,
    };
  }
}

function amplitudeToDbfs(amplitude: number): number {
  if (amplitude <= 0) return SILENCE_DBFS;
  return Math.max(SILENCE_DBFS, 20 * Math.log10(amplitude));
}

function evaluateMicrophoneTestSample(metrics: AudioLevelMetrics): VoiceLevelResult {
  if (
    metrics.rmsDbfs > SETUP_MAXIMUM_RMS_DBFS ||
    metrics.peakDbfs > MAXIMUM_PEAK_DBFS ||
    metrics.clippingRatio > MAXIMUM_CLIPPING_RATIO
  ) {
    return "too-loud";
  }
  return metrics.rmsDbfs < SETUP_MINIMUM_RMS_DBFS ? "too-quiet" : "acceptable";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
