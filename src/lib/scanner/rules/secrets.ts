import {
  fileMatches,
  isEnvFile,
  testRegex,
  uniquePaths,
} from "../fileFilters";
import { safeEvidenceSnippet } from "../maskSecrets";
import type { Finding, ScannedFile } from "../types";
import { makeFinding } from "./helpers";

const hardcodedSecretPattern =
  /\bsk_(?:live|test)_[A-Za-z0-9]{10,}\b|\bwhsec_[A-Za-z0-9]{10,}\b|\brk_live_[A-Za-z0-9]{10,}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{18,}\b|\bre_[A-Za-z0-9_-]{18,}\b|(?:OPENAI_API_KEY|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY|FIREBASE_PRIVATE_KEY|private_key)\s*[:=]\s*["'`][^"'`]{12,}["'`]|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i;

const dangerousPublicEnvPattern =
  /\b(?:NEXT_PUBLIC_|VITE_)[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE|OPENAI_API_KEY|STRIPE_SECRET|WEBHOOK_SECRET)[A-Z0-9_]*\b/;

export function analyzeSecrets(files: ScannedFile[]): Finding[] {
  const findings: Finding[] = [];
  const secretFiles = fileMatches(files, hardcodedSecretPattern);
  const publicEnvFiles = fileMatches(files, dangerousPublicEnvPattern);
  const envFiles = files.filter(isEnvFile);

  if (secretFiles.length > 0) {
    findings.push(
      makeFinding({
        id: "hardcoded-payment-or-api-secret",
        title: "Hardcoded payment or API secret detected",
        severity: "critical",
        category: "Secrets & Key Exposure",
        affectedFiles: uniquePaths(secretFiles),
        evidenceSnippet: safeEvidenceSnippet(secretFiles[0].content, hardcodedSecretPattern),
        scannerRule: "secrets.hardcodedPaymentOrApiSecret",
        explanation:
          "The scanner found a value or assignment that looks like a Stripe, OpenAI, Resend, Supabase service role, Firebase private key, or private key secret.",
        whyItMatters:
          "Leaked secrets can let attackers charge your account, read customer data, send emails as you, or bypass your app's server-side controls.",
        fixPrompt:
          "Remove the hardcoded secret from source code. Rotate the leaked key immediately in the provider dashboard. Move the new value into a server-only environment variable. Ensure it is never exposed through NEXT_PUBLIC_ or VITE_. Add a secret scanning check to CI.",
      }),
    );
  }

  if (publicEnvFiles.length > 0) {
    findings.push(
      makeFinding({
        id: "dangerous-public-env-var",
        title: "Dangerous public environment variable name detected",
        severity: "critical",
        category: "Secrets & Key Exposure",
        affectedFiles: uniquePaths(publicEnvFiles),
        evidenceSnippet: safeEvidenceSnippet(publicEnvFiles[0].content, dangerousPublicEnvPattern),
        scannerRule: "secrets.dangerousPublicEnvVar",
        explanation:
          "A NEXT_PUBLIC_ or VITE_ variable name contains secret-like terms such as SECRET, PRIVATE, SERVICE_ROLE, OPENAI_API_KEY, STRIPE_SECRET, or WEBHOOK_SECRET.",
        whyItMatters:
          "NEXT_PUBLIC_ and VITE_ values are shipped to the browser. If you put a secret there, users can read it from the app bundle.",
        fixPrompt:
          "Rename and move this variable to a server-only environment variable. Never expose secret keys through NEXT_PUBLIC_ or VITE_. Update all client code so it calls a server route instead of directly using the secret.",
      }),
    );
  }

  if (envFiles.length > 0) {
    findings.push(
      makeFinding({
        id: "env-file-included",
        title: "Real .env file appears to be included",
        severity: "high",
        category: "Secrets & Key Exposure",
        affectedFiles: uniquePaths(envFiles),
        scannerRule: "secrets.envFileIncluded",
        explanation:
          "A real environment file was included in the scan. .env.example is allowed, but .env, .env.local, .env.production, and .env.development should not be committed or shared.",
        whyItMatters:
          "Environment files often contain payment keys, database URLs, webhook secrets, and AI provider keys.",
        fixPrompt:
          "Remove real .env files from the repository. Add them to .gitignore. Keep only .env.example with placeholder values. Rotate any exposed secrets.",
      }),
    );
  }

  return findings;
}

export function containsDangerousPublicEnv(content: string) {
  return testRegex(dangerousPublicEnvPattern, content);
}
