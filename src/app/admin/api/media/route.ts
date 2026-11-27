import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";
import { isAdmin } from "@/lib/admin/guard";
import { sniffImage, sniffVideo } from "@/lib/utils/image";
import { logActivity } from "@/lib/services/activity-log";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

/** Admin-only image or video upload for the CMS. Returns the public "/media/<id>" URL. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  let file: FormDataEntryValue | null;
  let kind: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    file = form.get("file");
    kind = form.get("kind");
  } catch {
    return NextResponse.json({ error: "Berkas tidak terbaca." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Pilih berkas dulu." }, { status: 400 });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Ukuran berkas maksimal 25 MB (gambar 5 MB). Kompres videonya dulu." }, { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const image = sniffImage(data);
  const video = image ? null : sniffVideo(data);
  const contentType = image ?? video;
  if (!contentType) {
    return NextResponse.json({ error: "Format harus PNG, JPG, WebP, GIF, MP4, atau WebM." }, { status: 415 });
  }
  // an image field takes images only and a video field videos only, so a PNG can never end up as a "video"
  if (kind === "video" && image) return NextResponse.json({ error: "Kolom ini untuk video (MP4 atau WebM), bukan gambar." }, { status: 415 });
  if (kind === "image" && video) return NextResponse.json({ error: "Kolom ini untuk gambar, bukan video." }, { status: 415 });
  if (image && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB." }, { status: 413 });
  }

  const [row] = await getDb()
    .insert(schema.cmsMedia)
    .values({ filename: file.name.slice(0, 120), contentType, size: data.length, data })
    .returning({ id: schema.cmsMedia.id });
  await logActivity({ category: "Konten", action: video ? "Unggah video" : "Unggah gambar", target: file.name.slice(0, 120), detail: `${Math.round(data.length / 1024)} KB, ${contentType}` });
  return NextResponse.json({ url: `/media/${row.id}` });
}
