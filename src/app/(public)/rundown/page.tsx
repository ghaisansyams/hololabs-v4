import type { Metadata } from "next";
import { RundownSection } from "@/components/home/rundown-section";
import { siteConfig } from "@/data/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rundown",
  description: `Alur cerita satu show ${siteConfig.name}.`,
};

export default function RundownPage() {
  return <RundownSection />;
}
