"use client";

import { Clipboard, Radar } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, type Category, type Finding, type ScanReport } from "@/lib/scanner/types";
import { FeedbackCta } from "./FeedbackCta";
import { FindingCard } from "./FindingCard";
import { JsonExportButton } from "./JsonExportButton";
import { ScoreCard } from "./ScoreCard";

export function ReportView({ report }: { report: ScanReport | null }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Revenue readiness report</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Static analysis only. This does not guarantee security, compliance, or
            payment correctness. Use it as a preflight checklist before launch.
          </p>
        </div>
        {report ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                document.getElementById("scanner-card")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Run another scan
            </button>
            <JsonExportButton report={report} />
          </div>
        ) : null}
      </div>

      {report ? <ReportContent report={report} /> : <EmptyReportState />}
    </section>
  );
}

function ReportContent({ report }: { report: ScanReport }) {
  const highRiskCount = report.findings.filter(
    (finding) => finding.severity === "critical" || finding.severity === "high",
  ).length;

  return (
    <div className="mt-6 space-y-6">
      {report.source.label.includes("Sample report") ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          Sample report — no code uploaded
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm font-medium text-zinc-500">Overall RevenueReady Score</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-6xl font-semibold tracking-normal">
              {report.overallScore}
            </span>
            <span className="pb-2 text-lg text-zinc-500">/100</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-zinc-800">
            {scoreLabel(report.overallScore)}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {highRiskCount} critical or high-risk findings.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <ScoreCard
              key={category}
              category={category}
              score={report.categoryScores[category]}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 sm:grid-cols-4">
        <Stat label="Source" value={report.source.label} />
        <Stat label="Files scanned" value={String(report.stats.scannedFiles)} />
        <Stat label="Bytes scanned" value={formatBytes(report.stats.scannedBytes)} />
        <Stat label="Scanner" value={report.scannerVersion} />
      </div>

      <div className="space-y-6">
        {highRiskCount === 0 ? <LaunchVerificationPlan report={report} /> : null}
        <LaunchFixPlanView report={report} />
        {CATEGORIES.map((category) => (
          <FindingGroup
            key={category}
            category={category}
            findings={report.findings.filter((finding) => finding.category === category)}
          />
        ))}
        <FeedbackCta />
      </div>
    </div>
  );
}

function LaunchFixPlanView({ report }: { report: ScanReport }) {
  const [copied, setCopied] = useState(false);
  const plan = report.launchFixPlan;

  async function copyPrompt() {
    await navigator.clipboard.writeText(plan.consolidatedRepairPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-emerald-950">Launch Fix Plan</h3>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            What should I fix before charging users? Start with payment trust,
            paywall bypasses, leaked keys, and data access.
          </p>
        </div>
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
        >
          <Clipboard className="h-4 w-4" aria-hidden />
          {copied ? "Copied" : "Copy repair prompt"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-emerald-200 bg-white p-4">
          <h4 className="font-semibold text-zinc-900">Top 3 revenue blockers</h4>
          <div className="mt-3 space-y-3">
            {plan.topRevenueBlockers.length > 0 ? (
              plan.topRevenueBlockers.map((blocker, index) => (
                <div key={blocker.findingId} className="rounded-md bg-zinc-50 p-3">
                  <p className="text-sm font-semibold text-zinc-900">
                    {index + 1}. {blocker.title}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase text-zinc-500">
                    {blocker.severity} · {blocker.category}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{blocker.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-zinc-600">
                No critical or high revenue blockers were found.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <FixPath title="30-minute fix path" items={plan.thirtyMinuteFixes} />
          <FixPath title="2-hour fix path" items={plan.twoHourFixes} />
          <FixPath title="1-day fix path" items={plan.oneDayFixes} />
        </div>
      </div>

      <div className="mt-4 rounded-md bg-zinc-950 p-3 text-sm leading-6 text-zinc-100">
        <pre className="whitespace-pre-wrap font-sans">{plan.consolidatedRepairPrompt}</pre>
      </div>
    </section>
  );
}

function FixPath({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-white p-4">
      <h4 className="font-semibold text-zinc-900">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LaunchVerificationPlan({ report }: { report: ScanReport }) {
  const passedCategories = CATEGORIES.filter(
    (category) =>
      !report.findings.some(
        (finding) =>
          finding.category === category &&
          (finding.severity === "critical" || finding.severity === "high"),
      ),
  );

  return (
    <section className="rounded-md border border-sky-200 bg-sky-50 p-4">
      <h3 className="text-xl font-semibold text-sky-950">Launch Verification Plan</h3>
      <p className="mt-2 text-sm leading-6 text-sky-900">
        No critical or high-risk findings were found by static analysis. That is
        a good sign, but it does not prove the app is safe to charge users.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-sky-200 bg-white p-3">
          <h4 className="font-semibold text-zinc-900">What passed</h4>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            No critical or high blockers were detected in{" "}
            {passedCategories.join(", ")}.
          </p>
        </div>
        <div className="rounded-md border border-sky-200 bg-white p-3">
          <h4 className="font-semibold text-zinc-900">What static analysis cannot prove</h4>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            It cannot prove production Stripe events, cancellations, refunds,
            entitlement access, or Supabase policies are configured correctly.
          </p>
        </div>
        <div className="rounded-md border border-sky-200 bg-white p-3">
          <h4 className="font-semibold text-zinc-900">Manual checks before charging</h4>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
            {[
              "Test Stripe checkout, webhook events, cancellations, refunds, and paid-feature access.",
              "Review production Supabase RLS policies directly in Supabase.",
              "Rotate any key that may have been exposed historically.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FindingGroup({
  category,
  findings,
}: {
  category: Category;
  findings: Finding[];
}) {
  if (findings.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{category}</h3>
        <span className="text-sm text-zinc-500">{findings.length} findings</span>
      </div>
      <div className="space-y-4">
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function EmptyReportState() {
  return (
    <div className="mt-6 grid min-h-80 place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-white text-zinc-700 shadow-sm">
          <Radar className="h-6 w-6" aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Your report will appear here</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
          Revenue score, bypass risks, affected files, and copyable fix prompts
          are generated after the scan.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-zinc-400">{label}</p>
      <p className="mt-1 break-words font-medium text-zinc-800">{value}</p>
    </div>
  );
}

function scoreLabel(score: number) {
  if (score >= 90) {
    return "Ready to charge";
  }

  if (score >= 75) {
    return "Almost ready";
  }

  if (score >= 50) {
    return "Needs fixes before charging";
  }

  return "Not ready to charge";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 102.4) / 10} KB`;
  }

  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}
