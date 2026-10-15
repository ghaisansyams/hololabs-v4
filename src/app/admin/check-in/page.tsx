import { AdminHeader } from "@/components/admin/page-header";
import { CheckInForm } from "@/components/admin/check-in-form";

export const dynamic = "force-dynamic";

export default function AdminCheckInPage() {
  return (
    <>
      <AdminHeader title="Check-in" description="Untuk petugas di pintu. Hanya booking yang sudah lunas bisa di-check-in." />
      <div className="max-w-lg">
        <CheckInForm />
      </div>
    </>
  );
}
