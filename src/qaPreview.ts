interface QaPreviewBannerOptions {
  commit?: string;
}

export function installQaPreviewBanner({ commit }: QaPreviewBannerOptions): void {
  document.documentElement.dataset.qaPreview = "true";

  const banner = document.createElement("div");
  banner.className = "qa-preview-banner";
  banner.dataset.qaPreviewBanner = "true";
  banner.setAttribute("role", "status");
  banner.textContent = qaPreviewStatusText(commit);
  document.body.prepend(banner);
}

export function qaPreviewStatusText(commit?: string): string {
  return [
    "QA PREVIEW",
    "타이틀 마이크 테스트 필수",
    "GPT STT Worker 활성",
    "클릭·오프라인 폴백",
    commit ? `commit ${commit.slice(0, 7)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
