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
  readonly composition: SceneCompositionPreset;
  readonly renderMode: SceneRenderMode;
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

const doyun = (state: string): DevSceneVisual => ({
  logicalId: `doyun.${state}`,
  label: `도윤 · ${state}`,
  role: "player",
});

const M5_SCENE_PREVIEW_DRAFTS = [
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
    beat: "line 3/5 · 도윤 등장",
    bgmId: "bgm_daily",
    layout: "dialogue",
    visuals: [doyun("normal_tired")],
  },
  {
    id: "n1-first-voice",
    label: "N1 · 첫 목소리",
    backgroundId: "bg_hall_time_stop",
    nodeId: "n1_first_voice",
    beat: "주노 미노출",
    bgmId: "bgm_daily",
    layout: "dialogue",
    visuals: [doyun("normal")],
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
    visuals: [doyun("normal_startled"), juno("surprised")],
  },
  {
    id: "n3-wraith",
    label: "N3 · 망령 등장",
    backgroundId: "bg_hall_dark",
    nodeId: "n3_wraith_choice",
    beat: "주노 + 망령",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal_startled"), wraith("normal"), juno("upset")],
  },
  {
    id: "n4-team",
    label: "N4-A · 콤비",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_team",
    beat: "happy",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal_smile"), wraith("normal"), juno("happy")],
  },
  {
    id: "n4-cooperate",
    label: "N4-B · 협력",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_cooperate",
    beat: "neutral",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal"), wraith("normal"), juno("neutral")],
  },
  {
    id: "n4-awkward",
    label: "N4-C · 서먹함",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_awkward",
    beat: "upset",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal"), wraith("normal"), juno("upset")],
  },
  {
    id: "n4-c-recover",
    label: "N4-C · 서먹함 회복",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_awkward",
    beat: "relation recovered",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal_smile"), wraith("normal"), juno("shy")],
  },
  {
    id: "n4-c-distance",
    label: "N4-C · 거리 유지",
    backgroundId: "bg_hall_dark",
    nodeId: "n4_awkward",
    beat: "relation distant",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal_tired"), wraith("normal"), juno("neutral")],
  },
  {
    id: "n5-intro",
    label: "N5 · 변신 도입",
    backgroundId: "bg_hall_dark",
    nodeId: "n5_transform",
    beat: "floating employee ID · reaction handoff pending",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal_startled"), wraith("normal"), juno("surprised")],
  },
  {
    id: "n5-incantation",
    label: "N5 · 주문 게이트",
    backgroundId: "bg_desk_closeup",
    nodeId: "n5_transform",
    beat: "incantation",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal"), juno("surprised")],
  },
  {
    id: "n5-before-transform",
    label: "N5 · 변신 직전 live",
    backgroundId: "bg_hall_dark",
    nodeId: "n5_transform",
    beat: "before transform",
    bgmId: "bgm_crisis",
    layout: "dialogue",
    visuals: [doyun("normal"), wraith("normal"), juno("surprised")],
  },
  {
    id: "n5-cut-01",
    label: "N5 · 변신 CUT 01",
    backgroundId: "bg_transform_space",
    nodeId: "n5_transform",
    beat: "transform cut 01",
    bgmId: "bgm_transform",
    layout: "transform",
    visuals: [{ logicalId: "transform.cast", label: "변신 영창 컷", role: "cut" }],
  },
  {
    id: "n5-cut-02",
    label: "N5 · 변신 CUT 02",
    backgroundId: "bg_transform_space",
    nodeId: "n5_transform",
    beat: "transform cut 02",
    bgmId: "bgm_transform",
    layout: "transform",
    visuals: [{ logicalId: "transform.complete", label: "변신 완료 컷", role: "cut" }],
  },
  {
    id: "n5-transformed-live",
    label: "N5 · 변신 완료 live",
    backgroundId: "bg_hall_void",
    nodeId: "n5_transform",
    beat: "transformed live",
    bgmId: "bgm_transform",
    layout: "dialogue",
    visuals: [doyun("magical_pose"), juno("surprised"), wraith("normal")],
  },
  {
    id: "battle-p1",
    label: "BATTLE p1 · 방어",
    backgroundId: "bg_battle_wide",
    nodeId: "battle_wraith",
    beat: "p1_defend",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun("magical_defend"), wraith("normal"), juno("neutral")],
  },
  {
    id: "battle-p2",
    label: "BATTLE p2 · 공격",
    backgroundId: "bg_hall_void",
    nodeId: "battle_wraith",
    beat: "p2_attack",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun("magical_attack"), wraith("weakened"), juno("happy")],
  },
  {
    id: "battle-second-spell",
    label: "BATTLE · 두 번째 주문 기회",
    backgroundId: "bg_hall_void",
    nodeId: "battle_wraith",
    beat: "second spell choice",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun("magical_pose"), wraith("weakened"), juno("happy")],
  },
  {
    id: "n7-gray-answer",
    label: "N7 · 회색 속의 대면",
    backgroundId: "bg_mind_archive",
    nodeId: "n7_gray_answer",
    beat: "BELIEVE / POSSIBILITY / CYNIC",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun("magical_finish"), wraith("weakened"), juno("neutral")],
  },
  {
    id: "n8-final-spell",
    label: "N8 · 마지막 주문",
    backgroundId: "bg_battle_core",
    nodeId: "n8_final_spell",
    beat: "default / own / refusal",
    bgmId: "bgm_battle",
    layout: "battle",
    visuals: [doyun("magical_finish"), wraith("weakened"), juno("neutral")],
  },
  {
    id: "ending-good",
    label: "GOOD · 본 장면",
    backgroundId: "bg_hall_good",
    nodeId: "ending_good",
    beat: "line 1~5",
    bgmId: "bgm_ending",
    layout: "ending",
    visuals: [doyun("normal_smile"), juno("happy")],
  },
  {
    id: "asset-corridor-day",
    label: "ASSET QA · 밝은 복도 (v3.1 미사용)",
    backgroundId: "bg_corridor_day",
    nodeId: "asset_catalog",
    beat: "unmapped background",
    bgmId: null,
    layout: "ending",
    visuals: [],
  },
  {
    id: "ending-hidden",
    label: "HIDDEN · 사내 인기 영상",
    backgroundId: "bg_hall_good",
    nodeId: "ending_hidden",
    beat: "전체",
    bgmId: "bgm_ending",
    layout: "ending",
    visuals: [doyun("normal_smile"), juno("happy")],
  },
  {
    id: "post-credit",
    label: "POST-CREDIT · 검은빛 복도",
    backgroundId: "bg_corridor_blacklight",
    nodeId: "post_credit",
    beat: "canonical stinger",
    bgmId: "bgm_ending",
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
    bgmId: "bgm_ending",
    layout: "ending",
    visuals: [doyun("normal_smile"), juno("neutral")],
  },
  {
    id: "ending-bad",
    label: "BAD · 회색 업무일지",
    backgroundId: "bg_hall_bad",
    nodeId: "ending_bad",
    beat: "전체",
    bgmId: "bgm_ending",
    layout: "ending",
    visuals: [doyun("normal_empty"), juno("upset")],
  },
] as const;

