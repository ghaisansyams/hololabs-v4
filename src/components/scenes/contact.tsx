import Image from "next/image";

import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { SiteContent } from "@/lib/site-content";
import { InquiryForm } from "@/components/forms/inquiry-form";

/** Scene penutup — inquiry B2B. */
export function Contact({ content }: { content: SiteContent }) {
  const { identity } = content;
  return (
    <Section
      id="contact"
      describe="Bagian kontak berisi formulir inquiry untuk brand, korporat, dan institusi."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="10">Let's work together</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent="into an experience.">
          Turn your idea
        </Display>
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <Reveal delay={140}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-9">
            <h3 className="holo-display text-xl">Ceritakan kebutuhanmu</h3>
            <p className="mt-2 text-sm text-white/55">
              Semakin jelas ruang, audiens, dan hasil yang diharapkan, semakin cepat kami bisa
              menyiapkan penawaran yang tepat.
            </p>
            <InquiryForm />
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="space-y-7">
            <div>
              <p className="holo-eyebrow">Email</p>
              <a
                href={`mailto:${identity.email}`}
                className="mt-1.5 block text-sm text-white/80 underline underline-offset-4 transition hover:text-white"
              >
                {identity.email}
              </a>
            </div>

            {identity.whatsapp ? (
              <div>
                <p className="holo-eyebrow">WhatsApp</p>
                <a
                  href={`https://wa.me/${identity.whatsapp.replace(/\D/g, "")}`}
                  className="mt-1.5 block text-sm text-white/80 underline underline-offset-4 transition hover:text-white"
                >
                  {identity.whatsapp}
                </a>
              </div>
            ) : null}

            {identity.address ? (
              <div>
                <p className="holo-eyebrow">Lab</p>
                <p className="mt-1.5 text-sm text-white/70">{identity.address}</p>
              </div>
            ) : null}

            <div className="rounded-xl border border-dashed border-white/15 p-5">
              <p className="text-xs leading-relaxed text-white/45">
                Nomor WhatsApp, alamat lab, dan akun media sosial belum diisi. Keduanya ada di daftar
                materi yang masih perlu disiapkan HOLOLABS (Lampiran A PRD) dan akan tampil otomatis
                begitu dimasukkan lewat dashboard admin.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

export function Footer({ content }: { content: SiteContent }) {
  const { identity } = content;
  return (
    <footer className="relative z-10 border-t border-white/10 py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Image src="/hololabs-lockup.png" alt="HOLOLABS" width={1269} height={756} className="h-10 w-auto" />
            <p className="holo-eyebrow mt-3">{identity.tagline}</p>
            <ul className="mt-4 flex gap-x-5 text-[11px] tracking-[0.16em] text-white/40">
              {identity.pillars.map((pillar) => (
                <li key={pillar}>{pillar.toUpperCase()}</li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-white/35">
            <p>{identity.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
