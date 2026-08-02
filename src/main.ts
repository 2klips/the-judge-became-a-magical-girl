import "./styles.css";
import { GameDataError, loadGameData } from "./data/loader";
import type { Character, CutsceneNode } from "./data/schema";
import { GameEngine } from "./engine/nodeRunner";
import { BrowserSpeechPort } from "./input/stt";
import { VoiceTurnController } from "./input/voice";
import { SaveRepository } from "./storage/saveRepository";
import { GameView } from "./ui/gameView";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("#app 루트 요소가 없습니다.");
}

const speech = new BrowserSpeechPort();
const view = new GameView(root, speech.isSupported());
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
    let activeVoice: VoiceTurnController | null = null;

    const characterName = (speaker: string): string =>
      speaker === "narration" ? "나레이션" : characters.get(speaker)?.name ?? speaker;

    const renderCurrent = (
      inputNotice?: string,
      forceClickForTurn = false,
    ): void => {
      activeVoice?.cancel();
      activeVoice = null;
      const node = engine.getCurrentNode();
      const state = engine.getState();

      if (node.type === "dialogue") {
        const character = characters.get(node.npc.id);
        if (!character) {
          throw new Error(`캐릭터를 찾을 수 없습니다: ${node.npc.id}`);
        }
        const renderReply = (
          selectedLabel: string,
          result: ReturnType<GameEngine["chooseIntent"]>,
        ): void => {
          activeVoice = null;
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
        const voice = new VoiceTurnController(speech);
        if (state.inputMode === "voice") {
          activeVoice = voice;
        }
        view.renderDialogue(node, character, state, selectIntent, {
          speechSupported: speech.isSupported(),
          notice: inputNotice,
          forceClickForTurn,
          capture: (onInterim) => voice.capture(onInterim),
          stop: () => voice.stop(),
          cancel: () => voice.cancel(),
          onTranscript: (transcript) => {
            const result = engine.submitTranscript(transcript);
            if (result.kind === "unmatched") {
              return false;
            }
            renderReply(transcript, result);
            return true;
          },
          onTurnFailed: () => {
            const failure = engine.recordSttTurnFailure();
            if (failure.forcedClickMode) {
              renderCurrent("STT 실패 턴이 5회 누적돼 클릭 모드로 전환했어.");
            } else {
              renderCurrent(
                "두 번 인식하지 못했어. 이 턴은 클릭으로 진행해 줘.",
                true,
              );
            }
          },
          onUnavailable: (message) => {
            engine.setInputMode("click");
            renderCurrent(message);
          },
          onModeChange: (inputMode) => {
            if (inputMode === "voice" && !speech.isSupported()) {
              engine.setInputMode("click");
              renderCurrent("이 브라우저는 음성 인식을 지원하지 않아.");
              return;
            }
            engine.setInputMode(inputMode);
            renderCurrent();
          },
        });
        return;
      }

      if (node.type === "cutscene") {
        renderCutscene(node, characters, characterName, engine, view, renderCurrent);
        return;
      }

      view.renderEnding(node, new Map([...characters].map(([id, character]) => [id, character.name])), state, () => {
        engine.startNewGame(speech.isSupported() ? "voice" : "click");
        renderCurrent();
      });
    };

    view.renderTitle({
      hasSave: loaded.state !== null,
      warning:
        loaded.warning ??
        (speech.isSupported()
          ? null
          : "Web Speech API 미지원: 클릭 모드로 시작합니다."),
      onNewGame: (inputMode) => {
        engine.startNewGame(inputMode);
        renderCurrent();
      },
      onResume: () => {
        if (!loaded.state) {
          engine.startNewGame();
        } else {
          engine.resume(loaded.state);
        }
        if (engine.getState().inputMode === "voice" && !speech.isSupported()) {
          engine.setInputMode("click");
          renderCurrent("저장된 음성 모드를 사용할 수 없어 클릭 모드로 전환했어.");
        } else {
          renderCurrent();
        }
      },
    });
  } catch (error) {
    if (error instanceof GameDataError) {
      console.error(error.message, error.issues);
    } else {
      console.error(error);
    }
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

void bootstrap();
