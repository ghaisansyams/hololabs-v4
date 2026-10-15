"use client";

import { useActionState } from "react";
import { ScanLine, CheckCircle2 } from "lucide-react";
import { checkInByNumber, type CheckInLookupState } from "@/app/admin/actions";
import { Field, TextInput } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

const initialState: CheckInLookupState = {};

export function CheckInForm() {
  const [state, formAction, pending] = useActionState(checkInByNumber, initialState);
  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4 rounded-card border border-line bg-surface p-6">
        <Field label="Nomor booking" htmlFor="bookingNumber" required>
          <TextInput id="bookingNumber" name="bookingNumber" placeholder="HLM-BOOK-2026-00001" autoFocus />
        </Field>
        {state.error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          <ScanLine className="size-4" aria-hidden />
          {pending ? "Memproses…" : "Check-in"}
        </Button>
      </form>
      {state.success ? (
        <div className="flex items-start gap-3 rounded-card border border-success/40 bg-success-soft px-5 py-4 text-sm text-ink">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          {state.success}
        </div>
      ) : null}
    </div>
  );
}
