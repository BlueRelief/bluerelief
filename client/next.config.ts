import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

// mapbox ships its gl worker as a blob; lordicon icons are fetched as lottie json
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://api.mapbox.com",
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl} https://api.mapbox.com https://events.mapbox.com https://cdn.lordicon.com https://ip.radsoft.cloud`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  async redirects() {
    return [
      {
        source: "/:path*",
        // ingress terminates tls, so the original scheme only survives in this header
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: "https://bluerelief.app/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // report-only until we confirm nothing legitimate is blocked
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
