import { PublicShell } from "@/components/public-shell";
import { getAllAuthors } from "@/lib/public-data";

export const revalidate = 120;

export default async function AuthorsPage() {
  const authors = await getAllAuthors().catch(() => []);
  return <PublicShell><section className="page-head container"><span className="eyebrow">Contributor directory</span><h1>Authors</h1><p>Contributors represented in the published conference archive.</p></section><section className="section"><div className="container">{authors.length ? <div className="cards">{authors.map((a) => <article className="card" key={`${a.fullName}-${a.institution}-${a.country}`}><div className="card-body"><span className="chip chip-avocado">{a.country}</span><h3>{a.fullName}</h3><p>{a.institution}</p>{a.orcid && <p className="small">ORCID: {a.orcid}</p>}<p className="small muted">Published papers: {a.count}</p></div></article>)}</div> : <div className="empty">Author information will appear after articles are published.</div>}</div></section></PublicShell>;
}
