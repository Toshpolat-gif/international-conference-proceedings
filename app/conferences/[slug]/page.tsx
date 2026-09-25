import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { ProceedingsButton } from "@/components/proceedings-button";
import { getArticlesForConference, getConferenceBySlug } from "@/lib/public-data";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);

  if (!conference) {
    return {
      title: "Conference not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const conferenceUrl = `${siteConfig.url}/conferences/${conference.slug}`;

  return {
    title: conference.title,
    description:
      conference.description ||
      conference.theme ||
      siteConfig.description,

    alternates: {
      canonical: conferenceUrl
    },

    openGraph: {
      type: "website",
      title: conference.title,
      description:
        conference.description ||
        conference.theme ||
        siteConfig.description,
      url: conferenceUrl
    },

    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function ConferencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);
  if (!conference) { notFound(); throw new Error("Not found"); }
  const articles = await getArticlesForConference(conference.id).catch(() => []);

  const conferenceUrl = `${siteConfig.url}/conferences/${conference.slug}`;

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteConfig.url
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Conferences",
      item: `${siteConfig.url}/conferences`
    },
    {
      "@type": "ListItem",
      position: 3,
      name: conference.title,
      item: conferenceUrl
    }
  ]
};
  

  return (
  <PublicShell>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbJsonLd)
      }}
    />

    <section className="page-head container">
      <nav
        aria-label="Breadcrumb"
        style={{
          marginBottom: "18px",
          fontSize: "14px"
        }}
      >
        <Link href="/">Home</Link>
        <span aria-hidden="true"> → </span>
        <Link href="/conferences">Conferences</Link>
        <span aria-hidden="true"> → </span>
        <span>{conference.title}</span>
      </nav>
      <span className="eyebrow">International conference</span><h1>{conference.title}</h1><p>{conference.theme}</p></section><section className="section"><div className="container split"><div className="panel"><h3>Conference overview</h3><p>{conference.description}</p><table className="meta-table"><tbody><tr><td>Date</td><td>{conference.conferenceDate || "To be announced"}</td></tr><tr><td>Format</td><td>{conference.eventType || "Online"}</td></tr>
  <tr>
  <td>Proceedings</td>
  <td>
    {conference.proceedingsTitle &&
    conference.proceedingsTitle.trim().toLowerCase() !==
      conference.title.trim().toLowerCase()
      ? conference.proceedingsTitle
      : "Conference proceedings"}
  </td>
</tr>
<tr><td>Volume</td><td>{conference.volume || "—"}</td></tr><tr><td>Issue</td><td>{conference.issue || "—"}</td></tr><tr><td>Publication date</td><td>{conference.publicationDate || "—"}</td></tr><tr><td>Editors</td><td>{conference.editors?.join(", ") || "—"}</td></tr></tbody></table><ProceedingsButton
  conferenceId={conference.id}
  hasPdf={Boolean(conference.proceedingsKey)}
/>
</div>
<div className="card"><div className="poster-wrap">{conference.posterKey ? <img className="poster-img" src={`/api/conferences/${conference.id}/poster`} alt={`${conference.title} poster`} /> : <div className="poster-placeholder">Conference poster will be published here.</div>}</div><div className="card-body"><h3>Organizers</h3><p>{conference.organizers?.join(" • ") || "International conference organizers"}</p></div></div></div></section><section className="section section-muted"><div className="container"><div className="section-title-row"><div><span className="eyebrow">Research papers</span><h2>Published papers</h2></div></div>{articles.length ? <div className="cards">{articles.map((a) => <article className="card" key={a.id}><div className="card-body"><div className="card-meta"><span className="chip">Published</span>{a.doi && <span className="chip chip-avocado">DOI</span>}</div><h3>{a.title}</h3><p>{a.authors.map((x) => x.fullName).join(", ")}</p><Link className="card-link" href={`/articles/${a.slug}`}>Open article →</Link></div></article>)}</div> : <div className="empty">No published papers are linked to this conference yet.</div>}</div></section></PublicShell>);
}
