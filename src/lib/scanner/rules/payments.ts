import {
  fileMatches,
  hasAny,
  lowerPath,
  pathOrContentMatches,
  testRegex,
  uniquePaths,
} from "../fileFilters";
import { safeEvidenceSnippet } from "../maskSecrets";
import type { Finding, ScannedFile } from "../types";
import { makeFinding } from "./helpers";

const stripeUsagePatterns = [
  /["']stripe["']/i,
  /@stripe\/stripe-js/i,
  /stripe\.checkout\.sessions/i,
  /checkout\.session\.completed/i,
  /customer\.subscription/i,
  /\bSTRIPE_SECRET_KEY\b/,
  /\bNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\b/,
  /\bSTRIPE_WEBHOOK_SECRET\b/,
];

const webhookRoutePattern =
  /checkout\.session\.completed|customer\.subscription|stripe\.webhooks|webhook/i;
const webhookVerificationPattern =
  /constructEvent|Stripe-Signature|stripe-signature|STRIPE_WEBHOOK_SECRET|webhookSecret/i;
const checkoutPattern =
  /stripe\.checkout\.sessions|checkout\.sessions\.create|checkout\.session\.completed|\/checkout|price_[A-Za-z0-9]+|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/i;
const portalOrCancelPattern =
  /billing portal|billing_portal|portal\.sessions|manage subscription|manage-subscription|cancel subscription|cancellation|\/billing|\/account\/billing/i;
const pricingPattern =
  /\/pricing|pricing|plans|price card|price-card|subscription plans|choose plan/i;

export function analyzePayments(files: ScannedFile[]): Finding[] {
  const findings: Finding[] = [];
  const usesStripe = hasAny(files, stripeUsagePatterns);

  if (!usesStripe) {
    return findings;
  }

  const webhookFiles = files.filter(
    (file) =>
      lowerPath(file).includes("webhook") ||
      testRegex(webhookRoutePattern, file.content),
  );
  const webhookFilesWithoutVerification = webhookFiles.filter(
    (file) => !testRegex(webhookVerificationPattern, file.content),
  );

  if (webhookFiles.length > 0 && webhookFilesWithoutVerification.length > 0) {
    findings.push(
      makeFinding({
        id: "stripe-webhook-missing-signature-verification",
        title: "Stripe webhook does not appear to verify signatures",
        severity: "critical",
        category: "Payments & Revenue",
        affectedFiles: uniquePaths(webhookFilesWithoutVerification),
        evidenceSnippet: safeEvidenceSnippet(
          webhookFilesWithoutVerification[0].content,
          webhookRoutePattern,
        ),
        scannerRule: "payments.stripeWebhookSignatureVerification",
        explanation:
          "A Stripe webhook route was found, but this scanner did not find signature verification with constructEvent, the Stripe-Signature header, or the webhook secret.",
        whyItMatters:
          "Payment and subscription state must only change after Stripe proves the event is real. Otherwise a forged request can mark a user as paid.",
        fixPrompt:
          "Inspect the Stripe webhook route. Update it so it reads the raw request body, reads the Stripe-Signature header, calls stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET, rejects invalid signatures, and only then updates subscription or payment state. Add tests for valid and invalid signatures.",
      }),
    );
  }

  const hasCheckout = pathOrContentMatches(files, checkoutPattern);
  const hasPortalOrCancel = pathOrContentMatches(files, portalOrCancelPattern);
  const hasPricing = pathOrContentMatches(files, pricingPattern);

  if (hasCheckout && !hasPortalOrCancel) {
    findings.push(
      makeFinding({
        id: "missing-customer-portal-or-cancellation",
        title: "No customer portal or cancellation path detected",
        severity: "medium",
        category: "Payments & Revenue",
        affectedFiles: uniquePaths(fileMatches(files, checkoutPattern)),
        scannerRule: "payments.customerPortalOrCancellation",
        explanation:
          "Stripe checkout exists, but this scanner did not find a billing portal, manage-subscription page, cancellation page, or cancellation copy.",
        whyItMatters:
          "If users can subscribe but cannot manage or cancel their plan, payment disputes and support load climb quickly.",
        fixPrompt:
          "Add a billing portal or manage-subscription flow. Users should be able to manage or cancel their subscription from the app. Add a /billing or /account/billing page and a server route that creates a Stripe billing portal session.",
      }),
    );
  }

  if (!hasPricing) {
    findings.push(
      makeFinding({
        id: "missing-pricing-page",
        title: "No clear pricing page detected",
        severity: "low",
        category: "Payments & Revenue",
        scannerRule: "payments.pricingPage",
        explanation:
          "Stripe is used, but the scanner did not find a clear pricing page, plans page, or price card component.",
        whyItMatters:
          "Users need to understand what they are buying, when they renew, and how cancellation works before they pay.",
        fixPrompt:
          "Add a clear pricing page that explains plans, renewal terms, cancellation, and what users get. Link it from the landing page and checkout flow.",
      }),
    );
  }

  return findings;
}

export function projectUsesStripe(files: ScannedFile[]) {
  return hasAny(files, stripeUsagePatterns);
}
