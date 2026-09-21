import type { Metadata } from "next";
import "./globals.css";
import LocalFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/provider";
import { ThemeProvider } from "@/components/theme-provider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/react";
import { OfflineIndicator } from "@/components/OfflineIndicator";
const poppinsSans = LocalFont({
  src: [
    { path: "/fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "/fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "/fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
});

const SITE_URL = "https://rcfbethelacademy.com";
const SITE_NAME = "RCF E-Library";
const SITE_DESCRIPTION =
  "RCF E-Library is the all-in-one academic platform for university students. AI-powered study tools, a structured digital library, real-time collaboration, exam practice, and career opportunities, all in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RCF E-Library: Your Complete Academic Study Hub",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "e-library",
    "online study platform",
    "digital library",
    "AI study tools",
    "exam practice",
    "RCF Bethel Academy",
  ],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "RCF E-Library: Your Complete Academic Study Hub",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RCF E-Library: Your Complete Academic Study Hub",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`antialiased !overflow-x-hidden`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>{children}</Providers>
            <ServiceWorkerRegister />
            <OfflineIndicator />
            <Analytics />
            <Toaster
              position="top-center"
              richColors
              duration={4000}
              toastOptions={{
                className: "font-poppins bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl transition-all !p-4 !gap-3",
                classNames: {
                  title: "!text-sm !font-bold",
                  description: "!text-xs !text-zinc-500 dark:!text-zinc-400 !line-clamp-3 !mt-0.5",
                  icon: "!mt-0.5",
                  error: "!border-red-300 dark:!border-red-900",
                  success: "!border-green-300 dark:!border-green-900",
                },
                style: {
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  maxWidth: "380px",
                }
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
