import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["canvas", "pdfjs-dist"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore native canvas for client/PWA builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
      };

      config.externals = [...(config.externals || []), "canvas"];
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  // @ts-ignore
  sentry: {
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // disable PWA in dev
  // @ts-ignore
  fallbacks: {
    // HTML fallback
    document: "/offline",
    // (optional) add image/PDF fallback too if you want
    image: "/icons/android-chrome-192x192.png",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\/.*\.(?:png|jpg|jpeg|svg|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:pdf)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "pdf-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 90 * 24 * 60 * 60 },
      },
    },
    {
      // Catch-all for API routes, ensuring they load from Cache if offline, but try Network first.
      urlPattern: /\/api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
  ],
  // @ts-ignore
})(nextConfig);

export default withSentryConfig(pwaConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "rcf-elibrary",
  project: "e-library",

  // Only print logs for uploading source maps in CI or when debug is enabled
  silent: !process.env.CI,

  // Forstands to not upload source maps in development or when SENTRY_AUTH_TOKEN is missing
  disableLogger: true,
});
