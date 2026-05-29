"use client";

import { Mail } from "lucide-react";

const contactEmail = "13916903034@163.com";

export function FeedbackCta({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`rounded-md border border-zinc-200 bg-white ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700">
          <Mail className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Found a false positive or confusing result?
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Email{" "}
            <a
              className="font-medium text-emerald-700 hover:text-emerald-800"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>{" "}
            with your scan result and what looked wrong.
          </p>
        </div>
      </div>
    </section>
  );
}
