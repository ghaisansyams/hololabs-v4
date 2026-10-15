"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { faqItems } from "@/data/faq";
import { cn } from "@/lib/utils/cn";

/**
 * FAQ accordion — mirrors meatguysteakhouse.com's expandable question list.
 */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-line bg-canvas-deep py-20 sm:py-28">
      <Container className="max-w-2xl">
        <div className="text-center">
          <Reveal>
            <Eyebrow className="justify-center">FAQ</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-4 text-3xl text-ink sm:text-4xl">Pertanyaan yang sering ditanyakan</h2>
          </Reveal>
        </div>

        <div className="mt-10 divide-y divide-line border-t border-line">
          {faqItems.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : index)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-ink sm:text-base">{item.question}</span>
                  <Plus className={cn("size-4 shrink-0 text-accent transition-transform duration-300", expanded && "rotate-45")} aria-hidden />
                </button>
                <div
                  className={cn("grid overflow-hidden transition-[grid-template-rows] duration-300", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
