"use client";

/**
 * The show-room seat map from hololabs.id/booking: the performance area on
 * top, one row of seats on wide screens and two rows on phones, with the
 * same states (available, chosen, taken, checked in).
 */

export const STAGE_LABEL = "AREA PERTUNJUKAN";

export function SeatMap({
  seats,
  taken,
  selected,
  onToggle,
  marked,
  titles,
  disabled,
}: {
  seats: string[];
  taken: string[];
  selected: string[];
  onToggle?: (seat: string) => void;
  marked?: string[];
  titles?: Record<string, string>;
  disabled?: boolean;
}) {
  const takenSet = new Set(taken);
  const selectedSet = new Set(selected);
  const markedSet = new Set(marked ?? []);
  const half = Math.ceil(seats.length / 2);

  const seat = (label: string) => {
    const isTaken = takenSet.has(label) && !selectedSet.has(label);
    const isSelected = selectedSet.has(label);
    const isMarked = markedSet.has(label);
    const state = isSelected ? "dipilih" : isTaken ? "terisi" : "tersedia";
    return (
      <button
        key={label}
        type="button"
        disabled={disabled || isTaken || !onToggle}
        onClick={() => onToggle?.(label)}
        aria-pressed={isSelected}
        aria-label={`Kursi ${label}, ${state}${titles?.[label] ? `, ${titles[label]}` : ""}`}
        title={titles?.[label] ? `Kursi ${label}: ${titles[label]}` : `Kursi ${label}`}
        className={`relative grid h-10 w-full min-w-0 place-items-center rounded-t-xl rounded-b-md border text-[13px] font-semibold tabular-nums transition md:h-11 ${
          isSelected
            ? "hl-grad border-transparent text-white shadow-[0_0_18px_rgba(139,92,246,.6)]"
            : isTaken
              ? isMarked
                ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
                : "border-white/5 bg-white/[.06] text-[#6f6984]"
              : "border-white/25 text-hl-fg hover:border-cyan-300/70 hover:bg-cyan-300/10"
        } ${!onToggle || disabled ? "cursor-default" : isTaken ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        {label}
        {isTaken && !isMarked && !titles?.[label] ? (
          <span aria-hidden className="absolute inset-x-2 top-1/2 h-px -rotate-45 bg-white/25" />
        ) : null}
      </button>
    );
  };

  const row = (list: string[], key: string) => (
    <div key={key} className="flex flex-col gap-2">
      <div
        aria-hidden
        className="h-3 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,.35),rgba(139,92,246,.45),rgba(224,64,251,.35))] shadow-[0_0_20px_rgba(139,92,246,.25)]"
      />
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}>
        {list.map(seat)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <div aria-hidden className="h-1 w-3/4 rounded-full bg-cyan-300/60 shadow-[0_0_24px_rgba(34,211,238,.7)]" />
        <span className="hl-label text-[11px] tracking-[0.3em] text-[#9fe9f5]">{STAGE_LABEL}</span>
      </div>
      <div className="hidden md:block">{row(seats, "all")}</div>
      <div className="flex flex-col gap-4 md:hidden">
        {row(seats.slice(0, half), "a")}
        {row(seats.slice(half), "b")}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#a9a3bc]">
        <span className="inline-flex items-center gap-2">
          <span className="size-3.5 rounded border border-white/25" /> Tersedia
        </span>
        {onToggle ? (
          <span className="inline-flex items-center gap-2">
            <span className="hl-grad size-3.5 rounded" /> Dipilih
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <span className="size-3.5 rounded bg-white/[.12]" /> Terisi
        </span>
        {marked ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 rounded bg-cyan-400/30" /> Sudah check-in
          </span>
        ) : null}
      </div>
    </div>
  );
}
