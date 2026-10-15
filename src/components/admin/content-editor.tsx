"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveContent, type ContentFormState } from "@/app/admin/konten/actions";
import { Button } from "@/components/ui/button";
import type { FieldDef, ListField, SectionDef, TagsField, TextField } from "@/lib/cms/schema";

type Item = Record<string, string | string[]>;
type Values = Record<string, string | string[] | Item[]>;

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

function ScalarInput({
  field,
  value,
  onChange,
  id,
}: {
  field: TextField | TagsField;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  id: string;
}) {
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
  onChange: (items: Item[]) => void;
}) {
  const max = field.max ?? 20;
  const min = field.min ?? 0;
  const blank = (): Item =>
    Object.fromEntries(field.fields.map((f) => [f.key, f.type === "tags" ? [] : ""]));

  const update = (index: number, key: string, value: string | string[]) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    onChange(next);
  };

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
                onClick={() => onChange(items.filter((_, i) => i !== index))}
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
                  <Label htmlFor={id} hint={sub.type === "tags" ? sub.hint : undefined}>
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
          onClick={() => onChange([...items, blank()])}
          className="inline-flex items-center gap-1.5 rounded-pill border border-dashed border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
        >
          <Plus className="size-4" /> Tambah {field.itemLabel.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}

const initial: ContentFormState = {};

export function ContentEditor({ section, initialValues }: { section: SectionDef; initialValues: Values }) {
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
                onChange={(items) => set(field.key, items)}
              />
            </>
          ) : (
            <>
              <Label htmlFor={field.key} hint={field.type === "tags" ? field.hint : undefined}>
                {field.label}
              </Label>
              <ScalarInput
                id={field.key}
                field={field}
                value={(values[field.key] as string | string[]) ?? ""}
                onChange={(v) => set(field.key, v)}
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
