"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { CommandCenterScene } from "@/components/home/command-center-scene";
import { ViewingDeckScene } from "@/components/home/viewing-deck-scene";
import { cn } from "@/lib/utils/cn";

export interface RoomInfo {
  /** Small label above the title, e.g. "Lantai dasar". */
  floor: string;
  title: string;
  body: string;
  photos: string[];
}

/**
 * One of the two 3D rooms of the Reservasi section, made clickable: a click
 * (or Enter) anywhere on the card opens a pop up that says which room it is,
 * with its photos and a short description. Texts and photos come from the CMS.
 */
export function RoomScene({
  kind,
  sign,
  note,
  hint,
  info,
  className,
}: {
  kind: "command" | "deck";
  sign: string;
  note: string;
  /** Chip on the card inviting a click. */
  hint: string;
  info: RoomInfo;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLDivElement>(null);
  const Scene = kind === "command" ? CommandCenterScene : ViewingDeckScene;

  return (
    <>
      <div
        ref={opener}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`${hint}: ${info.title}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn("group relative cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-canvas", className)}
      >
        <Scene sign={sign} note={note} className="mx-0 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none" />
        {hint ? (
          <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:border-cyan/60 group-hover:text-cyan">
            <Maximize2 className="size-3.5" aria-hidden />
            {hint}
          </span>
        ) : null}
      </div>
      {open ? (
        <RoomDialog
          info={info}
          onClose={() => {
            setOpen(false);
            opener.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}

function RoomDialog({ info, onClose }: { info: RoomInfo; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const photos = info.photos;
  const count = photos.length;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (count > 1 && e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (count > 1 && e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, count]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0c0820] shadow-lift sm:rounded-3xl"
      >
        {count > 0 ? (
          <div className="relative aspect-[16/10] shrink-0 bg-black">
            {photos.map((src, i) => (
              <Image
                key={src + i}
                src={src}
                alt={i === index ? info.title : ""}
                fill
                unoptimized={src.startsWith("/media/")}
                sizes="(min-width: 768px) 768px, 100vw"
                className={cn("object-cover transition-opacity duration-300", i === index ? "opacity-100" : "opacity-0")}
              />
            ))}
            {count > 1 ? (
              <>
                <button type="button" aria-label="Foto sebelumnya" onClick={() => setIndex((i) => (i - 1 + count) % count)} className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" aria-label="Foto berikutnya" onClick={() => setIndex((i) => (i + 1) % count)} className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
                  <ChevronRight className="size-5" aria-hidden />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {photos.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      aria-label={`Foto ${i + 1} dari ${count}`}
                      aria-current={i === index}
                      onClick={() => setIndex(i)}
                      className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80")}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-start gap-4 overflow-y-auto p-6 sm:p-8">
          <div className="min-w-0 flex-1">
            {info.floor ? <p className="font-label text-xs uppercase tracking-[0.24em] text-cyan">{info.floor}</p> : null}
            <h3 id={titleId} className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              {info.title}
            </h3>
            {info.body ? <p className="mt-3 text-[0.9375rem] leading-7 text-ink-soft sm:text-base sm:leading-8">{info.body}</p> : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-white/10 hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
