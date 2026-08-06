import "./styles.css";
import {
  createDebugBattleLlmPort,
  createRetryingBattleLlmPort,
  createWorkerBattleLlmPort,
  judgeBattleWithFailureGate,
} from "./battle/llm";
import type { BattleAction, BattleGrade } from "./battle/state";
import { BgmController } from "./audio/bgm";
import { SfxPlayer } from "./audio/sfx";
import { preloadCoreAssets } from "./assets/catalog";
import { resolvePresentationBackground } from "./assets/presentationBackground";
import { GameDataError, loadGameData } from "./data/loader";
import type { BattleNode, CutsceneNode } from "./data/schema";
import { resolveDevSceneRequest } from "./dev/scenePreview";
import { GameEngine, type TurnResult } from "./engine/nodeRunner";
import {
  beginBrowserRecording,
  BrowserPttRecordingPort,
  decodeWithBrowserAudioContext,
} from "./input/recording";
import {
  evaluateVoiceLevel,
  resolveVoiceLevelFailure,
  type AudioLevelMetrics,
  type MicrophoneCalibration,
} from "./input/audioLevel";
import { BrowserMicrophoneTester } from "./input/microphoneSetup";
import {
  createWorkerTranscriptionPort,
  RecordedVoiceTurnController,
  resolveOpenAiSttModel,
  sttSampleRate,
  type OpenAiSttModel,
} from "./input/transcription";
import {
  createDebugLlmPort,
  createRetryingLlmPort,
  createWorkerLlmPort,
  resolveLlmDebugMode,
  type RecentDialogueTurn,
} from "./judge/llm";
import type { IncantationResult } from "./judge/incantation";
import { installQaPreviewMarker } from "./qaPreview";
import { resolveWorkerUrl } from "./runtimeConfig";
import { SaveRepository } from "./storage/saveRepository";
import { GameView } from "./ui/gameView";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app 루트 요소가 없습니다.");

