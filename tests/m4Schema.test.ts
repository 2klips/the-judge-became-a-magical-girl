import { describe, expect, it } from "vitest";
import { GameDataError, validateGameData } from "../src/data/loader";
import { rawFixture } from "./fixtures";

function m4Input(): ReturnType<typeof rawFixture> {
  const input = rawFixture();
  return {
    scenario: structuredClone(input.scenario),
    characters: structuredClone(input.characters),
    config: structuredClone(input.config),
  };
}

describe("M4 시나리오 경계 검증", () => {
  it("변신 게이트와 3페이즈 battle 계약을 허용한다", () => {
    let data;
    try {
      data = validateGameData(m4Input());
    } catch (error) {
      throw new Error((error as GameDataError).issues.join("\n"));
    }
    expect(data.scenario.some((node) => node.type === "battle")).toBe(true);
  });

  it("battle 페이즈가 정확히 3개가 아니면 차단한다", () => {
    const input = m4Input();
    const battle = (input.scenario as Array<Record<string, unknown>>).find(
      (node) => node.type === "battle",
    ) as {
      phases: unknown[];
    };
    battle.phases.pop();

    expect(() => validateGameData(input)).toThrow(GameDataError);
  });

  it("minMatch가 키워드 수보다 크면 위치를 포함해 차단한다", () => {
    const input = m4Input();
    const battle = (input.scenario as Array<Record<string, unknown>>).find(
      (node) => node.type === "battle",
    ) as {
      phases: Array<{ spell: { minMatch: number } }>;
    };
    battle.phases[0]!.spell.minMatch = 4;

    try {
      validateGameData(input);
      throw new Error("검증이 실패해야 합니다.");
    } catch (error) {
      expect((error as GameDataError).issues.join(" ")).toContain("minMatch");
    }
  });

  it("페이즈 턴 상한이 3을 넘으면 차단한다", () => {
    const input = m4Input();
    const battle = (input.scenario as Array<Record<string, unknown>>).find(
      (node) => node.type === "battle",
    ) as {
      phases: Array<{ maxTurns: number }>;
    };
    battle.phases[0]!.maxTurns = 4;

    expect(() => validateGameData(input)).toThrow(GameDataError);
  });
});
