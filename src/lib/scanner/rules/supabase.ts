import {
  fileMatches,
  hasAny,
  isBrowserFacingFile,
  lowerPath,
  pathOrContentMatches,
  uniquePaths,
} from "../fileFilters";
import { safeEvidenceSnippet } from "../maskSecrets";
import type { Finding, ScannedFile } from "../types";
import { makeFinding } from "./helpers";

const supabasePatterns = [
  /@supabase\/supabase-js/i,
  /\bcreateClient\b/i,
  /\bSUPABASE_URL\b/,
  /\bSUPABASE_ANON_KEY\b/,
  /\bSUPABASE_SERVICE_ROLE_KEY\b/,
  /\bservice_role\b/i,
  /\brow\s+level\s+security\b/i,
  /\bcreate\s+policy\b/i,
  /supabase\.from\s*\(/i,
];

const rlsEvidence =
  /enable\s+row\s+level\s+security|\balter\s+table\b|\bcreate\s+policy\b|\brow\s+level\s+security\b/i;
const broadPolicy = /\b(?:using|with\s+check)\s*\(\s*true\s*\)/i;
const serviceRole = /(?:SUPABASE_SERVICE_ROLE_KEY|service_role|service-role)/i;

export function analyzeSupabase(files: ScannedFile[]): Finding[] {
  const findings: Finding[] = [];
  const usesSupabase = hasAny(files, supabasePatterns);

  if (!usesSupabase) {
    return findings;
  }

  const serviceRoleInClient = fileMatches(
    files,
    serviceRole,
    (file) => isBrowserFacingFile(file) || lowerPath(file).includes("app/page."),
  );

  if (serviceRoleInClient.length > 0) {
    findings.push(
      makeFinding({
        id: "supabase-service-role-client",
        title: "Supabase service role appears in client-facing code",
        severity: "critical",
        category: "Supabase & Data Access",
        affectedFiles: uniquePaths(serviceRoleInClient),
        evidenceSnippet: safeEvidenceSnippet(serviceRoleInClient[0].content, serviceRole),
        scannerRule: "supabase.serviceRoleInClient",
        explanation:
          "The Supabase service role key or service_role reference appears in code that can be client-facing, such as app/page, components, pages, hooks, public, or a file with use client.",
        whyItMatters:
          "The service role bypasses RLS. If it reaches the browser, users may be able to read or change paid customer data.",
        fixPrompt:
          "Remove the Supabase service role key from client-facing code. Keep service role usage server-only. Create server routes or server actions for privileged operations. Use the anon/publishable key in the browser with RLS enabled.",
      }),
    );
  }

  const hasRlsEvidence = pathOrContentMatches(files, rlsEvidence);

  if (!hasRlsEvidence) {
    findings.push(
      makeFinding({
        id: "supabase-missing-rls-evidence",
        title: "No Supabase RLS evidence found",
        severity: "high",
        category: "Supabase & Data Access",
        affectedFiles: uniquePaths(fileMatches(files, /supabase/i)),
        scannerRule: "supabase.missingRlsEvidence",
        explanation:
          "The project uses Supabase, but the scanner did not find enable row level security, alter table, create policy, or RLS policy indicators.",
        whyItMatters:
          "Supabase apps can work perfectly in a demo while exposing every row if RLS is missing or incomplete.",
        fixPrompt:
          "Add Supabase migrations that enable row level security on user-owned tables. Create least-privilege policies based on auth.uid(). Add tests or SQL comments explaining which users can read/write each table.",
      }),
    );
  }

  const broadPolicies = fileMatches(files, broadPolicy);

  if (broadPolicies.length > 0) {
    findings.push(
      makeFinding({
        id: "supabase-broad-policy",
        title: "Overly broad Supabase RLS policy detected",
        severity: "high",
        category: "Supabase & Data Access",
        affectedFiles: uniquePaths(broadPolicies),
        evidenceSnippet: safeEvidenceSnippet(broadPolicies[0].content, broadPolicy),
        scannerRule: "supabase.overlyBroadRlsPolicy",
        explanation:
          "SQL contains using (true) or with check (true), which can make policies permissive on sensitive tables.",
        whyItMatters:
          "Broad policies may let one customer read or modify another customer's data, including paid subscription data.",
        fixPrompt:
          "Review broad RLS policies. Replace using (true) or with check (true) with policies scoped to auth.uid(), team membership, or explicit roles. Ensure users can only access their own records.",
      }),
    );
  }

  return findings;
}

export function projectUsesSupabase(files: ScannedFile[]) {
  return hasAny(files, supabasePatterns);
}
