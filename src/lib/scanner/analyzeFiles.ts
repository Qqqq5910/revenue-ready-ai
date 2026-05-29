import { SCANNER_VERSION } from "./constants";
import { buildLaunchFixPlan } from "./launchFixPlan";
import { analyzeLaunchBasics } from "./rules/launchBasics";
import { analyzeObservability } from "./rules/observability";
import { analyzePayments } from "./rules/payments";
import { analyzePaywall } from "./rules/paywall";
import { analyzeSecrets } from "./rules/secrets";
import { analyzeSupabase } from "./rules/supabase";
import { compareFindings, scoreCategories, scoreOverall } from "./score";
import type { Finding, ScanReport, ScanStats, ScannedFile, SourceInfo } from "./types";

export function analyzeFiles(
  files: ScannedFile[],
  source: SourceInfo = { type: "files", label: "In-memory files" },
  stats?: ScanStats,
): ScanReport {
  const findings: Finding[] = [
    ...analyzePayments(files),
    ...analyzePaywall(files),
    ...analyzeSecrets(files),
    ...analyzeSupabase(files),
    ...analyzeLaunchBasics(files),
    ...analyzeObservability(files),
  ].sort(compareFindings);

  const categoryScores = scoreCategories(findings);
  const launchFixPlan = buildLaunchFixPlan(findings);

  return {
    scannerVersion: SCANNER_VERSION,
    generatedAt: new Date().toISOString(),
    source,
    stats: stats ?? {
      scannedFiles: files.length,
      scannedBytes: files.reduce((total, file) => total + file.size, 0),
      ignoredFiles: 0,
      skippedLargeFiles: 0,
      skippedBinaryFiles: 0,
    },
    overallScore: scoreOverall(categoryScores),
    categoryScores,
    launchFixPlan,
    findings,
  };
}
