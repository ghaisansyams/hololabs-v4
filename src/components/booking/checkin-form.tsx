"use client";

import { useActionState } from "react";
import { CheckCircle2, ScanLine } from "lucide-react";
import { submitCheckIn, type CheckInFormState } from "@/app/(public)/cek-tiket/actions";
import { Field, TextInput } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { formatDate, formatWeekday } from "@/lib/utils/date";

const initialState: CheckInFormState = {};

export function CheckInForm() {
  const [state, formAction, pending] = useActionState(submitCheckIn, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-card border border-line bg-surface p-6">
        <Field label="Nomor booking" htmlFor="bookingNumber" required error={state.fieldErrors?.bookingNumber}>
          <TextInput id="bookingNumber" name="bookingNumber" placeholder="HLM-BOOK-2026-00001" error={state.fieldErrors?.bookingNumber} />
        </Field>
        <Field label="Nomor WhatsApp pemesan" htmlFor="whatsapp" required error={state.fieldErrors?.whatsapp}>
          <TextInput id="whatsapp" name="whatsapp" placeholder="08123456789" error={state.fieldErrors?.whatsapp} />
        </Field>
        {state.error ? (
          <p role="alert" className="rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          <ScanLine className="size-4" aria-hidden />
          {pending ? "Memeriksa…" : "Check-in"}
        </Button>
      </form>

      {state.success ? (
        <div className="flex items-start gap-3 rounded-card border border-success/40 bg-success-soft px-5 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <div className="text-sm">
            <p className="font-bold text-ink">
              {state.success.alreadyCheckedIn ? "Sudah check-in sebelumnya" : "Check-in berhasil"}
            </p>
            <p className="mt-1 text-ink-soft">
              {state.success.customerFullName} — {formatWeekday(state.success.sessionDate)},{" "}
              {formatDate(state.success.sessionDate)}, mulai {state.success.startTime.slice(0, 5)} WIB
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
