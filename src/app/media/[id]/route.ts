import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db/client";

/**
 * Serves an image uploaded from the CMS (see /admin/api/media). The id is a
 * random UUID and an upload is never modified, so the response can be
 * cached forever.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const [row] = await getDb()
    .select({ data: schema.cmsMedia.data, contentType: schema.cmsMedia.contentType })
    .from(schema.cmsMedia)
    .where(eq(schema.cmsMedia.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
