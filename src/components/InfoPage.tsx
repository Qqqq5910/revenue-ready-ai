import Link from "next/link";
import type { ReactNode } from "react";

export function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 lg:px-8">
          <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-900" href="/">
            RevenueReady AI
          </Link>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">{subtitle}</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-600 shadow-sm">
          {children}
        </div>
      </section>
    </main>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <div className="mt-3 space-y-3 text-zinc-600">{children}</div>
    </section>
  );
}
