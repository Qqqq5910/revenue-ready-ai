import {
  fileMatches,
  isBrowserFacingFile,
  lowerPath,
  testRegex,
  uniquePaths,
} from "../fileFilters";
import { safeEvidenceSnippet } from "../maskSecrets";
import type { Finding, ScannedFile } from "../types";
import { makeFinding } from "./helpers";

const clientPaidStatePattern =
  /\b(?:paid|isPaid|isPremium|premium|subscriptionStatus)\s*(?:=|:)\s*(?:true|["'`](?:active|paid|pro|premium|enterprise)["'`])|localStorage\.[\s\S]{0,80}(?:premium|paid|subscription)|(?:searchParams|URLSearchParams|location\.search)[\s\S]{0,120}success\s*=?\s*["'`]?true/i;

export function analyzePaywall(files: ScannedFile[]): Finding[] {
  const suspiciousClientFiles = fileMatches(files, clientPaidStatePattern, (file) => {
    const path = lowerPath(file);
    return isBrowserFacingFile(file) || path.includes("/app/page.");
  });

  if (suspiciousClientFiles.length === 0) {
    return [];
  }

  return [
    makeFinding({
      id: "client-side-payment-success-trust",
      title: "Client-side code appears to trust paid or premium state",
      severity: "critical",
      category: "Paywall Bypass Risk",
      affectedFiles: uniquePaths(suspiciousClientFiles),
      evidenceSnippet: safeEvidenceSnippet(
        suspiciousClientFiles[0].content,
        clientPaidStatePattern,
      ),
      scannerRule: "paywall.clientSidePaymentSuccessTrust",
      explanation:
        "Browser-facing code contains paid or premium flags, localStorage subscription state, or success=true logic that may unlock paid features.",
      whyItMatters:
        "Anything controlled by the browser can be changed by users. Revenue access should come from server-side entitlements backed by verified payment events.",
      fixPrompt:
        "Move paid entitlement checks to the server. Do not trust client-side flags, localStorage, or success query parameters. Store subscription state server-side based on verified Stripe webhooks. Add a server-side helper like getUserEntitlements(userId), and make protected paid features call it before returning data.",
    }),
  ];
}

export function hasClientPaidState(content: string) {
  return testRegex(clientPaidStatePattern, content);
}
