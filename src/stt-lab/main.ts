import { z } from "zod";
import {
  decodeWithBrowserAudioContext,
  normalizeRecordedAudio,
} from "./audio";
import { runComparison, type ComparisonResult, type LabAudio } from "./comparison";
import { createLocalWhisperEngine, createWorkerEngine } from "./engines";
import { characterErrorRate } from "./metrics";
import { beginBrowserRecording, PushToTalkCapture } from "./pushToTalk";
import "./styles.css";

const WorkerHealthSchema = z.object({
  openaiConfigured: z.boolean(),
  geminiConfigured: z.boolean(),
  openaiModel: z.string(),
  geminiModel: z.string(),
});

const workerUrl = import.meta.env.VITE_STT_LAB_WORKER_URL || "http://127.0.0.1:8787";
const pttButton = requiredElement<HTMLButtonElement>("ptt-button");
const compareButton = requiredElement<HTMLButtonElement>("compare-button");
const audioInput = requiredElement<HTMLInputElement>("audio-file");
const audioPlayer = requiredElement<HTMLAudioElement>("audio-player");
const audioMeta = requiredElement<HTMLParagraphElement>("audio-meta");
const captureStatus = requiredElement<HTMLParagraphElement>("capture-status");
const workerStatus = requiredElement<HTMLParagraphElement>("worker-status");
const referenceText = requiredElement<HTMLTextAreaElement>("reference-text");
const capture = new PushToTalkCapture(beginBrowserRecording);
const completedResults = new Map<string, ComparisonResult>();

let currentAudio: LabAudio | undefined;
let currentAudioUrl: string | undefined;
let pttInteractionActive = false;

const openAiEngine = createWorkerEngine({
  id: "A",
  label: "OpenAI",
  path: "/transcribe/openai",
  workerUrl,
});
const geminiEngine = createWorkerEngine({
  id: "B",
  label: "Gemini",
  path: "/transcribe/gemini",
  workerUrl,
});
const localEngine = createLocalWhisperEngine({
  onProgress: (message) => setLocalProgress(message),
});

pttButton.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  pttButton.setPointerCapture(event.pointerId);
  void beginPtt();
});

pttButton.addEventListener("pointerup", (event) => {
  event.preventDefault();
  if (pttButton.hasPointerCapture(event.pointerId)) {
    pttButton.releasePointerCapture(event.pointerId);
  }
  void endPtt();
});

pttButton.addEventListener("pointercancel", () => {
  void endPtt();
});

pttButton.addEventListener("keydown", (event) => {
  if ((event.key === " " || event.key === "Enter") && !event.repeat) {
    event.preventDefault();
    void beginPtt();
  }
});

pttButton.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    void endPtt();
  }
});

audioInput.addEventListener("change", () => {
  const file = audioInput.files?.[0];
  if (file) void prepareAudio(file, file.name);
});

compareButton.addEventListener("click", () => {
  void compareAll();
});

referenceText.addEventListener("input", () => {
  for (const result of completedResults.values()) renderResult(result);
});

window.addEventListener("beforeunload", () => {
  capture.cancel();
  if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
});

void checkWorkerHealth();

async function beginPtt(): Promise<void> {
  if (pttInteractionActive) return;
  pttInteractionActive = true;
  pttButton.dataset.active = "true";
  pttButton.querySelector<HTMLElement>(".ptt-main")!.textContent = "녹음 중";
  captureStatus.textContent = "마이크 준비 중 · 버튼을 계속 누르세요";
  try {
    await capture.press();
    if (capture.state === "recording") {
      captureStatus.textContent = "녹음 중 · 버튼을 떼면 종료";
    }
  } catch (error) {
    resetPttVisuals();
    captureStatus.textContent = errorMessage(error);
  }
}

async function endPtt(): Promise<void> {
  if (!pttInteractionActive) return;
  pttInteractionActive = false;
  captureStatus.textContent = "녹음 종료 및 WAV 변환 중";
  try {
    const recorded = await capture.release();
    if (recorded) await prepareAudio(recorded, "PTT 녹음");
  } catch (error) {
    captureStatus.textContent = errorMessage(error);
  } finally {
    resetPttVisuals();
  }
}

function resetPttVisuals(): void {
  pttButton.dataset.active = "false";
  pttButton.querySelector<HTMLElement>(".ptt-main")!.textContent = "누르고 말하기";
}

async function prepareAudio(source: Blob, label: string): Promise<void> {
  compareButton.disabled = true;
  captureStatus.textContent = `${label} 정규화 중`;
  try {
    const audio = await normalizeRecordedAudio(source, decodeWithBrowserAudioContext);
    currentAudio = audio;
    completedResults.clear();
    resetResultCards();
    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = URL.createObjectURL(audio.wavBlob);
    audioPlayer.src = currentAudioUrl;
    audioMeta.textContent = `${label} · ${(audio.durationMs / 1_000).toFixed(2)}초 · 16 kHz mono WAV · ${(audio.wavBlob.size / 1024).toFixed(1)}KB`;
    captureStatus.textContent = "음성 준비 완료";
    compareButton.disabled = false;
  } catch (error) {
    currentAudio = undefined;
    audioMeta.textContent = "오디오를 읽지 못했습니다.";
    captureStatus.textContent = errorMessage(error);
  }
}

