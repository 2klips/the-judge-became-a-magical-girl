import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

if (args.includes("--help")) {
  console.log(
    "Usage: npm run qa:dialogue-matrix -- --base-url http://127.0.0.1:8787 [--start-index 0] [--end-index 16] [--delay-ms 9000]",
  );
  process.exit(0);
}

const baseUrl = argValue("--base-url", "http://127.0.0.1:8787");
const delayMs = Number(argValue("--delay-ms", "9000"));
const startIndex = Number(argValue("--start-index", "0"));
const scenario = JSON.parse(await readFile(new URL("../public/scenario/scenario.json", import.meta.url)));
const characters = JSON.parse(await readFile(new URL("../public/scenario/characters.json", import.meta.url)));
const juno = characters.find((character) => character.id === "juno");

if (!juno) throw new Error("characters.json에서 juno를 찾지 못했습니다.");

const cases = [
  { nodeId: "n2_juno_intro", transcript: "내가 왜 그래야 돼?", expectedIntent: "realistic_objection" },
  { nodeId: "n2_juno_intro", transcript: "이거 수당은 나와?", expectedIntent: "realistic_objection" },
  { nodeId: "n2_juno_intro", transcript: "남자인데 마법소녀가 돼도 괜찮아?", expectedIntent: "realistic_objection" },
  { nodeId: "n2_juno_intro", transcript: "그래서 지금 어떻게 하면 돼?", expectedIntent: "curious_magic", replyPattern: /사무실\s*안쪽|이동|따라/u },
  { nodeId: "n2_juno_followup", transcript: "너는 누구야?", expectedIntent: "ask_identity" },
  { nodeId: "n2_juno_followup", transcript: "왜 하필 나를 골랐는데?", expectedIntent: "ask_why_chosen" },
  { nodeId: "n2_juno_followup", transcript: "어디로 움직이는데?", expectedIntent: "ask_identity", replyPattern: /사무실\s*안쪽/u },
  { nodeId: "n2_juno_followup", transcript: "설명 말고 빨리 끝내자.", expectedIntent: "stay_cold" },
  { nodeId: "n3_wraith_choice", transcript: "얘는 왜 나타난 거야?", expectedIntent: "seek_method", replyPattern: /기대|마음|체념|망령/u },
  { nodeId: "n3_wraith_choice", transcript: "누굴 먼저 지켜야 해?", expectedIntent: "protect_others", replyPattern: /직원|사람|게임/u },
  { nodeId: "n3_wraith_choice", transcript: "어떻게 막아?", expectedIntent: "seek_method", replyPattern: /변신|막|지키|맞서/u },
  { nodeId: "n3_wraith_choice", transcript: "난 빠질래. 다른 사람 찾아.", expectedIntent: "withdraw" },
  { nodeId: "n6_first_choice", transcript: "정면으로 먼저 맞서자.", expectedIntent: "attack_first" },
  { nodeId: "n6_first_choice", transcript: "사람과 게임부터 지킬게.", expectedIntent: "defend_first" },
  { nodeId: "n6_first_choice", transcript: "둘 다 해야지. 사람부터 지키고 망령도 막자.", expectedIntent: "protect_then_confront" },
  { nodeId: "n6_first_choice", transcript: "뭘 먼저 해야 하는데?" },
];

const metaPatterns = [
  /이건\s+.{0,30}묻는\s+거(?:네|야)/u,
  /(?:질문|의도)(?:를|는|이)?\s*(?:분류|정리|파악|확인)(?:해|하)/u,
  /(?:같이\s*)?(?:얘기|이야기)해\s*보자|(?:깔끔히\s*)?정리해\s*보자/u,
  /(?:맞설|막을|지킬|함께할)\s+연다/u,
];

function requestFor(nodeId, transcript) {
  const node = scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node || node.type !== "dialogue") throw new Error(`대화 node가 없습니다: ${nodeId}`);
  return {
    transcript,
    objective: node.objective,
    llmContext: node.llmContext,
    persona: {
      id: juno.id,
      name: juno.name,
      role: juno.role,
      traits: juno.traits,
      speechRules: juno.speechRules,
      taboos: juno.taboos,
      sampleLines: juno.sampleLines,
    },
    intents: node.intents.map(({ id, examples, keywords }) => ({ id, examples, keywords })),
    allowedFlags: node.allowedFlags,
    recentTurns: [],
  };
}

function assertReply(testCase, result) {
  const { nodeId, transcript, expectedIntent, replyPattern } = testCase;
  if (!result || typeof result.reply !== "string" || !result.reply.trim()) {
    throw new Error("빈 reply");
  }
  if (Array.from(result.reply).length > 80) throw new Error("reply 80자 초과");
  if (metaPatterns.some((pattern) => pattern.test(result.reply))) {
    throw new Error(`meta/evasive/malformed reply: ${result.reply}`);
  }
  const node = scenario.find((candidate) => candidate.nodeId === nodeId);
  if (!node.intents.some((intent) => intent.id === result.intentId)) {
    throw new Error(`허용되지 않은 intent: ${result.intentId}`);
  }
  if (expectedIntent && result.intentId !== expectedIntent) {
    throw new Error(`intent mismatch: ${result.intentId}, expected ${expectedIntent}`);
  }
  if (replyPattern && !replyPattern.test(result.reply)) {
    throw new Error(`scene-fact mismatch: ${result.reply}`);
  }
  if (/어디/u.test(transcript) && /왜\s*(?:이동|움직)|선택\s*이유/u.test(result.reply)) {
    throw new Error(`장소 질문 문맥 불일치: ${result.reply}`);
  }
}

const endIndex = Number(argValue("--end-index", String(cases.length)));
let passed = 0;
const activeCases = cases.slice(startIndex, endIndex);
for (const [offset, testCase] of activeCases.entries()) {
  const { nodeId, transcript } = testCase;
  if (offset > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  const response = await fetch(new URL("/judge/dialogue", baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:5173",
    },
    body: JSON.stringify(requestFor(nodeId, transcript)),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${nodeId} / ${transcript}: HTTP ${response.status} ${result.error ?? ""}`);
  assertReply(testCase, result);
  passed += 1;
  console.log(`[PASS] ${nodeId} | ${transcript}`);
  console.log(`       ${result.intentId} | ${result.reply}`);
}

console.log(
  `Dialogue QA matrix: ${passed}/${activeCases.length} PASS (indexes ${startIndex}-${endIndex - 1})`,
);
