import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getPublishedArticles, getPublishedConferences } from "@/lib/public-data";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  let conferences: Awaited<ReturnType<typeof getPublishedConferences>> = [];
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  try {
    [conferences, articles] = await Promise.all([getPublishedConferences(6), getPublishedArticles(6)]);
  } catch {
    // The public shell still renders before Firebase is configured.
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/site-logo.png`,
    description: siteConfig.description,
  };

  return (
    <PublicShell>
            <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">International scholarly publishing</span>
            <h1>Conference research, <span>published for the world.</span></h1>
            <p>International Conference Proceedings provides a structured home for discovering, reading, downloading, and citing research papers presented at international conferences.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/articles">Explore Articles</Link>
              <Link className="btn btn-tiffany" href="/conferences">View Conferences</Link>
            </div>
          </div>
          <div className="hero-card">
            <div className="logo-frame">
              <img
                className="logo-large"
                src="https://international-conference-proceedings.s3.ca-east-006.backblazeb2.com/Poster.png"
                alt="International Conference Proceedings"
                width={1254}
                height={1254}
                fetchPriority="high"
              />
            </div>
            <div className="hero-card-grid">
              <div className="mini-stat"><strong>{conferences.length}</strong><span>Featured conferences</span></div>
              <div className="mini-stat"><strong>{articles.length}</strong><span>Featured articles</span></div>
              <div className="mini-stat"><strong>EN</strong><span>Publication language</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Upcoming &amp; published</span>
              <h2>Conferences</h2>
              <p className="section-intro">Browse conference editions, proceedings information, and the research papers associated with each event.</p>
            </div>
            <Link className="btn btn-ghost" href="/conferences">All Conferences</Link>
          </div>
          {conferences.length ? <div className="cards">{conferences.map((c) => <article className="card" key={c.id}><div className="poster-wrap">{c.posterKey ? <img className="poster-img" src={`/api/conferences/${c.id}/poster`} alt={`${c.title} poster`} /> : <div className="poster-placeholder"><strong>{c.acronym || "ICP"}</strong><br />International Conference</div>}</div><div className="card-body"><div className="card-meta"><span className="chip chip-avocado">International</span>{c.eventType && <span className="chip">{c.eventType}</span>}</div><h3>{c.title}</h3><p>{c.theme}</p><Link className="card-link" href={`/conferences/${c.slug}`}>View conference →</Link></div></article>)}</div> : <div className="empty">No conferences have been published yet.</div>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title-row"><div><span className="eyebrow">Latest research</span><h2>Published Articles</h2></div><Link className="btn btn-ghost" href="/articles">Browse Articles</Link></div>
          {articles.length ? <div className="cards">{articles.map((a) => <article className="card" key={a.id}><div className="card-body"><div className="card-meta"><span className="chip">Article</span><span className="chip chip-mango">English</span></div><h3>{a.title}</h3><p>{a.authors.map((x) => x.fullName).join(", ")}</p><Link className="card-link" href={`/articles/${a.slug}`}>Read article →</Link></div></article>)}</div> : <div className="empty">No published articles are available yet.</div>}
        </div>
      </section>

      <section className="section section-muted">
        <div className="container split">
          <div className="panel"><span className="eyebrow">For researchers</span><h3>Clear publication and citation information</h3><p className="muted">Each published paper can expose author affiliations, ORCID, publication metadata, DOI when available, PDF access, and formatted citations.</p><Link className="card-link" href="/for-authors">View author requirements →</Link></div>
          <div className="proceedings-banner"><h3>Built for discoverability</h3><p>Article-level pages are structured for scholarly metadata, citation export, and long-term discoverability.</p><div className="hero-actions"><Link className="btn btn-tiffany" href="/articles">Search the archive</Link></div></div>
        </div>
      </section>
    </PublicShell>
  );
}
