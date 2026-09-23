"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Article, Conference } from "@/types";

export function ArticleSearch({ articles, conferences }: { articles: Article[]; conferences: Conference[] }) {
  const [query, setQuery] = useState("");
  const conferenceMap = useMemo(() => new Map(conferences.map((c) => [c.id, c.title])), [conferences]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((article) => {
      const haystack = [article.title, article.abstract, article.keywords.join(" "), article.authors.map((a) => a.fullName).join(" "), conferenceMap.get(article.conferenceId) || ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [articles, query, conferenceMap]);

  return (
    <>
      <div className="searchbar">
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, authors, keywords, abstracts..." />
      </div>
      {results.length ? (
        <div className="cards">
          {results.map((article) => (
            <article className="card" key={article.id}>
              <div className="card-body">
                <div className="card-meta">
                  <span className="chip">Article</span>
                  {conferenceMap.get(article.conferenceId) && <span className="chip chip-avocado">{conferenceMap.get(article.conferenceId)}</span>}
                </div>
                <h3>{article.title}</h3>
                <p>{article.authors.map((a) => a.fullName).join(", ")}</p>
                <Link className="card-link" href={`/articles/${article.slug}`}>Read article →</Link>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty">No published articles match your search.</div>}
    </>
  );
}
