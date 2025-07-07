"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SlideData {
  id: number
  mainText: string
  subText: string
  image: string
  bgColor: string
}

const slidesData: SlideData[] = [
  {
    id: 1,
    mainText: "SUMMER",
    subText: "Collection",
    image: "/heromainbg.png",
    bgColor: "from-amber-900/20 via-transparent to-amber-900/40"
  },
  {
    id: 2,
    mainText: "WINTER",
    subText: "Collection",
    image: "/heromainbg.png",
    bgColor: "from-blue-900/20 via-transparent to-blue-900/40"
  },
  {
    id: 3,
    mainText: "SPRING",
    subText: "Fits",
    image: "/heromainbg.png",
    bgColor: "from-green-900/20 via-transparent to-green-900/40"
  },
  {
    id: 4,
    mainText: "AUTUMN",
    subText: "Collection",
    image: "/heromainbg.png",
    bgColor: "from-orange-900/20 via-transparent to-orange-900/40"
  }
]

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlay) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesData.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlay])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlay(false)
    // Resume auto-play after manual interaction
    setTimeout(() => setIsAutoPlay(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slidesData.length)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slidesData.length) % slidesData.length)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 10000)
  }

  return (
    <section ref={ref} className="relative h-screen overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <Image
              src={slidesData[currentSlide].image}
              alt={`${slidesData[currentSlide].mainText} ${slidesData[currentSlide].subText}`}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Dynamic overlay gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className={`absolute inset-0 bg-gradient-to-b ${slidesData[currentSlide].bgColor}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end justify-center pb-20">
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.h1
              key={`${currentSlide}-main`}
              className="text-[6rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] text-white leading-none tracking-tighter drop-shadow-2xl"
              style={{
                fontFamily: "var(--font-anton)",
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {slidesData[currentSlide].mainText}
            </motion.h1>
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSlide}-sub`}
              className="relative mt-[-3rem] md:mt-[-4rem] lg:mt-[-6rem]"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div
                className="lg:text-8xl xl:text-9xl text-white relative text-5xl"
                style={{
                  fontFamily: "var(--font-allura)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  WebkitTextStroke: "2px #92400e",
                }}
              >
                {slidesData[currentSlide].subText}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 flex justify-between items-center z-20 pointer-events-none">
        <motion.button
          onClick={prevSlide}
          className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200 pointer-events-auto"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>

        <motion.button
          onClick={nextSlide}
          className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200 pointer-events-auto"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slidesData.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white shadow-lg' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-white/20 rounded-full overflow-hidden z-20">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: isAutoPlay ? "100%" : "0%" }}
          transition={{ 
            duration: isAutoPlay ? 5 : 0,
            ease: "linear",
            repeat: isAutoPlay ? Infinity : 0
          }}
          key={currentSlide}
        />
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
