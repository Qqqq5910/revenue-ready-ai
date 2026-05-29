import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Security",
  description: "Security model and limitations for RevenueReady AI scans.",
};

export default function SecurityPage() {
  return (
    <InfoPage
      title="Security"
      subtitle="How the public demo keeps scanning bounded and honest."
    >
      <InfoSection title="Scanner safety model">
        <p>RevenueReady AI never executes scanned code.</p>
        <p>
          It reads text files only, ignores generated and binary folders where
          practical, and enforces limits on archive size, file count, individual
          file size, and total scanned text bytes.
        </p>
        <p>
          Detected secrets are masked in evidence snippets. The report should
          show enough context to fix a problem without printing full secret
          values.
        </p>
      </InfoSection>

      <InfoSection title="Current limitations">
        <p>
          v0.1 has no private repo auth, no persistent audit trail, no human
          review, and no guarantee that every issue will be detected.
        </p>
        <p>
          Static analysis can miss issues hidden behind unusual abstractions,
          generated files, or runtime-only behavior.
        </p>
      </InfoSection>

      <InfoSection title="Responsible disclosure">
        <p>
          If you find a vulnerability in RevenueReady AI itself, contact:
          13916903034@163.com
        </p>
      </InfoSection>
    </InfoPage>
  );
}
