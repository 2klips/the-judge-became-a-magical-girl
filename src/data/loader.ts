import type { ZodType } from "zod";
import {
  knownBackgroundIds,
  knownBgmIds,
  knownImageIds,
} from "../assets/catalog";
import { getConditionFlagNames, parseCondition } from "../engine/branch";
import {
  charactersSchema,
  configSchema,
  scenarioSchema,
  type GameData,
  type ScenarioNode,
} from "./schema";

export class GameDataError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("게임 데이터 검증에 실패했습니다.");
    this.name = "GameDataError";
    this.issues = issues;
  }
}

function parseDocument<T>(label: string, schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "문서 루트";
    return `${label} 검증 실패 — ${path}: ${issue.message}`;
  });
  throw new GameDataError(issues);
}

function nodeTargets(node: ScenarioNode): string[] {
  if (node.type === "cutscene" || node.type === "battle") {
    return [node.next];
  }
  if (node.type === "dialogue") {
    return [
      ...node.intents.flatMap((intent) => (intent.next ? [intent.next] : [])),
      ...node.exitOnMaxTurns.map((rule) =>
        "default" in rule ? rule.default : rule.next,
      ),
    ];
  }
  return node.type === "ending" && node.next ? [node.next] : [];
}

function validateReferences(data: GameData): string[] {
  const issues: string[] = [];
  const nodeIds = new Set<string>();
  const characterIds = new Set<string>();
  const globalFlags = new Set(data.config.allowedFlags);

  for (const character of data.characters) {
    if (characterIds.has(character.id)) {
      issues.push(`characters.json 캐릭터 ID 중복: ${character.id}`);
    }
    characterIds.add(character.id);
  }

  for (const node of data.scenario) {
    if (nodeIds.has(node.nodeId)) {
      issues.push(`scenario.json 노드 ID 중복: ${node.nodeId}`);
    }
    nodeIds.add(node.nodeId);
  }

  const requireNode = (source: string, target: string): void => {
    if (!nodeIds.has(target)) {
      issues.push(`${source}에서 존재하지 않는 next를 참조합니다: ${target}`);
    }
  };

  requireNode("config.startNodeId", data.config.startNodeId);
  requireNode("config.finalConvergenceNodeId", data.config.finalConvergenceNodeId);

  for (const node of data.scenario) {
    for (const target of nodeTargets(node)) {
      requireNode(node.nodeId, target);
    }

    if (!knownBackgroundIds.has(node.scene.bg)) {
      issues.push(
        `${node.nodeId}의 scene.bg가 에셋 계약에 없습니다: ${node.scene.bg}`,
      );
    }
    if (node.scene.bgm && !knownBgmIds.has(node.scene.bgm)) {
      issues.push(
        `${node.nodeId}의 scene.bgm이 에셋 계약에 없습니다: ${node.scene.bgm}`,
      );
    }

    if (node.type === "dialogue") {
      if (!characterIds.has(node.npc.id)) {
        issues.push(`${node.nodeId}의 npc.id가 characters.json에 없습니다: ${node.npc.id}`);
      }

      const nodeFlags = new Set(node.allowedFlags);
      const requiredEmotions = new Set([
        node.npc.startEmotion,
        ...node.intents.map((intent) => intent.npcEmotion),
      ]);
      for (const emotion of requiredEmotions) {
        const logicalId = `${node.npc.id}.${emotion}`;
        if (!knownImageIds.has(logicalId)) {
          issues.push(
            `${node.nodeId}의 캐릭터 에셋 계약이 없습니다: ${logicalId}`,
          );
        }
      }
      for (const flag of node.allowedFlags) {
        if (!globalFlags.has(flag)) {
          issues.push(`${node.nodeId}의 allowedFlags가 전역 사전에 없습니다: ${flag}`);
        }
      }
      for (const flag of Object.keys(node.openingByFlag ?? {})) {
        if (!globalFlags.has(flag)) {
          issues.push(`${node.nodeId}의 openingByFlag가 전역 사전에 없습니다: ${flag}`);
        }
      }

      for (const intent of node.intents) {
        for (const flag of intent.setFlags) {
          if (!nodeFlags.has(flag)) {
            issues.push(`${node.nodeId}.${intent.id}가 화이트리스트 밖 플래그를 사용합니다: ${flag}`);
          }
        }
      }

      for (const rule of node.exitOnMaxTurns) {
        if (!("if" in rule)) {
          continue;
        }
        try {
          parseCondition(rule.if);
          for (const flag of getConditionFlagNames(rule.if)) {
            if (!globalFlags.has(flag)) {
              issues.push(`${node.nodeId} 분기 조건의 플래그가 전역 사전에 없습니다: ${flag}`);
            }
          }
        } catch (error) {
          issues.push(
            `${node.nodeId} 분기 조건 오류: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    if (node.type === "cutscene" || node.type === "ending") {
      for (const line of node.lines) {
        if (
          line.speaker !== "narration" &&
          line.speaker !== "voice" &&
          !characterIds.has(line.speaker)
        ) {
          issues.push(`${node.nodeId} 대사 화자가 characters.json에 없습니다: ${line.speaker}`);
        }
      }
    }

    if (node.type === "cutscene") {
      for (const [flag, lines] of Object.entries(node.linesByFlag ?? {})) {
        if (!globalFlags.has(flag)) {
          issues.push(`${node.nodeId}의 linesByFlag가 전역 사전에 없습니다: ${flag}`);
        }
        for (const line of lines) {
          if (
            line.speaker !== "narration" &&
            line.speaker !== "voice" &&
            !characterIds.has(line.speaker)
          ) {
            issues.push(`${node.nodeId}.${flag} 대사 화자가 characters.json에 없습니다: ${line.speaker}`);
          }
        }
      }
    }

    if (node.type === "cutscene" && node.incantationGate) {
      if (!globalFlags.has("perfect_transform")) {
        issues.push(`${node.nodeId} 변신 게이트에 필요한 전역 플래그가 없습니다: perfect_transform`);
      }
      for (const line of node.incantationGate.failLines) {
        if (line.speaker !== "narration" && !characterIds.has(line.speaker)) {
          issues.push(`${node.nodeId} failLines 화자가 characters.json에 없습니다: ${line.speaker}`);
        }
      }
      for (const logicalId of ["transform.cast", "transform.complete"]) {
        if (!knownImageIds.has(logicalId)) {
          issues.push(`${node.nodeId} 변신 에셋 계약이 없습니다: ${logicalId}`);
        }
      }
    }

    if (node.type === "battle") {
      for (const gradeFlag of ["battle_S", "battle_A", "battle_B"]) {
        if (!globalFlags.has(gradeFlag)) {
          issues.push(`${node.nodeId} 전투 등급에 필요한 전역 플래그가 없습니다: ${gradeFlag}`);
        }
      }
      for (const logicalId of [
        `${node.enemy.id}.normal`,
        `${node.enemy.id}.weakened`,
        "doyun.magical",
      ]) {
        if (!knownImageIds.has(logicalId)) {
          issues.push(`${node.nodeId} 전투 에셋 계약이 없습니다: ${logicalId}`);
        }
      }
      if (node.storyFlow) {
        const phaseIds = new Set(node.phases.map(({ phaseId }) => phaseId));
        for (const [flag, order] of Object.entries(node.storyFlow.phaseOrderByFlag)) {
          if (!globalFlags.has(flag)) {
            issues.push(`${node.nodeId}의 phase order 플래그가 전역 사전에 없습니다: ${flag}`);
          }
          for (const phaseId of order) {
            if (!phaseIds.has(phaseId)) {
              issues.push(`${node.nodeId}의 phase order가 없는 phase를 참조합니다: ${phaseId}`);
            }
          }
        }
        for (const flag of [
          ...node.storyFlow.secondSpell.eligibleFlags,
          node.storyFlow.secondSpell.opportunityFlag,
          ...Object.values(node.storyFlow.secondSpell.usedPhaseFlags),
        ]) {
          if (!globalFlags.has(flag)) {
            issues.push(`${node.nodeId}의 storyFlow 플래그가 전역 사전에 없습니다: ${flag}`);
          }
        }
      }
    }
  }

  if (nodeIds.has(data.config.startNodeId)) {
    const visited = new Set<string>();
    const queue = [data.config.startNodeId];
    const nodeMap = new Map(data.scenario.map((node) => [node.nodeId, node]));
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId || visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (node) {
        queue.push(...nodeTargets(node));
      }
    }

    for (const endingId of ["good", "normal", "bad"] as const) {
      const ending = data.scenario.find(
        (node) => node.type === "ending" && node.endingId === endingId,
      );
      if (!ending) {
        issues.push(`필수 ${endingId.toUpperCase()} ending 노드가 없습니다.`);
      } else if (!visited.has(ending.nodeId)) {
        issues.push(`시작 노드에서 ${endingId.toUpperCase()} ending에 도달할 수 없습니다.`);
      }
    }
  }

  return issues;
}

export function validateGameData(input: {
  scenario: unknown;
  characters: unknown;
  config: unknown;
}): GameData {
  const data: GameData = {
    scenario: parseDocument("scenario.json", scenarioSchema, input.scenario),
    characters: parseDocument("characters.json", charactersSchema, input.characters),
    config: parseDocument("config.json", configSchema, input.config),
  };

  const issues = validateReferences(data);
  if (issues.length > 0) {
    throw new GameDataError(issues);
  }
  return data;
}

async function fetchJson(path: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(`${import.meta.env.BASE_URL}scenario/${path}`);
  if (!response.ok) {
    throw new GameDataError([
      `${path}을 불러오지 못했습니다. HTTP ${response.status}`,
    ]);
  }
  try {
    return await response.json();
  } catch {
    throw new GameDataError([`${path}이 올바른 JSON이 아닙니다.`]);
  }
}

export async function loadGameData(fetcher: typeof fetch = fetch): Promise<GameData> {
  const [scenario, characters, config] = await Promise.all([
    fetchJson("scenario.json", fetcher),
    fetchJson("characters.json", fetcher),
    fetchJson("config.json", fetcher),
  ]);
  return validateGameData({ scenario, characters, config });
}
