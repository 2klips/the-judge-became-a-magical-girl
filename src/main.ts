import "./styles.css";
import { GameDataError, loadGameData } from "./data/loader";
import type { Character, CutsceneNode } from "./data/schema";
import { GameEngine, type TurnResult } from "./engine/nodeRunner";
import { BrowserPttRecordingPort } from "./input/recording";
import {
  createWorkerTranscriptionPort,
  RecordedVoiceTurnController,
  resolveSttProvider,
  type SttProviderId,
} from "./input/transcription";
import {
  createDebugLlmPort,
  createRetryingLlmPort,
  createWorkerLlmPort,
  resolveLlmDebugMode,
  type RecentDialogueTurn,
} from "./judge/llm";
import { SaveRepository } from "./storage/saveRepository";
import { GameView } from "./ui/gameView";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app 루트 요소가 없습니다.");

const params = new URLSearchParams(window.location.search);
const recordingSupported = BrowserPttRecordingPort.isSupported();
const workerUrl = import.meta.env.VITE_WORKER_URL || "http://127.0.0.1:8787";
const view = new GameView(root, recordingSupported);
view.renderLoading();

async function bootstrap(): Promise<void> {
  try {
    const data = await loadGameData();
    const nodeIds = new Set(data.scenario.map((node) => node.nodeId));
    const flags = new Set(data.config.allowedFlags);
    const saves = new SaveRepository(
      window.localStorage,
      "judge-magical-girl:m1-save",
      flags,
      nodeIds,
    );
    const engine = new GameEngine(data, saves);
    const characters = new Map(data.characters.map((character) => [character.id, character]));
    const loaded = saves.load();
    const recentTurns: RecentDialogueTurn[] = [];
    const llm = createRetryingLlmPort(
      createDebugLlmPort(
        createWorkerLlmPort({ workerUrl }),
        resolveLlmDebugMode(params),
      ),
      { timeoutMs: 4_000, retries: 1 },
    );

    let activeVoice: RecordedVoiceTurnController | null = null;
    let activeLlm: AbortController | null = null;
    let sttProvider = resolveSttProvider(params);

    const characterName = (speaker: string): string =>
      speaker === "narration" ? "나레이션" : characters.get(speaker)?.name ?? speaker;

    const rememberTurn = (transcript: string, reply: string): void => {
      recentTurns.push(
        { role: "player", text: transcript },
        { role: "juno", text: reply },
      );
      if (recentTurns.length > 6) recentTurns.splice(0, recentTurns.length - 6);
    };

    const renderCurrent = (inputNotice?: string, forceClickForTurn = false): void => {
      activeVoice?.cancel();
      activeVoice = null;
      activeLlm?.abort();
      activeLlm = null;
      const node = engine.getCurrentNode();
      const state = engine.getState();

      if (node.type === "dialogue") {
        const character = characters.get(node.npc.id);
        if (!character) throw new Error(`캐릭터를 찾을 수 없습니다: ${node.npc.id}`);

        const renderReply = (selectedLabel: string, result: TurnResult): void => {
          activeVoice = null;
          activeLlm = null;
          view.renderDialogueReply({
            sceneId: node.scene.bg,
            speaker: character.name,
            selectedLabel,
            reply: result.reply,
            state: engine.getState(),
            advanced: result.advanced,
            onContinue: () => renderCurrent(),
          });
        };

        const selectIntent = (intentId: string): void => {
          const result = engine.chooseIntent(intentId);
          renderReply(result.clickLabel, result);
        };

        const voice = new RecordedVoiceTurnController(
          new BrowserPttRecordingPort(),
          createWorkerTranscriptionPort({ provider: sttProvider, workerUrl }),
        );
        if (state.inputMode === "voice") activeVoice = voice;

        const applyFallback = (transcript: string, failureRecorded: boolean): boolean => {
          if (!failureRecorded) engine.recordLlmFailure();
          const fallbackIndex = Math.max(0, engine.getState().llmFailCount - 1) % node.fallbackReplies.length;
          const fallbackReply = node.fallbackReplies[fallbackIndex] ?? "한 번 더 이야기해 줘!";
          const result = engine.submitFallbackJudgement(transcript, fallbackReply);
          rememberTurn(transcript, result.reply);
          renderReply(transcript, result);
          return true;
        };

        const handleTranscript = async (transcript: string): Promise<boolean> => {
          const local = engine.submitTranscript(transcript);
          if (local.kind === "matched") {
            rememberTurn(transcript, local.reply);
            renderReply(transcript, local);
            return true;
          }

          if (engine.getState().llmFailCount >= 3) {
            return applyFallback(transcript, true);
          }

          const request = new AbortController();
          activeLlm = request;
          try {
            const judgement = await llm.judgeDialogue(
              {
                node,
                transcript,
                recentTurns,
                character,
              },
              request.signal,
            );
            if (request.signal.aborted) return true;
            const result = engine.submitLlmJudgement(transcript, judgement);
            rememberTurn(transcript, result.reply);
            renderReply(transcript, result);
            return true;
          } catch (error) {
            if (request.signal.aborted) return true;
            console.warn("LLM 폴백 전환", error instanceof Error ? error.message : String(error));
            const failure = engine.recordLlmFailure();
            if (failure.forcedLocalMode) {
              console.warn("LLM 3연속 실패: 로컬 판정 모드로 강등");
            }
            return applyFallback(transcript, true);
          } finally {
            if (activeLlm === request) activeLlm = null;
          }
        };

        view.renderDialogue(node, character, state, selectIntent, {
          speechSupported: recordingSupported,
          sttProvider,
          notice: inputNotice,
          forceClickForTurn,
          startCapture: () => voice.press(),
          finishCapture: () => voice.release(),
          cancel: () => voice.cancel(),
          onTranscript: handleTranscript,
          onTurnFailed: (message) => {
            const failure = engine.recordSttTurnFailure();
            if (failure.forcedClickMode) {
              engine.setInputMode("click");
              renderCurrent("STT 실패가 5회 누적돼 클릭 모드로 전환했어.");
            } else {
              renderCurrent(`${message} 이 턴은 클릭으로 진행해 줘.`, true);
            }
          },
          onUnavailable: (message) => {
            engine.setInputMode("click");
            renderCurrent(message);
          },
          onModeChange: (inputMode) => {
            if (inputMode === "voice" && !recordingSupported) {
              engine.setInputMode("click");
              renderCurrent("이 브라우저는 마이크 녹음을 지원하지 않아.");
              return;
            }
            if (inputMode === "voice") engine.recordLlmSuccess();
            engine.setInputMode(inputMode);
            renderCurrent();
          },
          onProviderChange: (provider) => {
            sttProvider = provider;
            updateProviderQuery(provider);
            renderCurrent(`${providerName(provider)} STT로 전환했어.`);
          },
        });
        return;
      }

      if (node.type === "cutscene") {
        renderCutscene(node, characters, characterName, engine, view, renderCurrent);
        return;
      }

      view.renderEnding(
        node,
        new Map([...characters].map(([id, character]) => [id, character.name])),
        state,
        () => {
          recentTurns.length = 0;
          engine.startNewGame(recordingSupported ? "voice" : "click");
          renderCurrent();
        },
      );
    };

    view.renderTitle({
      hasSave: loaded.state !== null,
      warning:
        loaded.warning ??
        (recordingSupported ? null : "마이크 녹음 미지원: 클릭 모드로 시작합니다."),
      onNewGame: (inputMode) => {
        recentTurns.length = 0;
        engine.startNewGame(inputMode);
        renderCurrent();
      },
      onResume: () => {
        if (!loaded.state) engine.startNewGame();
        else engine.resume(loaded.state);
        if (engine.getState().inputMode === "voice" && !recordingSupported) {
          engine.setInputMode("click");
          renderCurrent("저장된 음성 모드를 사용할 수 없어 클릭 모드로 전환했어.");
        } else {
          renderCurrent();
        }
      },
    });
  } catch (error) {
    if (error instanceof GameDataError) console.error(error.message, error.issues);
    else console.error(error);
    view.renderError(error);
  }
}

function renderCutscene(
  node: CutsceneNode,
  characters: ReadonlyMap<string, Character>,
  characterName: (speaker: string) => string,
  engine: GameEngine,
  gameView: GameView,
  renderCurrent: () => void,
): void {
  let lineIndex = 0;
  const renderLine = (): void => {
    const line = node.lines[lineIndex];
    if (!line) {
      engine.advanceLinearNode();
      renderCurrent();
      return;
    }
    const nextIndex = lineIndex + 1;
    gameView.renderLine({
      sceneId: node.scene.bg,
      speaker: characterName(line.speaker),
      text: line.text,
      progress: `${nextIndex}/${node.lines.length}`,
      continueLabel: nextIndex === node.lines.length ? "다음 장면" : "계속",
      state: engine.getState(),
      onContinue: () => {
        lineIndex = nextIndex;
        renderLine();
      },
    });
  };
  void characters;
  renderLine();
}

function updateProviderQuery(provider: SttProviderId): void {
  const url = new URL(window.location.href);
  url.searchParams.set("stt", provider);
  window.history.replaceState(null, "", url);
}

function providerName(provider: SttProviderId): string {
  return provider === "openai" ? "GPT" : "Gemini";
}

void bootstrap();
