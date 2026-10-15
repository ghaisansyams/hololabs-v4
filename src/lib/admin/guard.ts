import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isValidSessionToken } from "./session";

/**
 * Every admin server action must call this first: middleware only guards
 * page navigation, and a server action is a plain POST endpoint.
 */
export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) redirect("/admin/login");
}
