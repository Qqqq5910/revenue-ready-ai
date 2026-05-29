import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { analyzeFiles } from "../src/lib/scanner/analyzeFiles";
import { isUnsafeArchivePath } from "../src/lib/scanner/fileFilters";
import { parseGitHubRepoUrl } from "../src/lib/scanner/github";
import { maskSecrets } from "../src/lib/scanner/maskSecrets";
import { scoreCategories, scoreOverall } from "../src/lib/scanner/score";
import { extractTextFilesFromZip } from "../src/lib/scanner/zip";
import type { Finding, ScannedFile } from "../src/lib/scanner/types";

const fixturesRoot = join(__dirname, "fixtures");
const fakeStripeLivePrefix = "sk_" + "live_";
const fakeStripeTestPrefix = "sk_" + "test_";
const fakeStripeWebhookPrefix = "wh" + "sec_";
const fakeStripeRestrictedKeyPrefix = "rk_" + "live_";
const fakeOpenAiPrefix = "sk-" + "proj-";

function file(path: string, content: string): ScannedFile {
  return {
    path,
    content,
    size: Buffer.byteLength(content),
  };
}

function fixtureFiles(name: string): ScannedFile[] {
  const root = join(fixturesRoot, name);
  const files: ScannedFile[] = [];

  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const content = readFileSync(absolutePath, "utf8");
      files.push(file(relative(root, absolutePath), content));
    }
  }

  walk(root);

  return files;
}

function findingIds(filesOrFixture: ScannedFile[] | string) {
  const files =
    typeof filesOrFixture === "string" ? fixtureFiles(filesOrFixture) : filesOrFixture;

  return analyzeFiles(files).findings.map((finding) => finding.id);
}

function fakeStripeLiveKey() {
  return `${fakeStripeLivePrefix}1234567890abcdefghijklmnop`;
}

function fakeOpenAiKey() {
  return `${fakeOpenAiPrefix}abcdefghijklmnopqrstuvwxyz123456`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function testFilesUnder(directory: string): string[] {
  const files: string[] = [];

  function walk(currentDirectory: string) {
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      files.push(absolutePath);
    }
  }

  walk(directory);

  return files;
}

describe("realistic RevenueReady fixtures", () => {
  it("does not flag a secure Stripe webhook as missing signature verification", () => {
    const report = analyzeFiles(fixtureFiles("secure-stripe-app"));

    expect(report.findings.some((finding) => finding.id === "stripe-webhook-missing-signature-verification")).toBe(false);
  });

  it("flags insecure Stripe webhook updates as critical payment findings", () => {
    const report = analyzeFiles(fixtureFiles("insecure-stripe-webhook"));
    const finding = report.findings.find(
      (item) => item.id === "stripe-webhook-missing-signature-verification",
    );

    expect(finding?.severity).toBe("critical");
    expect(finding?.category).toBe("Payments & Revenue");
    expect(report.categoryScores["Payments & Revenue"]).toBeLessThan(100);
    expect(report.overallScore).toBeLessThan(90);
    expect(report.launchFixPlan.topRevenueBlockers[0]?.findingId).toBe(finding?.id);
    expect(report.launchFixPlan.consolidatedRepairPrompt).toContain(
      "Do not rewrite the whole app",
    );
  });

  it("flags client-side paywall bypass logic", () => {
    const ids = findingIds("client-paywall-bypass");

    expect(ids).toContain("client-side-payment-success-trust");
  });

  it("does not flag missing RLS when scoped Supabase policies exist", () => {
    const ids = findingIds("supabase-good-rls");

    expect(ids).not.toContain("supabase-missing-rls-evidence");
    expect(ids).not.toContain("supabase-broad-policy");
  });

  it("flags Supabase usage without RLS evidence", () => {
    const report = analyzeFiles(fixtureFiles("supabase-no-rls"));

    expect(report.findings.some((finding) => finding.id === "supabase-missing-rls-evidence")).toBe(true);
    expect(report.categoryScores["Supabase & Data Access"]).toBeLessThan(100);
  });

  it("flags overly broad Supabase RLS policies", () => {
    const ids = findingIds("supabase-broad-policy");

    expect(ids).toContain("supabase-broad-policy");
  });

  it("flags dangerous secrets while masking evidence snippets", () => {
    const report = analyzeFiles(fixtureFiles("secrets-dangerous"));
    const hardcoded = report.findings.find(
      (finding) => finding.id === "hardcoded-payment-or-api-secret",
    );
    const envFile = report.findings.find((finding) => finding.id === "env-file-included");

    expect(report.findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining([
        "hardcoded-payment-or-api-secret",
        "dangerous-public-env-var",
        "env-file-included",
      ]),
    );
    expect(hardcoded?.evidenceSnippet).toBeTruthy();
    expect(hardcoded?.evidenceSnippet).not.toContain(
      "__REVENUE_READY_FAKE_OPENAI_SECRET__",
    );
    expect(hardcoded?.evidenceSnippet).toContain("...");
    expect(envFile?.affectedFiles).toEqual([".env"]);
    expect(envFile?.affectedFiles).not.toContain(".env.example");
  });

  it("flags missing launch basics for a Stripe app without policies or support", () => {
    const ids = findingIds("launch-basics-missing");

    expect(ids).toEqual(
      expect.arrayContaining([
        "missing-privacy-policy",
        "missing-terms-page",
        "missing-support-contact-path",
        "missing-refund-cancellation-copy",
      ]),
    );
  });

  it("does not flag missing error tracking or analytics when observability is present", () => {
    const ids = findingIds("observability-present");

    expect(ids).not.toContain("missing-error-tracking");
    expect(ids).not.toContain("missing-analytics");
  });
});

