import {
  CATEGORIES,
  type CategoryScores,
  type Finding,
  type Severity,
} from "./types";
import { CATEGORY_WEIGHTS, SEVERITY_PENALTIES } from "./constants";

export function scoreCategories(findings: Finding[]): CategoryScores {
  const scores = Object.fromEntries(
    CATEGORIES.map((category) => [category, 100]),
  ) as CategoryScores;

  for (const finding of findings) {
    scores[finding.category] = Math.max(
      0,
      Math.min(100, scores[finding.category] - SEVERITY_PENALTIES[finding.severity]),
    );
  }

  return scores;
}

export function scoreOverall(categoryScores: CategoryScores) {
  const weightedScore = CATEGORIES.reduce(
    (total, category) => total + categoryScores[category] * CATEGORY_WEIGHTS[category],
    0,
  );

  return Math.round(weightedScore);
}

export function compareFindings(a: Finding, b: Finding) {
  const severityRank: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  return (
    severityRank[a.severity] - severityRank[b.severity] ||
    a.category.localeCompare(b.category) ||
    a.title.localeCompare(b.title)
  );
}
