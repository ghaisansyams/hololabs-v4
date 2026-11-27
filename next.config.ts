import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin file tracing to this project so unrelated lockfiles higher up the tree
// don't confuse Next's file tracing.
const projectRoot = dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera is allowed for this site only: the admin check-in scans QR codes with it
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=()" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  experimental: {
    // Server actions default to a 1 MB body; the transfer-proof upload accepts
    // up to 3 MB (see MAX_PROOF_BYTES), so leave headroom for the form fields.
    serverActions: { bodySizeLimit: "4mb" },
    // The CMS uploads videos (up to 25 MB) through /admin/api/media, which the admin middleware also matches.
    middlewareClientMaxBodySize: "30mb",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // the public ticket check page was removed: check-in now runs from the QR in the e-ticket email
    return [{ source: "/cek-tiket", destination: "/", permanent: false }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
