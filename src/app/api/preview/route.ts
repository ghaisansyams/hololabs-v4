import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

/**
 * Menyalakan pratinjau draft.
 *
 * Memakai draft mode bawaan Next, bukan cookie buatan sendiri: cookie-nya
 * diset di server, httpOnly, dan ditandatangani, sehingga pengunjung biasa
 * tidak bisa menyalakannya sendiri. Sesi admin diperiksa lebih dulu di sini
 * (PRD Lampiran B).
 */
export async function GET() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  (await draftMode()).enable();
  redirect("/");
}
