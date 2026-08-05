import { describe, expect, it } from "vitest";
import { qaPreviewCommitId } from "../src/qaPreview";

describe("공개 QA 비시각 식별자", () => {
  it("상단 배너 없이 DOM에서 확인할 7자 commit을 정규화한다", () => {
    expect(qaPreviewCommitId("1234567890")).toBe("1234567");
    expect(qaPreviewCommitId("  abcdefg  ")).toBe("abcdefg");
    expect(qaPreviewCommitId()).toBeUndefined();
  });
});
