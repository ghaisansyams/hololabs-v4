import { AdminHeader } from "@/components/admin/page-header";
import { createPackage, updatePackage } from "../actions";
import { listAllPackages } from "@/lib/services/admin";
import { Field, TextInput, TextArea } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await listAllPackages();
  return (
    <>
      <AdminHeader title="Paket F&B" description="Nama, harga, dan isi paket langsung tampil di halaman depan dan halaman pemesanan. Paket yang sudah pernah dipesan tidak bisa dihapus — nonaktifkan saja." />
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
            <Field label="Isi paket (satu per baris)" htmlFor={`inc-${pkg.id}`}>
              <TextArea id={`inc-${pkg.id}`} name="includes" defaultValue={pkg.includes.join("\n")} />
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

        <form action={createPackage} className="space-y-4 rounded-card border border-dashed border-line bg-surface/50 p-6">
          <p className="font-bold text-ink">Paket baru</p>
          <Field label="Nama paket" htmlFor="new-name" required>
            <TextInput id="new-name" name="name" required />
          </Field>
          <Field label="Deskripsi" htmlFor="new-desc">
            <TextArea id="new-desc" name="description" />
          </Field>
          <Field label="Harga per kursi (Rp)" htmlFor="new-price" required>
            <TextInput id="new-price" name="price" type="number" min={0} step={1000} required />
          </Field>
          <Field label="Isi paket (satu per baris)" htmlFor="new-inc">
            <TextArea id="new-inc" name="includes" />
          </Field>
          <Button type="submit" variant="secondary" className="w-full">
            Tambah paket
          </Button>
        </form>
      </div>
    </>
  );
}
