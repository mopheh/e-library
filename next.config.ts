import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};


export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // disable PWA in dev
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/.*\.(?:png|jpg|jpeg|svg|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:pdf)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "pdf-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 90 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/your-api-domain\/api\/(books|readingSessions).*$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
      },
    },
  ],
  // @ts-ignore
})(nextConfig);
