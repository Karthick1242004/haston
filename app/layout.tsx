import type React from "react"
import type { Metadata } from "next"
import { Inter, Anton, Allura } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
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
  title: "HASTON - Summer Collection 2025",
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
      <body className={`${inter.className} ${anton.variable} ${allura.variable}`}>{children}</body>
    </html>
  )
}
