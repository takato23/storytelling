import type { NextConfig } from "next";
import { getEnv, validateProductionEnvironment } from "./lib/config";

const env = getEnv();
const isDev = env.NODE_ENV !== "production";

validateProductionEnvironment();

function buildContentSecurityPolicy() {
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "https://api.stripe.com",
    "https://js.stripe.com",
    "https://api.mercadopago.com",
    env.posthogHost,
    "https://raw.githack.com",
    "https://raw.githubusercontent.com",
    "https://cdn.jsdelivr.net",
  ];

  if (isDev) {
    connectSources.push("ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*");
  }

  const scriptSources = ["'self'", "'unsafe-inline'", "https://js.stripe.com"];
  if (isDev) {
    scriptSources.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://api.mercadopago.com https://www.mercadopago.com",
    "frame-ancestors 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "worker-src 'self' blob:",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
        ],
      },
    ];
  },
};

export default nextConfig;
