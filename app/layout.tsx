import type { Metadata } from "next"
import "./globals.css"
import LocalFont from "next/font/local"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/app/provider"
const poppinsSans = LocalFont({
  src: [
    { path: "/fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "/fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "/fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
})

export const metadata: Metadata = {
  title: "E-Library",
  description: "Online Study",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`antialiased !overflow-x-hidden`}>
          <Providers>{children}</Providers>
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
