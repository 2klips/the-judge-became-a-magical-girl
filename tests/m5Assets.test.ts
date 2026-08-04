import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
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

const confirmedBackgrounds = [
  "bg_title",
  "bg_office_wide",
  "bg_hall_day",
  "bg_hall_time_stop",
  "bg_hall_dark",
  "bg_hall_good",
  "bg_hall_normal",
  "bg_hall_bad",
  "bg_desk_closeup",
  "bg_battle_wide",
  "bg_hall_void",
  "bg_battle_core",
  "bg_mind_archive",
  "bg_corridor_day",
  "bg_corridor_blacklight",
  "bg_transform_space",
] as const;

const runtimeDoyun = [
  "char_doyun_normal_tired.png",
  "char_doyun_normal_startled.png",
  "char_doyun_normal.png",
  "char_doyun_normal_smile.png",
  "char_doyun_normal_shy.png",
  "char_doyun_normal_empty.png",
  "char_doyun_magical.png",
  "char_doyun_magical_defend.png",
  "char_doyun_magical_attack.png",
  "char_doyun_magical_finish.png",
  "char_doyun_magical_pose.png",
] as const;

const runtimeJuno = [
  "char_juno_neutral.png",
  "char_juno_happy.png",
  "char_juno_shy.png",
  "char_juno_upset.png",
  "char_juno_surprised.png",
] as const;

const runtimeDiskPath = (assetPath: string): string =>
  resolve(process.cwd(), "assets", "runtime", assetPath.replace(/^assets\//, ""));

function readWebpDimensions(file: Buffer): { width: number; height: number } {
  expect(file.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(file.subarray(8, 12).toString("ascii")).toBe("WEBP");

  let offset = 12;
  while (offset + 8 <= file.length) {
    const chunkType = file.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = file.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (chunkType === "VP8X") {
      return {
        width: 1 + file.readUIntLE(dataOffset + 4, 3),
        height: 1 + file.readUIntLE(dataOffset + 7, 3),
      };
    }
    if (chunkType === "VP8 ") {
      expect(file.subarray(dataOffset + 3, dataOffset + 6)).toEqual(
        Buffer.from([0x9d, 0x01, 0x2a]),
      );
      return {
        width: file.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: file.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }
    if (chunkType === "VP8L") {
      const bits = file.readUInt32LE(dataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    offset = dataOffset + chunkSize + (chunkSize % 2);
  }
  throw new Error("WebP dimension chunk를 찾을 수 없습니다.");
}

function expectTransparentCharacterAsset(
  filename: string,
  sourceDirectory: string,
): void {
  const diskPath = resolve(process.cwd(), "assets", "runtime", "char", filename);
  const sourcePath = resolve(process.cwd(), sourceDirectory, filename);
  const file = readFileSync(diskPath);

  expect(file.equals(readFileSync(sourcePath)), filename).toBe(true);
  expect(file.subarray(0, 8), filename).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  expect(file.subarray(12, 16).toString("ascii"), filename).toBe("IHDR");
  expect(file.readUInt32BE(16), filename).toBe(1200);
  expect(file.readUInt32BE(20), filename).toBe(2000);
  expect(file[24], filename).toBe(8);
  const colorType = file[25];
  const chunkTypes: string[] = [];
  let offset = 8;
  while (offset + 12 <= file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.subarray(offset + 4, offset + 8).toString("ascii");
    chunkTypes.push(type);
    offset += length + 12;
    if (type === "IEND") break;
  }
  expect(
    colorType === 4 ||
      colorType === 6 ||
      (colorType === 3 && chunkTypes.includes("tRNS")),
    filename,
  ).toBe(true);
  expect(statSync(diskPath).size, filename).toBeLessThanOrEqual(800 * 1024);
}

afterEach(() => {
  resetAssetDiagnosticsForTest();
  vi.restoreAllMocks();
});

describe("M5 에셋 계약", () => {
  it("확정 배경 16개를 runtime 논리 ID와 파일명으로 해석한다", () => {
    for (const logicalId of confirmedBackgrounds) {
      expect(resolveBackgroundAsset(logicalId)?.primaryPath).toBe(
        `assets/bg/${logicalId}.webp`,
      );
    }
  });

  it("확정 배경 16개 실파일은 1920×1080 WebP이며 각각 500KB 이하다", () => {
    for (const logicalId of confirmedBackgrounds) {
      const assetPath = resolveBackgroundAsset(logicalId)?.primaryPath ?? "";
      const diskPath = runtimeDiskPath(assetPath);
      const file = readFileSync(diskPath);

      expect(readWebpDimensions(file), logicalId).toEqual({
        width: 1920,
        height: 1080,
      });
      expect(statSync(diskPath).size, logicalId).toBeLessThanOrEqual(500 * 1024);
    }
  });

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
    expect(resolveImageAsset("doyun.normal_tired")).toBe(
      "assets/char/char_doyun_normal_tired.png",
    );
    expect(resolveImageAsset("doyun.magical_finish")).toBe(
      "assets/char/char_doyun_magical_finish.png",
    );
    expect(resolveImageAsset("transform.complete")).toBe(
      "assets/cut/cut_transform_02.webp",
    );
    expect(resolveImageAsset("ending.black_magical_girl")).toBe(
      "assets/cut/cut_black_magical_girl_01.webp",
    );
    expect(resolveBgmAsset("bgm_transform")).toBe(
      "assets/bgm/bgm_transform.mp3",
    );
  });

  it("도윤 runtime 11장은 source와 같은 1200×2000 투명 PNG다", () => {
    for (const filename of runtimeDoyun) {
      expectTransparentCharacterAsset(
        filename,
        resolve("assets", "source", "doyun", "delivery"),
      );
    }
  });

  it("주노 runtime 5장은 이동된 source와 같은 1200×2000 투명 PNG다", () => {
    for (const filename of runtimeJuno) {
      expectTransparentCharacterAsset(
        filename,
        resolve("assets", "source", "juno", "delivery"),
      );
    }
  });

  it("첫 화면에서는 타이틀 핵심 배경만 선행 로드한다", () => {
    expect(corePreloadAssets.map(({ logicalId }) => logicalId)).toEqual(["bg_title"]);
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
