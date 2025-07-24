"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/hooks/use-wishlist"
import type { Product } from "@/types/product"

// Sample color data - in a real app, this would come from the API
const productVariants = {
  1: {
    colors: [
      { name: "Black", value: "#000000", image: "/placeholder.svg" },
      { name: "Beige", value: "#f5f5dc", image: "/placeholder.svg" }
    ],
    badge: "New-in",
    originalPrice: 1190,
    discountedPrice: 890
  },
  2: {
    colors: [
      { name: "Cream", value: "#fffdd0", image: "/placeholder.svg" },
      { name: "White", value: "#ffffff", image: "/placeholder.svg" }
    ],
    badge: "Trendy",
    originalPrice: 1690,
    discountedPrice: 1590
  },
  3: {
    colors: [
      { name: "Black", value: "#000000", image: "/placeholder.svg" },
      { name: "Beige", value: "#f5f5dc", image: "/placeholder.svg" }
    ],
    badge: "Trendy",
    originalPrice: 1490,
    discountedPrice: 1390
  },
  4: {
    colors: [
      { name: "White", value: "#ffffff", image: "/placeholder.svg" },
      { name: "Gray", value: "#808080", image: "/placeholder.svg" }
    ],
    badge: "New-in",
    originalPrice: 1490,
    discountedPrice: 1011
  }
}

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedColors, setSelectedColors] = useState<{[key: string]: number}>({})
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()
  const { toggleWishlist, isInWishlist, isLoading: wishlistLoading } = useWishlist()

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=8')
        const json = await res.json()
        setProducts(json.products || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchProducts()
  }, [])

  const handleProductClick = (productId: string | number) => {
    router.push(`/product/${productId}`)
  }

  const handleToggleWishlist = async (productId: string | number, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleWishlist(Number(productId))
  }

  const handleColorSelect = (productId: string | number, colorIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedColors(prev => ({
      ...prev,
      [productId.toString()]: colorIndex
    }))
  }

  const getProductVariant = (productId: string | number) => {
    const numericId = typeof productId === 'string' ? parseInt(productId) : productId
    return productVariants[numericId as keyof typeof productVariants] || productVariants[1]
  }

  const getSelectedImage = (product: Product) => {
    const variant = getProductVariant(product.id)
    const selectedColorIndex = selectedColors[product.id.toString()] || 0
    const colorVariantImage = variant.colors[selectedColorIndex]?.image
    
    // Use the actual product image instead of placeholder color variant images
    if (colorVariantImage && colorVariantImage !== "/placeholder.svg") {
      return colorVariantImage
    }
    
    // If we have multiple images for the product, use them for color switching
    if (product.images && product.images.length > selectedColorIndex) {
      return product.images[selectedColorIndex]
    }
    
    // Fallback to the main product image
    return product.image || "/placeholder.svg"
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNmY2ZjYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl md:text-8xl font-sans text-blue-950 tracking-tight" style={{ fontFamily: "var(--font-anton)" }}>
            Popular Products
          </h2>
        </motion.div>

        <div className="flex flex-row flex-wrap gap-3">
          {products.map((product, index) => {
            const variant = getProductVariant(product.id)
            const selectedColorIndex = selectedColors[product.id.toString()] || 0
            
            return (
              <motion.div
                key={product.id}
                className="group mx-auto w-[300px] cursor-pointer bg-white rounded-md shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  duration: 0.6, 
                  delay: (index % 12) * 0.08,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.03,
                  rotateY: 2,
                  rotateX: 2
                }}
                style={{
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.04)",
                  transformStyle: "preserve-3d"
                }}
              >
                <motion.div
                  className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                >
                  <Image
                    src={getSelectedImage(product)}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Shopping bag icon */}
                  <div className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <ShoppingBag className="w-4 h-4 text-gray-700" />
                  </div>

                  {/* Wishlist Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 left-3 w-9 h-9 bg-white/95 hover:bg-white transition-all backdrop-blur-sm rounded-full p-0 shadow-lg transform -translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                    style={{ transitionDelay: "50ms" }}
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    disabled={wishlistLoading}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isInWishlist(Number(product.id))
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600 hover:text-red-400"
                      }`}
                    />
                  </Button>
                </motion.div>

                <div className="p-4 space-y-3" onClick={() => handleProductClick(product.id)}>
                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight line-clamp-1 group-hover:text-orange-700 transition-colors duration-200">
                    {product.name}
                  </h3>
                  
                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900 group-hover:text-orange-700 transition-colors duration-200">
                        ₹{variant.discountedPrice}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ₹{variant.originalPrice}
                      </span>
                    </div>
                    <p className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full inline-block">
                      Get it for ₹{variant.discountedPrice}
                    </p>
                  </div>

                  {/* Color Options */}
                  <div className="flex items-center gap-2.5">
                    {variant.colors.map((color, colorIndex) => (
                      <button
                        key={colorIndex}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          selectedColorIndex === colorIndex
                            ? 'border-orange-500 scale-110 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400 shadow-sm'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={(e) => handleColorSelect(product.id, colorIndex, e)}
                        title={color.name}
                      />
                    ))}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full shadow-sm">
                      {variant.badge}
                    </span>
                    {index === 1 && (
                      <span className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-full shadow-sm">
                        Trendy
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