describe("scanner rules", () => {
  it("detects hardcoded secrets and masks evidence snippets", () => {
    const fullSecret = fakeStripeLiveKey();
    const report = analyzeFiles([
      file("src/app/api/billing/route.ts", `const stripeKey = "${fullSecret}";`),
    ]);
    const finding = report.findings.find(
      (item) => item.id === "hardcoded-payment-or-api-secret",
    );

    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("critical");
    expect(finding?.evidenceSnippet).toContain(`${fakeStripeLivePrefix}1234...`);
    expect(finding?.evidenceSnippet).not.toContain(fullSecret);
  });

  it(".env.example is allowed, but real .env files are flagged", () => {
    const report = analyzeFiles([
      file(".env.example", "STRIPE_SECRET_KEY=replace_me"),
      file(".env", `STRIPE_SECRET_KEY=${fakeStripeLiveKey()}`),
    ]);
    const finding = report.findings.find((item) => item.id === "env-file-included");

    expect(finding?.affectedFiles).toEqual([".env"]);
  });

  it("detects dangerous public environment variable names", () => {
    const report = analyzeFiles([
      file(
        "src/components/Checkout.tsx",
        `"use client"; const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;`,
      ),
    ]);

    expect(
      report.findings.some((finding) => finding.id === "dangerous-public-env-var"),
    ).toBe(true);
  });

  it("masks env-style secret assignments consistently", () => {
    const masked = maskSecrets(`OPENAI_API_KEY=${fakeOpenAiKey()}`);

    expect(masked).toContain(`OPENAI_API_KEY=${fakeOpenAiPrefix}abcd...`);
    expect(masked).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
  });

  it("keeps committed tests and fixtures free of provider-secret-looking values", () => {
    const providerSecretPattern = new RegExp(
      [
        fakeStripeLivePrefix,
        fakeStripeTestPrefix,
        fakeStripeWebhookPrefix,
        fakeStripeRestrictedKeyPrefix,
      ]
        .map(escapeRegExp)
        .join("|") + "[A-Za-z0-9]{10,}",
    );
    const matches = testFilesUnder(__dirname)
      .map((absolutePath) => ({
        path: relative(__dirname, absolutePath),
        content: readFileSync(absolutePath, "utf8"),
      }))
      .filter((item) => providerSecretPattern.test(item.content))
      .map((item) => item.path);

    expect(matches).toEqual([]);
  });
});

