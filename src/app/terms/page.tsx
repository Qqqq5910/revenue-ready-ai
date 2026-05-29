import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using RevenueReady AI as a static preflight checklist.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms"
      subtitle="RevenueReady AI is a preflight checklist, not a guarantee."
    >
      <InfoSection title="Static analysis only">
        <p>
          RevenueReady AI scans text files with deterministic rules. It does not
          execute scanned code, call AI models, modify repositories, or create
          pull requests.
        </p>
      </InfoSection>

      <InfoSection title="No guarantees">
        <p>
          The tool does not guarantee security, compliance, payment correctness,
          app-store approval, or revenue outcomes. You are responsible for
          reviewing findings, testing fixes, and deciding whether your app is
          ready to launch.
        </p>
      </InfoSection>

      <InfoSection title="Your responsibility">
        <p>
          You must have the right to scan the code you upload or the public
          repository URL you submit. Do not upload code you are not authorized to
          analyze.
        </p>
      </InfoSection>

      <InfoSection title="Not professional advice">
        <p>
          RevenueReady AI is provided as a founder-friendly preflight checklist.
          It is not legal advice, security advice, financial advice, or a
          substitute for a real security review.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>Contact: 13916903034@163.com</p>
      </InfoSection>
    </InfoPage>
  );
}
