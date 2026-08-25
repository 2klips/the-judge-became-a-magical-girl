import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

if (args.includes("--help")) {
  console.log("Usage: npm run qa:dialogue-matrix -- --base-url http://127.0.0.1:8787");
  process.exit(0);
}

const baseUrl = argValue("--base-url", "http://127.0.0.1:8787");
const scenario = JSON.parse(await readFile(new URL("../public/scenario/scenario.json", import.meta.url)));
const characters = JSON.parse(await readFile(new URL("../public/scenario/characters.json", import.meta.url)));
const juno = characters.find((character) => character.id === "juno");

if (!juno) throw new Error("characters.json에서 juno를 찾지 못했습니다.");

const cases = [
  ["n2_juno_intro", "내가 왜 그래야 돼?"],
  ["n2_juno_intro", "이거 수당은 나와?"],
  ["n2_juno_intro", "남자인데 마법소녀가 돼도 괜찮아?"],
  ["n2_juno_intro", "그래서 지금 어떻게 하면 돼?"],
  ["n2_juno_followup", "너는 누구야?"],
  ["n2_juno_followup", "왜 하필 나를 골랐는데?"],
  ["n2_juno_followup", "어디로 움직이는데?"],
  ["n2_juno_followup", "설명 말고 빨리 끝내자."],
  ["n3_wraith_choice", "얘는 왜 나타난 거야?"],
  ["n3_wraith_choice", "누굴 먼저 지켜야 해?"],
  ["n3_wraith_choice", "어떻게 막아?"],
  ["n3_wraith_choice", "난 빠질래. 다른 사람 찾아."],
  ["n6_first_choice", "정면으로 먼저 맞서자."],
  ["n6_first_choice", "사람과 게임부터 지킬게."],
  ["n6_first_choice", "둘 다 해야지. 사람부터 지키고 망령도 막자."],
  ["n6_first_choice", "뭘 먼저 해야 하는데?"],
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

function assertReply(nodeId, transcript, result) {
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
  if (/어디/u.test(transcript) && /왜\s*(?:이동|움직)|선택\s*이유/u.test(result.reply)) {
    throw new Error(`장소 질문 문맥 불일치: ${result.reply}`);
  }
}

let passed = 0;
for (const [nodeId, transcript] of cases) {
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
  assertReply(nodeId, transcript, result);
  passed += 1;
  console.log(`[PASS] ${nodeId} | ${transcript}`);
  console.log(`       ${result.intentId} | ${result.reply}`);
}

console.log(`Dialogue QA matrix: ${passed}/${cases.length} PASS`);
