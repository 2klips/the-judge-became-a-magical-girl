import type { LabAudio } from "./comparison";

const TARGET_SAMPLE_RATE = 16_000;

export interface DecodedAudio {
  sampleRate: number;
  channels: readonly Float32Array[];
}

export type AudioDecoder = (blob: Blob) => Promise<DecodedAudio>;

export async function normalizeRecordedAudio(
  source: Blob,
  decode: AudioDecoder,
): Promise<LabAudio> {
  const decoded = await decode(source);
  const mono = mixToMono(decoded);
  const samples = resampleLinear(mono, decoded.sampleRate, TARGET_SAMPLE_RATE);

  return {
    samples,
    wavBlob: encodePcm16Wav(samples, TARGET_SAMPLE_RATE),
    durationMs: (samples.length / TARGET_SAMPLE_RATE) * 1_000,
  };
}

export async function decodeWithBrowserAudioContext(blob: Blob): Promise<DecodedAudio> {
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    return {
      sampleRate: buffer.sampleRate,
      channels: Array.from({ length: buffer.numberOfChannels }, (_, index) =>
        buffer.getChannelData(index).slice(),
      ),
    };
  } finally {
    await context.close();
  }
}

function mixToMono(decoded: DecodedAudio): Float32Array {
  if (!Number.isFinite(decoded.sampleRate) || decoded.sampleRate <= 0) {
    throw new Error("오디오 샘플 레이트가 올바르지 않습니다.");
  }
  const firstChannel = decoded.channels[0];
  if (!firstChannel || firstChannel.length === 0) {
    throw new Error("오디오 샘플이 없습니다.");
  }

  const length = firstChannel.length;
  const mono = new Float32Array(length);
  for (const channel of decoded.channels) {
    if (channel.length !== length) {
      throw new Error("오디오 채널 길이가 일치하지 않습니다.");
    }
    for (let index = 0; index < length; index += 1) {
      mono[index] = (mono[index] ?? 0) + (channel[index] ?? 0) / decoded.channels.length;
    }
  }
  return mono;
}

function resampleLinear(
  source: Float32Array,
  sourceRate: number,
  targetRate: number,
): Float32Array {
  if (sourceRate === targetRate) {
    return source.slice();
  }

  const targetLength = Math.max(1, Math.round((source.length * targetRate) / sourceRate));
  const target = new Float32Array(targetLength);
  const ratio = sourceRate / targetRate;

  for (let index = 0; index < targetLength; index += 1) {
    const position = index * ratio;
    const leftIndex = Math.min(source.length - 1, Math.floor(position));
    const rightIndex = Math.min(source.length - 1, leftIndex + 1);
    const fraction = Math.min(1, position - leftIndex);
    const left = source[leftIndex] ?? 0;
    const right = source[rightIndex] ?? left;
    target[index] = left + (right - left) * fraction;
  }

  return target;
}

function encodePcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(44 + index * bytesPerSample, Math.round(pcm), true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
