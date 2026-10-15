"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";

/** File input for the transfer screenshot — shows the chosen filename once picked. */
export function ProofUpload() {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label
      htmlFor="proof"
      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-4 py-3.5 text-sm text-ink-soft transition-colors hover:border-accent/50 hover:text-ink"
    >
      <Paperclip className="size-4 shrink-0" aria-hidden />
      <span className="truncate">
        {fileName ? (
          <span className="font-semibold text-ink">{fileName}</span>
        ) : (
          <>
            <span className="font-semibold text-ink">Unggah bukti transfer</span> — opsional, JPG/PNG maks. 3 MB
          </>
        )}
      </span>
      <input
        id="proof"
        name="proof"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}
