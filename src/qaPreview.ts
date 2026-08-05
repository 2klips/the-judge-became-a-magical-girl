interface QaPreviewBannerOptions {
  commit?: string;
}

export function qaPreviewCommitId(commit?: string): string | undefined {
  const normalized = commit?.trim();
  return normalized ? normalized.slice(0, 7) : undefined;
}

export function installQaPreviewMarker({ commit }: QaPreviewBannerOptions): void {
  document.documentElement.dataset.qaPreview = "true";
  const commitId = qaPreviewCommitId(commit);
  if (commitId) document.documentElement.dataset.qaCommit = commitId;
}
