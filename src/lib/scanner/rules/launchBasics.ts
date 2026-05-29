import { pathOrContentMatches } from "../fileFilters";
import type { Finding, ScannedFile } from "../types";
import { makeFinding } from "./helpers";
import { projectUsesStripe } from "./payments";

export function analyzeLaunchBasics(files: ScannedFile[]): Finding[] {
  const findings: Finding[] = [];
  const hasPrivacy = pathOrContentMatches(files, /\/privacy|privacy-policy|Privacy Policy/i);
  const hasTerms = pathOrContentMatches(
    files,
    /\/terms|terms-of-service|Terms of Service|terms and conditions/i,
  );
  const hasSupport = pathOrContentMatches(
    files,
    /support|contact|help|mailto:|support@|help@|contact@/i,
  );
  const hasRefundOrCancellation = pathOrContentMatches(
    files,
    /refund|cancellation|cancel subscription|billing|manage subscription/i,
  );
  const usesStripe = projectUsesStripe(files);

  if (!hasPrivacy) {
    findings.push(
      makeFinding({
        id: "missing-privacy-policy",
        title: "Privacy policy not detected",
        severity: "medium",
        category: "Launch Basics",
        scannerRule: "launchBasics.privacyPolicy",
        explanation:
          "The scanner did not find an obvious privacy page or privacy policy copy.",
        whyItMatters:
          "If you collect emails, payments, analytics, or customer data, users need to know what data you collect and which providers process it.",
        fixPrompt:
          "Add a privacy policy page that explains what data you collect, why you collect it, third-party processors such as Stripe/Supabase/analytics, user rights, and contact information.",
      }),
    );
  }

  if (!hasTerms) {
    findings.push(
      makeFinding({
        id: "missing-terms-page",
        title: "Terms page not detected",
        severity: "medium",
        category: "Launch Basics",
        scannerRule: "launchBasics.termsPage",
        explanation:
          "The scanner did not find an obvious terms page or terms of service copy.",
        whyItMatters:
          "Terms set payment expectations, acceptable use, cancellation language, disclaimers, and support paths before users pay.",
        fixPrompt:
          "Add a terms of service page covering account usage, payments, refunds/cancellations, acceptable use, disclaimers, and contact information.",
      }),
    );
  }

  if (!hasSupport) {
    findings.push(
      makeFinding({
        id: "missing-support-contact-path",
        title: "Support or contact path not detected",
        severity: "medium",
        category: "Launch Basics",
        scannerRule: "launchBasics.supportContact",
        explanation:
          "The scanner did not find support, contact, help, or a visible email indicator.",
        whyItMatters:
          "When checkout, login, or billing fails, users need a clear way to reach you before they dispute or churn.",
        fixPrompt:
          "Add a support or contact page. Include a support email and link it from the footer, account page, and billing area.",
      }),
    );
  }

  if (usesStripe && !hasRefundOrCancellation) {
    findings.push(
      makeFinding({
        id: "missing-refund-cancellation-copy",
        title: "Refund or cancellation copy not detected",
        severity: "medium",
        category: "Launch Basics",
        scannerRule: "launchBasics.refundCancellationCopy",
        explanation:
          "The app uses Stripe, but this scanner did not find refund, cancellation, billing, or manage-subscription copy.",
        whyItMatters:
          "Clear billing copy lowers support tickets, failed launches, and payment disputes.",
        fixPrompt:
          "Add clear refund and cancellation copy near pricing and billing pages. Explain how users can cancel and who to contact for billing issues.",
      }),
    );
  }

  return findings;
}
