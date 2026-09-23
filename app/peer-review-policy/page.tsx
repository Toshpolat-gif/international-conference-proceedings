import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function PeerReviewPolicyPage() {
  return <PublicShell><PolicyPage title="Peer Review Policy" intro="The publisher uses editorial and review procedures appropriate to the stated conference publication workflow." sections={[
    { heading: "Review model", paragraphs: ["The specific review model used for a conference should be stated in the conference's call for papers or author instructions. This platform does not automatically claim single-blind, double-blind, or open peer review unless that process has been configured and actually used by the conference organizers."] },
    { heading: "Reviewer responsibilities", bullets: ["Provide an objective assessment based on the scope and criteria supplied by the conference.", "Treat manuscripts and unpublished information as confidential.", "Identify relevant concerns about methodology, attribution, originality, or unsupported claims.", "Decline the assignment when a conflict of interest could impair impartial assessment."] },
    { heading: "Editorial decisions", paragraphs: ["Publication decisions remain the responsibility of the designated conference editorial team. Review recommendations inform decisions but do not, by themselves, constitute a publication guarantee."] },
    { heading: "Confidentiality", paragraphs: ["Submitted material should not be shared beyond those who need access for editorial, review, production, or integrity purposes."] }
  ]}/></PublicShell>;
}
