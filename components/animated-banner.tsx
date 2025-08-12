"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import type { BannerMessage } from "@/types/banner"

interface BannerItem {
  id: string
  text: string
  icon?: string
}

// Fallback banner items if API fails
const fallbackBannerItems: BannerItem[] = [
  { id: "1", text: "FREE SHIPPING ON ORDERS OVER ₹999", icon: "🚚" },
 
]

export default function AnimatedBanner() {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>(fallbackBannerItems)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBannerMessages = async () => {
      try {
        const response = await fetch('/api/banner-messages')
        const data = await response.json()
        
        if (data.success && data.bannerMessages && data.bannerMessages.length > 0) {
          setBannerItems(data.bannerMessages)
        } else {
          setBannerItems(fallbackBannerItems)
        }
      } catch (error) {
        console.error('Error fetching banner messages:', error)
        setBannerItems(fallbackBannerItems)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBannerMessages()
  }, [])

  // Create triple set for truly seamless scrolling
  const tripleItems = [...bannerItems, ...bannerItems, ...bannerItems]

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 text-black overflow-hidden relative z-50">
        <div className="relative h-10 flex items-center justify-center">
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render if no items
  if (!bannerItems || bannerItems.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 text-black overflow-hidden relative z-50">
      <div className="relative h-10 flex items-center">
        {/* Animated banner content */}
        <motion.div
          className="flex items-center whitespace-nowrap will-change-transform"
          animate={{
            x: [`0%`, `-${100 / 3}%`] // Move exactly 1/3 of the total width (one set of items)
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          style={{
            width: `${100 * 3}%`, // Triple width for triple items
          }}
        >
          {/* Render all triple items */}
          {tripleItems.map((item, index) => (
            <motion.div
              key={`item-${index}`}
              className="flex items-center justify-center text-sm font-medium tracking-wide px-8 hover:bg-white/10 transition-colors duration-300 cursor-pointer flex-shrink-0"
              style={{ width: `${100 / tripleItems.length}%`, minWidth: "250px" }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {item.icon && (
                <motion.span 
                  className="mr-2 text-base"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                >
                  {item.icon}
                </motion.span>
              )}
              <span className="text-black/90 hover:text-black transition-colors duration-300">
                {item.text}
              </span>
              <div className="ml-8 w-1 h-1 bg-black/20 rounded-full hidden sm:block" />
            </motion.div>
          ))}
        </motion.div>

        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-yellow-400 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-yellow-400 to-transparent pointer-events-none z-10" />
        
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
