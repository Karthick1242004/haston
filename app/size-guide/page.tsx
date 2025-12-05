"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronLeft, Ruler, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PageTransition from "@/components/page-transition"

export default function SizeGuidePage() {
  const router = useRouter()

  const handleDownload = (type: 'regular' | 'oversize') => {
    const link = document.createElement('a')
    link.href = type === 'regular' ? '/regularfit.png' : '/oversizefit.png'
    link.download = type === 'regular' ? 'regular-fit-size-guide.png' : 'oversize-fit-size-guide.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        {/* Header */}
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-950 hover:text-blue-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </motion.div>

            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Ruler className="w-8 h-8 text-blue-950" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-950" style={{ fontFamily: "var(--font-nunito)" }}>
                  Size Guide
                </h1>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Find your perfect fit with our comprehensive size chart. All measurements are in centimeters.
              </p>
            </motion.div>

            {/* Size Guide Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Regular Fit Chart */}
              <Card className="bg-white shadow-lg border border-gray-200 overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-extrabold text-blue-950" style={{ fontFamily: "var(--font-nunito)" }}>
                      Regular Fit
                    </CardTitle>
                    <Button
                      onClick={() => handleDownload('regular')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-blue-950 border-blue-950 hover:bg-blue-950 hover:text-white transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative w-full">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-lg">
                        <Image
                          src="/regularfit.png"
                          alt="Regular Fit Size Guide Chart"
                          fill
                          className="object-contain"
                          priority
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          quality={90}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Oversize Fit Chart */}
              <Card className="bg-white shadow-lg border border-gray-200 overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-extrabold text-blue-950" style={{ fontFamily: "var(--font-nunito)" }}>
                      Oversize Fit
                    </CardTitle>
                    <Button
                      onClick={() => handleDownload('oversize')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-blue-950 border-blue-950 hover:bg-blue-950 hover:text-white transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative w-full">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-lg">
                        <Image
                          src="/oversizefit.png"
                          alt="Oversize Fit Size Guide Chart"
                          fill
                          className="object-contain"
                          priority
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          quality={90}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
            >
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-blue-950">
                    📏 How to Measure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li><strong>Chest:</strong> Measure around the fullest part of your chest</li>
                    <li><strong>Waist:</strong> Measure around your natural waistline</li>
                    <li><strong>Hips:</strong> Measure around the fullest part of your hips</li>
                    <li><strong>Length:</strong> Measure from shoulder to desired hem length</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-blue-950">
                    💡 Fitting Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li>Use a soft measuring tape for accurate measurements</li>
                    <li>Measure over well-fitting undergarments</li>
                    <li>If between sizes, we recommend sizing up</li>
                    <li>Contact us if you need help choosing the right size</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Section */}
            {/* <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-blue-950 mb-4">
                Still Need Help?
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Our customer service team is here to help you find the perfect fit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-blue-950 text-white hover:bg-blue-800 transition-all"
                  onClick={() => window.location.href = 'mailto:hexhueclothing@gmail.com'}
                >
                  Email Support
                </Button>
                <Button 
                  variant="outline"
                  className="text-blue-950 border-blue-950 hover:bg-blue-950 hover:text-white transition-all"
                  onClick={() => window.location.href = 'tel:+917060477331'}
                >
                  Call Us
                </Button>
              </div>
            </motion.div> */}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </PageTransition>
  )
} 