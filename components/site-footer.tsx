import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>{siteConfig.name}</h3>
          <p>International scholarly conference proceedings and research paper publication platform.</p>
          <p><strong>Location:</strong> {siteConfig.location}</p>
        </div>
        <div>
          <h4>Publishing</h4>
          <div className="footer-links">
            <Link href="/for-authors">For Authors</Link>
            <Link href="/publication-ethics">Publication Ethics</Link>
            <Link href="/peer-review-policy">Peer Review Policy</Link>
            <Link href="/plagiarism-policy">Plagiarism Policy</Link>
            <Link href="/copyright-policy">Copyright Policy</Link>
          </div>
        </div>
        <div>
          <h4>Policies &amp; Information</h4>
          <div className="footer-links">
            <Link href="/retraction-correction-policy">Retraction &amp; Correction</Link>
            <Link href="/ai-use-policy">AI Use Policy</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-use">Terms of Use</Link>
            <Link className="footer-email" href="/contact">{siteConfig.email}</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {siteConfig.name}</span>
        <span>International • English-language publication platform</span>
      </div>
    </footer>
  );
}
