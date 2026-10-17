import type { Metadata } from "next";
import { AmbianceSection } from "@/components/home/ambiance-section";
import { siteConfig } from "@/data/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ambiance",
  description: `Suasana dan ruang ${siteConfig.name}.`,
};

export default function AmbiancePage() {
  return <AmbianceSection />;
}
