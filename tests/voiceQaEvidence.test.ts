import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createVoiceQaFailureEvidence,
  createVoiceQaSuccessEvidence,
  formatVoiceQaClippingRatio,
  formatVoiceQaDbfs,
  summarizeVoiceQaKeywordMatches,
} from "../src/input/voiceQaEvidence";

const gameViewSource = readFileSync(new URL("../src/ui/gameView.ts", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const stateSource = readFileSync(new URL("../src/state.ts", import.meta.url), "utf8");

describe("QA voice evidence", () => {
  it("preserves transcript, four ordered keyword matches, and actual level metrics", () => {
    const evidence = createVoiceQaSuccessEvidence({
      surface: "incantation",
      observation: {
        text: "설렘아 잠든 마음을 깨워 줘 해피 플레이",
        model: "gpt-realtime-2.1-mini",
        roundTripMs: 842,
        upstreamMs: 610,
        firstDeltaMs: 224,
      },
      audioLevel: {
        rmsDbfs: -21.24,
        peakDbfs: -3.76,
        clippingRatio: 0.01234,
      },
      requiredKeywords: ["설렘", "잠든 마음", "해피 플레이", "매지컬 체인지"],
      matchedKeywords: ["설렘", "잠든 마음", "해피 플레이"],
    });

    expect(evidence).toMatchObject({
      kind: "success",
      surface: "incantation",
      transcript: "설렘아 잠든 마음을 깨워 줘 해피 플레이",
      model: "gpt-realtime-2.1-mini",
      rmsDbfs: -21.24,
      peakDbfs: -3.76,
      clippingRatio: 0.01234,
      keywordMatches: [
        { keyword: "설렘", matched: true },
        { keyword: "잠든 마음", matched: true },
        { keyword: "해피 플레이", matched: true },
        { keyword: "매지컬 체인지", matched: false },
      ],
    });
    expect(summarizeVoiceQaKeywordMatches(evidence.keywordMatches)).toBe("3/4");
    expect(formatVoiceQaDbfs(evidence.rmsDbfs)).toBe("-21.2 dBFS");
    expect(formatVoiceQaDbfs(evidence.peakDbfs)).toBe("-3.8 dBFS");
    expect(formatVoiceQaClippingRatio(evidence.clippingRatio)).toBe("1.23%");
  });

  it("failure evidence drops raw debug text and retains only safe kind/status", () => {
    const failure = createVoiceQaFailureEvidence("battle", {
      kind: "http",
      httpStatus: 503,
      debugMessage: "Realtime 음성 요청 실패 (503): secret upstream body",
    });

    expect(failure).toEqual({
      kind: "failure",
      surface: "battle",
      failureKind: "http",
      httpStatus: 503,
    });
    expect(JSON.stringify(failure)).not.toContain("secret upstream body");
  });

  it("wires ephemeral evidence only to QA debug presentation, never GameState", () => {
    expect(gameViewSource).toContain('import.meta.env.MODE === "qa" && this.debugEnabled');
    expect(gameViewSource).toContain("recordVoiceQaEvidence");
    expect(gameViewSource).toContain("voice-qa-keyword-list");
    expect(mainSource).toContain("createVoiceQaSuccessEvidence");
    expect(mainSource).toContain("createVoiceQaFailureEvidence");
    expect(stateSource).not.toContain("VoiceQaEvidence");
  });
});
