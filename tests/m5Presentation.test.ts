import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { EndingNode } from "../src/data/schema";
import {
  formatDialogueText,
  isActBoundaryTransition,
  resolveDialogueIdentity,
  resolveDialoguePresentation,
  resolveBattleStagePresentation,
  resolveBattleActionPresentation,
  resolveEndingLines,
  resolveEndingPages,
  resolveEndingVisual,
  resolveIncantationCompanionVisual,
  resolveMissingAssetPresentation,
  resolveSpriteSlot,
  resolveSceneBrand,
  resolveSttModelControlVisibility,
  resolveVoiceInputPresentation,
  resolveVoiceControlContract,
  TYPEWRITER_BASE_DELAY_MS,
  typewriterDelayFor,
  VOICE_PROCESSING_LABEL,
  VOICE_TITLE_SUBTITLE,
} from "../src/ui/gameView";

const gameViewSource = readFileSync(new URL("../src/ui/gameView.ts", import.meta.url), "utf8");

function rendererSection(start: string, end: string): string {
  const startIndex = gameViewSource.indexOf(start);
  const endIndex = gameViewSource.indexOf(end, startIndex + start.length);
  expect(startIndex, start).toBeGreaterThanOrEqual(0);
  expect(endIndex, end).toBeGreaterThan(startIndex);
  return gameViewSource.slice(startIndex, endIndex);
}

