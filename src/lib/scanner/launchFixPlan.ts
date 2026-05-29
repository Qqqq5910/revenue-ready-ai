import type { Category, Finding, LaunchBlocker, LaunchFixPlan, Severity } from "./types";

const blockerCategories: Category[] = [
  "Payments & Revenue",
  "Paywall Bypass Risk",
  "Secrets & Key Exposure",
  "Supabase & Data Access",
];

const severityRank: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const categoryRank: Record<Category, number> = {
  "Payments & Revenue": 0,
  "Paywall Bypass Risk": 1,
  "Secrets & Key Exposure": 2,
  "Supabase & Data Access": 3,
  "Launch Basics": 4,
  Observability: 5,
};

export function buildLaunchFixPlan(findings: Finding[]): LaunchFixPlan {
  const topRevenueBlockers = findings
    .filter(
      (finding) =>
        blockerCategories.includes(finding.category) &&
        (finding.severity === "critical" || finding.severity === "high"),
    )
    .sort(comparePlanFindings)
    .slice(0, 3)
    .map(toLaunchBlocker);

  const thirtyMinuteFixes = uniqueNonEmpty([
    ...findings
      .filter((finding) =>
        [
          "hardcoded-payment-or-api-secret",
          "dangerous-public-env-var",
          "env-file-included",
          "client-side-payment-success-trust",
          "missing-privacy-policy",
          "missing-terms-page",
          "missing-support-contact-path",
        ].includes(finding.id),
      )
      .map((finding) => quickFixFor(finding)),
  ]).slice(0, 6);

  const twoHourFixes = uniqueNonEmpty([
    ...findings
      .filter((finding) =>
        [
          "stripe-webhook-missing-signature-verification",
          "missing-customer-portal-or-cancellation",
          "supabase-missing-rls-evidence",
          "supabase-broad-policy",
          "supabase-service-role-client",
        ].includes(finding.id),
      )
      .map((finding) => sameDayFixFor(finding)),
  ]).slice(0, 6);

  const oneDayFixes = uniqueNonEmpty([
    ...findings
      .filter((finding) =>
        [
          "missing-error-tracking",
          "missing-analytics",
          "missing-payment-failure-logging",
          "missing-pricing-page",
          "missing-refund-cancellation-copy",
        ].includes(finding.id),
      )
      .map((finding) => dayFixFor(finding)),
  ]).slice(0, 6);

  return {
    topRevenueBlockers,
    thirtyMinuteFixes:
      thirtyMinuteFixes.length > 0
        ? thirtyMinuteFixes
        : ["No obvious 30-minute revenue blockers were found."],
    twoHourFixes:
      twoHourFixes.length > 0
        ? twoHourFixes
        : ["No same-day payment, entitlement, or Supabase fixes were found."],
    oneDayFixes:
      oneDayFixes.length > 0
        ? oneDayFixes
        : ["Add monitoring, analytics, and payment logging before a serious launch."],
    consolidatedRepairPrompt: buildConsolidatedPrompt(findings, topRevenueBlockers),
  };
}

function comparePlanFindings(a: Finding, b: Finding) {
  return (
    severityRank[a.severity] - severityRank[b.severity] ||
    categoryRank[a.category] - categoryRank[b.category] ||
    a.title.localeCompare(b.title)
  );
}

function toLaunchBlocker(finding: Finding): LaunchBlocker {
  return {
    findingId: finding.id,
    title: finding.title,
    category: finding.category,
    severity: finding.severity,
    reason: blockerReason(finding),
    fixPrompt: finding.fixPrompt,
  };
}

function blockerReason(finding: Finding) {
  if (finding.category === "Payments & Revenue") {
    return "Payment state may not be trustworthy enough to safely charge users.";
  }

  if (finding.category === "Paywall Bypass Risk") {
    return "Users may be able to unlock paid features without a verified subscription.";
  }

  if (finding.category === "Secrets & Key Exposure") {
    return "A leaked key can expose payment, AI, email, or customer-data systems.";
  }

  if (finding.category === "Supabase & Data Access") {
    return "Customer or subscription data may be readable or writable by the wrong users.";
  }

  return finding.whyItMatters;
}

