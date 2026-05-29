import type { Category, Finding, ScannedFile, Severity } from "../types";
import { normalizePath } from "../fileFilters";

export function makeFinding(input: {
  id: string;
  title: string;
  severity: Severity;
  category: Category;
  affectedFiles?: string[];
  explanation: string;
  whyItMatters: string;
  fixPrompt: string;
  evidenceSnippet?: string;
  scannerRule: string;
}): Finding {
  return {
    affectedFiles: [],
    ...input,
  };
}

export function paths(files: ScannedFile[], limit = 8) {
  return Array.from(new Set(files.map((file) => normalizePath(file.path)))).slice(
    0,
    limit,
  );
}
