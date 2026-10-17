import type { Metadata } from "next";
import { OurStorySection } from "@/components/home/our-story-section";
import { siteConfig } from "@/data/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Story",
  description: `Cerita brand ${siteConfig.name}.`,
};

export default function OurStoryPage() {
  return <OurStorySection />;
}
