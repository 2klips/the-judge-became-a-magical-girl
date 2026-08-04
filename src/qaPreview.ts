interface QaPreviewBannerOptions {
  commit?: string;
}

export function installQaPreviewBanner({ commit }: QaPreviewBannerOptions): void {
  document.documentElement.dataset.qaPreview = "true";

  const banner = document.createElement("div");
  banner.className = "qa-preview-banner";
  banner.dataset.qaPreviewBanner = "true";
  banner.setAttribute("role", "status");
  banner.textContent = [
    "QA PREVIEW",
    "타이틀 마이크 테스트 필수",
    "게임 내 클릭·오프라인",
    "음성 Worker 비활성",
    commit ? `commit ${commit.slice(0, 7)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  document.body.prepend(banner);
}