function quickFixFor(finding: Finding) {
  if (finding.id === "client-side-payment-success-trust") {
    return "Remove obvious browser-side paid or premium flags and route paid feature access through a server entitlement check.";
  }

  if (finding.category === "Secrets & Key Exposure") {
    return "Remove exposed keys and real .env files, rotate affected credentials, and move secrets to server-only environment variables.";
  }

  if (finding.id === "missing-privacy-policy") {
    return "Add a basic privacy policy page that lists Stripe, Supabase, analytics, collected data, and support contact details.";
  }

  if (finding.id === "missing-terms-page") {
    return "Add a terms page covering payments, cancellation, acceptable use, disclaimers, and support contact details.";
  }

  if (finding.id === "missing-support-contact-path") {
    return "Add a visible support or contact page and link it from footer, account, and billing surfaces.";
  }

  return finding.fixPrompt;
}

function sameDayFixFor(finding: Finding) {
  if (finding.id === "stripe-webhook-missing-signature-verification") {
    return "Verify Stripe webhooks with raw body, Stripe-Signature, constructEvent, and STRIPE_WEBHOOK_SECRET before changing subscription state.";
  }

  if (finding.id === "missing-customer-portal-or-cancellation") {
    return "Add a billing portal route and a billing page so users can manage or cancel subscriptions.";
  }

  if (finding.id === "supabase-service-role-client") {
    return "Move Supabase service-role operations behind server routes or server actions and keep browser code on anon/publishable keys.";
  }

  if (finding.id === "supabase-missing-rls-evidence") {
    return "Add Supabase migrations that enable RLS and policies scoped to auth.uid() for user-owned tables.";
  }

  if (finding.id === "supabase-broad-policy") {
    return "Replace using (true) or with check (true) policies with user, team, or role-scoped checks.";
  }

  return finding.fixPrompt;
}

function dayFixFor(finding: Finding) {
  if (finding.id === "missing-payment-failure-logging") {
    return "Add structured logs and error capture around checkout creation, webhook verification failures, subscription updates, and billing portal creation.";
  }

  if (finding.id === "missing-error-tracking") {
    return "Add production error tracking for server errors, client exceptions, and payment-related failures.";
  }

  if (finding.id === "missing-analytics") {
    return "Add analytics events for landing visits, signup, checkout started, checkout completed, subscription activated, and cancellation.";
  }

  if (finding.id === "missing-pricing-page") {
    return "Create or tighten the pricing page so plan value, renewal terms, and cancellation are clear before checkout.";
  }

  if (finding.id === "missing-refund-cancellation-copy") {
    return "Add refund and cancellation copy near pricing, billing, terms, and support pages.";
  }

  return finding.fixPrompt;
}

function buildConsolidatedPrompt(findings: Finding[], blockers: LaunchBlocker[]) {
  const priorityFindings = (blockers.length > 0
    ? blockers
    : findings.slice(0, 3).map(toLaunchBlocker)
  )
    .map(
      (finding, index) =>
        `${index + 1}. [${finding.severity.toUpperCase()}] ${finding.title} (${finding.category})`,
    )
    .join("\n");

  const affectedFiles = Array.from(
    new Set(findings.flatMap((finding) => finding.affectedFiles)),
  )
    .slice(0, 12)
    .map((file) => `- ${file}`)
    .join("\n");

  return [
    "You are helping harden an AI-built app so it is ready to charge users.",
    "",
    "Fix the top revenue-blocking issues first. Do not rewrite the whole app or change unrelated UI.",
    "",
    "Top findings:",
    priorityFindings || "No critical or high revenue blockers were found. Focus on launch readiness and observability.",
    "",
    "Relevant files from the scan:",
    affectedFiles || "- Review payment, auth, Supabase, and launch pages.",
    "",
    "Instructions:",
    "- Prioritize payment correctness, server-side entitlements, secret removal, and Supabase data access before polish.",
    "- Add or update tests for the changed payment, entitlement, and data-access behavior.",
    "- Keep changes small and idiomatic for the existing codebase.",
    "- Run lint, typecheck, tests, and production build.",
    "- Summarize changed files, what was fixed, and any known limitations.",
  ].join("\n");
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
