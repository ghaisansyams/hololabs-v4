"use client";

import { useState } from "react";

import { journey } from "@/content/site";
import { Field, FormStatus, Select, SubmitButton, Textarea } from "./field";

type Status = { ok: boolean; message: string } | null;

/**
 * Form reservasi Experience Journey — aturan validasi PRD bagian 8.
 *
 * Validasi di sini hanya untuk kenyamanan; server menjalankannya ulang dan
 * server yang menentukan (PRD bagian 11).
 */
export function ReservationForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const found: Record<string, string> = {};
    if (!data.name || data.name.trim().length < 3) found.name = "Nama minimal 3 karakter.";
    if (!/^(\+?62|0)8[1-9][0-9]{6,11}$/.test((data.whatsapp ?? "").replace(/[\s-]/g, ""))) {
      found.whatsapp = "Nomor WhatsApp Indonesia tidak valid.";
    }
    if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      found.email = "Format email tidak valid.";
    }
    const people = Number(data.people);
    if (!Number.isInteger(people) || people < 1 || people > 30) {
      found.people = "Jumlah orang antara 1 dan 30.";
    }
    if (!data.visitorType) found.visitorType = "Pilih tipe kunjungan.";
    if (!data.preferredDate) found.preferredDate = "Pilih tanggal kunjungan.";
    else if (new Date(data.preferredDate) < new Date(new Date().toDateString())) {
      found.preferredDate = "Tanggal tidak boleh di masa lalu.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ ok: false, message: "Periksa kembali isian yang ditandai." });
      return;
    }

    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setStatus({ ok: response.ok, message: result.message });
      if (response.ok) form.reset();
    } catch {
      setStatus({ ok: false, message: "Gagal menghubungi server. Coba lagi sebentar lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama" name="name" required error={errors.name} autoComplete="name" />
        <Field
          label="Nomor WhatsApp"
          name="whatsapp"
          type="tel"
          required
          placeholder="0812…"
          hint="Dipakai sebagai identitas booking."
          error={errors.whatsapp}
          autoComplete="tel"
        />
        <Field label="Email" name="email" type="email" error={errors.email} autoComplete="email" />
        <Field
          label="Jumlah orang"
          name="people"
          type="number"
          min={1}
          max={30}
          required
          defaultValue={1}
          error={errors.people}
        />
        <Select
          label="Tipe kunjungan"
          name="visitorType"
          required
          error={errors.visitorType}
          options={journey.visitorTypes.map((t) => ({
            value: t.key,
            label: `${t.label} — ${t.size}`,
          }))}
        />
        <Field
          label="Tanggal yang diinginkan"
          name="preferredDate"
          type="date"
          required
          error={errors.preferredDate}
        />
      </div>

      <Textarea label="Catatan" name="note" placeholder="Kebutuhan khusus, pertanyaan, dll." />

      <FormStatus state={status} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Kirim reservasi</SubmitButton>
        <p className="text-[11px] text-white/35">
          Dengan mengirim, kamu setuju datamu disimpan untuk keperluan reservasi.
        </p>
      </div>
    </form>
  );
}
