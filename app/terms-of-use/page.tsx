import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function TermsOfUsePage() {
  return <PublicShell><PolicyPage title="Terms of Use" intro="These general terms govern use of the International Conference Proceedings website and its published scholarly content." sections={[
    { heading: "Permitted use", paragraphs: ["Visitors may access published conference information and papers for lawful research, education, citation, and other legitimate scholarly purposes, subject to applicable copyright and license terms."] },
    { heading: "Accuracy", paragraphs: ["Conference and article records are provided from publication metadata supplied to the platform. Users should verify critical bibliographic information against the published PDF, DOI record, or other authoritative source when necessary."] },
    { heading: "Copyright and licenses", paragraphs: ["The reuse of a paper, figure, table, or other work is governed by the copyright and license information attached to that record and by applicable law."] },
    { heading: "Availability", paragraphs: ["The publisher may maintain, update, move, correct, or temporarily disable pages and files for editorial, technical, security, or legal reasons."] },
    { heading: "Contact", paragraphs: ["Questions concerning a specific article or publication record can be submitted through the publisher's designated contact page."] }
  ]}/></PublicShell>;
}
