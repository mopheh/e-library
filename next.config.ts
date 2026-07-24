import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // These are Node-only, never need client bundling, and are heavy enough
  // (native binaries / WASM / worker scripts) that letting webpack trace and
  // bundle them into the server build risks OOMing the build container.
  serverExternalPackages: ["canvas", "pdfjs-dist", "tesseract.js", "mammoth"],
  // lib/embedding-worker.cjs is loaded via `new Worker(path.join(...))`, a
  // runtime-constructed path outside the webpack module graph, so Next's
  // serverless file tracer can't statically discover its @xenova/transformers
  // (+ onnxruntime-node native binary) dependency from there. Only the two
  // entrypoints that actually call getEmbedding() at request time need it -
  // the background job worker (workers/index.ts) is a separate long-running
  // Node process with a plain node_modules install, not a traced serverless
  // bundle, so it doesn't need this.
  outputFileTracingIncludes: {
    "/api/ask": ["./node_modules/@xenova/transformers/**/*", "./node_modules/onnxruntime-node/**/*"],
    "/dashboard/tutor/[courseId]": ["./node_modules/@xenova/transformers/**/*", "./node_modules/onnxruntime-node/**/*"],
  },
  // onnxruntime-node bundles darwin/linux/win32 native binaries directly in
  // the package (no per-platform optionalDependencies split), and Vercel's
  // functions always run linux - excluding the other two keeps ~60MB out of
  // the traced bundle, which otherwise lands right at Vercel's 250MB
  // unzipped function size limit.
  outputFileTracingExcludes: {
    "/api/ask": ["./node_modules/onnxruntime-node/bin/napi-v3/darwin/**/*", "./node_modules/onnxruntime-node/bin/napi-v3/win32/**/*"],
    "/dashboard/tutor/[courseId]": ["./node_modules/onnxruntime-node/bin/napi-v3/darwin/**/*", "./node_modules/onnxruntime-node/bin/napi-v3/win32/**/*"],
  },
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

  // Tree-shake Sentry's debug logging out of the client bundle in production.
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
