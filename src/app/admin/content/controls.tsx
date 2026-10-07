"use client";

import { useActionState } from "react";

import { publishAction, restoreVersionAction, toggleSectionAction } from "../actions";

export function VisibilityToggle({
  sectionKey,
  label,
  visible,
}: {
  sectionKey: string;
  label: string;
  visible: boolean;
}) {
  return (
    <form action={toggleSectionAction}>
      <input type="hidden" name="sectionKey" value={sectionKey} />
      <input type="hidden" name="visible" value={visible ? "0" : "1"} />
      <button
        type="submit"
        aria-pressed={visible}
        className="rounded-full border px-3.5 py-1.5 text-xs transition"
        style={{
          borderColor: visible ? "color-mix(in srgb, var(--holo-cyan) 45%, transparent)" : "rgba(255,255,255,0.15)",
          color: visible ? "var(--holo-cyan)" : "rgba(255,255,255,0.4)",
        }}
      >
        {label}
        <span className="ml-2 text-[10px]">{visible ? "tampil" : "disembunyikan"}</span>
      </button>
    </form>
  );
}

export function PublishPanel({
  pending,
  canPublish,
  versions,
}: {
  pending: number;
  canPublish: boolean;
  versions: { id: string; note: string; by: string; at: string }[];
}) {
  const [publishState, publish, publishing] = useActionState(publishAction, null);
  const [restoreState, restore, restoring] = useActionState(restoreVersionAction, null);

  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm text-white/85">Terbitkan ke website</h2>
        <p className="mt-1.5 text-xs text-white/45">
          {pending === 0
            ? "Tidak ada perubahan draft yang menunggu."
            : `${pending} section menunggu diterbitkan.`}
        </p>

        {canPublish ? (
          <form action={publish} className="mt-4 space-y-3">
            <input
              name="note"
              placeholder="Catatan perubahan (opsional)"
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--holo-cyan)]"
            />
            <button
              type="submit"
              disabled={publishing || pending === 0}
              className="rounded-full px-5 py-2.5 text-xs font-medium text-[var(--holo-ink)] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--holo-gradient)" }}
            >
              {publishing ? "Menerbitkan…" : "Terbitkan"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-xs text-white/40">
            Hanya Super Admin yang bisa menerbitkan. Simpan draft, lalu minta persetujuan.
          </p>
        )}

        {publishState ? (
          <p
            role="status"
            className="mt-3 text-xs"
            style={{ color: publishState.ok ? "var(--holo-cyan)" : "var(--holo-magenta)" }}
          >
            {publishState.message}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm text-white/85">Riwayat versi</h2>
        <p className="mt-1.5 text-xs text-white/45">
          Memulihkan mengisi kolom draft, bukan langsung tayang. Periksa pratinjau dulu.
        </p>

        {versions.length === 0 ? (
          <p className="mt-4 text-xs text-white/35">Belum ada publish.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-3 py-2"
              >
                <span className="flex-1 text-xs text-white/65">
                  {version.at}
                  <span className="ml-2 text-white/35">{version.by}</span>
                  {version.note ? (
                    <span className="mt-0.5 block text-[11px] text-white/40">{version.note}</span>
                  ) : null}
                </span>
                {canPublish ? (
                  <form action={restore}>
                    <input type="hidden" name="versionId" value={version.id} />
                    <button
                      type="submit"
                      disabled={restoring}
                      className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/70 transition hover:border-white/50 disabled:opacity-50"
                    >
                      Pulihkan
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {restoreState ? (
          <p
            role="status"
            className="mt-3 text-xs"
            style={{ color: restoreState.ok ? "var(--holo-cyan)" : "var(--holo-magenta)" }}
          >
            {restoreState.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
