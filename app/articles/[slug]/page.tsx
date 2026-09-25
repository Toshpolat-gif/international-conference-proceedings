import Link from "next/link";
import { notFound } from "next/navigation";
import { CitationTools } from "@/components/citation-tools";
import { PdfActions } from "@/components/pdf-actions";
import { PublicShell } from "@/components/public-shell";
import { getArticleBySlug } from "@/lib/public-data";
import { siteConfig } from "@/lib/site";
import { serializeFirestore } from "@/lib/serialize";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const { getAdminDb } = await import("@/lib/firebase-admin");

  const conferenceDoc = await getAdminDb()
    .collection("conferences")
    .doc(article.conferenceId)
    .get();

  const conference =
    conferenceDoc.exists && conferenceDoc.data()?.status === "published"
      ? conferenceDoc.data()
      : null;

  return {
    title: article.title,

    description: article.abstract,

    alternates: {
      canonical: `${siteConfig.url}/articles/${article.slug}`
    },

    openGraph: {
      type: "article",
      title: article.title,
      description: article.abstract,
      url: `${siteConfig.url}/articles/${article.slug}`
    },

    other: {
      citation_title: article.title,

      citation_author: (article.authors || []).map(
        (author) => author.fullName
      ),

      citation_publication_date: article.publicationDate || "",

      citation_pdf_url:
        `${siteConfig.url}/articles/${article.slug}/pdf`,

      ...(conference?.title
        ? {
            citation_conference_title: conference.title
          }
        : {}),

      ...(article.volume || conference?.volume
        ? {
            citation_volume: article.volume || conference?.volume
          }
        : {}),

      ...(article.issue || conference?.issue
        ? {
            citation_issue: article.issue || conference?.issue
          }
        : {}),

      ...(article.pageStart
        ? {
            citation_firstpage: article.pageStart
          }
        : {}),

      ...(article.pageEnd
        ? {
            citation_lastpage: article.pageEnd
          }
        : {}),

      ...(conference?.issn
        ? {
            citation_issn: conference.issn
          }
        : {}),

      ...(conference?.isbn
        ? {
            citation_isbn: conference.isbn
          }
        : {})
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) { notFound(); throw new Error("Not found"); }

  // We only have the conference id in the article record, so resolve its public document separately.
  // The query is made from a trusted server component through the Admin SDK.
  const conference = await (async () => {
  const { getAdminDb } = await import("@/lib/firebase-admin");

  const doc = await getAdminDb()
    .collection("conferences")
    .doc(article.conferenceId)
    .get();

  if (!doc.exists || doc.data()?.status !== "published") {
    return null;
  }

  const data = doc.data()!;

  return serializeFirestore({
    id: doc.id,
    ...(data as Record<string, unknown>)
  }) as import("@/types").Conference;
})();

  const articleUrl = `${siteConfig.url}/articles/${article.slug}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",

  headline: article.title,
  description: article.abstract,

  inLanguage: article.language || "en",

  datePublished: article.publicationDate || undefined,

  dateModified:
    article.updatedAt ||
    article.publicationDate ||
    undefined,

  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": articleUrl
  },

  url: articleUrl,

  author: (article.authors || []).map((a) => ({
    "@type": "Person",
    name: a.fullName,

    ...(a.orcid
      ? {
          sameAs: a.orcid.startsWith("http")
            ? a.orcid
            : `https://orcid.org/${a.orcid}`
        }
      : {}),

    ...(a.institution
      ? {
          affiliation: {
            "@type": "Organization",
            name: a.institution
          }
        }
      : {})
  })),

  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url
  },

  isPartOf: {
    "@type": "PublicationIssue",
    name: conference?.proceedingsTitle || siteConfig.name,

    ...(conference?.volume
      ? {
          volumeNumber: conference.volume
        }
      : {}),

    ...(conference?.issue
      ? {
          issueNumber: conference.issue
        }
      : {})
  },

  ...(article.keywords?.length
    ? {
        keywords: article.keywords.join(", ")
      }
    : {}),

  ...(article.doi
    ? {
        identifier: {
          "@type": "PropertyValue",
          propertyID: "DOI",
          value: article.doi
        }
      }
    : {})
};

  return <PublicShell><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><article><header className="article-header container"><span className="eyebrow">Published research paper</span><h1>{article.title}</h1><p className="article-authors">{(article.authors || []).map((a) => a.fullName).join(", ")}</p>
  {conference && (
  <p className="article-publication-context">
    Published in{" "}
    <Link
      className="link"
      href={`/conferences/${conference.slug}`}
    >
      {conference.title}
    </Link>
  </p>
)}
  <PdfActions articleId={article.id} fileName={article.pdfFileName} /></header><section className="section"><div className="container article-layout"><div><div className="prose"><h2>Abstract</h2><p className="abstract">{article.abstract}</p><h2>Keywords</h2><p>{article.keywords?.join(" • ") || "Not supplied"}</p><hr className="divider" /><h2>Authors &amp; affiliations</h2>{(article.authors || []).map((a, index) => <div key={`${a.email}-${index}`} className="panel" style={{ marginTop: 12 }}><strong>{a.fullName}</strong>{a.isCorresponding && <span className="chip chip-mango" style={{ marginLeft: 8 }}>Corresponding author</span>}<p className="small muted">{a.institution} · {a.country}</p>{a.orcid && <p className="small">ORCID: <a className="link" href={a.orcid.startsWith("http") ? a.orcid : `https://orcid.org/${a.orcid}`} target="_blank" rel="noreferrer">{a.orcid}</a></p>}</div>)}</div><CitationTools article={article} conference={conference} /></div><aside className="sticky-side"><div className="panel"><h3>Publication information</h3>
  <table className="meta-table">
    <tbody>
      <tr>
        <td>Proceedings</td>
        <td>
          {conference?.proceedingsTitle &&
          conference.proceedingsTitle.trim().toLowerCase() !==
            conference?.title?.trim().toLowerCase()
            ? conference.proceedingsTitle
            : "Conference proceedings"}
        </td>
      </tr>
<tr><td>Date</td><td>{article.publicationDate || "—"}</td></tr><tr><td>Pages</td><td>{article.pageStart && article.pageEnd ? `${article.pageStart}–${article.pageEnd}` : "—"}</td></tr><tr><td>Volume</td><td>{article.volume || conference?.volume || "—"}</td></tr><tr><td>Issue</td><td>{article.issue || conference?.issue || "—"}</td></tr><tr><td>DOI</td><td>{article.doi ? <a className="link" href={`https://doi.org/${article.doi.replace(/^https:\/\/doi.org\//, "")}`} target="_blank" rel="noreferrer">{article.doi}</a> : "Coming soon"}</td></tr><tr><td>Language</td><td>English</td></tr><tr><td>License</td><td>{article.license || "See publisher policy"}</td></tr></tbody></table></div></aside></div></section></article></PublicShell>;
}
