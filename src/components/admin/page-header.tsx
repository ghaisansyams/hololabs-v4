import type { ReactNode } from "react";

export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "success" | "warning" | "danger" | "neutral" | "accent"; children: ReactNode }) {
  const tones = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    neutral: "bg-surface-raised text-ink-soft",
    accent: "bg-accent-soft text-accent",
  } as const;
  return (
    <span className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>
  );
}

export const paymentTone = (status: string) =>
  status === "PAID" ? "success" : status === "CANCELLED" ? "danger" : "warning";
