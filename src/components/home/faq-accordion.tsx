"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils/cn";

export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <Reveal key={index} as="div" variant={index % 2 ? "right" : "left"} delay={Math.min(index, 4) * 60}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : index)}
              aria-expanded={expanded}
              className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
            >
              <span className="text-base font-medium text-ink sm:text-lg">{item.question}</span>
              <Plus className={cn("size-5 shrink-0 text-ink-soft transition-transform duration-300", expanded && "rotate-45")} aria-hidden />
            </button>
            <div
              className={cn("grid overflow-hidden transition-[grid-template-rows] duration-300", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-10 text-[0.9375rem] leading-relaxed text-muted">{item.answer}</p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
