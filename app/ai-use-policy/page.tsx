import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function AIUsePolicyPage() {
  return <PublicShell><PolicyPage title="AI Use Policy" intro="AI-assisted tools may support scholarly work, but responsibility for the submitted and published content remains with the human authors." sections={[
    { heading: "Authorship", paragraphs: ["AI systems and tools should not be listed as authors because they cannot take responsibility for the accuracy, integrity, originality, and accountability required of an author."] },
    { heading: "Permitted assistance", bullets: ["Language editing or grammar improvement.", "Brainstorming, outlining, or other limited support that is critically reviewed by the authors.", "Technical assistance with formatting or code when the authors can verify the result."] },
    { heading: "Disclosure", paragraphs: ["Authors should disclose material use of generative AI when it contributes to the submitted work in a way that readers or editors would reasonably need to understand. The disclosure should identify the tool and the nature of its use."] },
    { heading: "Verification", paragraphs: ["Authors remain responsible for checking citations, factual claims, quotations, data, figures, translations, and generated text. AI tools can produce incorrect or fabricated information and should not be treated as an authoritative source without verification."] },
    { heading: "Confidentiality", paragraphs: ["Authors and reviewers should consider confidentiality, privacy, intellectual property, and contractual restrictions before submitting unpublished or sensitive material to third-party AI systems."] }
  ]}/></PublicShell>;
}
