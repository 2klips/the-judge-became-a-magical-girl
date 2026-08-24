import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourcePath = resolve(
  "assets",
  "source",
  "background",
  "openai-submission-2026-08-24",
  "original",
  "bg_title_openai_submission.png",
);
const runtimePath = resolve("assets", "runtime", "bg", "bg_title.webp");
const scenePreviewPath = resolve("src", "dev", "scenePreview.ts");

const approvedSourceSha256 =
  "0048CBD12479BB458970DCB8D94EBD97422F95887C441D7D5E421522966772A8";
const historicalNhnRuntimeSha256 =
  "A9837907F87AFB7323DD3A3B6C85E3BC6B76F93FDEBDF50D2A163E59EB35FC9C";

const sha256 = (file: Buffer): string =>
  createHash("sha256").update(file).digest("hex").toUpperCase();

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

function collectRuntimeFacingTextFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectRuntimeFacingTextFiles(path);
    return [".ts", ".css", ".html"].includes(extname(entry.name)) ? [path] : [];
  });
}

describe("OpenAI 제출용 TITLE rebrand 계약", () => {
  it("사용자 승인 PNG 원본을 source provenance에 바이트 그대로 보존한다", () => {
    expect(existsSync(sourcePath)).toBe(true);
    if (!existsSync(sourcePath)) return;

    const source = readFileSync(sourcePath);
    expect(sha256(source)).toBe(approvedSourceSha256);
    expect(source.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(source.readUInt32BE(16)).toBe(1672);
    expect(source.readUInt32BE(20)).toBe(941);
  });

  it("runtime bg_title은 OpenAI 제출본 1920×1080 WebP이며 과거 NHN binary가 아니다", () => {
    const runtime = readFileSync(runtimePath);

    expect(readWebpDimensions(runtime)).toEqual({ width: 1920, height: 1080 });
    expect(statSync(runtimePath).size).toBeLessThanOrEqual(500 * 1024);
    expect(sha256(runtime)).not.toBe(historicalNhnRuntimeSha256);
  });

  it("runtime-facing TITLE source와 preview label에 NHN 제출 branding을 남기지 않는다", () => {
    const files = [
      resolve("index.html"),
      ...collectRuntimeFacingTextFiles(resolve("src")),
      ...collectRuntimeFacingTextFiles(resolve("public")),
    ];
    const residue = files.flatMap((path) => {
      const text = readFileSync(path, "utf8");
      return /NHN|NH-IN|HACKATHON/i.test(text) ? [path] : [];
    });

    expect(residue).toEqual([]);
    expect(readFileSync(scenePreviewPath, "utf8")).toContain(
      'label: "TITLE · OpenAI 제출본"',
    );
  });
});
