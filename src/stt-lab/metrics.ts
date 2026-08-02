const IGNORED_CHARACTERS = /[\p{White_Space}\p{Punctuation}\p{Symbol}]/gu;

function normalizeForCer(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("ko-KR").replace(IGNORED_CHARACTERS, "");
}

export function characterErrorRate(reference: string, hypothesis: string): number {
  const expected = Array.from(normalizeForCer(reference));
  const actual = Array.from(normalizeForCer(hypothesis));
  const previous = Array.from({ length: actual.length + 1 }, (_, index) => index);

  for (let expectedIndex = 1; expectedIndex <= expected.length; expectedIndex += 1) {
    const current = [expectedIndex];
    for (let actualIndex = 1; actualIndex <= actual.length; actualIndex += 1) {
      const substitutionCost = expected[expectedIndex - 1] === actual[actualIndex - 1] ? 0 : 1;
      current[actualIndex] = Math.min(
        (current[actualIndex - 1] ?? 0) + 1,
        (previous[actualIndex] ?? 0) + 1,
        (previous[actualIndex - 1] ?? 0) + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return (previous[actual.length] ?? 0) / Math.max(1, expected.length);
}