const params = new URLSearchParams(window.location.search);
const debugEnabled = params.has("debug");
let selectedSttModel = resolveOpenAiSttModel(params, debugEnabled);
let handleDebugSttModelChange = (model: OpenAiSttModel): void => {
  selectedSttModel = model;
  updateSttModelQuery(model);
};
const recordingSupported = BrowserPttRecordingPort.isSupported();
const microphoneSetupSupported = recordingSupported && BrowserMicrophoneTester.isSupported();
const isQaPreview = import.meta.env.MODE === "qa";
const workerUrl = resolveWorkerUrl({
  explicitUrl: import.meta.env.VITE_WORKER_URL,
  isQaPreview,
  origin: window.location.origin,
  baseUrl: import.meta.env.BASE_URL,
});
if (isQaPreview) {
  installQaPreviewMarker({ commit: import.meta.env.VITE_QA_COMMIT });
}
const view = new GameView(root, {
  model: selectedSttModel,
  onModelChange: (model) => handleDebugSttModelChange(model),
});
const bgm = new BgmController();
const sfx = new SfxPlayer();
const microphoneTester = new BrowserMicrophoneTester();
preloadCoreAssets();

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
    let readyIncantationNodeId: string | null = null;
    let incantationAttempt = 1;
    let microphoneCalibration: MicrophoneCalibration | null = null;
    const battleVolumeFailures = new Map<string, number>();
    let renderCurrent: (inputNotice?: string, forceClickForTurn?: boolean) => void;

    handleDebugSttModelChange = (model): void => {
      selectedSttModel = model;
      updateSttModelQuery(model);
      if (activeVoice) {
        activeVoice.cancel();
        renderCurrent(`${model} 음성 인식으로 전환했어.`);
      }
    };

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

    const createVoiceTurn = (inputDeviceId?: string): RecordedVoiceTurnController =>
      new RecordedVoiceTurnController(
        new BrowserPttRecordingPort(
          () => beginBrowserRecording(inputDeviceId),
          decodeWithBrowserAudioContext,
          sttSampleRate(selectedSttModel),
        ),
        createWorkerTranscriptionPort({
          provider: "openai",
          workerUrl,
          ...(debugEnabled ? { model: selectedSttModel } : {}),
        }),
      );

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
        sceneId: resolvePresentationBackground({
          kind: "node",
          nodeId: node.nodeId,
          baseBackground: node.scene.bg,
          stage: "transformation",
        }),
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
      const voice = createVoiceTurn(microphoneCalibration?.inputDeviceId);
      if (state.inputMode === "voice") activeVoice = voice;
      view.renderIncantation(node, state, {
        speechSupported: recordingSupported,
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
      });
    };

    const renderBattleNode = (node: BattleNode, notice?: string): void => {
      const state = engine.getState();
      const battleState = engine.getBattleState();
      const phase = node.phases[battleState.phaseIndex];
      if (!phase) throw new Error("현재 battle phase를 찾을 수 없습니다.");
      const voice = createVoiceTurn(microphoneCalibration?.inputDeviceId);
      if (state.inputMode === "voice") activeVoice = voice;

      const applyAction = (
        action: BattleAction,
        actionLabel: string,
        reply: string,
        narration?: string,
      ): void => {
        battleVolumeFailures.delete(`${phase.phaseId}:${battleState.phaseTurn}`);
        const before = engine.getBattleState();
        const result = engine.submitBattleAction(action);
        const delta = result.battleState.momentum - before.momentum;
        sfx.play(delta === 0 ? "confirm" : "impact");
        view.renderBattleReply({
          sceneId: resolvePresentationBackground({
            kind: "battle",
            phaseId: phase.phaseId,
            beat:
              action.kind === "spell" ||
              action.kind === "click-spell" ||
              action.kind === "failed-spell"
                ? "spell"
                : "prompt",
            baseBackground: node.scene.bg,
          }),
          phaseId: phase.phaseId,
          enemyName: node.enemy.name,
          actionLabel,
          reply,
          narration,
          action:
            action.kind === "failed-spell"
              ? "failed-spell"
              : action.kind === "guard"
                ? "guard"
                : action.kind === "freeform"
                  ? "freeform"
                  : "spell",
          previousMomentum: before.momentum,
          previousEnemyState: before.enemyState,
          phaseChanged: result.battleState.phaseIndex !== before.phaseIndex,
          battleState: result.battleState,
          state: engine.getState(),
          completed: result.completed,
          grade: result.grade,
          onContinue: () => renderCurrent(),
        });
      };

      const handleBattleTranscript = async (
        action: "spell" | "freeform",
        transcript: string,
        audioLevel?: AudioLevelMetrics,
      ): Promise<void> => {
        if (action === "spell") {
          if (audioLevel && microphoneCalibration) {
            const levelResult = evaluateVoiceLevel(audioLevel, microphoneCalibration);
            if (levelResult !== "acceptable") {
              const failureKey = `${phase.phaseId}:${battleState.phaseTurn}`;
              const priorFailureCount = battleVolumeFailures.get(failureKey) ?? 0;
              if (resolveVoiceLevelFailure(priorFailureCount) === "retry") {
                battleVolumeFailures.set(failureKey, priorFailureCount + 1);
                sfx.play("recognition_fail");
                const direction =
                  levelResult === "too-quiet"
                    ? "목소리가 너무 작아 주문이 닿지 않았어. 조금 더 크게"
                    : "목소리가 너무 커 주문이 깨졌어. 마이크와 거리를 두고";
                renderCurrent(
                  `${direction} 다시 외쳐 줘. 현재 ${audioLevel.rmsDbfs.toFixed(1)} dBFS · 재시도는 턴을 소모하지 않아.`,
                );
                return;
              }
              const reply =
                levelResult === "too-quiet"
                  ? "『목소리가 결계에 닿지 않는다.』"
                  : "『넘친 마력이 갈라져 주문이 흩어진다.』";
              applyAction(
                { kind: "failed-spell", reason: levelResult },
                `${transcript} · ${audioLevel.rmsDbfs.toFixed(1)} dBFS`,
                reply,
                `음량 판정 ${levelResult === "too-quiet" ? "너무 작음" : "너무 큼"} · 주문 불발 +0`,
              );
              return;
            }
          }
          battleVolumeFailures.delete(`${phase.phaseId}:${battleState.phaseTurn}`);
          const before = engine.getBattleState();
          const result = engine.submitBattleAction({ kind: "spell", transcript });
          const delta = result.battleState.momentum - before.momentum;
          sfx.play(delta >= 25 ? "critical" : "impact");
          view.renderBattleReply({
            sceneId: resolvePresentationBackground({
              kind: "battle",
              phaseId: phase.phaseId,
              beat: "spell",
              baseBackground: node.scene.bg,
            }),
            phaseId: phase.phaseId,
            enemyName: node.enemy.name,
            actionLabel: transcript,
            reply: delta >= 25 ? "『그 주문은… 완전했어.』" : delta >= 15 ? "『빛이 내 안개를 가른다…!』" : "『흐린 목소리로는 닿지 않는다.』",
            narration: `주문 결과 momentum ${delta >= 0 ? "+" : ""}${delta}`,
            action: delta > 0 ? "spell" : "failed-spell",
            previousMomentum: before.momentum,
            previousEnemyState: before.enemyState,
            phaseChanged: result.battleState.phaseIndex !== before.phaseIndex,
            battleState: result.battleState,
            state: engine.getState(),
            completed: result.completed,
            grade: result.grade,
            onContinue: () => renderCurrent(),
          });
          return;
        }

        const request = new AbortController();
        activeLlm = request;
        try {
          const outcome = await judgeBattleWithFailureGate(
            battleLlm,
            { phase, transcript },
            request.signal,
            {
              getFailureCount: () => engine.getState().llmFailCount,
              recordFailure: () => engine.recordLlmFailure(),
              recordSuccess: () => engine.recordLlmSuccess(),
            },
          );
          if (request.signal.aborted) return;
          if (outcome.kind === "judged") {
            applyAction(
              { kind: "freeform", momentumDelta: outcome.judgement.momentumDelta },
              transcript,
              outcome.judgement.reply,
              outcome.judgement.narration,
            );
            return;
          }

          if (outcome.reason === "failure") {
            console.warn(
              "Battle LLM 폴백 전환",
              outcome.error instanceof Error
                ? outcome.error.message
                : String(outcome.error),
            );
          }
          if (outcome.forcedLocalMode) {
            console.warn("Battle LLM 3연속 실패: 로컬 판정 모드로 강등");
          }
          applyAction(
            { kind: "freeform", momentumDelta: 0 },
            transcript,
            "『말은 들었다. 하지만 아직 흔들리지는 않는다.』",
            outcome.reason === "disabled"
              ? "로컬 판정 모드: 안전한 0점 폴백"
              : "네트워크 판정 실패: 안전한 0점 폴백",
          );
        } catch (error) {
          if (!request.signal.aborted) throw error;
        } finally {
          if (activeLlm === request) activeLlm = null;
        }
      };

      view.renderBattle(node, phase, battleState, state, {
        speechSupported: recordingSupported,
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
            sceneId: resolvePresentationBackground({
              kind: "battle",
              phaseId: phase.phaseId,
              beat: phase.phaseId === "p3_answer" ? "spell" : "prompt",
              baseBackground: node.scene.bg,
            }),
            phaseId: phase.phaseId,
            enemyName: node.enemy.name,
            actionLabel: `DEBUG ${grade}`,
            reply: `『${grade} 등급 결과를 재현했다.』`,
            action: "debug",
            previousMomentum: battleState.momentum,
            previousEnemyState: battleState.enemyState,
            phaseChanged: false,
            battleState: finalBattleState,
            state: engine.getState(),
            completed: true,
            grade,
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

        const renderReply = (
          selectedLabel: string,
          result: TurnResult,
          intentId?: string,
        ): void => {
          activeVoice = null;
          activeLlm = null;
          view.renderDialogueReply({
            nodeId: node.nodeId,
            sceneId: node.scene.bg,
            characterId: character.id,
            emotion: engine.getState().npcEmotion,
            intentId,
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
          renderReply(result.clickLabel, result, intentId);
        };

        const voice = createVoiceTurn(microphoneCalibration?.inputDeviceId);
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
            renderReply(transcript, local, local.intentId);
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
            engine.recordLlmSuccess();
            const result = engine.submitLlmJudgement(transcript, judgement);
            rememberTurn(transcript, result.reply);
            renderReply(transcript, result, result.intentId);
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
          notice: inputNotice,
          forceClickForTurn,
          ...voiceCapture(voice),
          onTranscript: handleTranscript,
          onTurnFailed: (message) => {
            sfx.play("recognition_fail");
            const failure = engine.recordSttTurnFailure();
            if (failure.forcedClickMode) {
              engine.setInputMode("click");
              renderCurrent("음성 인식 실패가 5회 누적돼 클릭 모드로 전환했어.");
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
      microphoneSupported: microphoneSetupSupported,
      connectMicrophone: (deviceId, onLevel) => microphoneTester.connect(deviceId, onLevel),
      disconnectMicrophone: () => microphoneTester.disconnect(),
      warning:
        loaded.warning ??
        (microphoneSetupSupported
          ? null
          : "마이크 테스트 미지원: 지원 브라우저와 입력 장치가 필요합니다."),
      onNewGame: (calibration) => {
        microphoneCalibration = calibration;
        recentTurns.length = 0;
        engine.startNewGame("voice");
        renderCurrent();
      },
      onResume: (calibration) => {
        microphoneCalibration = calibration;
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
      lineIndex,
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

function updateSttModelQuery(model: OpenAiSttModel): void {
  const url = new URL(window.location.href);
  url.searchParams.set("sttModel", model);
  window.history.replaceState(null, "", url);
}

const devSceneRequest = resolveDevSceneRequest(window.location.search);
if (devSceneRequest.mode === "preview") {
  view.renderDevScenePreview(devSceneRequest.preview, () => {
    const bgmId = devSceneRequest.preview.bgmId;
    if (bgmId) void bgm.play(bgmId, bgmId !== "bgm_transform");
  });
} else if (devSceneRequest.mode === "invalid") {
  view.renderDevSceneError(devSceneRequest.requestedId);
} else {
  view.renderLoading();
  void bootstrap();
}
