"use client"

import { useEffect } from "react"
import { useUIStore } from "@/stores/ui-store"
import Loader from "@/components/loader"
import Header from "@/components/header"
import HeroSection from "@/components/hero-section"
import LookBreakdown from "@/components/look-breakdown"
import PopularProducts from "@/components/popular-products"
import Testimonials from "@/components/testimonials"
import Footer from "@/components/footer"
import PageTransition from "@/components/page-transition"

export default function HomePage() {
  const { isLoading, setLoading } = useUIStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [setLoading])

  if (isLoading) {
    return <Loader />
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        <Header />
        <main>
          <HeroSection />
          <PopularProducts />
          <LookBreakdown />
          <Testimonials/>
        </main>
        <Footer />
      </div>
    </PageTransition>
  )
}
