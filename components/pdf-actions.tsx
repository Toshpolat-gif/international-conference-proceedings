"use client";

export function PdfActions({ articleId, fileName }: { articleId: string; fileName?: string }) {
  function openPdf() {
    window.open(`/api/articles/${articleId}/pdf`, "_blank", "noopener,noreferrer");
  }

  function downloadPdf() {
    const a = document.createElement("a");
    a.href = `/api/articles/${articleId}/pdf?download=1`;
    a.download = fileName || "article.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="hero-actions">
      <button className="btn btn-primary" onClick={openPdf}>Read PDF</button>
      <button className="btn btn-tiffany" onClick={downloadPdf}>Download PDF</button>
    </div>
  );
}

export function ProceedingsActions({ conferenceId, fileName }: { conferenceId: string; fileName?: string }) {
  function openProceedings() {
    window.open(`/api/conferences/${conferenceId}/proceedings`, "_blank", "noopener,noreferrer");
  }
  return <div className="hero-actions"><button className="btn btn-primary" onClick={openProceedings}>Open Proceedings PDF</button><span className="muted small">{fileName || "Proceedings PDF"}</span></div>;
}
