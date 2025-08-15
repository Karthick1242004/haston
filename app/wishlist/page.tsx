"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useWishlist } from "@/hooks/use-wishlist"
import { useAuthCart } from "@/hooks/use-auth-cart"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import type { Product } from "@/types/product"

export default function WishlistPage() {
  const router = useRouter()
  const { wishlist, removeFromWishlist, isLoading } = useWishlist()
  const { addProductToCart } = useAuthCart()
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Fetch full product details for wishlist items
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setWishlistProducts([])
        return
      }

      setIsLoadingProducts(true)
      try {
        const productPromises = wishlist.map(async (productId) => {
          const response = await fetch(`/api/products?id=${productId}`)
          if (response.ok) {
            return await response.json()
          }
          return null
        })

        const products = await Promise.all(productPromises)
        const validProducts = products.filter(product => product !== null)
        setWishlistProducts(validProducts)
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchWishlistProducts()
  }, [wishlist])

  const handleRemoveFromWishlist = async (productId: number) => {
    await removeFromWishlist(productId)
  }

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes?.[0] || "M"
    const defaultColor = product.colors?.[0] || "Default"
    addProductToCart(product, defaultSize, defaultColor, 1)
  }

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`)
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
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </motion.div>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-blue-950" />
                <h1 className="text-3xl md:text-4xl font-bold text-blue-950" style={{ fontFamily: "var(--font-anton)" }}>
                  My Wishlist
                </h1>
              </div>
              <p className="text-gray-600">
                {wishlistProducts.length > 0 
                  ? `${wishlistProducts.length} item${wishlistProducts.length !== 1 ? 's' : ''} in your wishlist`
                  : "Your wishlist is empty"
                }
              </p>
            </motion.div>

            {/* Loading State */}
            {(isLoading || isLoadingProducts) && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950"></div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isLoadingProducts && wishlistProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-6">Start adding items you love to your wishlist</p>
                <Button
                  onClick={() => router.push('/shop')}
                  className="bg-blue-950 text-white hover:bg-blue-800 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Start Shopping
                </Button>
              </motion.div>
            )}

            {/* Wishlist Products Grid */}
            {!isLoading && !isLoadingProducts && wishlistProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {wishlistProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="relative" onClick={() => handleProductClick(typeof product.id === 'string' ? parseInt(product.id) : product.id)}>
                        <div className="aspect-[3/4] overflow-hidden">
                          <Image
                            src={product.image || '/placeholder.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized
                          />
                        </div>

                        {/* Remove from Wishlist Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 bg-white/80 hover:bg-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFromWishlist(typeof product.id === 'string' ? parseInt(product.id) : product.id)
                          }}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>

                        {/* Quick Add to Cart */}
                        <Button
                          size="sm"
                          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(product)
                          }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Button>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate mb-2 group-hover:text-gray-700 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-gray-900 mb-3">
                          ₹{product.price.toFixed(2)}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-blue-950 text-white hover:bg-blue-800 transition-all"
                            onClick={() => handleAddToCart(product)}
                          >
                            Add to Cart
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleRemoveFromWishlist(typeof product.id === 'string' ? parseInt(product.id) : product.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Continue Shopping */}
            {wishlistProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-12"
              >
                <Button
                  variant="outline"
                  onClick={() => router.push('/shop')}
                  className="border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white transition-all"
                >
                  Continue Shopping
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 