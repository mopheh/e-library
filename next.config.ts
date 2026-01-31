import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
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
};

export default withPWA({
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
      urlPattern:
        /^https:\/\/e-library-two-cyan.vercel.app\/api\/(books|readingSessions).*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
      },
    },
  ],
  // @ts-ignore
})(nextConfig);