function previewComposition(id: string): Pick<
  DevScenePreview,
  "composition" | "renderMode"
> {
  if (id === "n5-cut-01" || id === "n5-cut-02") {
    return { composition: "solo-cut", renderMode: "cut" };
  }
  if (id === "n3-wraith" || id.startsWith("n4-") || id === "n5-before-transform") {
    return { composition: "confrontation", renderMode: "sprite" };
  }
  if (id === "n5-intro" || id === "n5-incantation") {
    return { composition: "protect", renderMode: "sprite" };
  }
  if (
    id.startsWith("battle-") ||
    id === "n5-transformed-live" ||
    id === "n7-gray-answer" ||
    id === "n8-final-spell"
  ) {
    return { composition: "battle", renderMode: "sprite" };
  }
  if (id.startsWith("ending-") || id === "post-credit") {
    return { composition: "ending", renderMode: "sprite" };
  }
  return { composition: "conversation", renderMode: "sprite" };
}

export const M5_SCENE_PREVIEWS: readonly DevScenePreview[] =
  M5_SCENE_PREVIEW_DRAFTS.map((preview) => ({
    ...preview,
    ...previewComposition(preview.id),
  }));

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
import type {
  SceneCompositionPreset,
  SceneRenderMode,
} from "../ui/sceneComposition";
