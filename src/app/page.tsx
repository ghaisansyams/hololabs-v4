import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";

import { StageLoader } from "@/components/three/stage-loader";
import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { MotionToggle, Preloader, SceneNav, ScrollProgress } from "@/components/scroll/chrome";
import { Hero } from "@/components/scenes/hero";
import { Dna, Integration } from "@/components/scenes/story";
import { Solutions } from "@/components/scenes/solutions";
import { Ecosystem } from "@/components/scenes/ecosystem";
import { BestWorks } from "@/components/scenes/best-works";
import { Journey } from "@/components/scenes/journey";
import { Process } from "@/components/scenes/process";
import { Contact, Footer } from "@/components/scenes/contact";
import { getHiddenSections } from "@/lib/content";
import { getSiteContent } from "@/lib/site-content";

/**
 * Isi halaman di-cache dan diberi tag.
 *
 * Tanpa ini setiap kunjungan akan memanggil basis data, padahal isinya baru
 * berubah ketika admin menekan Publish. Publish memanggil
 * `revalidateTag("cms")`, jadi perubahan tetap tampil seketika tanpa membuat
 * halaman dirender ulang untuk tiap pengunjung.
 */
async function loadPage() {
  "use cache";
  cacheTag("cms");
  cacheLife("hours");
  const [content, hidden] = await Promise.all([getSiteContent(), getHiddenSections()]);
  return { content, hidden: [...hidden] };
}

/**
 * Satu halaman scroll, 12 scene.
 *
 * Seluruh teks dirender di server sebagai HTML biasa. Kanvas 3D menempel di
 * belakangnya sebagai lapisan dekoratif, jadi halaman ini tetap utuh dan
 * terbaca bila WebGL tidak tersedia atau JavaScript gagal dimuat
 * (PRD bagian 8, aturan 4 dan 8).
 */
/**
 * Jalur pratinjau: membaca kolom draft dan tidak pernah di-cache.
 *
 * Dipisah dari loadPage karena fungsi ber-"use cache" tidak boleh membaca
 * draft mode — hasilnya akan ikut tersimpan dan bocor ke pengunjung biasa.
 */
async function loadDraftPage() {
  const [content, hidden] = await Promise.all([getSiteContent(true), getHiddenSections()]);
  return { content, hidden: [...hidden] };
}

export default async function Home() {
  const { isEnabled } = await draftMode();
  const { content, hidden } = isEnabled ? await loadDraftPage() : await loadPage();
  const show = (key: string) => !hidden.includes(key);

  return (
    <>
      <Preloader />
      <SmoothScroll />
      <StageLoader />
      <ScrollProgress />
      <SceneNav />
      <MotionToggle />

      <a href="#hero" className="holo-skip">
        Lompat ke konten
      </a>

      {isEnabled ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-full border border-[var(--holo-cyan)] bg-black/75 px-4 py-2 text-xs text-[var(--holo-cyan)] backdrop-blur">
          Pratinjau draft ·{" "}
          <a href="/api/preview/exit" className="underline underline-offset-2">
            keluar
          </a>
        </div>
      ) : null}

      <main id="main" className="relative z-10">
        {show("hero") && <Hero content={content} />}
        {show("integration") && <Integration content={content} />}
        {show("dna") && <Dna />}
        {show("solutions") && <Solutions />}
        {show("ecosystem") && <Ecosystem content={content} />}
        {show("best-works") && <BestWorks />}
        {show("journey") && <Journey content={content} />}
        {show("process") && <Process content={content} />}
        {show("contact") && <Contact content={content} />}
      </main>

      <Footer content={content} />
    </>
  );
}
