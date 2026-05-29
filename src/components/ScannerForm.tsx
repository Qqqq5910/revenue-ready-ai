"use client";

import { AlertTriangle, FileArchive, GitBranch, Loader2, Sparkles } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { DEFAULT_LIMITS } from "@/lib/scanner/constants";
import { sampleReport } from "@/lib/sampleReport";
import type { ScanReport } from "@/lib/scanner/types";

const limitCopy = [
  `Max zip size: ${formatMb(DEFAULT_LIMITS.maxArchiveBytes)}`,
  `Max files scanned: ${DEFAULT_LIMITS.maxFiles}`,
  `Max file size: ${formatKb(DEFAULT_LIMITS.maxFileBytes)}`,
  `Max scanned text: ${formatMb(DEFAULT_LIMITS.maxTotalTextBytes)}`,
  "Public GitHub repos only",
];

export function ScannerForm({ onReport }: { onReport: (report: ScanReport) => void }) {
  const [mode, setMode] = useState<"github" | "zip">("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsScanning(true);

    try {
      const formData = new FormData();

      if (mode === "github") {
        formData.append("repoUrl", repoUrl);
      } else if (file) {
        formData.append("archive", file);
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        report?: ScanReport;
        error?: { message: string; code?: string };
      };

      if (!response.ok || !payload.report) {
        throw new Error(friendlyError(payload.error?.message, payload.error?.code));
      }

      onReport(payload.report);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Scan your app</h2>
          <p className="text-sm text-zinc-500">Public GitHub repo or .zip upload.</p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 rounded-md bg-zinc-100 p-1">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
              mode === "github"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
            onClick={() => setMode("github")}
          >
            <GitBranch className="h-4 w-4" aria-hidden />
            GitHub URL
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
              mode === "zip"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
            onClick={() => setMode("zip")}
          >
            <FileArchive className="h-4 w-4" aria-hidden />
            Zip upload
          </button>
        </div>

        {mode === "github" ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Public repo URL</span>
            <input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              className="mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-4 text-base outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
            />
          </label>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="flex min-h-32 w-full flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileArchive className="mb-3 h-8 w-8 text-zinc-500" aria-hidden />
              <span className="font-medium text-zinc-800">
                {file ? file.name : "Choose a .zip archive"}
              </span>
              <span className="mt-1 text-sm text-zinc-500">
                Max 8 MB archive, text files only.
              </span>
            </button>
          </div>
        )}

        {error ? (
          <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {isScanning ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
            <p className="font-semibold">Scanning for revenue blockers...</p>
            <p>Checking payments, secrets, Supabase, launch basics, and observability.</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isScanning || (mode === "github" ? !repoUrl : !file)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          {isScanning ? "Scanning..." : "Scan your app"}
        </button>
        <button
          type="button"
          onClick={() => onReport(sampleReport)}
          className="flex h-11 w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          View sample report
        </button>
        <div className="rounded-md bg-zinc-50 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-400">Scan limits</p>
          <ul className="mt-2 grid gap-1 text-xs leading-5 text-zinc-600 sm:grid-cols-2">
            {limitCopy.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}

function friendlyError(message?: string, code?: string) {
  if (code === "INVALID_GITHUB_URL") {
    return "That GitHub URL does not look supported. Use https://github.com/owner/repo or a /tree/branch URL.";
  }

  if (code === "FETCH_FAILED") {
    return message ?? "GitHub could not return that public repo. It may be private, unavailable, too large, or rate limited. Try a zip upload instead.";
  }

  if (code === "INVALID_ARCHIVE") {
    return message ?? "That zip could not be read. Upload a valid .zip archive.";
  }

  if (code === "ARCHIVE_TOO_LARGE") {
    return message ?? "That zip is too large for the public demo.";
  }

  if (code === "TOO_MANY_FILES") {
    return message ?? "That project has too many readable files for the public demo.";
  }

  if (code === "NO_TEXT_FILES") {
    return "No readable source files were found. Upload a zip that contains text source files.";
  }

  if (code === "TEXT_BYTES_LIMIT") {
    return message ?? "That project has too much readable text for the public demo.";
  }

  return message ?? "Scan failed unexpectedly. Try a smaller zip or a public GitHub repo.";
}

function formatMb(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function formatKb(bytes: number) {
  return `${Math.round(bytes / 1024)} KB`;
}
