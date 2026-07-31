import { describe, expect, it } from "vitest";
import { SaveRepository, type StoragePort } from "../src/storage/saveRepository";
import { createInitialGameState } from "../src/state";
import { loadFixtureData } from "./fixtures";

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("SaveRepository", () => {
  it("상태를 JSON으로 저장하고 복구한다", () => {
    const data = loadFixtureData();
    const storage = new MemoryStorage();
    const repository = new SaveRepository(
      storage,
      "save",
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map((node) => node.nodeId)),
    );
    const state = createInitialGameState(data.config);
    state.flags.add("promise");
    repository.save(state);

    const loaded = repository.load();
    expect(loaded.warning).toBeNull();
    expect(loaded.state?.flags.has("promise")).toBe(true);
  });

  it("손상 JSON을 예외 없이 거부하고 새 게임 안내를 반환한다", () => {
    const data = loadFixtureData();
    const storage = new MemoryStorage();
    const repository = new SaveRepository(
      storage,
      "save",
      new Set(data.config.allowedFlags),
      new Set(data.scenario.map((node) => node.nodeId)),
    );
    storage.setItem("save", "{broken");

    const loaded = repository.load();
    expect(loaded.state).toBeNull();
    expect(loaded.warning).toContain("올바른 JSON이 아니어서");
  });
});
