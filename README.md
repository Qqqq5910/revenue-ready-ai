# RevenueReady AI

RevenueReady AI is a v0.1.2 revenue-readiness scanner for founders shipping
AI-built web apps from tools such as Lovable, Bolt, Replit, Cursor, v0, and
Claude Code.

It accepts a public GitHub repo URL or an uploaded `.zip` archive, scans text
files only, and returns a deterministic report with:

- Overall RevenueReady Score.
- Category scores.
- Top revenue blockers.
- Launch Fix Plan.
- Findings grouped by category.
- Safe evidence snippets.
- Copyable fix prompts and one consolidated AI repair prompt.
- JSON export.

Static analysis only. This does not guarantee security, compliance, or payment
correctness. Use it as a preflight checklist before launch.

## What It Does

- Checks whether payment state can be trusted before you charge users.
- Looks for bypassable client-side paid or premium flags.
- Looks for leaked payment, AI, email, Firebase, and Supabase secrets.
- Checks common Supabase RLS and service-role mistakes.
- Checks minimum launch basics such as privacy, terms, support, refunds, and
  cancellation copy.
- Checks whether error tracking, analytics, and payment failure logging appear
  to exist.
- Generates a deterministic Launch Fix Plan and repair prompt for
  Cursor/Codex/Claude Code.

## What It Does Not Do

- No user accounts.
- No billing for this product.
- No database persistence.
- No GitHub OAuth or private repo access.
- No AI model calls.
- No automatic PR creation or code modification.
- No PDF export.
- No guarantee of security, compliance, or payment correctness.

## Local Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required for v0.1.2.

## Quality Commands

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm smoke
```

## Vercel Deploy

Import the repo in Vercel as a Next.js project and use the default build command:

```bash
pnpm build
```

No environment variables are required for v0.1.2.

With the Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

The scan API uses the Node.js runtime and does not rely on local filesystem
persistence.

## Scanner Limits

- Max archive size: 8 MB.
- Max scanned text files: 700.
- Max total scanned text: 4 MB.
- Max individual text file: 256 KB.
- Scan API max duration: 20 seconds.
- Health API max duration: 5 seconds.
- Ignored directories include `node_modules`, `.next`, `dist`, `build`, `.git`,
  `coverage`, `.vercel`, cache folders, output folders, and generated files.
- Lockfiles and binary files are ignored.

The scanner never executes scanned code.

## GitHub URL Support

Supported public URL shapes:

- `https://github.com/owner/repo`
- `https://github.com/owner/repo.git`
- `https://github.com/owner/repo/tree/main`
- `https://github.com/owner/repo/tree/feature/some-branch`

Private repos and GitHub OAuth are intentionally out of scope for v0.1.2. If a
public repo fetch fails because of rate limits or repo size, upload a `.zip`
instead.

## Public Pages

- `/privacy`
- `/terms`
- `/security`
- `/api/health`
- `/robots.txt`
- `/sitemap.xml`

## First Public Launch Checklist

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm smoke
```

Then verify:

- Deploy preview loads.
- Sample report opens from “View sample report.”
- One public GitHub repo scan works.
- `/privacy`, `/terms`, and `/security` render.
- `/api/health` returns scanner version and limits.
- Zip upload error handling is founder-friendly.
- JSON export downloads a report.
- Copy buttons work for individual fixes and the consolidated repair prompt.

## Known False Positives And False Negatives

RevenueReady AI uses deterministic text rules. It can miss issues hidden behind
unusual abstractions, generated code, minified bundles, or nonstandard payment
providers. It can also flag placeholders or intentionally public demo code.
Treat the report as a launch checklist, not a formal security audit.

## Privacy Note

v0.1.2 does not persist uploaded repos or scan results. Uploaded zip files and
GitHub archives are scanned in memory for the request and discarded.

Do not upload highly sensitive private code to a public demo unless private
scanning and stronger data-handling controls are implemented later.