describe("M5 장면 표시 계약", () => {
  it("누락 외부 이미지는 UI를 보존하는 검은 presentation으로 표시한다", () => {
    expect(resolveMissingAssetPresentation("주노 · neutral")).toEqual({
      className: "asset-black-placeholder",
      ariaLabel: "주노 · neutral 에셋 준비 중",
      preservesInteractiveUi: true,
    });
  });

  it("N1에서는 주노 정체를 이름표와 상단 링크에 노출하지 않는다", () => {
    expect(resolveDialogueIdentity("n1_first_voice", "주노")).toEqual({
      speaker: "정체불명의 목소리",
      brand: "VOICE // LINK",
    });
  });

  it("타이틀에서도 첫 음성의 정체를 미리 밝히지 않는다", () => {
    expect(VOICE_TITLE_SUBTITLE).not.toContain("주노");
  });

  it("TITLE renderer는 전용 TitleView에 시각 골격을 위임한다", () => {
    const renderer = rendererSection("renderTitle(", "renderLine(");
    expect(renderer).toMatch(/new TitleView\(shell,/);
    expect(renderer).not.toContain("microphone-meter");
    expect(renderer).not.toContain("dBFS");
  });

  it("N0와 N1은 익명 링크, N2부터 주노 링크를 표시한다", () => {
    expect(resolveSceneBrand("n0_review")).toBe("VOICE // LINK");
    expect(resolveSceneBrand("n1_first_voice")).toBe("VOICE // LINK");
    expect(resolveSceneBrand("n2_juno_intro")).toBe("JUNO // LINK");
  });

  it("화자별 미연시 대화창 방향·색상과 무기명 내레이션을 고정한다", () => {
    expect(resolveDialoguePresentation("juno")).toEqual({
      side: "center",
      tone: "juno",
      showName: true,
    });
    expect(resolveDialoguePresentation("doyun")).toEqual({
      side: "center",
      tone: "doyun",
      showName: true,
    });
    expect(resolveDialoguePresentation("gray_wraith")).toEqual({
      side: "center",
      tone: "wraith",
      showName: true,
    });
    expect(resolveDialoguePresentation("narration")).toEqual({
      side: "center",
      tone: "narration",
      showName: false,
    });
    expect(resolveDialoguePresentation("voice")).toEqual({
      side: "center",
      tone: "voice",
      showName: true,
    });
  });

  it("대화창 이동 대신 캐릭터 논리 ID를 고정 highlight 슬롯으로 분류한다", () => {
    expect(resolveSpriteSlot("doyun.normal_smile")).toBe("doyun");
    expect(resolveSpriteSlot("juno.happy")).toBe("juno");
    expect(resolveSpriteSlot("gray_wraith.weakened")).toBe("gray_wraith");
    expect(resolveSpriteSlot("transform.cast")).toBeNull();
  });

  it("타이프라이터는 24ms 기본 속도와 문장부호 휴지를 사용한다", () => {
    expect(TYPEWRITER_BASE_DELAY_MS).toBe(24);
    expect(typewriterDelayFor("가")).toBe(24);
    expect(typewriterDelayFor(",")).toBe(48);
    expect(typewriterDelayFor(".")).toBe(92);
    expect(typewriterDelayFor("…")).toBe(92);
  });

  it("암전은 지정된 네 막 경계에서만 실행한다", () => {
    expect(isActBoundaryTransition("title", "n0_review")).toBe(true);
    expect(isActBoundaryTransition("n5_transform_result", "battle_wraith")).toBe(true);
    expect(isActBoundaryTransition("battle_wraith", "ch3_gray_answer")).toBe(true);
    expect(isActBoundaryTransition("ch3_gray_answer", "ending_good")).toBe(true);
    expect(isActBoundaryTransition("n2_juno_intro", "n2_juno_followup")).toBe(false);
    expect(isActBoundaryTransition("battle_wraith", "battle_wraith")).toBe(false);
  });

  it("내레이션만 소괄호로 감싸고 이미 감싼 문장은 중복 처리하지 않는다", () => {
    expect(formatDialogueText("퇴근하고 싶다.", "narration")).toBe("(퇴근하고 싶다.)");
    expect(formatDialogueText("(이미 감싼 독백)", "narration")).toBe("(이미 감싼 독백)");
    expect(formatDialogueText("오늘은 같이 가자!", "juno")).toBe("오늘은 같이 가자!");
  });

  it("고정 STT 공급자는 내부 동작만 유지하고 UI 표시는 숨긴다", () => {
    expect(resolveSttModelControlVisibility(false)).toBe("hidden");
    expect(resolveSttModelControlVisibility(true)).toBe("select");
  });

  it("음성 입력은 별도 안내·상태 영역 없이 누르고 말하기 버튼만 표시한다", () => {
    expect(resolveVoiceInputPresentation()).toEqual({
      buttonLabel: "누르고 말하기 (T)",
      showInstruction: false,
      showStatusRegion: false,
    });
    expect(VOICE_PROCESSING_LABEL).toBe("목소리 전달 중…");
  });

  it("dialogue 현재 턴 강제 클릭은 선택지만 보이고 음성 복귀를 숨긴다", () => {
    expect(resolveVoiceControlContract("dialogue", "voice", true, true)).toEqual({
      surface: "dialogue",
      showVoiceCapture: false,
      showClickActions: true,
      showVoiceModeSwitch: false,
    });
    const renderer = rendererSection("renderDialogue(", "renderDialogueReply(");
    expect(renderer).toMatch(/resolveVoiceControlContract\(\s*"dialogue"/);
    expect(renderer).toMatch(/controlContract\.showVoiceCapture/);
    expect(renderer).toMatch(/controlContract\.showClickActions/);
    expect(renderer).toMatch(/controlContract\.showVoiceModeSwitch/);
  });

  it("incantation 현재 턴 강제 클릭은 주문 버튼만 보이고 음성 복귀를 숨긴다", () => {
    expect(resolveVoiceControlContract("incantation", "voice", true, true)).toEqual({
      surface: "incantation",
      showVoiceCapture: false,
      showClickActions: true,
      showVoiceModeSwitch: false,
    });
    const renderer = rendererSection("renderIncantation(", "renderTransformationResult(");
    expect(renderer).toMatch(/resolveVoiceControlContract\(\s*"incantation"/);
    expect(renderer).toMatch(/controlContract\.showVoiceCapture/);
    expect(renderer).toMatch(/controlContract\.showClickActions/);
    expect(renderer).toMatch(/controlContract\.showVoiceModeSwitch/);
  });

  it("battle 현재 턴 강제 클릭은 행동 버튼만 보이고 음성 복귀를 숨긴다", () => {
    expect(resolveVoiceControlContract("battle", "voice", true, true)).toEqual({
      surface: "battle",
      showVoiceCapture: false,
      showClickActions: true,
      showVoiceModeSwitch: false,
    });
    const renderer = rendererSection("renderBattle(", "renderBattleReply(");
    expect(renderer).toMatch(/resolveVoiceControlContract\(\s*"battle"/);
    expect(renderer).toMatch(/controlContract\.showVoiceCapture/);
    expect(renderer).toMatch(/controlContract\.showClickActions/);
    expect(renderer).toMatch(/controlContract\.showVoiceModeSwitch/);
  });

  it("ending 본문 뒤에 현재 전투 등급의 추가 대사만 붙인다", () => {
    const ending: EndingNode = {
      nodeId: "ending_good",
      type: "ending",
      scene: { bg: "bg_hall_day" },
      endingId: "good",
      lines: [
        { speaker: "narration", text: "GOOD" },
        { speaker: "narration", text: "기본 본문" },
      ],
      gradeVariants: {
        S: [{ speaker: "juno", text: "S 추가 대사" }],
        B: [{ speaker: "juno", text: "B 추가 대사" }],
      },
    };

    expect(resolveEndingLines(ending, "S").map(({ text }) => text)).toEqual([
      "GOOD",
      "기본 본문",
      "S 추가 대사",
    ]);
  });

  it("ending 본문을 배경 cue와 마지막 페이지 정보가 있는 문장별 페이지로 만든다", () => {
    const ending: EndingNode = {
      nodeId: "ending_good",
      type: "ending",
      scene: { bg: "bg_hall_day" },
      endingId: "good",
      lines: Array.from({ length: 7 }, (_, index) => ({
        speaker: "narration",
        text: `GOOD ${index}`,
      })),
    };

    const pages = resolveEndingPages(ending, null);

    expect(pages.map(({ sceneId }) => sceneId)).toEqual([
      "bg_hall_good",
      "bg_hall_good",
      "bg_hall_good",
      "bg_hall_good",
      "bg_hall_good",
      "bg_corridor_day",
      "bg_corridor_blacklight",
    ]);
    expect(pages.map(({ isLast }) => isLast)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it("ending 문장별 주노 표정과 GOOD 마지막 인물 미노출을 고정한다", () => {
    expect(resolveEndingVisual("good", 0)).toEqual({
      characterId: "juno",
      emotion: "happy",
    });
    expect(resolveEndingVisual("good", 5)).toEqual({
      characterId: "juno",
      emotion: "surprised",
    });
    expect(resolveEndingVisual("good", 6)).toBeNull();
    expect(resolveEndingVisual("normal", 0)?.emotion).toBe("neutral");
    expect(resolveEndingVisual("bad", 0)?.emotion).toBe("upset");
  });

  it("N5 주문 게이트에서 직전 N4의 주노 표정을 유지한다", () => {
    expect(resolveIncantationCompanionVisual({ npcEmotion: "happy" })).toEqual({
      characterId: "juno",
      emotion: "happy",
    });
    expect(resolveIncantationCompanionVisual({ npcEmotion: "shy" })).toEqual({
      characterId: "juno",
      emotion: "shy",
    });
    expect(resolveIncantationCompanionVisual({ npcEmotion: "neutral" })).toEqual({
      characterId: "juno",
      emotion: "neutral",
    });
  });

  it("전투 명령·결과 화면이 같은 페이즈별 무대 인물 계약을 사용한다", () => {
    expect(resolveBattleStagePresentation("p1_defend")).toEqual({
      phaseIndex: 0,
      phaseTotal: 3,
      doyunLogicalId: "doyun.magical_defend",
      junoEmotion: "neutral",
    });
    expect(resolveBattleStagePresentation("p2_attack")).toMatchObject({
      phaseIndex: 1,
      doyunLogicalId: "doyun.magical_attack",
      junoEmotion: "happy",
    });
    expect(resolveBattleStagePresentation("p3_answer")).toMatchObject({
      phaseIndex: 2,
      doyunLogicalId: "doyun.magical_finish",
      junoEmotion: "neutral",
    });
  });

  it("전투 행동·약화·페이즈·등급 연출을 수치 변경과 분리해 결정한다", () => {
    expect(
      resolveBattleActionPresentation({
        phaseId: "p2_attack",
        action: "spell",
        delta: 25,
        previousEnemyState: "normal",
        enemyState: "weakened",
        phaseChanged: true,
        completed: false,
        grade: null,
      }),
    ).toMatchObject({
      className: "battle-action-spell-success",
      doyunLogicalId: "doyun.magical_attack",
      particles: true,
      wraithTransition: "weaken",
      phaseCallout: "……도윤. 이번에는 네 대답을 듣고 싶어.",
    });
    expect(
      resolveBattleActionPresentation({
        phaseId: "p3_answer",
        action: "guard",
        delta: 3,
        previousEnemyState: "weakened",
        enemyState: "weakened",
        phaseChanged: false,
        completed: true,
        grade: "A",
      }),
    ).toMatchObject({
      className: "battle-action-guard",
      doyunLogicalId: "doyun.magical_defend",
      guardBarrier: true,
      gradeLabel: "빛을 되찾은 언령",
    });
    expect(
      resolveBattleActionPresentation({
        phaseId: "p1_defend",
        action: "failed-spell",
        delta: 0,
        previousEnemyState: "weakened",
        enemyState: "normal",
        phaseChanged: false,
        completed: false,
        grade: null,
      }),
    ).toMatchObject({
      className: "battle-action-failed",
      particles: false,
      wraithTransition: "recover",
    });
  });
});
