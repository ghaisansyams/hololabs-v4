"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Site-wide settings from the CMS that client components need — the logo and
 * the header/menu. Read once in the root layout (server) and handed down
 * here, so the header, logo and booking wizard don't each need a data prop.
 */
export interface Chrome {
  logoLockup: string;
  logoMark: string;
  siteName: string;
  reservationLabel: string;
  menuItems: { label: string; href: string }[];
  menuImage: string;
  menuEyebrow: string;
  menuTagline: string;
}

const fallback: Chrome = {
  logoLockup: "/hololabs-lockup.png",
  logoMark: "/hololabs-mark.png",
  siteName: "Hololabs",
  reservationLabel: "Reservasi",
  menuItems: [],
  menuImage: "/renders/ambiance-hall.jpg",
  menuEyebrow: "Hololabs",
  menuTagline: "A Creative Technology Lab",
};

const ChromeContext = createContext<Chrome>(fallback);

export function ChromeProvider({ value, children }: { value: Chrome; children: ReactNode }) {
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export const useChrome = () => useContext(ChromeContext);
