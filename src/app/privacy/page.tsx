import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How RevenueReady AI handles uploaded zip files and public GitHub scans.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy"
      subtitle="Clear, honest handling notes for the public RevenueReady AI demo."
    >
      <InfoSection title="What the scanner does">
        <p>
          RevenueReady AI v0.1 does static analysis only. It reads text files in
          an uploaded zip file or public GitHub archive and returns a scan report
          in the response.
        </p>
        <p>
          Uploaded zip files and GitHub repo contents are processed for the scan
          response. v0.1 does not intentionally persist uploaded source code or
          scan reports.
        </p>
      </InfoSection>

      <InfoSection title="Public GitHub scans">
        <p>
          Public GitHub repo scanning downloads public code only. Private repo
          access and GitHub OAuth are not implemented in v0.1.
        </p>
      </InfoSection>

      <InfoSection title="Use good judgment">
        <p>
          Do not upload highly sensitive private code to a public demo unless
          private scanning and stronger data-handling controls are implemented
          later.
        </p>
        <p>
          RevenueReady AI is not a guarantee of security, compliance, or payment
          correctness. Treat it as a preflight checklist before launch.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>Contact: 13916903034@163.com</p>
      </InfoSection>
    </InfoPage>
  );
}
