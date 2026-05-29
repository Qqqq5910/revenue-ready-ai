"use client";

import { ArrowDownToLine } from "lucide-react";
import type { ScanReport } from "@/lib/scanner/types";

export function JsonExportButton({ report }: { report: ScanReport }) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "revenueready-ai-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportJson}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
    >
      <ArrowDownToLine className="h-4 w-4" aria-hidden />
      Export JSON
    </button>
  );
}
