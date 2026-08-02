import { describe, expect, it } from "vitest";
import { GameDataError, validateGameData } from "../src/data/loader";
import { loadFixtureData, rawFixture } from "./fixtures";

describe("시나리오 zod·참조 검증", () => {
  it("저장소의 실제 M4 JSON을 검증한다", () => {
    const data = loadFixtureData();
    expect(data.scenario).toHaveLength(11);
    expect(data.characters[0]?.id).toBe("juno");
  });

  it("필수 clickLabel 누락을 한국어 진단으로 차단한다", () => {
    const input = rawFixture();
    const scenario = structuredClone(input.scenario) as Array<Record<string, unknown>>;
    const dialogue = scenario.find((node) => node.type === "dialogue") as {
      intents: Array<Record<string, unknown>>;
    };
    delete dialogue.intents[0]?.clickLabel;

    expect(() => validateGameData({ ...input, scenario })).toThrow(GameDataError);
    try {
      validateGameData({ ...input, scenario });
    } catch (error) {
      expect((error as GameDataError).issues.join(" ")).toContain("scenario.json 검증 실패");
    }
  });

  it("존재하지 않는 next를 검출한다", () => {
    const input = rawFixture();
    const scenario = structuredClone(input.scenario) as Array<Record<string, unknown>>;
    const prologue = scenario[0] as Record<string, unknown>;
    prologue.next = "missing_node";

    expect(() => validateGameData({ ...input, scenario })).toThrow(
      "게임 데이터 검증에 실패했습니다.",
    );
    try {
      validateGameData({ ...input, scenario });
    } catch (error) {
      expect((error as GameDataError).issues.join(" ")).toContain("존재하지 않는 next");
    }
  });

  it("존재하지 않는 캐릭터 ID를 검출한다", () => {
    const input = rawFixture();
    const scenario = structuredClone(input.scenario) as Array<Record<string, unknown>>;
    const dialogue = scenario.find((node) => node.type === "dialogue") as {
      npc: Record<string, unknown>;
    };
    dialogue.npc.id = "unknown";

    try {
      validateGameData({ ...input, scenario });
      throw new Error("검증이 실패해야 합니다.");
    } catch (error) {
      expect((error as GameDataError).issues.join(" ")).toContain(
        "characters.json에 없습니다",
      );
    }
  });

  it("intent의 화이트리스트 밖 플래그를 검출한다", () => {
    const input = rawFixture();
    const scenario = structuredClone(input.scenario) as Array<Record<string, unknown>>;
    const dialogue = scenario.find((node) => node.type === "dialogue") as {
      intents: Array<{ setFlags: string[] }>;
    };
    dialogue.intents[0]?.setFlags.push("invented_flag");

    try {
      validateGameData({ ...input, scenario });
      throw new Error("검증이 실패해야 합니다.");
    } catch (error) {
      expect((error as GameDataError).issues.join(" ")).toContain(
        "화이트리스트 밖 플래그",
      );
    }
  });
});
