"use client";

import { useActionState, useState } from "react";

import { saveDraftAction } from "../actions";

interface Props {
  sectionKey: string;
  fields: { key: string; label: string; multiline?: boolean }[];
  /** Teks bawaan dari kode; ditampilkan sebagai placeholder. */
  fallback: Record<string, string>;
  draft: Record<string, string>;
  dirty: boolean;
}

export function SectionEditor({ sectionKey, fields, fallback, draft, dirty }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveDraftAction, null);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]"
        >
          <span className="flex-1 text-sm text-white/85">{sectionKey}</span>
          {dirty ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--holo-cyan)_22%,transparent)] px-2.5 py-0.5 text-[10px] text-[var(--holo-cyan)]">
              draft belum terbit
            </span>
          ) : null}
          <span aria-hidden="true" className="text-white/35">
            {open ? "−" : "+"}
          </span>
        </button>
      </h3>

      {open ? (
        <form action={action} className="border-t border-white/10 px-5 py-5">
          <input type="hidden" name="sectionKey" value={sectionKey} />
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
                <label
                  htmlFor={`${sectionKey}-${field.key}`}
                  className="block text-xs text-white/55"
                >
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    id={`${sectionKey}-${field.key}`}
                    name={field.key}
                    rows={3}
                    defaultValue={draft[field.key] ?? ""}
                    placeholder={fallback[field.key]}
                    className="mt-1.5 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--holo-cyan)]"
                  />
                ) : (
                  <input
                    id={`${sectionKey}-${field.key}`}
                    name={field.key}
                    defaultValue={draft[field.key] ?? ""}
                    placeholder={fallback[field.key]}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--holo-cyan)]"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full border border-white/20 px-5 py-2 text-xs text-white/85 transition hover:border-white/50 disabled:opacity-50"
            >
              {pending ? "Menyimpan…" : "Simpan draft"}
            </button>
            {state ? (
              <p
                role="status"
                className="text-xs"
                style={{ color: state.ok ? "var(--holo-cyan)" : "var(--holo-magenta)" }}
              >
                {state.message}
              </p>
            ) : (
              <p className="text-[11px] text-white/30">
                Kosongkan kolom untuk memakai teks bawaan.
              </p>
            )}
          </div>
        </form>
      ) : null}
    </article>
  );
}
