import { PolicyPage } from "@/components/policy-page";
import { PublicShell } from "@/components/public-shell";

export default function PrivacyPolicyPage() {
  return <PublicShell><PolicyPage title="Privacy Policy" intro="This page describes the categories of information that the platform may process and the general purposes for which it is used." sections={[
    { heading: "Public scholarly information", paragraphs: ["Published article and conference records can contain names, affiliations, countries, ORCID identifiers, publication dates, abstracts, keywords, DOI information, and other bibliographic metadata. Information intentionally published as part of the scholarly record may be publicly accessible."] },
    { heading: "Contact messages", paragraphs: ["When a visitor submits the contact form, the platform may store the name, email address, subject, message, timestamp, and basic operational metadata needed to respond and prevent abuse. Contact content should not contain passwords, payment credentials, or other unnecessary sensitive information."] },
    { heading: "Administrative accounts", paragraphs: ["Administrator authentication is handled through Firebase Authentication. Administrative credentials and service-account keys are not published on the public website."] },
    { heading: "Third-party services", paragraphs: ["The platform uses Firebase for authentication and database services and Backblaze B2 for object storage. Their own terms and privacy documentation also apply to processing performed within their services."] },
    { heading: "Retention", paragraphs: ["Publication records may be retained as part of the scholarly archive. Administrative and contact records should be retained only as long as operational, legal, or editorial needs require."] }
  ]}/></PublicShell>;
}
