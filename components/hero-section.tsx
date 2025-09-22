"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useHeroSlides } from "@/hooks/use-hero-slides"

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({})
  const { slides, isLoading, error } = useHeroSlides()
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  // Image preloading function
  const preloadImage = useCallback((imageUrl: string) => {
    if (preloadedImages.has(imageUrl)) return Promise.resolve()
    
    // Set loading state
    setImageLoadingStates(prev => ({ ...prev, [imageUrl]: true }))
    
    return new Promise<void>((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, imageUrl]))
        setImageLoadingStates(prev => ({ ...prev, [imageUrl]: false }))
        resolve()
      }
      img.onerror = () => {
        setImageLoadingStates(prev => ({ ...prev, [imageUrl]: false }))
        console.warn('Failed to preload image:', imageUrl)
        reject(new Error(`Failed to preload image: ${imageUrl}`))
      }
      img.src = imageUrl
    })
  }, [preloadedImages])

  // Preload current, next, and previous images
  useEffect(() => {
    if (slides.length === 0) return

    const preloadImages = async () => {
      const imagesToPreload = []
      
      // Current image (highest priority)
      if (slides[currentSlide]?.image) {
        imagesToPreload.push(slides[currentSlide].image)
      }
      
      // Next image
      const nextIndex = (currentSlide + 1) % slides.length
      if (slides[nextIndex]?.image) {
        imagesToPreload.push(slides[nextIndex].image)
      }
      
      // Previous image
      const prevIndex = (currentSlide - 1 + slides.length) % slides.length
      if (slides[prevIndex]?.image) {
        imagesToPreload.push(slides[prevIndex].image)
      }
      
      // Preload all three images
      try {
        await Promise.allSettled(imagesToPreload.map(preloadImage))
      } catch (error) {
        console.warn('Some images failed to preload:', error)
      }
    }

    preloadImages()
  }, [currentSlide, slides, preloadImage])

  // Preload all remaining images in background (low priority)
  useEffect(() => {
    if (slides.length === 0) return

    const preloadRemainingImages = async () => {
      const remainingImages = slides
        .map(slide => slide.image)
        .filter(imageUrl => imageUrl && !preloadedImages.has(imageUrl))
      
      // Preload remaining images with delay to not impact performance
      for (const imageUrl of remainingImages) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
          await preloadImage(imageUrl)
        } catch (error) {
          // Silently fail for background preloading
        }
      }
    }

    // Start background preloading after a delay
    const timeoutId = setTimeout(preloadRemainingImages, 2000)
    return () => clearTimeout(timeoutId)
  }, [slides, preloadedImages, preloadImage])


  useEffect(() => {
    if (!isAutoPlay) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlay, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlay(false)

    setTimeout(() => setIsAutoPlay(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlay(false)
    setTimeout(() => setIsAutoPlay(true), 10000)
  }

  // Show loading or error states
  if (isLoading) {
    return (
      <section className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 animate-pulse"></div>
        
        {/* Loading content */}
        <div className="text-center relative z-10">
          <div className="mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-950/20 border-t-blue-950 mx-auto mb-4"></div>
            <div className="flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-blue-950 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-950 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-950 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <p className="text-blue-950/80 text-lg font-medium">Loading amazing content...</p>
          <p className="text-blue-950/60 text-sm mt-2">This won't take long</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-950/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-950/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </section>
    )
  }

  if (error || slides.length === 0) {
    return (
      <section className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'No slides available'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-950 text-white rounded hover:bg-blue-900 transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    )
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
            <div className="relative w-full h-full">
              {/* Blur placeholder while loading */}
              {imageLoadingStates[slides[currentSlide]?.image] && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              )}
              
              <Image
                src={slides[currentSlide]?.image}
                alt={`${slides[currentSlide]?.mainText} ${slides[currentSlide]?.subText}`}
                fill
                className={`object-cover transition-opacity duration-700 ${
                  preloadedImages.has(slides[currentSlide]?.image) 
                    ? 'opacity-100' 
                    : 'opacity-0'
                }`}
                priority
                sizes="100vw"
                quality={85}
                onLoad={() => {
                  // Mark as loaded when Next.js Image component loads
                  if (slides[currentSlide]?.image) {
                    setImageLoadingStates(prev => ({ 
                      ...prev, 
                      [slides[currentSlide].image]: false 
                    }))
                  }
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

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
              {slides[currentSlide]?.mainText}
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
                {slides[currentSlide]?.subText}
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
      {/* <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
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
      </div> */}

      {/* Progress Bar */}
      {/* <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-white/20 rounded-full overflow-hidden z-20">
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
      </div> */}

      {/* Scroll indicator */}
      {/* <motion.div
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
      </motion.div> */}
    </section>
  )
}
