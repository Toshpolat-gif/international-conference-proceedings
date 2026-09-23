"use client";

import { useState } from "react";
import { Article, Conference } from "@/types";
import { getCitationData } from "@/lib/citations";

type CitationFormat = "APA" | "MLA" | "Chicago" | "Harvard" | "IEEE" | "BibTeX" | "RIS";

export function CitationTools({ article, conference }: { article: Article; conference?: Conference | null }) {
  const citations: Record<CitationFormat, string> = getCitationData(article, conference);
  const formats: CitationFormat[] = ["APA", "MLA", "Chicago", "Harvard", "IEEE", "BibTeX", "RIS"];
  const [active, setActive] = useState<CitationFormat>("APA");
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(citations[active]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="citation-box panel">
      <h3>Cite this article</h3>
      <div className="citation-tabs">
        {formats.map((format) => (
          <button key={format} type="button" className={`citation-tab ${active === format ? "active" : ""}`} onClick={() => setActive(format)}>
            {format}
          </button>
        ))}
      </div>
      <textarea className="citation-output" readOnly value={citations[active]} aria-label={`${active} citation`} />
      <div className="form-actions">
        <button type="button" className="btn btn-primary btn-small" onClick={copy}>{copied ? "Copied" : "Copy Citation"}</button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => downloadText(`${article.slug}.${active.toLowerCase()}`, citations[active])}>Export</button>
      </div>
    </div>
  );
}

function downloadText(name: string, text: string) {
  const extension = name.endsWith(".bibtex") ? "bib" : name.endsWith(".ris") ? "ris" : "txt";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/\.[^.]+$/, `.${extension}`);
  a.click();
  URL.revokeObjectURL(url);
}
