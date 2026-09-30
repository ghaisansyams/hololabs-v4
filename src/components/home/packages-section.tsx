import Link from "next/link";
import { Check } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { packagesPreview } from "@/data/packages";
import { formatRupiah } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function PackagesSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Paket F&B"
          title="Pilih paket sesuai rombonganmu"
          description="Harga berlaku per kursi. Dipilih saat pemesanan, bersamaan dengan sesi dan jumlah kursi."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {packagesPreview.map((pkg, index) => {
            const featured = pkg.id === "standard";
            return (
              <Reveal key={pkg.id} delay={index * 80}>
                <article
                  className={cn(
                    "flex h-full flex-col rounded-card border p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1",
                    featured
                      ? "border-brand/50 bg-gradient-to-b from-brand-soft/60 to-surface shadow-glow"
                      : "border-line bg-surface hover:shadow-lift",
                  )}
                >
                  {featured ? (
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-pill bg-gradient-to-r from-brand to-accent px-2.5 py-1 text-xs font-bold text-canvas">
                      Paling dipilih
                    </span>
                  ) : null}
                  <h3 className="text-lg font-extrabold text-ink">{pkg.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{pkg.description}</p>
                  <p className="mt-5 text-3xl font-extrabold text-ink font-display">
                    {formatRupiah(pkg.price)}
                    <span className="ml-1 text-sm font-semibold text-muted">/ kursi</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-soft">
                    {pkg.includes.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/pesan?package=${pkg.id}`}
                    className={buttonStyles({
                      variant: featured ? "primary" : "secondary",
                      className: "mt-6 w-full",
                    })}
                  >
                    Pilih {pkg.name}
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
