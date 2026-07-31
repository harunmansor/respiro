import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  reloadOnOnline: true,
  // Never put authenticated HTML or React Server Component payloads in a
  // persistent service-worker cache. Static build assets are still precached.
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ request, sameOrigin }) =>
          sameOrigin && request.mode === "navigate",
        handler: "NetworkOnly",
        options: { cacheName: "pages" },
      },
      {
        urlPattern: ({ request, sameOrigin }) =>
          sameOrigin && request.headers.get("RSC") === "1",
        handler: "NetworkOnly",
        options: { cacheName: "pages-rsc" },
      },
    ],
  },
  fallbacks: {
    document: "/_offline",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {},
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "media-src 'self' blob:",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
  // Allow phones/tablets on the local network to use the dev server. Next 16
  // blocks cross-origin dev requests (HMR, server actions) by default, which
  // breaks interactivity when the app is opened via the machine's LAN IP.
  // Covers common private-network ranges. Has no effect on production builds.
  allowedDevOrigins: [
    "192.168.100.46",
    "192.168.*",
    "10.*",
    "172.16.*",
    "172.17.*",
    "172.18.*",
  ],
};

// next-pwa is a Workbox/webpack plugin, so the production build must run with
// `next build --webpack` (see package.json) for the service worker to generate.
// In dev, PWA is disabled and Turbopack is used, so skip the wrapper entirely to
// avoid the webpack-config-with-Turbopack warning.
const isDev = process.env.NODE_ENV === "development";

export default isDev ? nextConfig : withPWA(nextConfig);
