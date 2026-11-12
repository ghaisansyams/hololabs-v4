import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";
import { isAdmin } from "@/lib/admin/guard";
import { sniffImage } from "@/lib/utils/image";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Admin-only image upload for the CMS. Returns the public "/media/<id>" URL. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Berkas tidak terbaca." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Pilih gambar dulu." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB." }, { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniffImage(data);
  if (!contentType) {
    return NextResponse.json({ error: "Format harus PNG, JPG, WebP, atau GIF." }, { status: 415 });
  }

  const [row] = await getDb()
    .insert(schema.cmsMedia)
    .values({ filename: file.name.slice(0, 120), contentType, size: data.length, data })
    .returning({ id: schema.cmsMedia.id });
  return NextResponse.json({ url: `/media/${row.id}` });
}
