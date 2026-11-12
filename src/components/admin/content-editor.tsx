"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { saveContent, type ContentFormState } from "@/app/admin/konten/actions";
import { Button } from "@/components/ui/button";
import type { FieldDef, ListField, SectionDef, TagsField, TextField } from "@/lib/cms/schema";

type Item = Record<string, string | string[]>;
type Values = Record<string, string | string[] | Item[]>;

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

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
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              {field.itemLabel} {index + 1}
            </span>
            <div className="flex gap-1">
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
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState(saveContent, initial);

  const set = (key: string, value: Values[string]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };

  return (
    <form
      action={(fd) => {
        setDirty(false);
        formAction(fd);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="key" value={section.key} />
      <input type="hidden" name="value" value={JSON.stringify(values)} />

      {section.fields.map((field: FieldDef) => (
        <div key={field.key}>
          {field.type === "list" ? (
            <>
              <p className="mb-2 text-sm font-bold text-ink">{field.label}</p>
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
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan & tayangkan"}
        </Button>
        {state.error ? (
          <p className="text-sm font-medium text-danger">{state.error}</p>
        ) : state.ok && !dirty ? (
          <p className="text-sm font-medium text-success">Tersimpan — sudah tampil di website.</p>
        ) : dirty ? (
          <p className="text-sm text-muted">Ada perubahan yang belum disimpan.</p>
        ) : null}
      </div>
    </form>
  );
}
