import type { Metadata } from "next";
import "./globals.css";
import LocalFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/provider";
import { ThemeProvider } from "@/components/theme-provider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { OfflineIndicator } from "@/components/OfflineIndicator";
const poppinsSans = LocalFont({
  src: [
    { path: "/fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "/fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "/fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "UniVault - E-Library",
  description: "Online Study",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
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
            <Toaster 
              position="top-center" 
              richColors 
              duration={4000} 
              toastOptions={{
                className: "font-poppins bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl transition-all",
                style: {
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
