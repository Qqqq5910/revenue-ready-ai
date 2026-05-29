import { DEFAULT_LIMITS } from "./constants";
import { ScanError, type SourceInfo } from "./types";

export type ParsedGitHubRepoUrl = {
  owner: string;
  repo: string;
  branch?: string;
  archiveUrl: string;
  label: string;
};

export function parseGitHubRepoUrl(repoUrl: string): ParsedGitHubRepoUrl {
  let url: URL;

  try {
    url = new URL(repoUrl);
  } catch {
    throw invalidGitHubUrlError();
  }

  if (url.protocol !== "https:" || url.hostname !== "github.com") {
    throw invalidGitHubUrlError();
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const [owner, rawRepo, action, ...rest] = segments;

  if (!owner || !rawRepo) {
    throw invalidGitHubUrlError();
  }

  const repo = rawRepo.replace(/\.git$/, "");
  const branch = action === "tree" && rest.length > 0 ? rest.join("/") : undefined;

  if (!repo || (action && action !== "tree")) {
    throw invalidGitHubUrlError();
  }

  const encodedBranch = branch
    ? branch
        .split("/")
        .filter(Boolean)
        .map((part) => encodeURIComponent(part))
        .join("/")
    : "";
  const archiveUrl = encodedBranch
    ? `https://api.github.com/repos/${owner}/${repo}/zipball/${encodedBranch}`
    : `https://api.github.com/repos/${owner}/${repo}/zipball`;

  return {
    owner,
    repo,
    branch,
    archiveUrl,
    label: branch ? `${owner}/${repo}:${branch}` : `${owner}/${repo}`,
  };
}

export async function fetchGitHubArchive(repoUrl: string) {
  const parsed = parseGitHubRepoUrl(repoUrl);
  const response = await fetch(parsed.archiveUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "revenueready-ai-v0.1",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    const reason =
      response.status === 404
        ? "The repository or branch was not found. Private repos are not supported in v0.1."
        : response.status === 403
          ? "GitHub rate limited or denied the request. Try a zip upload instead."
          : "GitHub could not return the public archive.";

    throw new ScanError(reason, "FETCH_FAILED", response.status === 404 ? 404 : 502);
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength && Number(contentLength) > DEFAULT_LIMITS.maxArchiveBytes) {
    throw new ScanError(
      `GitHub archive is too large for v0.1. The limit is ${Math.round(DEFAULT_LIMITS.maxArchiveBytes / 1024 / 1024)} MB.`,
      "ARCHIVE_TOO_LARGE",
      413,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > DEFAULT_LIMITS.maxArchiveBytes) {
    throw new ScanError(
      `GitHub archive is too large for v0.1. The limit is ${Math.round(DEFAULT_LIMITS.maxArchiveBytes / 1024 / 1024)} MB.`,
      "ARCHIVE_TOO_LARGE",
      413,
    );
  }

  return {
    buffer,
    source: {
      type: "github",
      label: parsed.label,
    } satisfies SourceInfo,
  };
}

function invalidGitHubUrlError() {
  return new ScanError(
    "Use a public GitHub URL like https://github.com/owner/repo, https://github.com/owner/repo.git, or https://github.com/owner/repo/tree/branch-name.",
    "INVALID_GITHUB_URL",
  );
}
