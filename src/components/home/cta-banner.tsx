import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";

export async function CtaBanner() {
  const { cta } = await getSiteContent();
  return (
    <section className="pb-4 pt-6 sm:pb-8">
      <Container>
        <Reveal variant="zoom">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-dark via-surface to-accent-dark px-6 py-12 text-center sm:rounded-[2rem] sm:px-12 sm:py-16">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-canvas/40" />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
                <Sparkles className="size-3.5" aria-hidden />
                {cta.badge}
              </span>
              <h2 className="mt-5 text-[1.75rem] leading-tight font-extrabold text-white sm:text-4xl">
                {cta.title}
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/75 sm:text-base">
                {cta.text}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/pesan" className={buttonStyles({ size: "lg", className: "w-full sm:w-auto" })}>
                  {cta.ctaPrimary}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/cek-tiket"
                  className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full border-white/30 bg-white/5 text-white hover:bg-white/10 sm:w-auto" })}
                >
                  {cta.ctaSecondary}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
