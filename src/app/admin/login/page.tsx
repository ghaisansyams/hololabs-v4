import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (!hasDatabase()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-white/80">
          <h1 className="holo-display text-xl">Dashboard belum aktif</h1>
          <p className="mt-3 text-sm text-white/55">
            Variabel <code className="text-white/80">DATABASE_URL</code> belum diatur, jadi dashboard
            admin belum bisa dipakai. Website publik tetap tayang dengan konten bawaan.
          </p>
        </div>
      </div>
    );
  }

  if (await getSession()) redirect("/admin");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <div className="w-full">
        <p className="holo-display text-lg tracking-[0.2em] text-white">
          HOLO<span className="holo-gradient-text">LABS</span>
        </p>
        <h1 className="holo-display mt-6 text-3xl text-white">Masuk dashboard</h1>
        <p className="mt-2 text-sm text-white/50">
          Akun dibuat oleh Super Admin. Tidak ada pendaftaran mandiri.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
