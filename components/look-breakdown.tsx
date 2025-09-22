"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { useAuthCart } from "@/hooks/use-auth-cart"
import { useWishlist } from "@/hooks/use-wishlist"

interface CarouselItem {
  id: number
  title: string
  description: string
  image: string
  price: string
  sizes: string[]
}

export default function LookBreakdown() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false) // Start false until data loads
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false) // Add loading state
  const prevCurrentIndex = useRef(0)
  const router = useRouter()
  const { addProductToCart } = useAuthCart()
  const { toggleWishlist, isInWishlist, isLoading: wishlistLoading } = useWishlist()

  // carousel items state
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [selectedSize, setSelectedSize] = useState<string>("")

  // state inside component declared later, placeholder removed

  // fetch look items
  useEffect(() => {
    async function fetchLooks() {
      try {
        setIsDataLoaded(false)
        
        const res = await fetch('/api/products?isLook=true')
        const json = await res.json()
        
        const items = (json.products || []).map((p: any) => ({
          id: p.id,
          title: p.name,
          description: p.description,
          image: p.image || p.images?.[0] || '/placeholder.jpg', // Add fallback
          price: `₹${p.price}`,
          sizes: p.sizes || ["S", "M", "L", "XL"]
        }))
        
        if (items.length > 0) {
          setCarouselItems(items)
          setIsDataLoaded(true)
          // Enable auto-play only after data is loaded
          setTimeout(() => setIsAutoPlaying(true), 1000)
        }
      } catch (err) {
        console.error('Error fetching look items:', err)
        setIsDataLoaded(false)
      }
    }
    fetchLooks()
  }, [])


  // Auto-rotate carousel
  useEffect(() => {
    if (!isAutoPlaying || isTransitioning || !isDataLoaded || carouselItems.length === 0) return
    
    const interval = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, isTransitioning, isDataLoaded, carouselItems.length])

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % carouselItems?.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsTransitioning(false), 1200)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsTransitioning(false), 1200)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsTransitioning(false), 1200)
  }

  // Generate all items with their positions for smooth transitions
  const getAllItemsWithPositions = () => {
    if (!carouselItems || carouselItems.length === 0) {
      return []
    }
    
    const allItems = []
    // Fix: Ensure minimum radius of 1 for small item counts
    const visibleRadius = Math.max(1, Math.min(3, Math.floor((carouselItems.length - 1) / 2)))

    // Generate items in the range -visibleRadius … +visibleRadius
    for (let i = -visibleRadius; i <= visibleRadius; i++) {
      const itemIndex = (currentIndex + i + carouselItems.length) % carouselItems.length
      const isVisible = Math.abs(i) <= visibleRadius // Only show calculated visible items
      
      allItems.push({
        ...carouselItems[itemIndex],
        actualIndex: itemIndex,
        position: i,
        isCenter: i === 0,
        isVisible: isVisible
      })
    }
    
    // Update previous index after calculation
    prevCurrentIndex.current = currentIndex
    
    return allItems
  }

  const allItems = getAllItemsWithPositions()
  const edgeDistance = (allItems.length - 1) / 2
  
  // Debug logging
  console.log(`🎠 Carousel State: ${carouselItems.length} total items, ${allItems.length} rendered items, edgeDistance=${edgeDistance}, currentIndex=${currentIndex}`)

  // guard against out-of-range index
  const len = carouselItems?.length
  const safeIndex = len ? ((currentIndex % len) + len) % len : 0

  // Set default size when carousel items change or current index changes
  useEffect(() => {
    if (isDataLoaded && carouselItems.length > 0) {
      const currentItem = carouselItems[safeIndex]
      if (currentItem?.sizes && currentItem.sizes.length > 0) {
        setSelectedSize(currentItem.sizes[0])
      }
    }
  }, [carouselItems, safeIndex, isDataLoaded])

  // Convert carousel item to product format for cart
  const createProductFromCarouselItem = (item: CarouselItem) => {
    return {
      id: item.id,
      name: item.title,
      price: parseInt(item.price.replace('₹', '')),
      image: item.image,
      images: [item.image],
      colors: ["Default"],
      sizes: item.sizes || ["S", "M", "L", "XL"],
      description: item.description,
      rating: 5.0,
      stock: 50,
      category: "Look"
    }
  }

  const handleAddToCart = () => {
    const currentItem = carouselItems[currentIndex]
    const productItem = createProductFromCarouselItem(currentItem)
    // Add as product with selected size and default color
    addProductToCart(productItem, selectedSize || "M", "Default", 1)
  }

  const handleToggleWishlist = async () => {
    const currentItem = carouselItems[currentIndex]
    if (currentItem) {
      await toggleWishlist(currentItem.id)
    }
  }

  const handleProductClick = (productId: string | number) => {
    console.log("handleProductClick called with productId:", productId);
    console.log("Navigating to:", `/product/${productId}`);
    router.push(`/product/${productId}`);
  }

  return (
    <section ref={ref} className="py-20 bg-[#F1EFEE]">
      <div className="w-full px-6 md:px-12">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center gap-8 mb-6">
            <h2 className="text-6xl md:text-8xl mt-4 font-bold tracking-tight text-blue-950" style={{ fontFamily: "var(--font-poppins)" }}>
              The{" "}
              Look{" "}
              Breakdown
            </h2>
            <p className="text-sm text-gray-600 max-w-md leading-relaxed">
              Effortless style, made simple. Shop the complete outfit with just one click—each piece carefully selected
              for a refined, timeless look. Find the details, see the quality, and build your wardrobe with confidence.
            </p>
          </div>
        </motion.div>

        {/* 3D Infinite Slider */}
        <motion.div
          className="relative h-[630px] overflow-hidden"
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          style={{ perspective: "1500px" }}
        >
          {/* Loading State */}
          {!isDataLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F1EFEE]">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-950/20 border-t-blue-950 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-blue-950 font-medium">Loading looks...</p>
              </div>
            </div>
          )}
          {/* Slider Container */}
          {isDataLoaded && carouselItems.length > 0 && (
            <div className="relative h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                {allItems.map((item) => {
                const { position, isCenter, isVisible, actualIndex } = item
                
                // Render all items but hide those outside visible range
                const rotateY = position * 20
                const translateX = position * 300
                const translateZ = isCenter ? 0 : -Math.abs(position) * 80
                const scale = isCenter ? 1.35 : Math.max(0.8, 1 - Math.abs(position) * 0.12)
                // Hide the item completely when it is at the extreme edge (wrap position)
                const opacity = isVisible
                  ? position === -edgeDistance || position === edgeDistance
                    ? 0 // fully transparent on the frame that wraps so it isn't seen moving across
                    : isCenter
                      ? 1
                      : Math.max(0.7, 1 - Math.abs(position) * 0.15)
                  : 0
                
                // Temporary debug logging
                if (isCenter) {
                  console.log(`🎯 CENTER ITEM: "${item.title}" - position=${position}, isVisible=${isVisible}, opacity=${opacity}, edgeDistance=${edgeDistance}`)
                }
                
                return (
                  <motion.div
                    key={`item-${actualIndex}`}
                    className="absolute cursor-pointer flex items-center justify-center"
                    style={{
                      width: "380px",
                      height: "500px",
                      left: "50%",
                      top: "50%",
                      marginLeft: "-190px",
                      marginTop: "-250px",
                    }}
                    animate={{
                      rotateY: `${rotateY}deg`,
                      translateX: `${translateX}px`,
                      translateZ: `${translateZ}px`,
                      scale: scale,
                      opacity: opacity
                    }}
                    transition={{ 
                      duration: 1.2, 
                      ease: [0.23, 1, 0.320, 1],
                      opacity: { duration: 0.8 },
                      scale: { duration: 1.0 }
                    }}
                    onClick={(e) => {
                      if (!isVisible) return;
                      // If clicking on center item, navigate to product
                      if (isCenter) {
                        console.log("Center item clicked - navigating to product:", item.id);
                        handleProductClick(item.id);
                      } else {
                        // If clicking on side item, bring it to center
                        goToSlide(actualIndex);
                      }
                    }}
                    whileHover={isVisible ? { 
                      scale: isCenter ? 1.4 : scale * 1.05,
                      transition: { duration: 0.3 }
                    } : {}}
                    layout
                  >
                    <motion.div
                      className="relative w-full h-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: isCenter ? 0 : Math.abs(position) * 0.05,
                        ease: "easeOut"
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={380}
                        height={500}
                        className="object-contain w-full h-full filter drop-shadow-2xl transition-all duration-300"
                        priority={isCenter}
                        quality={85}
                        sizes="(max-width: 768px) 80vw, 380px"
                      />
                      {/* Visual indicator for center item being clickable */}
                      {isCenter && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                            <svg className="w-6 h-6 text-blue-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
          )}

          {/* Navigation Buttons */}
          {isDataLoaded && carouselItems.length > 0 && (
            <>
          <motion.button
            className="absolute left-8 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/95 hover:bg-white rounded-full shadow-2xl border border-stone-200 transition-all duration-300 hover:scale-110 disabled:opacity-50"
            onClick={prevSlide}
            disabled={isTransitioning}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-blue-950" />
          </motion.button>

          <motion.button
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/95 hover:bg-white rounded-full shadow-2xl border border-stone-200 transition-all duration-300 hover:scale-110 disabled:opacity-50"
            onClick={nextSlide}
            disabled={isTransitioning}
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-6 h-6 text-blue-950" />
          </motion.button>
          </>
          )}
        </motion.div>

        {/* Active Item Details */}
        {isDataLoaded && carouselItems.length > 0 && (
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {carouselItems?.length>0 && (
                <>
                  <h3 
                    className="text-4xl font-bold text-blue-950 mb-4 cursor-pointer hover:text-blue-800 transition-colors duration-200" 
                    style={{ fontFamily: "var(--font-poppins)" }}
                    onClick={() => handleProductClick(carouselItems[safeIndex]?.id)}
                  >
                    {carouselItems[safeIndex]?.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {carouselItems[safeIndex]?.description}
                  </p>
                </>
              )}
              {/* Size Selection */}
              {carouselItems?.length > 0 && carouselItems[safeIndex]?.sizes && (
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-blue-950 mb-3">Select Size</h4>
                    <div className="flex justify-center">
                      <div className="grid grid-cols-4 gap-2 mx-auto max-w-sm">
                        {carouselItems[safeIndex].sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`py-2 px-3 text-sm border rounded transition-all duration-200 font-medium ${
                              selectedSize === size
                                ? "border-blue-950 bg-blue-950 text-white"
                                : "border-gray-300 hover:border-blue-700 hover:bg-blue-50"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Selected: {selectedSize}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center flex-wrap justify-center gap-6 mb-8">
                {carouselItems?.length>0 && (
                  <span className="text-3xl font-bold text-blue-950">{carouselItems[safeIndex]?.price}</span>
                )}
                <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  className="border rounded-none font-semibold bg-transparent border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white px-8 py-3 transition-all duration-300"
                  onClick={handleAddToCart}
                    disabled={!selectedSize}
                >
                    Add to Cart {selectedSize && `(${selectedSize})`}
                  </Button>
                  
                  {/* Wishlist Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border rounded-none bg-transparent border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white transition-all duration-300"
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        carouselItems?.length > 0 && isInWishlist(carouselItems[safeIndex]?.id)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
        )}

        {/* Dots Indicator */}
        {isDataLoaded && carouselItems.length > 0 && (
        <motion.div
          className="flex justify-center mt-8 space-x-3"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {carouselItems?.map((_:any, index: any) => (
            <button
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-950 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
            />
          ))}
        </motion.div>
        )}

        {/* Bottom Text */}
        <motion.div
          className="flex flex-row justify-between items-center mt-32 flex-wrap"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <p className="text-md text-gray-600 max-w-3xl leading-relaxed mb-8">
            Our outfits are meticulously designed by fashion experts to save you time while ensuring a refined, cohesive
            look. Every piece is thoughtfully selected for its perfect balance of textures, materials, and seasonal
            adaptability—so you can step out with confidence, no matter the occasion.
          </p>
          <Button 
            variant="outline"
            className="border rounded-none font-semibold bg-transparent border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white px-10 py-4 transition-all duration-300"
          >
            View All Outfits
          </Button>
        </motion.div>
      </div>
    </section>
  )
}