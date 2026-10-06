import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { isAdminConfigured } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Login Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-7">
        <h1 className="text-xl font-extrabold text-ink">Login Admin</h1>
        <p className="mt-1 text-sm text-muted">Holomoc Exhibition — area pengelola.</p>
        {isAdminConfigured() ? (
          <div className="mt-6">
            <LoginForm />
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
            ADMIN_PASSWORD dan ADMIN_SESSION_SECRET belum diisi di environment.
          </p>
        )}
      </div>
    </main>
  );
}
