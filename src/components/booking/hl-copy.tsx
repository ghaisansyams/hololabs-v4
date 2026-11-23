"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Small copy-to-clipboard pill for account numbers and amounts. */
export function HlCopy({ value, label = "Salin", tone = "plain" }: { value: string; label?: string; tone?: "plain" | "cyan" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
      className={
        "inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[13px] transition hover:border-cyan-300/70 hover:text-cyan-100 " +
        (tone === "cyan" ? "border-cyan-300/40 bg-cyan-300/5 text-cyan-100" : "border-white/15 text-[#d3cee2]")
      }
    >
      {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {done ? "Tersalin" : label}
    </button>
  );
}
