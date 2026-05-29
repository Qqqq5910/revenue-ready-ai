import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeFiles } from "../src/lib/scanner/analyzeFiles";
import type { ScannedFile } from "../src/lib/scanner/types";

const repoRoot = process.cwd();
const fixtureNames = [
  "insecure-stripe-webhook",
  "client-paywall-bypass",
  "supabase-no-rls",
  "secrets-dangerous",
];

describe("smoke scan", () => {
  it("scans representative fixtures and prints summary output", () => {
    for (const fixtureName of fixtureNames) {
      const report = analyzeFiles(readFixture(fixtureName), {
        type: "files",
        label: `Smoke fixture: ${fixtureName}`,
      });

      console.log(`\n${fixtureName}`);
      console.log(`Score: ${report.overallScore}`);
      console.log(`Findings: ${report.findings.length}`);
      console.log(
        `Top blockers: ${
          report.launchFixPlan.topRevenueBlockers
            .map((blocker) => blocker.title)
            .join(" | ") || "none"
        }`,
      );
      console.log(`Launch Fix Plan: ${report.launchFixPlan ? "present" : "missing"}`);

      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.launchFixPlan.consolidatedRepairPrompt).toContain(
        "Do not rewrite the whole app",
      );
    }
  });
});

function readFixture(name: string): ScannedFile[] {
  const root = join(repoRoot, "tests", "fixtures", name);
  const files: ScannedFile[] = [];

  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const content = readFileSync(absolutePath, "utf8");
      files.push({
        path: relative(root, absolutePath),
        content,
        size: Buffer.byteLength(content),
      });
    }
  }

  walk(root);

  return files;
}
