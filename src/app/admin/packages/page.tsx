import { AdminHeader } from "@/components/admin/page-header";
import { updatePackage } from "../actions";
import { listAllPackages } from "@/lib/services/admin";
import { Field, TextInput, TextArea } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await listAllPackages();
  return (
    <>
      <AdminHeader title="Paket F&B" description="Perubahan harga langsung tampil di halaman pemesanan." />
      <div className="grid gap-5 lg:grid-cols-3">
        {packages.map((pkg) => (
          <form key={pkg.id} action={updatePackage} className="space-y-4 rounded-card border border-line bg-surface p-6">
            <input type="hidden" name="packageId" value={pkg.id} />
            <Field label="Nama paket" htmlFor={`name-${pkg.id}`} required>
              <TextInput id={`name-${pkg.id}`} name="name" defaultValue={pkg.name} required />
            </Field>
            <Field label="Deskripsi" htmlFor={`desc-${pkg.id}`}>
              <TextArea id={`desc-${pkg.id}`} name="description" defaultValue={pkg.description} />
            </Field>
            <Field label="Harga per kursi (Rp)" htmlFor={`price-${pkg.id}`} required>
              <TextInput id={`price-${pkg.id}`} name="price" type="number" min={0} step={1000} defaultValue={pkg.price} required />
            </Field>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <input type="checkbox" name="active" defaultChecked={pkg.active} className="size-4 accent-accent" />
              Tampilkan di halaman pemesanan
            </label>
            <Button type="submit" className="w-full">
              Simpan
            </Button>
          </form>
        ))}
      </div>
    </>
  );
}
