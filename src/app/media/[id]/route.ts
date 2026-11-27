import { eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db/client";

/**
 * Serves an image or video uploaded from the CMS (see /admin/api/media). The
 * id is a random UUID and an upload is never modified, so the response can be
 * cached forever. Videos answer byte-range requests (206): Safari and iOS
 * refuse to play a video that cannot be read in pieces, and a range reads only
 * the requested slice from the database instead of the whole file.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };

  try {
    const db = getDb();
    const [meta] = await db
      .select({ contentType: schema.cmsMedia.contentType, size: schema.cmsMedia.size })
      .from(schema.cmsMedia)
      .where(eq(schema.cmsMedia.id, id))
      .limit(1);
    if (!meta) return new Response("Not found", { status: 404 });
    headers["Content-Type"] = meta.contentType;

    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
    if (range && meta.contentType.startsWith("video/") && (range[1] || range[2])) {
      const total = meta.size;
      let start = range[1] ? Number(range[1]) : Math.max(total - Number(range[2]), 0);
      let end = range[1] && range[2] ? Number(range[2]) : total - 1;
      end = Math.min(end, total - 1);
      if (start > end || start >= total) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${total}` } });
      start = Math.max(start, 0);
      const length = end - start + 1;
      const result = await db.execute(sql`select substring(data from ${start + 1}::int for ${length}::int) as part from cms_media where id = ${id}::uuid`);
      const part = (result.rows[0] as { part: Buffer } | undefined)?.part;
      if (!part) return new Response("Not found", { status: 404 });
      return new Response(new Uint8Array(part), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(part.length) },
      });
    }

    const [row] = await db.select({ data: schema.cmsMedia.data }).from(schema.cmsMedia).where(eq(schema.cmsMedia.id, id)).limit(1);
    if (!row) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(row.data), { headers: { ...headers, "Content-Length": String(row.data.length) } });
  } catch {
    // Database unreachable: answer cleanly instead of with a stack trace.
    return new Response("Layanan sedang tidak tersedia.", { status: 503, headers: { "Retry-After": "30" } });
  }
}
