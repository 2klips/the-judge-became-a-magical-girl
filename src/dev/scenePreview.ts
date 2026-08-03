export type DevSceneLayout =
  | "empty"
  | "dialogue"
  | "battle"
  | "transform"
  | "ending";

export interface DevSceneVisual {
  readonly logicalId: string;
  readonly label: string;
  readonly role: "juno" | "enemy" | "player" | "cut" | "ending-cut";
}

export interface DevScenePreview {
  readonly id: string;
  readonly label: string;
  readonly backgroundId: string;
  readonly nodeId: string;
  readonly beat: string;
  readonly bgmId: string | null;
  readonly layout: DevSceneLayout;
  readonly visuals: readonly DevSceneVisual[];
  readonly showVoiceOrb?: boolean;
}

const juno = (emotion: string): DevSceneVisual => ({
  logicalId: `juno.${emotion}`,
  label: `주노 · ${emotion}`,
  role: "juno",
});

const wraith = (state: "normal" | "weakened"): DevSceneVisual => ({
  logicalId: `gray_wraith.${state}`,
  label: `회색 망령 · ${state}`,
  role: "enemy",
});

const doyun: DevSceneVisual = {
  logicalId: "doyun.magical",
  label: "마법소녀 도윤",
  role: "player",
};

export const M5_SCENE_PREVIEWS = [
  {
    id: "title",
    label: "TITLE · 임시 승인본",
    backgroundId: "bg_title",
    nodeId: "title",
    beat: "타이틀",
    bgmId: null,
    layout: "empty",
    visuals: [],
  },
  {
    id: "n0-office",
    label: "N0 · 사무실 도입",
    backgroundId: "bg_office_wide",
    nodeId: "n0_review",
    beat: "line 1/5",
    bgmId: "bgm_daily",
    layout: "empty",
    visuals: [],
  },
  {
    id: "n0-desk",
    label: "N0 · 평가표 책상",
    backgroundId: "bg_hall_day",
    nodeId: "n0_review",
    beat: "line 2~5/5",
    bgmId: "bgm_daily",
    layout: "empty",
    visuals: [],
  },
  {
    id: "n1-first-voice",
    label: "N1 · 첫 목소리",
    backgroundId: "bg_hall_time_stop",
    nodeId: "n1_first_voice",
    beat: "주노 미노출",
    bgmId: "bgm_daily",
    layout: "dialogue",
    visuals: [],
    showVoiceOrb: true,
  },
  {
    id: "n2-juno",
    label: "N2 · 주노 등장",
    backgroundId: "bg_hall_day",
    nodeId: "n2_juno_intro",
    beat: "surprised → happy",
    bgmId: "bgm_daily",
    layout: "dialogue",
    visuals: [juno("surprised")],
  },
  {
    id: "n3-wraith",
    label: "N3 · 망령 등장",
    backgroundId: "bg_hall_dark",
    nodeId: "n3_wraith_choice",
    beat: "주노 + 망령",
    bgmId: "bgm_battle",
    layout: "dialogue",
    visuals: [wraith("normal"), juno("upset")],
  },
  {
    id: "n4-team",
    label: "N4-A · 콤비",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_team",
    beat: "happy",
    bgmId: "bgm_battle",
    layout: "dialogue",
    visuals: [wraith("normal"), juno("happy")],
  },
  {
    id: "n4-cooperate",
    label: "N4-B · 협력",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_cooperate",
    beat: "neutral",
    bgmId: "bgm_battle",
    layout: "dialogue",
    visuals: [wraith("normal"), juno("neutral")],
  },
  {
    id: "n4-awkward",
    label: "N4-C · 서먹함",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_awkward",
    beat: "upset",
    bgmId: "bgm_battle",
    layout: "dialogue",
    visuals: [wraith("normal"), juno("upset")],
  },
  {
    id: "n5-intro",
    label: "N5 · 변신 도입",
    backgroundId: "bg_hall_dark",
    nodeId: "n5_transform",
    beat: "도입 line",
    bgmId: "bgm_battle",
    layout: "dialogue",
    visuals: [wraith("normal"), juno("surprised")],
  },
  {
    id: "n5-incantation",
    label: "N5 · 주문 게이트",
    backgroundId: "bg_desk_closeup",
    nodeId: "n5_transform",
    beat: "incantation",
    bgmId: "bgm_battle",
    layout: "dialogue",
    visuals: [juno("surprised")],
  },
  {
    id: "n5-transformation",
    label: "N5 · 변신 결과",
    backgroundId: "bg_transform_space",
    nodeId: "n5_transform",
    beat: "cast → complete",
    bgmId: "bgm_transform",
    layout: "transform",
    visuals: [
      { logicalId: "transform.cast", label: "변신 영창 컷", role: "cut" },
      { logicalId: "transform.complete", label: "변신 완료 컷", role: "cut" },
    ],
  },
  {
    id: "battle-p1",
    label: "BATTLE p1 · 방어",
    backgroundId: "bg_battle_wide",
    nodeId: "battle_wraith",
    beat: "p1_defend",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun, wraith("normal"), juno("neutral")],
  },
  {
    id: "battle-p2",
    label: "BATTLE p2 · 공격",
    backgroundId: "bg_hall_void",
    nodeId: "battle_wraith",
    beat: "p2_attack",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun, wraith("weakened"), juno("happy")],
  },
  {
    id: "battle-p3-question",
    label: "BATTLE p3 · 핵심 질문",
    backgroundId: "bg_mind_archive",
    nodeId: "battle_wraith",
    beat: "p3_answer · prompt",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun, wraith("weakened"), juno("neutral")],
  },
  {
    id: "battle-p3-spell",
    label: "BATTLE p3 · 마지막 주문",
    backgroundId: "bg_battle_core",
    nodeId: "battle_wraith",
    beat: "p3_answer · spell",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun, wraith("weakened"), juno("neutral")],
  },
  {
    id: "convergence",
    label: "수렴 · 작은 회색 빛",
    backgroundId: "bg_hall_dark",
    nodeId: "ch3_gray_answer",
    beat: "전투 후 질문",
    bgmId: "bgm_daily",
    layout: "dialogue",
    visuals: [juno("neutral")],
  },
  {
    id: "ending-good",
    label: "GOOD · 본 장면",
    backgroundId: "bg_hall_good",
    nodeId: "ending_good",
    beat: "line 1~5",
    bgmId: "bgm_daily",
    layout: "ending",
    visuals: [juno("happy")],
  },
  {
    id: "ending-good-corridor",
    label: "GOOD · 밝은 복도",
    backgroundId: "bg_corridor_day",
    nodeId: "ending_good",
    beat: "line 6",
    bgmId: "bgm_daily",
    layout: "ending",
    visuals: [juno("surprised")],
  },
  {
    id: "ending-good-blacklight",
    label: "GOOD · 검은빛 복도",
    backgroundId: "bg_corridor_blacklight",
    nodeId: "ending_good",
    beat: "line 7",
    bgmId: "bgm_daily",
    layout: "ending",
    visuals: [
      {
        logicalId: "ending.black_magical_girl",
        label: "검은 마법소녀 선택 컷",
        role: "ending-cut",
      },
    ],
  },
  {
    id: "ending-normal",
    label: "NORMAL · 부분 회복",
    backgroundId: "bg_hall_normal",
    nodeId: "ending_normal",
    beat: "전체",
    bgmId: "bgm_daily",
    layout: "ending",
    visuals: [juno("neutral")],
  },
  {
    id: "ending-bad",
    label: "BAD · 회색 업무일지",
    backgroundId: "bg_hall_bad",
    nodeId: "ending_bad",
    beat: "전체",
    bgmId: "bgm_daily",
    layout: "ending",
    visuals: [juno("upset")],
  },
] as const satisfies readonly DevScenePreview[];

export type DevSceneRequest =
  | { readonly mode: "game"; readonly debugEnabled: boolean }
  | {
      readonly mode: "preview";
      readonly debugEnabled: true;
      readonly preview: DevScenePreview;
    }
  | {
      readonly mode: "invalid";
      readonly debugEnabled: true;
      readonly requestedId: string;
    };

export function resolveDevSceneRequest(search: string): DevSceneRequest {
  const params = new URLSearchParams(search);
  const debugEnabled = params.has("debug");
  const requestedId = params.get("scene");
  if (!debugEnabled || !requestedId) {
    return { mode: "game", debugEnabled };
  }
  const preview = M5_SCENE_PREVIEWS.find(({ id }) => id === requestedId);
  return preview
    ? { mode: "preview", debugEnabled: true, preview }
    : { mode: "invalid", debugEnabled: true, requestedId };
}
