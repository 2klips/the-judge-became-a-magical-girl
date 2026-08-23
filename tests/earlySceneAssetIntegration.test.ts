import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveBackgroundAsset,
  resolveImageAsset,
} from "../src/assets/catalog";
import {
  DIRECT_WISH_PROMPT_TEXT,
  resolveEarlySceneBackground,
  shouldHideDialogueOpeningForBakedPrompt,
} from "../src/assets/earlyScenePresentation";
import { compositionForContext } from "../src/ui/sceneComposition";

const gameViewSource = readFileSync(resolve("src", "ui", "gameView.ts"), "utf8");
const mainSource = readFileSync(resolve("src", "main.ts"), "utf8");
const vnCssSource = readFileSync(resolve("src", "ui", "vn.css"), "utf8");
const deliveryDirectory = resolve("assets", "source", "early-scene-2026-08-22", "delivery");

function readPngDimensions(file: Buffer): { width: number; height: number } {
  expect(file.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) };
}

function readWebpDimensions(file: Buffer): { width: number; height: number } {
  expect(file.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(file.subarray(8, 12).toString("ascii")).toBe("WEBP");
  let offset = 12;
  while (offset + 8 <= file.length) {
    const type = file.subarray(offset, offset + 4).toString("ascii");
    const size = file.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === "VP8X") {
      return {
        width: 1 + file.readUIntLE(data + 4, 3),
        height: 1 + file.readUIntLE(data + 7, 3),
      };
    }
    if (type === "VP8 ") {
      return {
        width: file.readUInt16LE(data + 6) & 0x3fff,
        height: file.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    offset = data + size + (size % 2);
  }
  throw new Error("WebP dimension chunk not found");
}

describe("2026-08-22 early-scene human-approved assets", () => {
  it("registers the two Doyun poses and two monitor cuts with canonical paths", () => {
    expect(resolveImageAsset("doyun.normal_suspicious")).toBe(
      "assets/char/char_doyun_normal_suspicious.png",
    );
    expect(resolveImageAsset("doyun.employee_id_surprised")).toBe(
      "assets/char/char_doyun_employee_id_surprised.png",
    );
    expect(resolveBackgroundAsset("cut.juno_monitor_emerge")?.primaryPath).toBe(
      "assets/cut/cut_juno_monitor_emerge.webp",
    );
    expect(resolveBackgroundAsset("cut.monitor_direct_wish_prompt")?.primaryPath).toBe(
      "assets/cut/cut_monitor_direct_wish_prompt.webp",
    );
  });

  it("keeps source delivery and runtime bytes identical at the canonical dimensions", () => {
    for (const filename of [
      "char_doyun_normal_suspicious.png",
      "char_doyun_employee_id_surprised.png",
    ]) {
      const source = readFileSync(resolve(deliveryDirectory, "char", filename));
      const runtime = readFileSync(resolve("assets", "runtime", "char", filename));
      expect(runtime.equals(source), filename).toBe(true);
      expect(readPngDimensions(runtime), filename).toEqual({ width: 1200, height: 2000 });
      expect(runtime.includes(Buffer.from("tRNS")), `${filename} transparency`).toBe(true);
      expect(statSync(resolve("assets", "runtime", "char", filename)).size).toBeLessThanOrEqual(
        800 * 1024,
      );
    }
    for (const filename of [
      "cut_juno_monitor_emerge.webp",
      "cut_monitor_direct_wish_prompt.webp",
    ]) {
      const source = readFileSync(resolve(deliveryDirectory, "cut", filename));
      const runtime = readFileSync(resolve("assets", "runtime", "cut", filename));
      expect(runtime.equals(source), filename).toBe(true);
      expect(readWebpDimensions(runtime), filename).toEqual({ width: 1920, height: 1080 });
      expect(statSync(resolve("assets", "runtime", "cut", filename)).size).toBeLessThanOrEqual(
        700 * 1024,
      );
    }
  });

  it("uses the baked prompt once while retaining an accessible semantic equivalent", () => {
    expect(DIRECT_WISH_PROMPT_TEXT).toBe("지금 가장 원하는 것을 직접 말해주세요!");
    expect(resolveEarlySceneBackground("n0_review", 5)).toBe(
      "cut.monitor_direct_wish_prompt",
    );
    expect(resolveEarlySceneBackground("n1_first_voice")).toBe(
      "cut.monitor_direct_wish_prompt",
    );
    expect(shouldHideDialogueOpeningForBakedPrompt("n1_first_voice")).toBe(true);
    expect(gameViewSource).toContain("early-scene-prompt-semantic visually-hidden");
    expect(gameViewSource).toContain("vn-baked-prompt-shell");
  });

  it("renders the Juno emergence as a solo cut before N2 without live actors", () => {
    expect(compositionForContext("n1_juno_monitor_emerge")).toMatchObject({
      preset: "solo-cut",
      mode: "cut",
      actors: {},
    });
    expect(gameViewSource).toContain("renderJunoMonitorEmergence");
    expect(gameViewSource).toContain('shell.dataset.cutLogicalId = "cut.juno_monitor_emerge"');
    expect(mainSource).toMatch(
      /node\.nodeId === "n1_first_voice"[\s\S]*?renderJunoMonitorEmergence\([\s\S]*?renderCurrent\(\)/,
    );
    expect(vnCssSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?juno-monitor-emergence-cut[\s\S]*?animation:\s*none/s,
    );
  });

  it("places narration progress at the visual bottom-right edge without boxing it", () => {
    expect(vnCssSource).toMatch(
      /vn-dialogue-shell--narration[^}]*\.vn-advance\s*\{[^}]*position:\s*absolute;[^}]*right:[^;]+;[^}]*bottom:/s,
    );
    expect(vnCssSource).toMatch(/vn-dialogue-shell--narration[^}]*padding-bottom:/s);
  });

  it("anchors only the direct-wish cut progress control above the bottom center", () => {
    expect(vnCssSource).toMatch(
      /\.direct-wish-prompt-cut\s+\.early-scene-cut-controls\s*\{[^}]*left:\s*50%;[^}]*right:\s*auto;[^}]*bottom:\s*clamp\(56px,\s*7vh,\s*80px\);[^}]*transform:\s*translateX\(-50%\);/s,
    );
    expect(vnCssSource).not.toMatch(
      /\.juno-monitor-emergence-cut\s+\.early-scene-cut-controls[^}]*left:\s*50%/s,
    );
  });
});
