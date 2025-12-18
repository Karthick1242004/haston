"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PageTransition from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Palette, Shirt, Star, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef<HTMLDivElement>(null)
  
  const heroInView = useInView(heroRef, { once: true })
  const contentInView = useInView(contentRef, { once: true, margin: "-100px" })
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" })
  // const valuesInView = useInView(valuesRef, { once: true, margin: "-100px" })

  const stats = [
    { number: "500+", label: "Unique Colors", icon: Palette },
    { number: "10k+", label: "Happy Customers", icon: Star },
    { number: "50+", label: "Fresh Designs", icon: Shirt },
    { number: "100%", label: "Quality Promise", icon: Sparkles },
  ]

  // const values = [
  //   {
  //     title: "Color Innovation",
  //     description: "We stay ahead of color trends, ensuring our customers always have access to the latest and most vibrant hues that express their unique personality.",
  //     color: "from-blue-400 to-purple-500"
  //   },
  //   {
  //     title: "Quality Craftsmanship", 
  //     description: "Each t-shirt is carefully crafted with premium materials and attention to detail, ensuring comfort, durability, and style in every piece.",
  //     color: "from-green-400 to-teal-500"
  //   },
  //   {
  //     title: "Fresh Vibes",
  //     description: "Whether retro-inspired graphics or minimalist modern designs, every piece from Hex and Hue is designed to make a statement and exude unique vibes.",
  //     color: "from-orange-400 to-red-500"
  //   }
  // ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        <Header />
        
        {/* Hero Section */}
        <section ref={heroRef} className="pt-42 pb-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 via-transparent to-purple-200/30" />
          </div>
          
          <div className="relative w-full mt-10 px-6 md:px-12">
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-950 hover:text-blue-800 mb-8"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              
              <motion.h1
                className="text-6xl md:text-8xl lg:text-9xl text-blue-950 leading-none tracking-tight mb-6 font-bold"
                style={{ fontFamily: "var(--font-nunito)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={heroInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                About{" "}Us
              </motion.h1>
              
              <motion.p
                className="text-lg text-center text-gray-600 mx-auto max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Discover the story behind the colors, the passion behind the designs, 
                and the vision that drives us to create fresh, vibrant fashion.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Brand Story Section */}
        <section ref={contentRef} className="py-20">
          <div className="w-full px-6 md:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={contentInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div>
                  <motion.h2
                    className="text-5xl md:text-7xl text-blue-950 leading-tight mb-6 font-bold"
                    style={{ fontFamily: "var(--font-nunito)" }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={contentInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Hex&Hue
                  </motion.h2>
                  
                  <motion.div
                    className="space-y-6 text-gray-600 leading-relaxed text-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={contentInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <p>
                      One clothing brand that excels in providing fresh t-shirt colors and vibes is Hex and Hue. 
                      Known for its dynamic approach to fashion, Hex and Hue offers a wide range of t-shirts in 
                      vibrant, eye-catching colors that are sure to make a statement.
                    </p>
                    
                    <p>
                      Each t-shirt from Hex and Hue is designed to exude a unique vibe, whether it's a retro-inspired 
                      graphic tee or a minimalist, modern style. The brand prides itself on staying ahead of the curve 
                      when it comes to color trends, ensuring that customers can always find the perfect hue to express 
                      their personality.
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={contentInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Button
                    className="bg-transparent border-2 border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white transition-all duration-300 px-8 py-4 text-sm rounded-none"
                    onClick={() => router.push('/shop')}
                  >
                    Explore Our Collection
                  </Button>
                </motion.div>
              </motion.div>

              {/* Testimonials */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={contentInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-extrabold text-blue-950 mb-8 text-center" style={{ fontFamily: "var(--font-nunito)" }}>
                    What Our Customers Say
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Testimonial 1 */}
                    <motion.div
                      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 italic mb-4">
                        "The colors are absolutely vibrant and the quality is outstanding! 
                        I've gotten so many compliments on my Hex and Hue tees."
                      </p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Sarah M.</p>
                          <p className="text-sm text-gray-500">Fashion Enthusiast</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Testimonial 2 */}
                    <motion.div
                      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 italic mb-4">
                        "Finally found a brand that gets color right! Every shade is perfect 
                        and the fit is incredibly comfortable."
                      </p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Alex R.</p>
                          <p className="text-sm text-gray-500">Design Student</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Testimonial 3 */}
                    <motion.div
                      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 italic mb-4">
                        "Love the fresh vibes and unique designs. Hex and Hue has become 
                        my go-to brand for expressing my personality through fashion."
                      </p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Maya K.</p>
                          <p className="text-sm text-gray-500">Creative Director</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {/* <section ref={statsRef} className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-purple-100/50" />
          <div className="relative w-full px-6 md:px-12">
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
              initial={{ opacity: 0, y: 50 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              {stats.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-950 text-white rounded-full mb-4">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 
                      className="text-4xl md:text-5xl font-thin text-blue-950 mb-2"
                      style={{ fontFamily: "var(--font-nunito)" }}
                    >
                      {stat.number}
                    </h3>
                    <p className="text-gray-600 font-medium">{stat.label}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section> */}

        {/* Values Section */}
        {/* <section ref={valuesRef} className="py-20">
          <div className="w-full px-6 md:px-12">
            <motion.div
              className="mb-16 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={valuesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 
                className="text-5xl md:text-7xl text-blue-950 leading-tight mb-6 font-bold"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                OUR{" "}
                <span 
                  style={{ fontFamily: "var(--font-allura)" }}
                  className="text-6xl md:text-8xl text-blue-950"
                >
                  Values
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do, from design to delivery.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 50 }}
                  animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <div className="relative overflow-hidden rounded-lg mb-6">
                    <div 
                      className={`h-48 bg-gradient-to-br ${value.color} transition-transform duration-300 group-hover:scale-110`}
                    />
                  </div>
                  <h3 className="text-2xl font-extrabold text-blue-950 mb-4" style={{ fontFamily: "var(--font-nunito)" }}>
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section> */}

        <Footer />
      </div>
    </PageTransition>
  )
} 