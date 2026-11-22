"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";

/** Optional transfer screenshot for the payment page; shows the chosen file name. */
export function HlProofUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <label
      htmlFor="proof"
      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-hl-ink/50 px-4 py-4 text-[15px] text-[#c9c4d9] transition hover:border-cyan-300/60"
    >
      <Paperclip className="size-4 shrink-0 text-cyan-200" aria-hidden />
      <span className="truncate">
        {fileName ? (
          <span className="font-semibold text-hl-fg">{fileName}</span>
        ) : (
          <>
            <span className="font-semibold text-hl-fg">Unggah bukti transfer</span> (opsional, gambar maks. 3 MB)
          </>
        )}
      </span>
      <input
        id="proof"
        name="proof"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}
