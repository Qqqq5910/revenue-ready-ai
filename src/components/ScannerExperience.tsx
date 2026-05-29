"use client";

import { CheckCircle2, Radar, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { sampleReport } from "@/lib/sampleReport";
import { SCANNER_VERSION } from "@/lib/scanner/constants";
import type { ScanReport } from "@/lib/scanner/types";
import { FeedbackCta } from "./FeedbackCta";
import { ReportView } from "./ReportView";
import { ScannerForm } from "./ScannerForm";

const checks = [
  "Stripe webhooks and checkout flow",
  "Paywall bypass risk in browser code",
  "Leaked API and payment secrets",
  "Supabase RLS and service-role exposure",
  "Refund, support, privacy, and terms basics",
  "Analytics, error tracking, and payment logs",
];

const builders = ["Lovable", "Bolt", "Replit", "Cursor", "v0", "Claude Code"];
const outputs = [
  "RevenueReady Score",
  "Category scores",
  "Top revenue blockers",
  "Launch Fix Plan",
  "Copyable AI repair prompt",
  "JSON export",
];
const nonGoals = [
  "Does not guarantee security or compliance",
  "Does not replace a real security review",
  "Does not modify code or create PRs",
  `Does not scan private repos in v${SCANNER_VERSION}`,
  "Does not store projects or reports",
];

export function ScannerExperience() {
  const [report, setReport] = useState<ScanReport | null>(null);

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              <Radar className="h-4 w-4" aria-hidden />
              RevenueReady AI v{SCANNER_VERSION}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl lg:text-6xl">
              Is your AI-built app ready to charge users?
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Scan for leaked secrets, weak Supabase rules, broken Stripe flows,
              bypassable paywalls, missing refund/support pages, and
              launch-readiness gaps.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              AI can make a demo fast. RevenueReady checks whether it is safe to
              charge users before you connect Stripe or launch publicly.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              {[
                "Built for AI-made apps",
                "Deterministic static checks",
                "No code execution or AI calls",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <section id="scanner-card" className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
            <ScannerForm onReport={setReport} />
            <div className="mt-4">
              <FeedbackCta compact />
            </div>
          </section>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <div className="space-y-6">
          <ExampleReportPreview />
          <TrySampleReport onSample={() => setReport(sampleReport)} />
          <WhatWeCheck />
          <BuiltForAiApps />
          <WhatYouGet />
          <WhatItDoesNotDo />
        </div>
        <ReportView report={report} />
      </section>
    </main>
  );
}

function TrySampleReport({ onSample }: { onSample: () => void }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-emerald-950">
        Try it without uploading code
      </h2>
      <p className="mt-2 text-sm leading-6 text-emerald-900">
        Open a realistic sample report with payment, paywall, Supabase, launch,
        and observability findings.
      </p>
      <button
        type="button"
        onClick={onSample}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        View sample report
      </button>
    </section>
  );
}

function ExampleReportPreview() {
  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-white">
          <WalletCards className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Example report preview</h2>
          <p className="text-sm text-zinc-500">Founder-friendly revenue checks.</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {[
          ["Payments", 44, "Webhook signature verification missing"],
          ["Paywall", 38, "Client code trusts isPremium = true"],
          ["Secrets", 65, "Webhook secret found in source"],
          ["Supabase", 72, "RLS evidence missing"],
          ["Observability", 86, "Payment failure logging missing"],
        ].map(([label, score, note]) => (
          <div key={label} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-zinc-800">{label}</span>
              <span className="text-sm font-semibold">{score}/100</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{note}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function WhatWeCheck() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">What we check</h2>
      <div className="mt-4 grid gap-3">
        {checks.map((check) => (
          <div key={check} className="flex items-start gap-2 text-sm text-zinc-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{check}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BuiltForAiApps() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Built for AI-made apps</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        RevenueReady AI is tuned for founders moving from demo to first paid
        users, especially apps generated with tools like:
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Before you connect Stripe or launch publicly, scan for the mistakes AI
        coding tools commonly miss.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {builders.map((builder) => (
          <span
            key={builder}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700"
          >
            {builder}
          </span>
        ))}
      </div>
    </section>
  );
}

function WhatYouGet() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">What you get</h2>
      <div className="mt-4 grid gap-3">
        {outputs.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-zinc-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhatItDoesNotDo() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">What it does not do</h2>
      <div className="mt-4 grid gap-3">
        {nonGoals.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-zinc-600">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
