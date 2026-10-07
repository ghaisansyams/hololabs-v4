"use client";

import { useRef, useTransition } from "react";

/**
 * Dropdown yang langsung menyimpan saat diubah.
 *
 * Form-nya tetap sungguhan dan punya tombol kirim tersembunyi, sehingga tanpa
 * JavaScript dropdown ini masih bisa dipakai lewat tombol itu.
 */
export function StatusSelect({
  id,
  current,
  options,
  action,
}: {
  id: string;
  current: string;
  options: { value: string; label: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => action(formData).then(() => {}))}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`status-${id}`}>
        Ubah status
      </label>
      <select
        id={`status-${id}`}
        name="status"
        defaultValue={current}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--holo-cyan)] disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#0b0d12]">
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="rounded border border-white/20 px-2 py-1 text-xs">
          Simpan
        </button>
      </noscript>
    </form>
  );
}
