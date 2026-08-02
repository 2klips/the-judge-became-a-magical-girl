import { describe, expect, it } from "vitest";
import { characterErrorRate } from "../src/stt-lab/metrics";

describe("STT Lab CER", () => {
  it("공백과 문장부호를 제외하고 문자 오류율을 계산한다", () => {
    expect(characterErrorRate("안녕, 주노야!", "안녕 주노야")).toBe(0);
    expect(characterErrorRate("마법소녀", "마법소녀가")).toBeCloseTo(0.25);
  });
});
