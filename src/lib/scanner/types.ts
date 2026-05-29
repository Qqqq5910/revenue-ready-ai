export const CATEGORIES = [
  "Payments & Revenue",
  "Paywall Bypass Risk",
  "Secrets & Key Exposure",
  "Supabase & Data Access",
  "Launch Basics",
  "Observability",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;

export type Severity = (typeof SEVERITIES)[number];

export type ScannedFile = {
  path: string;
  content: string;
  size: number;
};

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  category: Category;
  affectedFiles: string[];
  explanation: string;
  whyItMatters: string;
  fixPrompt: string;
  evidenceSnippet?: string;
  scannerRule: string;
};

export type LaunchBlocker = {
  findingId: string;
  title: string;
  category: Category;
  severity: Severity;
  reason: string;
  fixPrompt: string;
};

export type LaunchFixPlan = {
  topRevenueBlockers: LaunchBlocker[];
  thirtyMinuteFixes: string[];
  twoHourFixes: string[];
  oneDayFixes: string[];
  consolidatedRepairPrompt: string;
};

export type SourceInfo = {
  type: "github" | "zip" | "files";
  label: string;
};

export type ScanStats = {
  scannedFiles: number;
  scannedBytes: number;
  ignoredFiles: number;
  skippedLargeFiles: number;
  skippedBinaryFiles: number;
};

export type CategoryScores = Record<Category, number>;

export type ScanReport = {
  scannerVersion: string;
  generatedAt: string;
  source: SourceInfo;
  stats: ScanStats;
  overallScore: number;
  categoryScores: CategoryScores;
  launchFixPlan: LaunchFixPlan;
  findings: Finding[];
};

export type ScanLimitConfig = {
  maxArchiveBytes: number;
  maxFiles: number;
  maxTotalTextBytes: number;
  maxFileBytes: number;
};

export type ScanErrorCode =
  | "INVALID_ARCHIVE"
  | "ARCHIVE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "TEXT_BYTES_LIMIT"
  | "NO_TEXT_FILES"
  | "FETCH_FAILED"
  | "INVALID_GITHUB_URL"
  | "UNSAFE_ARCHIVE_PATH";

export class ScanError extends Error {
  code: ScanErrorCode;
  status: number;

  constructor(message: string, code: ScanErrorCode, status = 400) {
    super(message);
    this.name = "ScanError";
    this.code = code;
    this.status = status;
  }
}
