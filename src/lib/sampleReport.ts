import { buildLaunchFixPlan } from "./scanner/launchFixPlan";
import { scoreCategories, scoreOverall } from "./scanner/score";
import type { Finding, ScanReport } from "./scanner/types";
import { SCANNER_VERSION } from "./scanner/constants";

const sampleFindings: Finding[] = [
  {
    id: "stripe-webhook-missing-signature-verification",
    title: "Stripe webhook does not appear to verify signatures",
    severity: "critical",
    category: "Payments & Revenue",
    affectedFiles: ["src/app/api/stripe/webhook/route.ts"],
    explanation:
      "A Stripe webhook route updates subscription state, but no constructEvent or Stripe-Signature verification was found.",
    whyItMatters:
      "Payment state cannot be trusted if anyone can forge a webhook request.",
    fixPrompt:
      "Inspect the Stripe webhook route. Update it so it reads the raw request body, reads the Stripe-Signature header, calls stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET, rejects invalid signatures, and only then updates subscription or payment state. Add tests for valid and invalid signatures.",
    evidenceSnippet: 'if (event.type === "checkout.session.completed") {',
    scannerRule: "payments.stripeWebhookSignatureVerification",
  },
  {
    id: "client-side-payment-success-trust",
    title: "Client-side code appears to trust paid or premium state",
    severity: "critical",
    category: "Paywall Bypass Risk",
    affectedFiles: ["src/components/Paywall.tsx"],
    explanation:
      "Browser-facing code sets isPremium = true and reads localStorage subscription flags.",
    whyItMatters:
      "Users can change browser state and unlock paid features without a verified subscription.",
    fixPrompt:
      "Move paid entitlement checks to the server. Do not trust client-side flags, localStorage, or success query parameters. Store subscription state server-side based on verified Stripe webhooks. Add a server-side helper like getUserEntitlements(userId), and make protected paid features call it before returning data.",
    evidenceSnippet: "const isPremium = true;",
    scannerRule: "paywall.clientSidePaymentSuccessTrust",
  },
  {
    id: "missing-customer-portal-or-cancellation",
    title: "No customer portal or cancellation path detected",
    severity: "medium",
    category: "Payments & Revenue",
    affectedFiles: ["src/app/pricing/page.tsx"],
    explanation:
      "Checkout exists, but the sample scan did not find a billing portal or manage-subscription path.",
    whyItMatters:
      "Users need a clear way to manage or cancel subscriptions before you charge them.",
    fixPrompt:
      "Add a billing portal or manage-subscription flow. Users should be able to manage or cancel their subscription from the app. Add a /billing or /account/billing page and a server route that creates a Stripe billing portal session.",
    scannerRule: "payments.customerPortalOrCancellation",
  },
  {
    id: "supabase-missing-rls-evidence",
    title: "No Supabase RLS evidence found",
    severity: "high",
    category: "Supabase & Data Access",
    affectedFiles: ["src/lib/supabase.ts"],
    explanation:
      "Supabase is used, but no migrations or policy indicators were found.",
    whyItMatters:
      "Customer or subscription records may be readable by the wrong users if RLS is missing.",
    fixPrompt:
      "Add Supabase migrations that enable row level security on user-owned tables. Create least-privilege policies based on auth.uid(). Add tests or SQL comments explaining which users can read/write each table.",
    scannerRule: "supabase.missingRlsEvidence",
  },
  {
    id: "missing-support-contact-path",
    title: "Support or contact path not detected",
    severity: "medium",
    category: "Launch Basics",
    affectedFiles: [],
    explanation:
      "No support, contact, help, or email indicator was found.",
    whyItMatters:
      "When billing fails, users need a clear way to reach you before they dispute or churn.",
    fixPrompt:
      "Add a support or contact page. Include a support email and link it from the footer, account page, and billing area.",
    scannerRule: "launchBasics.supportContact",
  },
  {
    id: "missing-payment-failure-logging",
    title: "Payment failure logging not detected",
    severity: "low",
    category: "Observability",
    affectedFiles: [],
    explanation:
      "Stripe appears to be used, but no obvious logging around checkout or webhook failures was found.",
    whyItMatters:
      "Silent checkout and webhook failures directly block revenue.",
    fixPrompt:
      "Add structured logging around Stripe checkout creation, webhook verification failures, subscription updates, and billing portal creation. Ensure errors are visible in production logs or error tracking.",
    scannerRule: "observability.paymentFailureLogging",
  },
];

const categoryScores = scoreCategories(sampleFindings);

export const sampleReport: ScanReport = {
  scannerVersion: SCANNER_VERSION,
  generatedAt: "2026-05-29T00:00:00.000Z",
  source: {
    type: "files",
    label: "Sample report — no code uploaded",
  },
  stats: {
    scannedFiles: 34,
    scannedBytes: 124_800,
    ignoredFiles: 19,
    skippedLargeFiles: 2,
    skippedBinaryFiles: 6,
  },
  overallScore: scoreOverall(categoryScores),
  categoryScores,
  launchFixPlan: buildLaunchFixPlan(sampleFindings),
  findings: sampleFindings,
};
