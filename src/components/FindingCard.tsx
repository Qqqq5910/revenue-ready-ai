"use client";

import { Clipboard } from "lucide-react";
import { useState } from "react";
import type { Finding } from "@/lib/scanner/types";

const severityStyles: Record<Finding["severity"], string> = {
  critical: "bg-red-50 text-red-700 ring-red-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-sky-50 text-sky-700 ring-sky-200",
  info: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export function FindingCard({ finding }: { finding: Finding }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(finding.fixPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ring-1 ${severityStyles[finding.severity]}`}
            >
              {finding.severity}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              {finding.category}
            </span>
          </div>
          <h4 className="mt-3 text-lg font-semibold">{finding.title}</h4>
        </div>
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          <Clipboard className="h-4 w-4" aria-hidden />
          {copied ? "Copied" : "Copy fix"}
        </button>
      </div>

      {finding.affectedFiles.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {finding.affectedFiles.map((filePath) => (
            <code
              key={filePath}
              className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
            >
              {filePath}
            </code>
          ))}
        </div>
      ) : null}

      {finding.evidenceSnippet ? (
        <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-400">Evidence</p>
          <code className="mt-1 block break-words text-xs leading-5 text-zinc-700">
            {finding.evidenceSnippet}
          </code>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-400">What we found</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{finding.explanation}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-400">Why it matters</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{finding.whyItMatters}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs font-semibold uppercase text-zinc-400">
          What to verify manually
        </p>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          {manualVerificationFor(finding)}
        </p>
      </div>

      <div className="mt-3 rounded-md bg-zinc-950 p-3 text-sm leading-6 text-zinc-100">
        {finding.fixPrompt}
      </div>
      <p className="mt-2 text-xs text-zinc-400">Rule: {finding.scannerRule}</p>
    </article>
  );
}

function manualVerificationFor(finding: Finding) {
  if (finding.scannerRule === "payments.stripeWebhookSignatureVerification") {
    return "Verify the webhook route reads the raw body, reads the Stripe-Signature header, and calls stripe.webhooks.constructEvent before updating subscription state.";
  }

  if (finding.category === "Paywall Bypass Risk") {
    return "Verify paid features are checked server-side, not only through client state, localStorage, query params, or UI flags.";
  }

  if (finding.category === "Supabase & Data Access") {
    return "Verify production tables have RLS enabled and policies scoped to auth.uid(), team membership, or explicit roles.";
  }

  if (finding.category === "Secrets & Key Exposure") {
    return "Rotate any real exposed key immediately, even if it only appeared in a test branch or old commit. Keep secrets server-side only.";
  }

  if (finding.category === "Launch Basics") {
    return "Verify privacy, terms, support, refund, and cancellation copy match your actual product, payment flow, and jurisdiction.";
  }

  if (finding.category === "Observability") {
    return "Verify production errors, checkout failures, webhook failures, and subscription updates are visible in logs or error tracking.";
  }

  return "Review the affected files and confirm the finding matches the production behavior before charging users.";
}
