import type { Category } from "@/lib/scanner/types";

const categoryAccent: Record<Category, string> = {
  "Payments & Revenue": "bg-emerald-500",
  "Paywall Bypass Risk": "bg-red-500",
  "Secrets & Key Exposure": "bg-orange-500",
  "Supabase & Data Access": "bg-indigo-500",
  "Launch Basics": "bg-amber-500",
  Observability: "bg-sky-500",
};

export function ScoreCard({ category, score }: { category: Category; score: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-zinc-800">{category}</p>
        <p className="text-sm font-semibold">{score}/100</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-zinc-100">
        <div
          className={`h-2 rounded-full ${categoryAccent[category]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
