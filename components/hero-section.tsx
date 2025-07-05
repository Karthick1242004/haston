"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  return (
    <section ref={ref} className="relative h-screen overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <Image
          src="/Screenshot 2025-07-01 at 9.26.18 PM.png"
          alt="Two men in suits standing in a field of poppies looking at the sky"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Subtle overlay to enhance text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      <div className="relative z-10 h-full flex items-end justify-center pb-20">
        <div className="text-center">
          <motion.h1
            className="text-[6rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem]  text-white leading-none tracking-tighter drop-shadow-2xl"
            style={{
              fontFamily: "var(--font-anton)",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            SUMMER
          </motion.h1>
          <motion.div
            className="relative mt-[-3rem] md:mt-[-4rem] lg:mt-[-6rem]"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          >
            <div
              className="lg:text-8xl xl:text-9xl text-white relative text-5xl"
              style={{
                fontFamily: "var(--font-allura)",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                WebkitTextStroke: "2px #92400e",
              }}
            >
              Collection
            </div>
            {/* <div
              className="absolute top-6 right-[-2rem] md:right-[-3rem] lg:right-[-4rem] xl:right-[-6rem] text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-light"
              style={{
                fontFamily: "Inter, sans-serif",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              2025
            </div> */}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          animate={{
            borderColor: ["rgba(255,255,255,0.5)", "rgba(255,255,255,0.8)", "rgba(255,255,255,0.5)"],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <motion.div
            className="w-1 h-3 bg-white/70 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
