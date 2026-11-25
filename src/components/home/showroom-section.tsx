import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ShowroomMap } from "@/components/home/showroom-map";
import { getSiteContent } from "@/lib/cms";

/**
 * Showroom plan right under the hero: where each part of the show takes
 * place, with photos of the space. Texts come from the CMS ("Denah showroom").
 */
export async function ShowroomSection() {
  const { showroom } = await getSiteContent();

  return (
    <section id="showroom" className="relative isolate overflow-hidden bg-[#06031a] py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_40%_at_20%_0%,rgb(99_102_241/0.18),transparent_70%),radial-gradient(ellipse_45%_35%_at_90%_100%,rgb(217_70_239/0.12),transparent_70%)]" />
      <Container>
        <div className="max-w-3xl">
          <Reveal>
            <p className="font-label text-[0.8125rem] uppercase tracking-[0.3em] text-cyan sm:text-sm">{showroom.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.12] text-ink sm:text-4xl lg:text-5xl">{showroom.title}</h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 text-lg leading-9 text-ink-soft">{showroom.body}</p>
          </Reveal>
        </div>
        <Reveal delay={120} className="mt-12">
          <ShowroomMap
            zones={showroom.zones.map((z) => ({ name: z.name, tag: z.tag, photos: [z.photo1, z.photo2, z.photo3, z.photo4].filter(Boolean) }))}
            text={{
              noPhoto: showroom.noPhoto,
              floorGround: showroom.floorGround,
              floorUpper: showroom.floorUpper,
              swipeHint: showroom.swipeHint,
              planImage: showroom.planImage,
              note: showroom.note,
            }}
          />
        </Reveal>
      </Container>
    </section>
  );
}
