import type { Category, ScanLimitConfig, Severity } from "./types";

const MB = 1024 * 1024;

export const SCANNER_VERSION = "0.1.3";

export const DEFAULT_LIMITS: ScanLimitConfig = {
  maxArchiveBytes: 8 * MB,
  maxFiles: 700,
  maxTotalTextBytes: 4 * MB,
  maxFileBytes: 256 * 1024,
};

export const SEVERITY_PENALTIES: Record<Severity, number> = {
  critical: 35,
  high: 20,
  medium: 10,
  low: 4,
  info: 0,
};

export const CATEGORY_WEIGHTS: Record<Category, number> = {
  "Payments & Revenue": 0.3,
  "Paywall Bypass Risk": 0.25,
  "Secrets & Key Exposure": 0.2,
  "Supabase & Data Access": 0.15,
  "Launch Basics": 0.05,
  Observability: 0.05,
};

export const IGNORED_DIRECTORY_PARTS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
  ".turbo",
  ".vercel",
  ".cache",
  "out",
  ".output",
  "generated",
] as const;

export const IGNORED_FILE_NAMES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
]);

export const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".csv",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".prisma",
  ".sql",
  ".svelte",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
]);

export const TEXT_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.example",
  ".gitignore",
  "Dockerfile",
  "Procfile",
  "README",
  "README.md",
]);
