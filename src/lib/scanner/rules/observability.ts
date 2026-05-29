import { hasAny } from "../fileFilters";
import type { Finding, ScannedFile } from "../types";
import { makeFinding } from "./helpers";
import { projectUsesStripe } from "./payments";

const errorTrackingPatterns = [
  /sentry/i,
  /bugsnag/i,
  /logrocket/i,
  /\baxiom\b/i,
  /datadog/i,
  /rollbar/i,
  /honeybadger/i,
];

const analyticsPatterns = [
  /posthog/i,
  /plausible/i,
  /google-analytics/i,
  /googletagmanager/i,
  /gtag\s*\(/i,
  /segment/i,
  /amplitude/i,
  /mixpanel/i,
];

const paymentFailureLoggingPatterns = [
  /console\.error[\s\S]{0,160}(stripe|webhook|checkout|subscription|billing)/i,
  /(stripe|webhook|checkout|subscription|billing)[\s\S]{0,160}console\.error/i,
  /logger\.(error|warn)[\s\S]{0,160}(stripe|webhook|checkout|subscription|billing)/i,
  /(stripe|webhook|checkout|subscription|billing)[\s\S]{0,160}logger\.(error|warn)/i,
  /captureException[\s\S]{0,160}(stripe|webhook|checkout|subscription|billing)/i,
  /(stripe|webhook|checkout|subscription|billing)[\s\S]{0,160}captureException/i,
];

export function analyzeObservability(files: ScannedFile[]): Finding[] {
  const findings: Finding[] = [];
  const hasErrorTracking = hasAny(files, errorTrackingPatterns);
  const hasAnalytics = hasAny(files, analyticsPatterns);
  const usesStripe = projectUsesStripe(files);
  const hasPaymentFailureLogging = hasAny(files, paymentFailureLoggingPatterns);

  if (!hasErrorTracking) {
    findings.push(
      makeFinding({
        id: "missing-error-tracking",
        title: "Production error tracking not detected",
        severity: "low",
        category: "Observability",
        scannerRule: "observability.errorTracking",
        explanation:
          "The scanner did not find Sentry, Bugsnag, LogRocket, Axiom, Datadog, Rollbar, or similar error monitoring indicators.",
        whyItMatters:
          "If checkout, auth, or paid features break after launch, you need to know before customers complain.",
        fixPrompt:
          "Add production error tracking such as Sentry. Capture server errors, payment webhook errors, checkout failures, and important client-side exceptions.",
      }),
    );
  }

  if (!hasAnalytics) {
    findings.push(
      makeFinding({
        id: "missing-analytics",
        title: "Revenue analytics not detected",
        severity: "low",
        category: "Observability",
        scannerRule: "observability.analytics",
        explanation:
          "The scanner did not find PostHog, Plausible, Google Analytics, Segment, Amplitude, Mixpanel, or similar analytics indicators.",
        whyItMatters:
          "You need basic funnel visibility to know whether visitors reach signup, checkout, activation, and cancellation.",
        fixPrompt:
          "Add privacy-conscious analytics to track landing page visits, signup, checkout started, checkout completed, subscription activated, and cancellation events.",
      }),
    );
  }

  if (usesStripe && !hasPaymentFailureLogging) {
    findings.push(
      makeFinding({
        id: "missing-payment-failure-logging",
        title: "Payment failure logging not detected",
        severity: "medium",
        category: "Observability",
        scannerRule: "observability.paymentFailureLogging",
        explanation:
          "The project uses Stripe, but the scanner did not find obvious logging around webhook failures, checkout errors, subscription updates, or billing portal creation.",
        whyItMatters:
          "Payment bugs directly block revenue. Silent webhook or checkout failures are painful to diagnose after launch.",
        fixPrompt:
          "Add structured logging around Stripe checkout creation, webhook verification failures, subscription updates, and billing portal creation. Ensure errors are visible in production logs or error tracking.",
      }),
    );
  }

  return findings;
}
