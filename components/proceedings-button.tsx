"use client";

import { useState } from "react";
import Link from "next/link";

type ProceedingsButtonProps = {
  conferenceId: string;
  hasPdf: boolean;
};

export function ProceedingsButton({
  conferenceId,
  hasPdf
}: ProceedingsButtonProps) {
  const [showMessage, setShowMessage] = useState(false);

  if (hasPdf) {
    return (
      <div className="hero-actions">
        <Link
          className="btn btn-primary"
          href={`/api/conferences/${conferenceId}/proceedings`}
          target="_blank"
        >
          Open Proceedings PDF
        </Link>
      </div>
    );
  }

  return (
    <div className="hero-actions">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowMessage(true)}
      >
        Open Proceedings PDF
      </button>

      {showMessage && (
        <p className="small muted" style={{ marginTop: "10px" }}>
          Proceedings PDF has not yet been published.
        </p>
      )}
    </div>
  );
}