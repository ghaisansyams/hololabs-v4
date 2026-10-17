import type { Metadata } from "next";
import { CollectionSection } from "@/components/home/collection-section";
import { siteConfig } from "@/data/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Collection",
  description: `Karya 3D dan konten imersif ${siteConfig.name}.`,
};

export default function CollectionPage() {
  return <CollectionSection />;
}
