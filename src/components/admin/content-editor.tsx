"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { saveContent, type ContentFormState } from "@/app/admin/konten/actions";
import { Button } from "@/components/ui/button";
import type { FieldDef, ListField, SectionDef, TagsField, TextField } from "@/lib/cms/schema";

type Item = Record<string, string | string[]>;
type Values = Record<string, string | string[] | Item[]>;

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink outline-none sm:text-sm transition-colors placeholder:text-muted/60 focus:border-accent";

/** Image field: preview, upload (to /admin/api/media), and "back to the built-in image". */
function ImageInput({
  id,
  value,
  onChange,
  fallback,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/admin/api/media", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Gagal mengunggah gambar.");
      onChange(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-3">
      <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas-deep">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-muted">Belum ada gambar</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          id={id}
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-2 text-sm font-semibold text-ink hover:border-accent/50 disabled:opacity-50"
          >
            <ImagePlus className="size-4" aria-hidden />
            {busy ? "Mengunggah…" : value ? "Ganti gambar" : "Unggah gambar"}
          </button>
          {fallback && value !== fallback ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(fallback)}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink disabled:opacity-50"
            >
              <RotateCcw className="size-4" aria-hidden />
              Pakai gambar bawaan
            </button>
          ) : null}
          {!fallback && value ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange("")}
              className="rounded-pill border border-line px-3.5 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-50"
            >
              Hapus gambar
            </button>
          ) : null}
        </div>
        <p className="text-xs text-muted">PNG, JPG, WebP, atau GIF — maksimal 5 MB. Simpan setelah memilih gambar.</p>
        {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

function ScalarInput({
  field,
  value,
  onChange,
  id,
  fallback,
}: {
  field: TextField | TagsField;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  id: string;
  fallback?: string;
}) {
  if (field.type === "image") {
    return <ImageInput id={id} value={String(value ?? "")} onChange={onChange} fallback={fallback} />;
  }
  if (field.type === "tags") {
    const text = Array.isArray(value) ? value.join("\n") : String(value ?? "");
    return (
      <textarea
        id={id}
        rows={Math.min(8, Math.max(3, text.split("\n").length + 1))}
        className={inputClass}
        value={text}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        rows={3}
        maxLength={field.max}
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      id={id}
      maxLength={field.max}
      className={inputClass}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Label({ htmlFor, children, hint }: { htmlFor: string; children: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-ink-soft">
      {children}
      {hint ? <span className="ml-1.5 font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

function ListEditor({
  field,
  items,
  onChange,
}: {
  field: ListField;
  items: Item[];
  // Functional, so two quick edits to different fields never overwrite each other.
  onChange: (apply: (items: Item[]) => Item[]) => void;
}) {
  const max = field.max ?? 20;
  const min = field.min ?? 0;
  // a list with a fixed count (the nine zones) is tied to fixed places on the page: no moving or removing
  const fixed = min === max;
  const blank = (): Item =>
    Object.fromEntries(field.fields.map((f) => [f.key, f.type === "tags" ? [] : ""]));

  const update = (index: number, key: string, value: string | string[]) =>
    onChange((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const move = (index: number, delta: number) =>
    onChange((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + delta, 0, moved);
      return next;
    });

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-line bg-canvas-deep p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-muted">
              {field.itemLabel} {index + 1}
              {field.itemTitle && item[field.itemTitle] ? (
                <span className="font-semibold normal-case tracking-normal text-ink-soft"> · {String(item[field.itemTitle])}</span>
              ) : null}
            </span>
            <div className={fixed ? "hidden" : "flex gap-1"}>
              <button
                type="button"
                aria-label="Naikkan"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Turunkan"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Hapus"
                disabled={items.length <= min}
                onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
                className="rounded-lg p-1.5 text-danger hover:bg-danger-soft disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {field.fields.map((sub) => {
              const id = `${field.key}-${index}-${sub.key}`;
              return (
                <div key={sub.key}>
                  <Label htmlFor={id} hint={sub.hint}>
                    {sub.label}
                  </Label>
                  <ScalarInput
                    id={id}
                    field={sub}
                    value={item[sub.key] ?? ""}
                    onChange={(v) => update(index, sub.key, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {items.length < max ? (
        <button
          type="button"
          onClick={() => onChange((current) => [...current, blank()])}
          className="inline-flex items-center gap-1.5 rounded-pill border border-dashed border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
        >
          <Plus className="size-4" /> Tambah {field.itemLabel.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}

const initial: ContentFormState = {};

/* ------------------------------------------------------------------ */
/* Ringkasan perubahan (untuk pop up konfirmasi)                       */
/* ------------------------------------------------------------------ */

interface Change {
  label: string;
  kind: "text" | "image";
  from: string;
  to: string;
}

const asText = (value: unknown): string =>
  Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean).join(" • ") : String(value ?? "");

function describeChanges(section: SectionDef, before: Values, after: Values): Change[] {
  const changes: Change[] = [];
  const push = (label: string, type: string, from: unknown, to: unknown) => {
    const a = asText(from);
    const b = asText(to);
    if (a !== b) changes.push({ label, kind: type === "image" ? "image" : "text", from: a, to: b });
  };

  let part = "";
  for (const field of section.fields) {
    if (field.type === "heading") {
      part = field.label;
      continue;
    }
    if (field.type !== "list") {
      push(part ? `${part} › ${field.label}` : field.label, field.type, before[field.key], after[field.key]);
      continue;
    }
    const a = (before[field.key] as Item[]) ?? [];
    const b = (after[field.key] as Item[]) ?? [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const title = field.itemTitle ? asText((b[i] ?? a[i])?.[field.itemTitle]) : "";
      const name = `${field.label} › ${field.itemLabel} ${i + 1}${title ? ` (${title})` : ""}`;
      if (!a[i]) {
        changes.push({ label: name, kind: "text", from: "", to: "(item baru ditambahkan)" });
      } else if (!b[i]) {
        changes.push({ label: name, kind: "text", from: "(item dihapus)", to: "" });
      } else {
        for (const sub of field.fields) {
          push(`${name} › ${sub.label}`, sub.type, a[i][sub.key], b[i][sub.key]);
        }
      }
    }
  }
  return changes;
}

function Snippet({ text, kind, tone }: { text: string; kind: "text" | "image"; tone: "old" | "new" }) {
  const box =
    tone === "old"
      ? "border-line bg-canvas-deep text-muted"
      : "border-accent/40 bg-accent-soft text-ink";
  if (kind === "image") {
    return (
      <div className={`flex h-20 items-center justify-center overflow-hidden rounded-lg border ${box}`}>
        {text ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={text} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs">(kosong)</span>
        )}
      </div>
    );
  }
  const shown = text.length > 160 ? `${text.slice(0, 160)}…` : text;
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm leading-snug [overflow-wrap:anywhere] ${box} ${tone === "old" && text ? "line-through decoration-muted/60" : ""}`}>
      {shown || <span className="text-xs italic">(kosong)</span>}
    </p>
  );
}

function ConfirmDialog({
  sectionLabel,
  changes,
  onCancel,
  onConfirm,
}: {
  sectionLabel: string;
  changes: Change[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const none = changes.length === 0;
  const visible = changes.slice(0, 12);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="flex max-h-[88dvh] w-full max-w-xl flex-col rounded-card border border-line bg-surface shadow-lift"
      >
        <div className="border-b border-line px-6 py-5">
          <h2 id="confirm-title" className="text-lg font-extrabold text-ink">
            Tayangkan perubahan ke website?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Bagian <span className="font-semibold text-ink-soft">{sectionLabel}</span>.{" "}
            {none
              ? "Belum ada yang berbeda dari versi yang sedang tayang."
              : `${changes.length} bagian akan diubah dan langsung tampil di website publik.`}
          </p>
        </div>

        {none ? null : (
          <ul className="space-y-4 overflow-y-auto px-6 py-5">
            {visible.map((change, index) => (
              <li key={index}>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">{change.label}</p>
                <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <Snippet text={change.from} kind={change.kind} tone="old" />
                  <span className="hidden text-muted sm:block" aria-hidden>
                    →
                  </span>
                  <Snippet text={change.to} kind={change.kind} tone="new" />
                </div>
              </li>
            ))}
            {changes.length > visible.length ? (
              <li className="text-sm text-muted">+ {changes.length - visible.length} perubahan lainnya.</li>
            ) : null}
          </ul>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-pill border border-line px-5 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
          >
            {none ? "Tutup" : "Batal"}
          </button>
          {none ? null : (
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              className="inline-flex h-11 items-center rounded-pill bg-brand px-5 text-sm font-semibold uppercase tracking-[0.08em] text-ink hover:bg-brand-dark"
            >
              Ya, simpan & tayangkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessToast({
  sectionLabel,
  count,
  onClose,
}: {
  sectionLabel: string;
  count: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 12000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-card border border-success/50 bg-surface p-4 shadow-lift"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
          <Check className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Berhasil tayang di website publik</p>
          <p className="mt-1 text-sm leading-snug text-muted">
            Bagian <span className="font-semibold text-ink-soft">{sectionLabel}</span> sudah disimpan
            {count > 0 ? ` (${count} perubahan)` : ""} dan sekarang tampil untuk semua pengunjung.
          </p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            Lihat website <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
        <button
          type="button"
          aria-label="Tutup pemberitahuan"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function ContentEditor({
  section,
  initialValues,
  defaultValues,
}: {
  section: SectionDef;
  initialValues: Values;
  /** The built-in values, so an image can be put back to its default. */
  defaultValues?: Values;
}) {
  const [values, setValues] = useState<Values>(initialValues);
  // Versi yang sedang tayang; dipakai untuk membandingkan sebelum menyimpan.
  const [published, setPublished] = useState<Values>(initialValues);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<{ id: string; count: number } | null>(null);
  const [state, formAction, pending] = useActionState(saveContent, initial);
  const [, startTransition] = useTransition();
  const submitted = useRef<{ values: Values; count: number } | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const set = (key: string, value: Values[string]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };

  const changes = confirming ? describeChanges(section, published, values) : [];

  function confirmSave() {
    const formData = new FormData();
    formData.set("key", section.key);
    formData.set("value", JSON.stringify(values));
    submitted.current = { values, count: changes.length };
    setConfirming(false);
    setDirty(false);
    startTransition(() => formAction(formData));
  }

  // Server sudah menyimpan: catat versi tayang yang baru dan tampilkan notifikasi.
  useEffect(() => {
    if (!state.ok || !state.savedAt || !submitted.current) return;
    setPublished(submitted.current.values);
    setToast({ id: state.savedAt, count: submitted.current.count });
    submitted.current = null;
  }, [state]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setConfirming(true);
      }}
      className="space-y-6"
    >
      {section.fields.map((field: FieldDef) => (
        <div key={field.key}>
          {field.type === "heading" ? (
            <div className="border-t border-line pt-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{field.label}</h2>
              {field.hint ? <p className="mt-1 text-xs text-muted">{field.hint}</p> : null}
            </div>
          ) : field.type === "list" ? (
            <>
              <p className="text-sm font-bold text-ink">{field.label}</p>
              {field.hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{field.hint}</p> : null}
              <div className="mt-2" />
              <ListEditor
                field={field}
                items={(values[field.key] as Item[]) ?? []}
                onChange={(apply) => {
                  setValues((v) => ({ ...v, [field.key]: apply((v[field.key] as Item[]) ?? []) }));
                  setDirty(true);
                }}
              />
            </>
          ) : (
            <>
              <Label htmlFor={field.key} hint={field.hint}>
                {field.label}
              </Label>
              <ScalarInput
                id={field.key}
                field={field}
                value={(values[field.key] as string | string[]) ?? ""}
                onChange={(v) => set(field.key, v)}
                fallback={field.type === "image" ? (defaultValues?.[field.key] as string | undefined) : undefined}
              />
            </>
          )}
        </div>
      ))}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-1 py-4 backdrop-blur">
        <Button ref={saveButtonRef} type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan & tayangkan"}
        </Button>
        {state.error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : state.ok && !dirty ? (
          <p className="text-sm font-medium text-success">Tersimpan — sudah tampil di website.</p>
        ) : dirty ? (
          <p className="text-sm text-muted">Ada perubahan yang belum disimpan.</p>
        ) : null}
      </div>

      {confirming ? (
        <ConfirmDialog
          sectionLabel={section.label}
          changes={changes}
          onCancel={() => {
            setConfirming(false);
            saveButtonRef.current?.focus();
          }}
          onConfirm={confirmSave}
        />
      ) : null}
      {toast ? (
        <SuccessToast key={toast.id} sectionLabel={section.label} count={toast.count} onClose={() => setToast(null)} />
      ) : null}
    </form>
  );
}