async function compareAll(): Promise<void> {
  if (!currentAudio) return;
  compareButton.disabled = true;
  completedResults.clear();
  markRunning("A", "API 전사 중");
  markRunning("B", "API 전사 중");
  markRunning("C", "A/B 완료 후 시작");

  try {
    await runComparison(currentAudio, [openAiEngine, geminiEngine], {
      onResult: receiveResult,
    });
    setLocalProgress("로컬 모델 준비 중");
    await runComparison(currentAudio, [localEngine], {
      onResult: receiveResult,
    });
  } finally {
    compareButton.disabled = false;
  }
}

function receiveResult(result: ComparisonResult): void {
  completedResults.set(result.id, result);
  renderResult(result);
}

function renderResult(result: ComparisonResult): void {
  const card = resultCard(result.id);
  card.dataset.status = result.status;
  role(card, "state").textContent = result.status === "success" ? "완료" : "오류";
  role(card, "latency").textContent = `${Math.round(result.totalMs)} ms`;

  if (result.status === "error") {
    role(card, "transcript").textContent = result.error;
    role(card, "model").textContent = "—";
    role(card, "cer").textContent = "—";
    const detail = card.querySelector<HTMLElement>('[data-role="detail"]');
    if (detail) detail.textContent = "—";
    return;
  }

  role(card, "transcript").textContent = result.text || "(빈 전사문)";
  role(card, "model").textContent = result.model;
  role(card, "cer").textContent = cerLabel(referenceText.value, result.text);
  const detail = card.querySelector<HTMLElement>('[data-role="detail"]');
  if (detail) {
    const load = result.metrics?.modelLoadMs ?? 0;
    const inference = result.metrics?.inferenceMs ?? 0;
    detail.textContent = `${Math.round(load)} / ${Math.round(inference)} ms`;
  }
}

function resetResultCards(): void {
  for (const id of ["A", "B", "C"] as const) {
    const card = resultCard(id);
    delete card.dataset.status;
    role(card, "state").textContent = "대기";
    role(card, "transcript").textContent = "전사 전";
    role(card, "latency").textContent = "—";
    role(card, "cer").textContent = "—";
    role(card, "model").textContent = "—";
    const detail = card.querySelector<HTMLElement>('[data-role="detail"]');
    if (detail) detail.textContent = "—";
  }
  setLocalProgress("첫 실행 시 모델을 내려받습니다.");
}

function markRunning(id: "A" | "B" | "C", message: string): void {
  const card = resultCard(id);
  card.dataset.status = "running";
  role(card, "state").textContent = "진행 중";
  role(card, "transcript").textContent = message;
  role(card, "latency").textContent = "—";
  role(card, "cer").textContent = "—";
  if (id === "C") setLocalProgress(message);
}

function setLocalProgress(message: string): void {
  role(resultCard("C"), "progress").textContent = message;
}

async function checkWorkerHealth(): Promise<void> {
  try {
    const response = await fetch(new URL("/health", `${workerUrl}/`));
    if (!response.ok) throw new Error(`Worker ${response.status}`);
    const health = WorkerHealthSchema.parse(await response.json());
    const configured = [health.openaiConfigured ? "A ✓" : "A 키 없음", health.geminiConfigured ? "B ✓" : "B 키 없음"];
    workerStatus.textContent = `${configured.join(" · ")} · ${health.openaiModel} / ${health.geminiModel}`;
    workerStatus.dataset.ready = health.openaiConfigured && health.geminiConfigured ? "true" : "partial";
  } catch {
    workerStatus.textContent = "Worker 연결 안 됨 · npm run dev:stt-lab 확인";
    workerStatus.dataset.ready = "partial";
  }
}

function cerLabel(reference: string, transcript: string): string {
  if (!reference.trim()) return "정답 미입력";
  return `${(characterErrorRate(reference, transcript) * 100).toFixed(1)}%`;
}

function resultCard(id: "A" | "B" | "C"): HTMLElement {
  const card = document.querySelector<HTMLElement>(`[data-result-card="${id}"]`);
  if (!card) throw new Error(`결과 카드 ${id}를 찾을 수 없습니다.`);
  return card;
}

function role(card: HTMLElement, name: string): HTMLElement {
  const element = card.querySelector<HTMLElement>(`[data-role="${name}"]`);
  if (!element) throw new Error(`${name} 요소를 찾을 수 없습니다.`);
  return element;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} 요소를 찾을 수 없습니다.`);
  return element as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
