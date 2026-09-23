import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getPublishedConferences } from "@/lib/public-data";

export const revalidate = 60;

export default async function ConferencesPage() {
  const conferences = await getPublishedConferences(100).catch(() => []);
  return <PublicShell><section className="page-head container"><span className="eyebrow">Archive</span><h1>Conferences</h1><p>International conference editions and their associated proceedings.</p></section><section className="section"><div className="container">{conferences.length ? <div className="cards">{conferences.map((c) => <article className="card" key={c.id}><div className="poster-wrap">{c.posterKey ? <img className="poster-img" src={`/api/conferences/${c.id}/poster`} alt={`${c.title} poster`} /> : <div className="poster-placeholder"><strong>{c.acronym || "ICP"}</strong><br />Conference proceedings</div>}</div><div className="card-body"><div className="card-meta"><span className="chip chip-avocado">International</span>{c.eventType && <span className="chip">{c.eventType}</span>}</div><h3>{c.title}</h3><p>{c.theme}</p><p className="small muted">{c.conferenceDate || "Date to be announced"}</p><Link className="card-link" href={`/conferences/${c.slug}`}>Open conference →</Link></div></article>)}</div> : <div className="empty">No published conferences are available yet.</div>}</div></section></PublicShell>;
}
