import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://revenueready.ai"),
  title: {
    default: "RevenueReady AI — Check if your AI-built app is ready to charge users",
    template: "%s — RevenueReady AI",
  },
  description:
    "Scan AI-built apps for Stripe webhook issues, paywall bypass risk, leaked secrets, Supabase RLS problems, and launch-readiness gaps.",
  openGraph: {
    title: "RevenueReady AI — Check if your AI-built app is ready to charge users",
    description:
      "Scan AI-built apps for Stripe webhook issues, paywall bypass risk, leaked secrets, Supabase RLS problems, and launch-readiness gaps.",
    type: "website",
    url: "https://revenueready.ai",
    siteName: "RevenueReady AI",
  },
  twitter: {
    card: "summary",
    title: "RevenueReady AI — Check if your AI-built app is ready to charge users",
    description:
      "Scan AI-built apps for Stripe webhook issues, paywall bypass risk, leaked secrets, Supabase RLS problems, and launch-readiness gaps.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>RevenueReady AI v0.1.2 · Static analysis only.</p>
        <nav className="flex flex-wrap gap-4">
          <Link className="hover:text-zinc-950" href="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-zinc-950" href="/terms">
            Terms
          </Link>
          <Link className="hover:text-zinc-950" href="/security">
            Security
          </Link>
          <a className="hover:text-zinc-950" href="https://github.com/Qqqq5910/revenue-ready-ai">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
