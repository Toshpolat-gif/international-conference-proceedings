import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function RetractionCorrectionPolicyPage() {
  return <PublicShell><PolicyPage title="Retraction & Correction Policy" intro="The scholarly record should remain accurate while preserving a transparent history of publication changes." sections={[
    { heading: "Corrections", paragraphs: ["A correction may be issued when an error affects the accuracy or clarity of a published record but does not invalidate the paper as a whole. The publisher should describe the correction and link it to the original article."] },
    { heading: "Retractions", paragraphs: ["A retraction may be considered when reliable evidence indicates that published findings are sufficiently unreliable or publication was affected by a serious integrity problem. The retraction notice should identify the affected publication and explain the reason in a factual manner."] },
    { heading: "Expression of concern", paragraphs: ["When a credible issue is under investigation but available evidence is not yet sufficient for a final editorial action, the publisher may publish an expression of concern or equivalent notice where appropriate."] },
    { heading: "Persistent record", paragraphs: ["The publisher should retain the bibliographic record and clearly connect subsequent notices to the affected paper. The goal is to prevent readers from relying on an unqualified version of a materially affected publication."] }
  ]}/></PublicShell>;
}
