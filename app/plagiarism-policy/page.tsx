import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function PlagiarismPolicyPage() {
  return <PublicShell><PolicyPage title="Plagiarism Policy" intro="The publisher expects submitted and published work to be appropriately attributed, original, and free from unacceptable duplication." sections={[
    { heading: "Scope", paragraphs: ["Plagiarism includes presenting another person's words, ideas, data, images, code, or other intellectual contributions as one's own without appropriate attribution. Unacceptable duplicate publication or substantial unattributed overlap may also raise publication-integrity concerns."] },
    { heading: "Screening", paragraphs: ["Conference organizers may use similarity-detection or editorial screening before publication. A similarity percentage alone does not determine whether plagiarism exists; editorial assessment must consider quotation, references, common terminology, legitimate overlap, and context."] },
    { heading: "Author responsibilities", bullets: ["Cite the sources that informed the work.", "Use quotation and paraphrase appropriately.", "Obtain permission where required for copyrighted third-party material.", "Disclose material reuse and related prior publications when relevant."] },
    { heading: "Suspected cases", paragraphs: ["When a credible concern is raised, the publisher may request clarification or supporting information and may consult the responsible editorial team. Confirmed serious cases can result in rejection, correction, retraction, or other action proportionate to the evidence."] }
  ]}/></PublicShell>;
}
