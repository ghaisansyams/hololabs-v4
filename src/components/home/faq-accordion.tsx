"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils/cn";

export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-10 divide-y divide-line border-t border-line">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <Reveal key={index} as="div" variant={index % 2 ? "right" : "left"} delay={Math.min(index, 4) * 60}>
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
          </Reveal>
        );
      })}
    </div>
  );
}
