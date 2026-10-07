"use client";

import { useState } from "react";

import { budgetRanges, solutions } from "@/content/site";
import { Field, FormStatus, Select, SubmitButton, Textarea } from "./field";

type Status = { ok: boolean; message: string } | null;

/** Form inquiry B2B — aturan validasi PRD bagian 8. */
export function InquiryForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string[]>([]);

  function toggleSolution(key: string) {
    setPicked((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const found: Record<string, string> = {};
    if (!data.name || data.name.trim().length < 3) found.name = "Nama minimal 3 karakter.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email ?? "")) found.email = "Format email tidak valid.";
    if (!/^(\+?62|0)8[1-9][0-9]{6,11}$/.test((data.whatsapp ?? "").replace(/[\s-]/g, ""))) {
      found.whatsapp = "Nomor WhatsApp Indonesia tidak valid.";
    }
    if (picked.length === 0) found.services = "Pilih minimal satu layanan.";
    if (!data.budget) found.budget = "Pilih rentang budget.";
    const message = (data.message ?? "").trim();
    if (message.length < 20 || message.length > 1000) {
      found.message = "Deskripsi kebutuhan 20–1000 karakter.";
    }
    if (data.eventDate && new Date(data.eventDate) < new Date(new Date().toDateString())) {
      found.eventDate = "Tanggal acara tidak boleh di masa lalu.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ ok: false, message: "Periksa kembali isian yang ditandai." });
      return;
    }

    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, services: picked }),
      });
      const result = await response.json();
      setStatus({ ok: response.ok, message: result.message });
      if (response.ok) {
        form.reset();
        setPicked([]);
      }
    } catch {
      setStatus({ ok: false, message: "Gagal menghubungi server. Coba lagi sebentar lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama" name="name" required error={errors.name} autoComplete="name" />
        <Field label="Perusahaan" name="company" autoComplete="organization" />
        <Field label="Jabatan" name="role" autoComplete="organization-title" />
        <Field label="Email" name="email" type="email" required error={errors.email} autoComplete="email" />
        <Field
          label="Nomor WhatsApp"
          name="whatsapp"
          type="tel"
          required
          placeholder="0812…"
          error={errors.whatsapp}
          autoComplete="tel"
        />
        <Field label="Perkiraan tanggal acara" name="eventDate" type="date" error={errors.eventDate} />
      </div>

      <fieldset>
        <legend className="text-xs tracking-wide text-white/60">
          Layanan yang diminati <span className="text-[var(--holo-magenta)]">*</span>
        </legend>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {solutions.map((solution) => {
            const active = picked.includes(solution.key);
            return (
              <li key={solution.key}>
                <button
                  type="button"
                  onClick={() => toggleSolution(solution.key)}
                  aria-pressed={active}
                  className="rounded-full border px-3.5 py-1.5 text-xs transition"
                  style={{
                    borderColor: active ? "var(--holo-cyan)" : "rgba(255,255,255,0.15)",
                    color: active ? "var(--holo-cyan)" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {solution.title}
                </button>
              </li>
            );
          })}
        </ul>
        {errors.services ? (
          <p className="mt-1.5 text-[11px] text-[var(--holo-magenta)]">{errors.services}</p>
        ) : null}
      </fieldset>

      <Select
        label="Rentang budget"
        name="budget"
        required
        error={errors.budget}
        options={budgetRanges.map((range) => ({ value: range, label: range }))}
      />

      <Textarea
        label="Deskripsi kebutuhan"
        name="message"
        required
        error={errors.message}
        placeholder="Ceritakan acara, ruang, dan hasil yang diharapkan."
      />

      <FormStatus state={status} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Kirim inquiry</SubmitButton>
        <p className="text-[11px] text-white/35">
          Dengan mengirim, kamu setuju datamu disimpan untuk keperluan penawaran.
        </p>
      </div>
    </form>
  );
}
