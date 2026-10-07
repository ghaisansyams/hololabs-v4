import "server-only";

import * as defaults from "@/content/site";
import { getOverrides, merge, type Overrides } from "./content";

/** Bentuk isi yang diterima scene. Sama persis dengan bentuk bawaannya. */
export interface SiteContent {
  identity: typeof defaults.identity;
  hero: typeof defaults.hero;
  essence: typeof defaults.essence;
  integration: typeof defaults.integration;
  colorJourney: typeof defaults.colorJourney;
  ecosystem: typeof defaults.ecosystem;
  journey: typeof defaults.journey;
  process: typeof defaults.process;
}

export function assemble(overrides: Overrides): SiteContent {
  return {
    identity: merge("identity", overrides),
    hero: merge("hero", overrides),
    essence: merge("essence", overrides),
    integration: merge("integration", overrides),
    colorJourney: merge("colorJourney", overrides),
    ecosystem: merge("ecosystem", overrides),
    journey: merge("journey", overrides),
    process: merge("process", overrides),
  };
}

export async function getSiteContent(draft = false): Promise<SiteContent> {
  return assemble(await getOverrides(draft));
}
