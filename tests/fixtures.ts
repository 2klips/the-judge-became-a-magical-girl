import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateGameData } from "../src/data/loader";
import type { GameData } from "../src/data/schema";

function readJson(relativePath: string): unknown {
  const url = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8")) as unknown;
}

export function loadFixtureData(): GameData {
  return validateGameData({
    scenario: readJson("../public/scenario/scenario.json"),
    characters: readJson("../public/scenario/characters.json"),
    config: readJson("../public/scenario/config.json"),
  });
}

export function rawFixture(): {
  scenario: unknown;
  characters: unknown;
  config: unknown;
} {
  return {
    scenario: readJson("../public/scenario/scenario.json"),
    characters: readJson("../public/scenario/characters.json"),
    config: readJson("../public/scenario/config.json"),
  };
}
