import {
  parseStateSnapshot,
  serializeState,
  type GameState,
} from "../state";

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadResult {
  state: GameState | null;
  warning: string | null;
}

export class SaveRepository {
  constructor(
    private readonly storage: StoragePort,
    private readonly key: string,
    private readonly allowedFlags: ReadonlySet<string>,
    private readonly knownNodeIds: ReadonlySet<string>,
  ) {}

  save(state: GameState): void {
    this.storage.setItem(this.key, JSON.stringify(serializeState(state)));
  }

  load(): LoadResult {
    const raw = this.storage.getItem(this.key);
    if (raw === null) {
      return { state: null, warning: null };
    }
    try {
      const state = parseStateSnapshot(
        JSON.parse(raw) as unknown,
        this.allowedFlags,
        this.knownNodeIds,
      );
      if (!state) {
        return {
          state: null,
          warning: "저장 데이터가 손상되었거나 버전이 달라 새 게임으로 시작할 수 있습니다.",
        };
      }
      return { state, warning: null };
    } catch {
      return {
        state: null,
        warning: "저장 데이터가 올바른 JSON이 아니어서 새 게임으로 시작할 수 있습니다.",
      };
    }
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }
}
