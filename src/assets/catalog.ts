import type { Emotion } from "../data/schema";

export interface BackgroundAssetContract {
  readonly logicalId: string;
  readonly primaryPath: string;
  readonly fallbackPath?: string;
  readonly fallbackClass?: string;
}

const backgrounds = {
  bg_title: {
    logicalId: "bg_title",
    primaryPath: "assets/bg/bg_title.webp",
  },
  bg_office_wide: {
    logicalId: "bg_office_wide",
    primaryPath: "assets/bg/bg_office_wide.webp",
  },
  bg_hall_day: {
    logicalId: "bg_hall_day",
    primaryPath: "assets/bg/bg_hall_day.webp",
  },
  bg_hall_time_stop: {
    logicalId: "bg_hall_time_stop",
    primaryPath: "assets/bg/bg_hall_time_stop.webp",
  },
  bg_lounge_day: {
    logicalId: "bg_lounge_day",
    primaryPath: "assets/bg/bg_lounge_day.webp",
  },
  bg_street_evening: {
    logicalId: "bg_street_evening",
    primaryPath: "assets/bg/bg_street_evening.webp",
  },
  bg_hall_dark: {
    logicalId: "bg_hall_dark",
    primaryPath: "assets/bg/bg_hall_dark.webp",
    fallbackPath: "assets/bg/bg_hall_day.webp",
    fallbackClass: "scene-derived-dark",
  },
  bg_hall_void: {
    logicalId: "bg_hall_void",
    primaryPath: "assets/bg/bg_hall_void.webp",
  },
  bg_hall_good: {
    logicalId: "bg_hall_good",
    primaryPath: "assets/bg/bg_hall_good.webp",
  },
  bg_hall_normal: {
    logicalId: "bg_hall_normal",
    primaryPath: "assets/bg/bg_hall_normal.webp",
  },
  bg_hall_bad: {
    logicalId: "bg_hall_bad",
    primaryPath: "assets/bg/bg_hall_bad.webp",
  },
  bg_desk_closeup: {
    logicalId: "bg_desk_closeup",
    primaryPath: "assets/bg/bg_desk_closeup.webp",
  },
  bg_battle_wide: {
    logicalId: "bg_battle_wide",
    primaryPath: "assets/bg/bg_battle_wide.webp",
  },
  bg_battle_core: {
    logicalId: "bg_battle_core",
    primaryPath: "assets/bg/bg_battle_core.webp",
  },
  bg_mind_archive: {
    logicalId: "bg_mind_archive",
    primaryPath: "assets/bg/bg_mind_archive.webp",
  },
  bg_corridor_day: {
    logicalId: "bg_corridor_day",
    primaryPath: "assets/bg/bg_corridor_day.webp",
  },
  bg_corridor_blacklight: {
    logicalId: "bg_corridor_blacklight",
    primaryPath: "assets/bg/bg_corridor_blacklight.webp",
  },
  bg_transform_space: {
    logicalId: "bg_transform_space",
    primaryPath: "assets/bg/bg_transform_space.webp",
  },
} as const satisfies Record<string, BackgroundAssetContract>;

const imagePaths = {
  "juno.neutral": "assets/char/char_juno_neutral.png",
  "juno.happy": "assets/char/char_juno_happy.png",
  "juno.shy": "assets/char/char_juno_shy.png",
  "juno.upset": "assets/char/char_juno_upset.png",
  "juno.surprised": "assets/char/char_juno_surprised.png",
  "gray_wraith.normal": "assets/char/char_gray_wraith_normal.png",
  "gray_wraith.weakened": "assets/char/char_gray_wraith_weakened.png",
  "doyun.normal": "assets/char/char_doyun_normal.png",
  "doyun.normal_tired": "assets/char/char_doyun_normal_tired.png",
  "doyun.normal_startled": "assets/char/char_doyun_normal_startled.png",
  "doyun.normal_smile": "assets/char/char_doyun_normal_smile.png",
  "doyun.normal_shy": "assets/char/char_doyun_normal_shy.png",
  "doyun.normal_empty": "assets/char/char_doyun_normal_empty.png",
  "doyun.magical": "assets/char/char_doyun_magical.png",
  "doyun.magical_defend": "assets/char/char_doyun_magical_defend.png",
  "doyun.magical_attack": "assets/char/char_doyun_magical_attack.png",
  "doyun.magical_finish": "assets/char/char_doyun_magical_finish.png",
  "doyun.magical_pose": "assets/char/char_doyun_magical_pose.png",
  "transform.cast": "assets/cut/cut_transform_01.webp",
  "transform.complete": "assets/cut/cut_transform_02.webp",
  "ending.black_magical_girl": "assets/cut/cut_black_magical_girl_01.webp",
} as const;

