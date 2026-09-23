import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getPublishedConferences } from "@/lib/public-data";

export const revalidate = 60;

export default async function ProceedingsPage() {
  const conferences = await getPublishedConferences(100).catch(() => []);
  return <PublicShell><section className="page-head container"><span className="eyebrow">Publication archive</span><h1>Proceedings</h1><p>Conference proceedings volumes and publication records.</p></section><section className="section"><div className="container">{conferences.length ? <div className="cards">{conferences.map((c) => <article className="card" key={c.id}><div className="card-body"><div className="card-meta"><span className="chip chip-avocado">Proceedings</span>{c.issn && <span className="chip">ISSN {c.issn}</span>}</div><h3>{c.proceedingsTitle}</h3><p>{c.title}</p><table className="meta-table"><tbody><tr><td>Volume</td><td>{c.volume || "—"}</td></tr><tr><td>Issue</td><td>{c.issue || "—"}</td></tr><tr><td>Publication date</td><td>{c.publicationDate || "—"}</td></tr><tr><td>Editors</td><td>{c.editors?.join(", ") || "—"}</td></tr></tbody></table>{c.proceedingsKey ? <Link className="card-link" href={`/api/conferences/${c.id}/proceedings`} target="_blank">Open proceedings PDF →</Link> : <span className="small muted">Proceedings PDF not yet published.</span>}</div></article>)}</div> : <div className="empty">No published proceedings are available yet.</div>}</div></section></PublicShell>;
}
