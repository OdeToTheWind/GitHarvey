"use client";

import { useState } from "react";

interface Props {
  markdown: string;
  csv: string;
}

/** Copies the comparison as Markdown, or downloads it as CSV. Nothing is sent anywhere. */
export function CompareExport({ markdown, csv }: Props) {
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setMessage("Markdown copied.");
    } catch {
      setMessage("Could not copy. Use the CSV download instead.");
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "githarvey-comparison.csv";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("CSV downloaded.");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="btn-secondary">Copy as Markdown</button>
        <button type="button" onClick={download} className="btn-secondary">Download CSV</button>
      </div>
      <p className="mt-2 text-sm text-muted" aria-live="polite">{message}</p>
    </div>
  );
}