const bgmPaths = {
  bgm_daily: "assets/bgm/bgm_daily.mp3",
  bgm_battle: "assets/bgm/bgm_battle.mp3",
  bgm_transform: "assets/bgm/bgm_transform.mp3",
  bgm_crisis: "assets/bgm/bgm_crisis.mp3",
  bgm_ending: "assets/bgm/bgm_ending.mp3",
} as const;

export type BackgroundId = keyof typeof backgrounds;
export type ImageAssetId = keyof typeof imagePaths;
export type BgmAssetId = keyof typeof bgmPaths;

export interface ImageAssetFallback {
  readonly path: string;
  readonly className: string;
}

const imageFallbacks: Partial<Record<ImageAssetId, ImageAssetFallback>> = {
  "gray_wraith.weakened": {
    path: imagePaths["gray_wraith.normal"],
    className: "asset-derived-wraith-weakened",
  },
};

const unavailablePaths = new Set<string>();
const reportedFailures = new Set<string>();

export const knownBackgroundIds = new Set<string>(Object.keys(backgrounds));
export const knownBgmIds = new Set<string>(Object.keys(bgmPaths));
export const knownImageIds = new Set<string>(Object.keys(imagePaths));

export function resolveBackgroundAsset(
  logicalId: string,
): BackgroundAssetContract | null {
  return backgrounds[logicalId as BackgroundId] ?? null;
}

export function resolveImageAsset(logicalId: string): string | null {
  return imagePaths[logicalId as ImageAssetId] ?? null;
}

export function resolveImageAssetFallback(
  logicalId: string,
): ImageAssetFallback | null {
  return imageFallbacks[logicalId as ImageAssetId] ?? null;
}

export function resolveCharacterAsset(
  characterId: string,
  emotion: Emotion,
): string | null {
  return resolveImageAsset(`${characterId}.${emotion}`);
}

export function resolveBgmAsset(logicalId: string): string | null {
  return bgmPaths[logicalId as BgmAssetId] ?? null;
}

export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${relativePath}`;
}

export const corePreloadAssets = [
  { logicalId: "bg_title", path: backgrounds.bg_title.primaryPath },
] as const;

export function preloadCoreAssets(): void {
  if (typeof Image === "undefined") return;
  for (const asset of corePreloadAssets) {
    if (isAssetPathUnavailable(asset.path)) continue;
    const image = new Image();
    image.decoding = "async";
    image.addEventListener(
      "error",
      () => reportAssetLoadFailure(asset.logicalId, asset.path),
      { once: true },
    );
    image.src = assetUrl(asset.path);
  }
}

export function isAssetPathUnavailable(relativePath: string): boolean {
  return unavailablePaths.has(relativePath);
}

export function reportAssetLoadFailure(
  logicalId: string,
  relativePath: string,
  reason = "파일 없음 또는 로드 실패",
): void {
  unavailablePaths.add(relativePath);
  const key = `${logicalId}|${relativePath}`;
  if (reportedFailures.has(key)) return;
  reportedFailures.add(key);
  console.warn(
    `[ASSET_HANDOFF] ${logicalId}: 기대 경로 ${relativePath} — ${reason}. ` +
      "외부 원본은 변경하지 말고 담당자에게 반환하세요.",
  );
}

export function resetAssetDiagnosticsForTest(): void {
  unavailablePaths.clear();
  reportedFailures.clear();
}
