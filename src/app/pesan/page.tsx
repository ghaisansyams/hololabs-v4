import { redirect } from "next/navigation";

/** The old reservation URL; booking now lives at /booking, as on hololabs.id. */
export default function PesanPage() {
  redirect("/booking");
}
