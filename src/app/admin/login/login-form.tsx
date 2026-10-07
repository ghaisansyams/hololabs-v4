"use client";

import { useActionState } from "react";

import { signInAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, null);

  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs text-white/55">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[var(--holo-cyan)]"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs text-white/55">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[var(--holo-cyan)]"
        />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-[var(--holo-magenta)]">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full px-6 py-3 text-sm font-medium text-[var(--holo-ink)] disabled:opacity-50"
        style={{ background: "var(--holo-gradient)" }}
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
