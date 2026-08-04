import { describe, expect, it } from "vitest";
import { qaPreviewStatusText } from "../src/qaPreview";

describe("공개 QA 상태 배너", () => {
  it("GPT STT Worker 활성 상태와 배포 commit을 표시한다", () => {
    expect(qaPreviewStatusText("1234567890")).toBe(
      "QA PREVIEW · 타이틀 마이크 테스트 필수 · GPT STT Worker 활성 · 클릭·오프라인 폴백 · commit 1234567",
    );
  });
});
