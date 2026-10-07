"use client";

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  hint,
  error,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={name} className="block text-xs tracking-wide text-white/60">
        {label}
        {required ? <span className="ml-1 text-[var(--holo-magenta)]">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[var(--holo-cyan)]"
        {...rest}
      />
      {hint ? (
        <p id={`${name}-hint`} className="mt-1 text-[11px] text-white/35">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-[11px] text-[var(--holo-magenta)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Select({
  label,
  name,
  required,
  options,
  error,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs tracking-wide text-white/60">
        {label}
        {required ? <span className="ml-1 text-[var(--holo-magenta)]">*</span> : null}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[var(--holo-cyan)]"
        {...rest}
      >
        <option value="">Pilih…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[var(--holo-ink)]">
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-[11px] text-[var(--holo-magenta)]">{error}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  name,
  required,
  error,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs tracking-wide text-white/60">
        {label}
        {required ? <span className="ml-1 text-[var(--holo-magenta)]">*</span> : null}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        rows={4}
        aria-invalid={error ? true : undefined}
        className="mt-1.5 w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[var(--holo-cyan)]"
        {...rest}
      />
      {error ? <p className="mt-1 text-[11px] text-[var(--holo-magenta)]">{error}</p> : null}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full px-6 py-3 text-sm font-medium text-[var(--holo-ink)] transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--holo-gradient)" }}
    >
      {pending ? "Mengirim…" : children}
    </button>
  );
}

export function FormStatus({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded-lg border px-4 py-3 text-sm"
      style={{
        borderColor: state.ok
          ? "color-mix(in srgb, var(--holo-cyan) 45%, transparent)"
          : "color-mix(in srgb, var(--holo-magenta) 45%, transparent)",
        color: state.ok ? "var(--holo-cyan)" : "var(--holo-magenta)",
      }}
    >
      {state.message}
    </p>
  );
}