describe("scoring", () => {
  it("applies RevenueReady penalties and weighted average", () => {
    const findings: Finding[] = [
      {
        id: "critical-payments",
        title: "Critical payment issue",
        severity: "critical",
        category: "Payments & Revenue",
        affectedFiles: [],
        explanation: "Bad",
        whyItMatters: "Revenue risk",
        fixPrompt: "Fix it",
        scannerRule: "test.criticalPayments",
      },
      {
        id: "high-supabase",
        title: "High Supabase issue",
        severity: "high",
        category: "Supabase & Data Access",
        affectedFiles: [],
        explanation: "Bad",
        whyItMatters: "Data risk",
        fixPrompt: "Fix it",
        scannerRule: "test.highSupabase",
      },
    ];

    const categoryScores = scoreCategories(findings);

    expect(categoryScores["Payments & Revenue"]).toBe(65);
    expect(categoryScores["Supabase & Data Access"]).toBe(80);
    expect(scoreOverall(categoryScores)).toBe(87);
  });
});

describe("zip filtering and limits", () => {
  it("ignores generated folders and skips binary files", () => {
    const zip = new AdmZip();
    zip.addFile("repo/src/app/page.tsx", Buffer.from("export default function Page() {}"));
    zip.addFile("repo/node_modules/package/index.js", Buffer.from("module.exports = {}"));
    zip.addFile("repo/.next/server/page.js", Buffer.from("generated"));
    zip.addFile("repo/public/logo.png", Buffer.from([0, 1, 2, 3, 4]));

    const { files, stats } = extractTextFilesFromZip(zip.toBuffer());

    expect(files.map((item) => item.path)).toEqual(["src/app/page.tsx"]);
    expect(stats.ignoredFiles).toBeGreaterThanOrEqual(2);
    expect(stats.skippedBinaryFiles).toBeGreaterThanOrEqual(1);
  });

  it("detects unsafe zip path traversal names before extraction", () => {
    expect(isUnsafeArchivePath("../evil.ts")).toBe(true);
    expect(isUnsafeArchivePath("repo/../../evil.ts")).toBe(true);
    expect(isUnsafeArchivePath("/absolute/evil.ts")).toBe(true);
    expect(isUnsafeArchivePath("repo/src/app/page.tsx")).toBe(false);
  });

  it("ignores large files and enforces max file count and text bytes", () => {
    const largeZip = new AdmZip();
    largeZip.addFile("repo/src/app/page.tsx", Buffer.from("export default function Page() {}"));
    largeZip.addFile("repo/src/large.ts", Buffer.from("x".repeat(50)));

    const largeResult = extractTextFilesFromZip(largeZip.toBuffer(), {
      maxArchiveBytes: 1024 * 1024,
      maxFiles: 10,
      maxFileBytes: 40,
      maxTotalTextBytes: 1024,
    });

    expect(largeResult.files.map((item) => item.path)).toEqual(["src/app/page.tsx"]);
    expect(largeResult.stats.skippedLargeFiles).toBe(1);

    const manyFilesZip = new AdmZip();
    manyFilesZip.addFile("repo/src/a.ts", Buffer.from("export const a = 1;"));
    manyFilesZip.addFile("repo/src/b.ts", Buffer.from("export const b = 1;"));

    expect(() =>
      extractTextFilesFromZip(manyFilesZip.toBuffer(), {
        maxArchiveBytes: 1024 * 1024,
        maxFiles: 1,
        maxFileBytes: 1024,
        maxTotalTextBytes: 1024,
      }),
    ).toThrow(/Too many text files/i);

    expect(() =>
      extractTextFilesFromZip(manyFilesZip.toBuffer(), {
        maxArchiveBytes: 1024 * 1024,
        maxFiles: 10,
        maxFileBytes: 1024,
        maxTotalTextBytes: 20,
      }),
    ).toThrow(/too much text/i);
  });
});

describe("GitHub URL parsing", () => {
  it.each([
    ["https://github.com/owner/repo", "owner", "repo", undefined],
    ["https://github.com/owner/repo.git", "owner", "repo", undefined],
    ["https://github.com/owner/repo/tree/main", "owner", "repo", "main"],
    [
      "https://github.com/owner/repo/tree/feature/some-branch",
      "owner",
      "repo",
      "feature/some-branch",
    ],
  ])("supports %s", (url, owner, repo, branch) => {
    const parsed = parseGitHubRepoUrl(url);

    expect(parsed.owner).toBe(owner);
    expect(parsed.repo).toBe(repo);
    expect(parsed.branch).toBe(branch);
    expect(parsed.archiveUrl).toContain(`/repos/${owner}/${repo}/zipball`);
  });
});
