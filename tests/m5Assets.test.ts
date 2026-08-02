import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAssetPathUnavailable,
  corePreloadAssets,
  reportAssetLoadFailure,
  resetAssetDiagnosticsForTest,
  resolveBackgroundAsset,
  resolveBgmAsset,
  resolveCharacterAsset,
  resolveImageAsset,
} from "../src/assets/catalog";

afterEach(() => {
  resetAssetDiagnosticsForTest();
  vi.restoreAllMocks();
});

describe("M5 에셋 계약", () => {
  it("bg_hall_dark는 실파일, day 파생, CSS placeholder 순서를 보존한다", () => {
    expect(resolveBackgroundAsset("bg_hall_dark")).toEqual({
      logicalId: "bg_hall_dark",
      primaryPath: "assets/bg/bg_hall_dark.webp",
      fallbackPath: "assets/bg/bg_hall_day.webp",
      fallbackClass: "scene-derived-dark",
    });
  });

  it("캐릭터·변신·BGM 논리 ID를 고정 파일명으로 해석한다", () => {
    expect(resolveCharacterAsset("juno", "happy")).toBe(
      "assets/char/char_juno_happy.png",
    );
    expect(resolveImageAsset("gray_wraith.weakened")).toBe(
      "assets/char/char_gray_wraith_weakened.png",
    );
    expect(resolveImageAsset("transform.complete")).toBe(
      "assets/cut/cut_transform_02.webp",
    );
    expect(resolveBgmAsset("bgm_transform")).toBe(
      "assets/bgm/bgm_transform.mp3",
    );
  });

  it("첫 화면 핵심 배경과 주노 기본 표정을 선행 로드 목록에 둔다", () => {
    expect(corePreloadAssets.map(({ logicalId }) => logicalId)).toEqual([
      "bg_title",
      "bg_hall_day",
      "juno.neutral",
      "juno.surprised",
    ]);
  });

  it("누락 파일을 변경하지 않고 담당자 반환 진단을 한 번만 남긴다", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const path = "assets/bg/bg_hall_dark.webp";

    reportAssetLoadFailure("bg_hall_dark", path);
    reportAssetLoadFailure("bg_hall_dark", path);

    expect(isAssetPathUnavailable(path)).toBe(true);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0]?.[0]).toContain("[ASSET_HANDOFF]");
    expect(warning.mock.calls[0]?.[0]).toContain("외부 원본은 변경하지 말고");
  });
});
