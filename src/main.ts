import "./styles.css";
import {
  createDebugBattleLlmPort,
  createRetryingBattleLlmPort,
  createWorkerBattleLlmPort,
} from "./battle/llm";
import type { BattleAction, BattleGrade } from "./battle/state";
import { BgmController } from "./audio/bgm";
import { SfxPlayer } from "./audio/sfx";
import { preloadCoreAssets } from "./assets/catalog";
import { GameDataError, loadGameData } from "./data/loader";
import type { BattleNode, CutsceneNode } from "./data/schema";
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
import type { IncantationResult } from "./judge/incantation";
import { SaveRepository } from "./storage/saveRepository";
import { GameView } from "./ui/gameView";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app 루트 요소가 없습니다.");

const params = new URLSearchParams(window.location.search);
const recordingSupported = BrowserPttRecordingPort.isSupported();
const workerUrl = import.meta.env.VITE_WORKER_URL || "http://127.0.0.1:8787";
const view = new GameView(root, recordingSupported);
const bgm = new BgmController();
const sfx = new SfxPlayer();
preloadCoreAssets();
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
    const battleLlm = createRetryingBattleLlmPort(
      createDebugBattleLlmPort(
        createWorkerBattleLlmPort({ workerUrl }),
        resolveLlmDebugMode(params),
      ),
      { timeoutMs: 4_000, retries: 1 },
    );

    let activeVoice: RecordedVoiceTurnController | null = null;
    let activeLlm: AbortController | null = null;
    let sttProvider = resolveSttProvider(params);
    let readyIncantationNodeId: string | null = null;
    let incantationAttempt = 1;
    let renderCurrent: (inputNotice?: string, forceClickForTurn?: boolean) => void;

    const characterName = (speaker: string): string =>
      speaker === "narration" ? "나레이션" : characters.get(speaker)?.name ?? speaker;

    const rememberTurn = (transcript: string, reply: string): void => {
      recentTurns.push(
        { role: "player", text: transcript },
        { role: "juno", text: reply },
      );
      if (recentTurns.length > 6) recentTurns.splice(0, recentTurns.length - 6);
    };

    const voiceCapture = (voice: RecordedVoiceTurnController) => ({
      startCapture: async (): Promise<void> => {
        bgm.setDucked(true);
        try {
          await voice.press();
        } catch (error) {
          bgm.setDucked(false);
          throw error;
        }
      },
      finishCapture: async () => {
        try {
          return await voice.release();
        } finally {
          bgm.setDucked(false);
        }
      },
      cancel: (): void => {
        voice.cancel();
        bgm.setDucked(false);
      },
    });

    const showTransformationResult = (
      node: CutsceneNode & { incantationGate: NonNullable<CutsceneNode["incantationGate"]> },
      result: IncantationResult,
    ): void => {
      if (result.outcome === "retry") return;
      readyIncantationNodeId = null;
      incantationAttempt = 1;
      const lines =
        result.outcome === "rescued"
          ? node.incantationGate.failLines.map(({ text }) => text)
          : result.outcome === "perfect"
            ? ["목소리가 마지막 단어까지 정확히 이어졌다. 빛이 강하게 응답한다."]
            : ["사원증의 빛이 주문에 응답해 변신을 완성했다."];
      void bgm.play("bgm_transform", false);
      sfx.play(result.outcome === "perfect" ? "critical" : "cast");
      view.renderTransformationResult({
        sceneId: node.scene.bg,
        outcome: result.outcome,
        state: engine.getState(),
        lines,
        onContinue: () => renderCurrent(),
      });
    };

    const renderIncantationNode = (
      node: CutsceneNode & { incantationGate: NonNullable<CutsceneNode["incantationGate"]> },
      notice?: string,
    ): void => {
      const state = engine.getState();
      const voice = new RecordedVoiceTurnController(
        new BrowserPttRecordingPort(),
        createWorkerTranscriptionPort({ provider: sttProvider, workerUrl }),
      );
      if (state.inputMode === "voice") activeVoice = voice;
      view.renderIncantation(node, state, {
        speechSupported: recordingSupported,
        sttProvider,
        attempt: incantationAttempt,
        notice,
        ...voiceCapture(voice),
        onTranscript: async (transcript) => {
          const result = engine.submitIncantation(transcript, incantationAttempt);
          if (result.outcome === "retry") {
            incantationAttempt += 1;
            renderCurrent(
              `키워드 ${result.matchCount}/${node.incantationGate.requiredKeywords.length}. 한 번 더 읽어 줘.`,
            );
            return;
          }
          showTransformationResult(node, result);
        },
        onFallback: () => showTransformationResult(node, engine.chooseIncantationFallback()),
        onTurnFailed: (message) => {
          engine.recordSttTurnFailure();
          engine.setInputMode("click");
          renderCurrent(`${message} 주문 외우기 버튼으로 계속해 줘.`);
        },
        onUnavailable: (message) => {
          engine.setInputMode("click");
          renderCurrent(message);
        },
        onModeChange: (inputMode) => {
          engine.setInputMode(inputMode);
          renderCurrent();
        },
        onProviderChange: (provider) => {
          sttProvider = provider;
          updateProviderQuery(provider);
          renderCurrent(`${providerName(provider)} STT로 전환했어.`);
        },
      });
    };

    const renderBattleNode = (node: BattleNode, notice?: string): void => {
      const state = engine.getState();
      const battleState = engine.getBattleState();
      const phase = node.phases[battleState.phaseIndex];
      if (!phase) throw new Error("현재 battle phase를 찾을 수 없습니다.");
      const voice = new RecordedVoiceTurnController(
        new BrowserPttRecordingPort(),
        createWorkerTranscriptionPort({ provider: sttProvider, workerUrl }),
      );
      if (state.inputMode === "voice") activeVoice = voice;

      const applyAction = (
        action: BattleAction,
        actionLabel: string,
        reply: string,
        narration?: string,
      ): void => {
        const before = engine.getBattleState();
        const result = engine.submitBattleAction(action);
        const delta = result.battleState.momentum - before.momentum;
        sfx.play(delta === 0 ? "confirm" : "impact");
        view.renderBattleReply({
          sceneId: node.scene.bg,
          enemyName: node.enemy.name,
          actionLabel,
          reply,
          narration,
          battleState: result.battleState,
          state: engine.getState(),
          completed: result.completed,
          grade: result.grade,
          effect: delta > 0 ? "flash" : delta < 0 ? "shake" : "none",
          onContinue: () => renderCurrent(),
        });
      };

      const handleBattleTranscript = async (
        action: "spell" | "freeform",
        transcript: string,
      ): Promise<void> => {
        if (action === "spell") {
          const before = engine.getBattleState();
          const result = engine.submitBattleAction({ kind: "spell", transcript });
          const delta = result.battleState.momentum - before.momentum;
          sfx.play(delta >= 25 ? "critical" : "impact");
          view.renderBattleReply({
            sceneId: node.scene.bg,
            enemyName: node.enemy.name,
            actionLabel: transcript,
            reply: delta >= 25 ? "『그 주문은… 완전했어.』" : delta >= 15 ? "『빛이 내 안개를 가른다…!』" : "『흐린 목소리로는 닿지 않는다.』",
            narration: `주문 결과 momentum ${delta >= 0 ? "+" : ""}${delta}`,
            battleState: result.battleState,
            state: engine.getState(),
            completed: result.completed,
            grade: result.grade,
            effect: delta > 0 ? "flash" : "none",
            onContinue: () => renderCurrent(),
          });
          return;
        }

        const request = new AbortController();
        activeLlm = request;
        try {
          const judgement = await battleLlm.judgeBattle({ phase, transcript }, request.signal);
          if (request.signal.aborted) return;
          applyAction(
            { kind: "freeform", momentumDelta: judgement.momentumDelta },
            transcript,
            judgement.reply,
            judgement.narration,
          );
        } catch (error) {
          if (request.signal.aborted) return;
          console.warn(
            "Battle LLM 폴백 전환",
            error instanceof Error ? error.message : String(error),
          );
          applyAction(
            { kind: "freeform", momentumDelta: 0 },
            transcript,
            "『말은 들었다. 하지만 아직 흔들리지는 않는다.』",
            "네트워크 판정 실패: 안전한 0점 폴백",
          );
        } finally {
          if (activeLlm === request) activeLlm = null;
        }
      };

      view.renderBattle(node, phase, battleState, state, {
        speechSupported: recordingSupported,
        sttProvider,
        notice,
        ...voiceCapture(voice),
        onTranscript: handleBattleTranscript,
        onClickSpell: () =>
          applyAction(
            { kind: "click-spell" },
            phase.spell.displayText,
            "『빛이 내 안개를 가른다…!』",
            "클릭 주문 성공 +15",
          ),
        onClickResponse: (text, momentumDelta) =>
          applyAction(
            { kind: "freeform", momentumDelta },
            text,
            momentumDelta >= 8 ? "『그 확신은… 어디서 나오는 거지?』" : "『아직 버티는 건가.』",
          ),
        onGuard: () =>
          applyAction({ kind: "guard" }, "버티기", "『계속 버틴다고 달라질까.』", phase.guardLine),
        onTurnFailed: (message) => {
          sfx.play("recognition_fail");
          engine.recordSttTurnFailure();
          engine.setInputMode("click");
          renderCurrent(`${message} 클릭 행동으로 계속해 줘.`);
        },
        onUnavailable: (message) => {
          engine.setInputMode("click");
          renderCurrent(message);
        },
        onModeChange: (inputMode) => {
          engine.setInputMode(inputMode);
          renderCurrent();
        },
        onProviderChange: (provider) => {
          sttProvider = provider;
          updateProviderQuery(provider);
          renderCurrent(`${providerName(provider)} STT로 전환했어.`);
        },
        onDebugMomentum: (momentum) => {
          engine.setBattleMomentumForDebug(momentum);
          renderCurrent(`debug momentum을 ${Math.min(100, Math.max(20, Math.trunc(momentum)))}로 설정했어.`);
        },
        onDebugGrade: (grade: BattleGrade) => {
          const targetMomentum = grade === "S" ? 80 : grade === "A" ? 55 : 20;
          const finalBattleState = {
            ...engine.setBattleMomentumForDebug(targetMomentum),
            complete: true as const,
            grade,
          };
          engine.completeBattleForDebug(grade);
          view.renderBattleReply({
            sceneId: node.scene.bg,
            enemyName: node.enemy.name,
            actionLabel: `DEBUG ${grade}`,
            reply: `『${grade} 등급 결과를 재현했다.』`,
            battleState: finalBattleState,
            state: engine.getState(),
            completed: true,
            grade,
            effect: "flash",
            onContinue: () => renderCurrent(),
          });
        },
      });
    };

    renderCurrent = (inputNotice?: string, forceClickForTurn = false): void => {
      activeVoice?.cancel();
      activeVoice = null;
      bgm.setDucked(false);
      activeLlm?.abort();
      activeLlm = null;
      const node = engine.getCurrentNode();
      const state = engine.getState();
      if (node.scene.bgm) void bgm.play(node.scene.bgm);
      if (readyIncantationNodeId && readyIncantationNodeId !== node.nodeId) {
        readyIncantationNodeId = null;
        incantationAttempt = 1;
      }

      if (node.type === "dialogue") {
        const character = characters.get(node.npc.id);
        if (!character) throw new Error(`캐릭터를 찾을 수 없습니다: ${node.npc.id}`);

        const renderReply = (selectedLabel: string, result: TurnResult): void => {
          activeVoice = null;
          activeLlm = null;
          view.renderDialogueReply({
            nodeId: node.nodeId,
            sceneId: node.scene.bg,
            characterId: character.id,
            emotion: engine.getState().npcEmotion,
            speaker: character.name,
            selectedLabel,
            reply: result.reply,
            state: engine.getState(),
            advanced: result.advanced,
            onContinue: () => renderCurrent(),
          });
        };

        const selectIntent = (intentId: string): void => {
          sfx.play("confirm");
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
          ...voiceCapture(voice),
          onTranscript: handleTranscript,
          onTurnFailed: (message) => {
            sfx.play("recognition_fail");
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
        if (node.incantationGate && readyIncantationNodeId === node.nodeId) {
          renderIncantationNode(
            node as CutsceneNode & {
              incantationGate: NonNullable<CutsceneNode["incantationGate"]>;
            },
            inputNotice,
          );
          return;
        }
        renderCutscene(node, characterName, engine, view, () => {
          if (node.incantationGate) {
            readyIncantationNodeId = node.nodeId;
            incantationAttempt = 1;
          } else {
            engine.advanceLinearNode();
          }
          renderCurrent();
        });
        return;
      }

      if (node.type === "battle") {
        renderBattleNode(node, inputNotice);
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
  characterName: (speaker: string) => string,
  engine: GameEngine,
  gameView: GameView,
  onComplete: () => void,
): void {
  let lineIndex = 0;
  const renderLine = (): void => {
    const line = node.lines[lineIndex];
    if (!line) {
      onComplete();
      return;
    }
    const nextIndex = lineIndex + 1;
    gameView.renderLine({
      nodeId: node.nodeId,
      sceneId: node.scene.bg,
      speaker: characterName(line.speaker),
      speakerId: line.speaker,
      emotion: line.emotion,
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
