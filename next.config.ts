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
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  experimental: {
    // Server actions default to a 1 MB body; the transfer-proof upload accepts
    // up to 3 MB (see MAX_PROOF_BYTES), so leave headroom for the form fields.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
