import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function PublicationEthicsPage() {
  return <PublicShell><PolicyPage title="Publication Ethics" intro="International Conference Proceedings aims to maintain responsible, transparent, and documented scholarly publishing practices." sections={[
    { heading: "Purpose", paragraphs: ["This policy describes the responsibilities of authors, editors, reviewers, and the publisher in protecting the integrity of the scholarly record.", "The policy is designed as a general publishing framework and should be applied consistently to published conference papers."] },
    { heading: "Responsibilities", bullets: ["Authors should submit original work, acknowledge sources, disclose relevant conflicts of interest, and ensure that all listed contributors satisfy the publisher's authorship requirements.", "Editors should make publication decisions using relevant scholarly criteria and should handle submitted information confidentially.", "Reviewers should evaluate manuscripts objectively, protect confidentiality, and disclose conflicts that could affect impartiality.", "The publisher should maintain clear records of publication decisions, corrections, and post-publication actions."] },
    { heading: "Conflicts of interest", paragraphs: ["Authors, editors, and reviewers should disclose relationships or interests that could reasonably be perceived as affecting a publication decision or scholarly assessment."] },
    { heading: "Complaints and appeals", paragraphs: ["Questions about editorial decisions, publication ethics, or published material may be submitted through the publisher's designated contact channel. Submissions should identify the relevant article or conference record and provide sufficient detail for review."] },
    { heading: "Post-publication integrity", paragraphs: ["When credible concerns arise after publication, the publisher may investigate and, where appropriate, issue a correction, retraction, or other editorial notice. The public record should explain the nature of the action."] }
  ]}/></PublicShell>;
}
