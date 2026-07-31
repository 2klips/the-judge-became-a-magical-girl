import type { ExitRule } from "../data/schema";

export interface BranchState {
  affinity: number;
  flags: ReadonlySet<string>;
}

type ComparisonOperator = ">=" | "<=" | ">" | "<" | "==" | "!=";

type ConditionTerm =
  | { kind: "affinity"; operator: ComparisonOperator; value: number }
  | { kind: "flag"; name: string };

const affinityPattern = /^(affinity)\s*(>=|<=|==|!=|>|<)\s*(\d{1,3})$/;
const flagPattern = /^flags\.([a-z][a-z0-9_]*)$/;

export function parseCondition(condition: string): ConditionTerm[] {
  const rawTerms = condition.split("&&").map((term) => term.trim());
  if (rawTerms.length === 0 || rawTerms.some((term) => term.length === 0)) {
    throw new Error(`허용되지 않은 분기 조건식: ${condition}`);
  }

  return rawTerms.map((term) => {
    const affinityMatch = affinityPattern.exec(term);
    if (affinityMatch) {
      const operator = affinityMatch[2] as ComparisonOperator;
      const value = Number(affinityMatch[3]);
      if (value < 0 || value > 100) {
        throw new Error(`affinity 비교값은 0~100이어야 합니다: ${term}`);
      }
      return { kind: "affinity", operator, value };
    }

    const flagMatch = flagPattern.exec(term);
    if (flagMatch?.[1]) {
      return { kind: "flag", name: flagMatch[1] };
    }

    throw new Error(`허용되지 않은 분기 조건식: ${condition}`);
  });
}

export function getConditionFlagNames(condition: string): string[] {
  return parseCondition(condition)
    .filter((term): term is Extract<ConditionTerm, { kind: "flag" }> => term.kind === "flag")
    .map((term) => term.name);
}

function compare(left: number, operator: ComparisonOperator, right: number): boolean {
  switch (operator) {
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case "<":
      return left < right;
    case "==":
      return left === right;
    case "!=":
      return left !== right;
  }
}

export function evaluateCondition(condition: string, state: BranchState): boolean {
  return parseCondition(condition).every((term) => {
    if (term.kind === "flag") {
      return state.flags.has(term.name);
    }
    return compare(state.affinity, term.operator, term.value);
  });
}

export function selectExit(rules: ExitRule[], state: BranchState): string {
  for (const rule of rules) {
    if ("default" in rule) {
      return rule.default;
    }
    if (evaluateCondition(rule.if, state)) {
      return rule.next;
    }
  }
  throw new Error("분기표에 default 행선지가 없습니다.");
}
