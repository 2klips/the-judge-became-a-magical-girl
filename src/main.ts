import "./styles.css";
import { GameDataError, loadGameData } from "./data/loader";
import type { Character, CutsceneNode } from "./data/schema";
import { GameEngine } from "./engine/nodeRunner";
import { SaveRepository } from "./storage/saveRepository";
import { GameView } from "./ui/gameView";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("#app 루트 요소가 없습니다.");
}

const view = new GameView(root);
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

    const characterName = (speaker: string): string =>
      speaker === "narration" ? "나레이션" : characters.get(speaker)?.name ?? speaker;

    const renderCurrent = (): void => {
      const node = engine.getCurrentNode();
      const state = engine.getState();

      if (node.type === "dialogue") {
        const character = characters.get(node.npc.id);
        if (!character) {
          throw new Error(`캐릭터를 찾을 수 없습니다: ${node.npc.id}`);
        }
        view.renderDialogue(node, character, state, (intentId) => {
          const result = engine.chooseIntent(intentId);
          view.renderDialogueReply({
            sceneId: node.scene.bg,
            speaker: character.name,
            selectedLabel: result.clickLabel,
            reply: result.reply,
            state: engine.getState(),
            advanced: result.advanced,
            onContinue: renderCurrent,
          });
        });
        return;
      }

      if (node.type === "cutscene") {
        renderCutscene(node, characters, characterName, engine, view, renderCurrent);
        return;
      }

      view.renderEnding(node, new Map([...characters].map(([id, character]) => [id, character.name])), state, () => {
        engine.startNewGame();
        renderCurrent();
      });
    };

    view.renderTitle({
      hasSave: loaded.state !== null,
      warning: loaded.warning,
      onNewGame: () => {
        engine.startNewGame();
        renderCurrent();
      },
      onResume: () => {
        if (!loaded.state) {
          engine.startNewGame();
        } else {
          engine.resume(loaded.state);
        }
        renderCurrent();
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
