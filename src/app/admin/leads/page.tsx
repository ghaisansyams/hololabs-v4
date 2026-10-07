import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getSql, hasDatabase } from "@/lib/db";
import { StatusSelect } from "../status-select";
import { updateLeadStatusAction } from "../actions";

export const metadata = { title: "Leads", robots: { index: false, follow: false } };

const STATUSES = [
  { value: "NEW", label: "Baru" },
  { value: "CONTACTED", label: "Dihubungi" },
  { value: "QUOTED", label: "Penawaran dikirim" },
  { value: "WON", label: "Menang" },
  { value: "LOST", label: "Kalah" },
];

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  services: string[];
  budget: string;
  message: string;
  status: string;
  event_date: string | null;
  created_at: string;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!hasDatabase()) redirect("/admin/login");
  if (!(await getSession())) redirect("/admin/login");

  const { status } = await searchParams;
  const sql = getSql()!;
  const rows = (await (status && STATUSES.some((s) => s.value === status)
    ? sql`select * from leads where status = ${status} order by created_at desc limit 200`
    : sql`select * from leads order by created_at desc limit 200`)) as unknown as Lead[];

  return (
    <div>
      <h1 className="holo-display text-2xl text-white">Leads</h1>
      <p className="mt-1.5 text-sm text-white/45">{rows.length} inquiry, terbaru di atas.</p>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filter status">
        <a
          href="/admin/leads"
          className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
            !status ? "border-white/50 text-white" : "border-white/15 text-white/50"
          }`}
        >
          Semua
        </a>
        {STATUSES.map((s) => (
          <a
            key={s.value}
            href={`/admin/leads?status=${s.value}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
              status === s.value ? "border-white/50 text-white" : "border-white/15 text-white/50"
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-white/35">Belum ada lead.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((lead) => (
            <li key={lead.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/90">
                    {lead.name}
                    {lead.company ? <span className="text-white/45"> · {lead.company}</span> : null}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    <a href={`mailto:${lead.email}`} className="underline underline-offset-2">
                      {lead.email}
                    </a>
                    {" · "}
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                      className="underline underline-offset-2"
                    >
                      {lead.whatsapp}
                    </a>
                  </p>
                </div>
                <StatusSelect
                  id={lead.id}
                  current={lead.status}
                  options={STATUSES}
                  action={updateLeadStatusAction}
                />
              </div>

              <p className="mt-3 text-sm text-white/65">{lead.message}</p>

              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-[11px] text-white/40">
                <div>
                  <dt className="inline">Layanan: </dt>
                  <dd className="inline text-white/60">{lead.services.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt className="inline">Budget: </dt>
                  <dd className="inline text-white/60">{lead.budget}</dd>
                </div>
                {lead.event_date ? (
                  <div>
                    <dt className="inline">Tanggal acara: </dt>
                    <dd className="inline text-white/60">
                      {new Date(lead.event_date).toLocaleDateString("id-ID")}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="inline">Masuk: </dt>
                  <dd className="inline text-white/60">
                    {new Date(lead.created_at).toLocaleString("id-ID")}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
