"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { Field, TextInput } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Password" htmlFor="password" required>
        <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
