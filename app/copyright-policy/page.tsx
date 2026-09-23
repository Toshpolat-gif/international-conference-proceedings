import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function CopyrightPolicyPage() {
  return <PublicShell><PolicyPage title="Copyright Policy" intro="Copyright and licensing terms should be made clear for every published paper and should match the publisher's agreement with authors." sections={[
    { heading: "Default principle", paragraphs: ["The copyright status and reuse license for an article should be stated on the article record. Authors should not transfer or grant rights beyond the terms they have agreed to with the publisher or conference organizer."] },
    { heading: "Third-party material", paragraphs: ["Authors are responsible for securing permission or confirming a lawful exception when reproducing material owned by third parties. Sources and permissions should be documented where appropriate."] },
    { heading: "Open licensing", paragraphs: ["Where an open license such as Creative Commons is applied, the exact license and a link to its terms should appear on the article page and, where practical, in the PDF."] },
    { heading: "Corrections and retractions", paragraphs: ["Changes to the publication record do not erase the history of a published article. Corrections, retractions, and related notices should be linked to the affected record so readers can understand what changed."] }
  ]}/></PublicShell>;
}
