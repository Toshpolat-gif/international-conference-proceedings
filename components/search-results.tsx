"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Article, Conference } from "@/types";

const PAGE_SIZE = 20;

export function ArticleSearch({
  articles,
  conferences,
}: {
  articles: Article[];
  conferences: Conference[];
}) {
  const [query, setQuery] = useState("");
  const [selectedConference, setSelectedConference] = useState("");
  const [page, setPage] = useState(1);
  const [isConferenceOpen, setIsConferenceOpen] = useState(false);

  const conferenceMap = useMemo(
    () =>
      new Map(
        conferences.map((conference) => [
          conference.id,
          {
            title: conference.title,
            slug: conference.slug,
            volume: conference.volume,
            issue: conference.issue,
          },
        ]),
      ),
    [conferences],
  );

  const selectedConferenceTitle =
  conferences.find((conference) => conference.id === selectedConference)
    ?.title || "All collections";

const conferenceDropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      conferenceDropdownRef.current &&
      !conferenceDropdownRef.current.contains(event.target as Node)
    ) {
      setIsConferenceOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return articles.filter((article) => {
      const conference = conferenceMap.get(article.conferenceId);

      const matchesQuery =
        !q ||
        [
          article.title,
          article.abstract,
          article.keywords?.join(" ") || "",
          article.authors?.map((a) => a.fullName).join(" ") || "",
          conference?.title || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesConference =
        !selectedConference ||
        article.conferenceId === selectedConference;

      return matchesQuery && matchesConference;
    });
  }, [articles, query, selectedConference, conferenceMap]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  const visibleResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, page]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleConferenceChange(value: string) {
    setSelectedConference(value);
    setPage(1);
  }

  const startItem = results.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, results.length);

  return (
    <>
      <div className="article-filters">
        <input
          className="input"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search titles, authors, keywords, abstracts..."
          aria-label="Search articles"
        />

        <div className="collection-select" ref={conferenceDropdownRef}>
  <button
    type="button"
    className="collection-select-trigger"
    onClick={() => setIsConferenceOpen((current) => !current)}
    aria-haspopup="listbox"
    aria-expanded={isConferenceOpen}
  >
    <span>{selectedConferenceTitle}</span>
    <span
      className={`collection-select-arrow ${
        isConferenceOpen ? "open" : ""
      }`}
      aria-hidden="true"
    >
      ▾
    </span>
  </button>

  {isConferenceOpen && (
    <div className="collection-select-menu" role="listbox">
      <button
        type="button"
        className={`collection-select-option ${
          !selectedConference ? "active" : ""
        }`}
        onClick={() => {
          handleConferenceChange("");
          setIsConferenceOpen(false);
        }}
        role="option"
        aria-selected={!selectedConference}
      >
        All collections
      </button>

      {conferences.map((conference) => (
        <button
          type="button"
          key={conference.id}
          className={`collection-select-option ${
            selectedConference === conference.id ? "active" : ""
          }`}
          onClick={() => {
            handleConferenceChange(conference.id);
            setIsConferenceOpen(false);
          }}
          role="option"
          aria-selected={selectedConference === conference.id}
        >
          {conference.title}
        </button>
      ))}
    </div>
  )}
</div>
      </div>

      {results.length ? (
        <>
          <div className="article-list-header">
            <span>
              Showing {startItem}–{endItem} of {results.length} articles
            </span>
          </div>

          <div className="article-list">
            {visibleResults.map((article) => {
              const conference = conferenceMap.get(article.conferenceId);

              return (
                <article className="article-row" key={article.id}>
                  <div className="article-row-main">
                    <div className="article-row-meta">
                      <span className="chip">Article</span>

                      {conference && (
                        <span className="chip chip-avocado">
                          {conference.title}
                        </span>
                      )}
                    </div>

                    <h3>{article.title}</h3>

                    <p className="article-row-authors">
                      {article.authors
                        ?.map((author) => author.fullName)
                        .join(", ")}
                    </p>

                    <div className="article-row-details">
                      <span>
                        Volume{" "}
                        {article.volume || conference?.volume || "—"}
                      </span>

                      <span>
                        Issue{" "}
                        {article.issue || conference?.issue || "—"}
                      </span>

                      <span>
                        Pages{" "}
                        {article.pageStart && article.pageEnd
                          ? `${article.pageStart}–${article.pageEnd}`
                          : "—"}
                      </span>

                      {article.publicationDate && (
                        <span>{article.publicationDate}</span>
                      )}

                      {article.doi && <span>DOI</span>}
                    </div>
                  </div>

                  <div className="article-row-action">
                    <Link
                      className="card-link"
                      href={`/articles/${article.slug}`}
                    >
                      Read article →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Article pagination">
              <button
                className="pagination-button"
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                ← Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`pagination-page ${
                        pageNumber === page ? "active" : ""
                      }`}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ),
                )}
              </div>

              <button
                className="pagination-button"
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty">
          No published articles match your search.
        </div>
      )}
    </>
  );
}