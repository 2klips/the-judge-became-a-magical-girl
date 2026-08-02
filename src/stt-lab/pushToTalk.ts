export interface RecordingSession {
  finish(): Promise<Blob>;
  abort(): void;
}

export type BeginRecording = () => Promise<RecordingSession>;
export type PushToTalkState = "idle" | "starting" | "recording" | "stopping";

export class PushToTalkCapture {
  state: PushToTalkState = "idle";

  private readonly beginRecording: BeginRecording;
  private startPromise: Promise<void> | undefined;
  private finishPromise: Promise<Blob | null> | undefined;
  private session: RecordingSession | undefined;
  private cancelRequested = false;

  constructor(beginRecording: BeginRecording) {
    this.beginRecording = beginRecording;
  }

  async press(): Promise<void> {
    if (this.state !== "idle") {
      return this.startPromise;
    }

    this.cancelRequested = false;
    this.state = "starting";
    this.startPromise = this.beginRecording()
      .then((session) => {
        if (this.cancelRequested) {
          session.abort();
          return;
        }
        this.session = session;
        if (this.state === "starting") {
          this.state = "recording";
        }
      })
      .catch((error: unknown) => {
        this.reset();
        throw error;
      });

    return this.startPromise;
  }

  release(): Promise<Blob | null> {
    if (this.state === "idle") {
      return Promise.resolve(null);
    }
    if (this.finishPromise) {
      return this.finishPromise;
    }

    this.state = "stopping";
    this.finishPromise = (async () => {
      try {
        await this.startPromise;
        return this.session ? await this.session.finish() : null;
      } finally {
        this.reset();
      }
    })();
    return this.finishPromise;
  }

  cancel(): void {
    this.cancelRequested = true;
    this.session?.abort();
    this.reset();
  }

  private reset(): void {
    this.state = "idle";
    this.startPromise = undefined;
    this.finishPromise = undefined;
    this.session = undefined;
  }
}

export async function beginBrowserRecording(): Promise<RecordingSession> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("이 브라우저는 마이크 녹음을 지원하지 않습니다.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: false,
  });
  const mimeType = selectRecordingMimeType();
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);
  const chunks: Blob[] = [];

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });
  recorder.start();

  const stopTracks = (): void => {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };

  return {
    finish() {
      return new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener(
          "stop",
          () => {
            stopTracks();
            resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          },
          { once: true },
        );
        recorder.addEventListener(
          "error",
          () => {
            stopTracks();
            reject(new Error("브라우저 녹음 중 오류가 발생했습니다."));
          },
          { once: true },
        );
        recorder.stop();
      });
    },
    abort() {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      stopTracks();
    },
  };
}

function selectRecordingMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}
