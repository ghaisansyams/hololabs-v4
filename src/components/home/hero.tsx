import Link from "next/link";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-4 pt-8 sm:pt-14 lg:pb-16 lg:pt-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-brand/25 blur-3xl motion-safe:animate-float-slow sm:size-96" />
        <div
          className="absolute -right-20 top-40 size-72 rounded-full bg-accent/20 blur-3xl motion-safe:animate-float-slow sm:size-96"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-pill border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink">
                <Sparkles className="size-3.5" aria-hidden />
                Booking engine by {siteConfig.builtBy}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 text-[2.1rem] leading-[1.08] font-extrabold text-ink sm:text-5xl lg:text-[3.4rem]">
                Amankan kursimu di <span className="text-gradient">Holomoc Exhibition</span>.
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-lg">
                Pilih sesi, pilih paket F&amp;B, dan selesaikan pembayaran dalam hitungan menit.
                Kalau sesi pilihanmu penuh, sistem otomatis mengarahkan ke sesi berikutnya yang
                masih tersedia — tidak perlu bolak-balik cek jadwal.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/pesan" className={buttonStyles({ size: "lg", className: "w-full sm:w-auto" })}>
                  Pesan Tiket
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/#jadwal"
                  className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}
                >
                  Lihat Jadwal & Paket
                </Link>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
                <div>
                  <dd className="text-xl font-extrabold text-ink font-display">18.00–21.00</dd>
                  <dt className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted">WIB / hari</dt>
                </div>
                <div>
                  <dd className="text-xl font-extrabold text-ink font-display">3</dd>
                  <dt className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted">Sesi / hari</dt>
                </div>
                <div>
                  <dd className="text-xl font-extrabold text-ink font-display">13</dd>
                  <dt className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted">Kursi / sesi</dt>
                </div>
              </dl>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={120}>
              <div className="glass relative overflow-hidden rounded-[1.75rem] p-6 shadow-lift sm:p-8">
                <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/25 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Live preview</span>
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                    <span className="size-1.5 rounded-full bg-current motion-safe:animate-pulse-soft" />
                    Kuota real-time
                  </span>
                </div>
                <div className="relative mt-6 space-y-3">
                  {[
                    { time: "18.00 – 19.00", left: 4 },
                    { time: "19.00 – 20.00", left: 0 },
                    { time: "20.00 – 21.00", left: 9 },
                  ].map((slot) => (
                    <div
                      key={slot.time}
                      className="flex items-center justify-between rounded-2xl border border-line bg-surface/80 px-4 py-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-surface-raised text-accent">
                          <Users className="size-4" aria-hidden />
                        </span>
                        <span className="text-sm font-semibold text-ink">{slot.time}</span>
                      </div>
                      <span
                        className={
                          slot.left === 0
                            ? "text-xs font-bold uppercase tracking-wide text-danger"
                            : "text-xs font-bold uppercase tracking-wide text-success"
                        }
                      >
                        {slot.left === 0 ? "Penuh → auto-routing" : `${slot.left} kursi tersisa`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="relative mt-5 text-xs leading-relaxed text-muted">
                  Ilustrasi tampilan jadwal. Sesi 19.00 penuh — pemesan otomatis diarahkan ke sesi
                  20.00 tanpa kehilangan urutan.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
