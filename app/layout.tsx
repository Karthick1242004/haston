import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, Anton, Allura } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/components/auth-provider"
import CartSidebar from "@/components/cart-sidebar"
import CartSyncProvider from "@/components/cart-sync-provider"
import AnimatedBanner from "@/components/animated-banner"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })
const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
})
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
})
const allura = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-allura",
})

export const metadata: Metadata = {
  title: "Hex & Hue - Summer Collection 2025",
  description: "Premium men's fashion with effortless style and timeless elegance",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} ${anton.variable} ${poppins.variable} ${allura.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartSyncProvider>
            <AnimatedBanner />
            {children}
            <CartSidebar />
            <Toaster />
            </CartSyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
