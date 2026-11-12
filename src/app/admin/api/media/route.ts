import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";
import { isAdmin } from "@/lib/admin/guard";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Identify the image by its first bytes — the browser-supplied type isn't trusted. */
function sniff(bytes: Uint8Array): string | null {
  const at = (i: number) => bytes[i];
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) return "image/png";
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (at(0) === 0x47 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x38) return "image/gif";
  if (
    at(0) === 0x52 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x46 &&
    at(8) === 0x57 && at(9) === 0x45 && at(10) === 0x42 && at(11) === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

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
  const contentType = sniff(data);
  if (!contentType) {
    return NextResponse.json({ error: "Format harus PNG, JPG, WebP, atau GIF." }, { status: 415 });
  }

  const [row] = await getDb()
    .insert(schema.cmsMedia)
    .values({ filename: file.name.slice(0, 120), contentType, size: data.length, data })
    .returning({ id: schema.cmsMedia.id });
  return NextResponse.json({ url: `/media/${row.id}` });
}
