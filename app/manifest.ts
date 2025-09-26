// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "UniVault — E-Library",
        short_name: "UniVault",
        description: "Academic e-library for students — read, download, and study offline.",
        start_url: "/?source=pwa",
        display: "standalone", // looks like a native app
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#0b1220", // matches your brand color
        icons: [
            {
                src: "/icons/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icons/maskable-icon.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable", // ensures proper Android adaptive icon
            },
        ],
    };
}
