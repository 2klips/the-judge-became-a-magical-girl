import { describe, expect, it } from "vitest";
import { resolvePresentationBackground } from "../src/assets/presentationBackground";
import { resolveBackgroundTransition } from "../src/ui/gameView";

describe("M5 장면 배경 presentation 계약", () => {
  it("같은 배경은 정지하고 실제 ID가 바뀔 때만 전환한다", () => {
    expect(resolveBackgroundTransition(null, "bg_title")).toBe("initial");
    expect(resolveBackgroundTransition("bg_hall_day", "bg_hall_day")).toBe("same");
    expect(resolveBackgroundTransition("bg_hall_day", "bg_hall_dark")).toBe("change");
  });

  it("N0 첫 도입만 사무실 전경이고 평가표가 시작되면 책상으로 전환한다", () => {
    expect(
      resolvePresentationBackground({
        kind: "node",
        nodeId: "n0_review",
        baseBackground: "bg_hall_day",
        lineIndex: 0,
      }),
    ).toBe("bg_office_wide");
    expect(
      resolvePresentationBackground({
        kind: "node",
        nodeId: "n0_review",
        baseBackground: "bg_hall_day",
        lineIndex: 1,
      }),
    ).toBe("bg_hall_day");
  });

  it("N1 첫 목소리는 주노 공개 전 시간정지 책상을 사용한다", () => {
    expect(
      resolvePresentationBackground({
        kind: "node",
        nodeId: "n1_first_voice",
        baseBackground: "bg_hall_day",
      }),
    ).toBe("bg_hall_time_stop");
  });

  it("N5는 도입에서 사원증·주문·변신 결과 순으로 배경을 교체한다", () => {
    const baseCue = {
      kind: "node" as const,
      nodeId: "n5_transform",
      baseBackground: "bg_hall_dark",
    };

    expect(resolvePresentationBackground({ ...baseCue, lineIndex: 0 })).toBe(
      "bg_hall_dark",
    );
    expect(resolvePresentationBackground({ ...baseCue, lineIndex: 1 })).toBe(
      "bg_desk_closeup",
    );
    expect(
      resolvePresentationBackground({ ...baseCue, stage: "incantation" }),
    ).toBe("bg_desk_closeup");
    expect(
      resolvePresentationBackground({ ...baseCue, stage: "transformation" }),
    ).toBe("bg_transform_space");
  });

  it("battle은 방어·공격 2개 주문 배경을 사용한다", () => {
    const resolveBattle = (
      phaseId: string,
      beat: "prompt" | "spell" = "prompt",
    ): string =>
      resolvePresentationBackground({
        kind: "battle",
        phaseId,
        beat,
        baseBackground: "bg_hall_void",
      });

    expect(resolveBattle("p1_defend")).toBe("bg_battle_wide");
    expect(resolveBattle("p2_attack")).toBe("bg_hall_void");
  });

  it("엔딩은 결과별 책상과 독립 post-credit 복도를 구분한다", () => {
    const resolveEnding = (endingId: string, lineIndex: number): string =>
      resolvePresentationBackground({
        kind: "ending",
        endingId,
        lineIndex,
        baseBackground: "bg_hall_day",
      });

    expect(resolveEnding("good", 0)).toBe("bg_hall_good");
    expect(resolveEnding("good", 4)).toBe("bg_hall_good");
    expect(resolveEnding("good", 5)).toBe("bg_hall_good");
    expect(resolveEnding("hidden", 0)).toBe("bg_hall_good");
    expect(resolveEnding("post_credit", 0)).toBe("bg_corridor_blacklight");
    expect(resolveEnding("normal", 0)).toBe("bg_hall_normal");
    expect(resolveEnding("bad", 0)).toBe("bg_hall_bad");
  });
});
