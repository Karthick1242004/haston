"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, Star, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProductStore } from "@/stores/product-store"
import { useUIStore } from "@/stores/ui-store"
import { useAuthCart } from "@/hooks/use-auth-cart"
import Header from "@/components/header"
import ReviewSection from "@/components/review-section"
import type { Product } from "@/types/product"


export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = parseInt(params.id as string)
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  
  const { addProductToCart, buyProductNow } = useAuthCart()
  const { cartCount } = useUIStore()
  
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products?id=${params.id}`)
        const json = await res.json()
        if (!json.error) setProduct(json)
      } catch (err) {
        console.error(err)
      }
    }
    fetchProduct()
  }, [params.id])

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || "")
      setSelectedSize(product.sizes?.[0] || "")
    }
  }, [product])

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    if (selectedSize && selectedColor) {
      addProductToCart(product, selectedSize, selectedColor, quantity)
    }
  }

  const colorOptions = [
    { name: "Portage", color: "bg-blue-400" },
    { name: "Forest Green", color: "bg-green-600" },
    { name: "Black", color: "bg-black" },
    { name: "Pink", color: "bg-pink-400" },
  ]

  return (
    <motion.div 
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="relative">
        <div className="absolute mt-2 inset-0 bg-[#F1EFEE] backdrop-blur-sm"></div>
        <Header />
      </div>
      {/* Desktop Layout */}
      <div className="hidden lg:block pt-20">
        <div className="flex min-h-screen max-h-screen">
          {/* Left side - Product Images */}
          <div className="w-[60%] flex">
            {/* Thumbnail Images */}
            <div className="w-32 bg-gray-50 p-4 space-y-4 overflow-y-auto">
              {product.images?.map((image, index) => (
                <motion.div
                  key={index}
                  className={`relative aspect-[3/4] cursor-pointer rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-black" : "border-transparent"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-fit"
                    unoptimized
                  />
                </motion.div>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative bg-gradient-to-br h-[80vh] max-h-[800px]">
              <div className="absolute w-full h-full inset-6">
                <Image
                  src={product.images?.[selectedImageIndex] || product.image || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-contain rounded-lg"
                  unoptimized
                />
              </div>
              
              {/* Navigation arrows */}
              <button 
                className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                disabled={selectedImageIndex === 0}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors rotate-180"
                onClick={() => setSelectedImageIndex(Math.min((product.images?.length || 1) - 1, selectedImageIndex + 1))}
                disabled={selectedImageIndex === (product.images?.length || 1) - 1}
                aria-label="Next image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Image indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
                {product.images?.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      selectedImageIndex === index ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Product Details */}
          <div className="w-[500px] px-12 overflow-y-auto scrollbar-hide"
          style={{
            scrollbarWidth: "none",
          }}
          >
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex px-0 items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="rounded-full"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              </div>

              {/* Product Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{product.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({product.stock})</span>
                </div>

                <div className="mb-3">
                  {product.hasDiscount && product.originalPrice && product.discountPercentage ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-4xl font-bold text-gray-900">
                          ₹{Number(product.price).toFixed(2)}
                        </p>
                        <p className="text-2xl text-gray-500 line-through">
                          ₹{Number(product.originalPrice).toFixed(2)}
                        </p>
                        <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                          {product.discountPercentage}% OFF
                        </span>
                      </div>
                      <p className="text-lg text-green-600 font-medium">
                        You save ₹{(Number(product.originalPrice) - Number(product.price)).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-4xl font-bold text-gray-900">
                      ₹{Number(product.price).toFixed(2)}
                    </p>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed mb-0">
                  {product.description}
                </p>
              </div>

              {/* Color Selection */}
              {/* <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select Color</h3>
                  <span className="text-gray-500 capitalize">{selectedColor}</span>
                </div> */}
                
                {/* <div className="flex gap-3">
                  {colorOptions.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => setSelectedColor(option.name)}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        selectedColor === option.name
                          ? "border-black scale-110"
                          : "border-gray-200 hover:border-gray-400"
                      } ${option.color}`}
                      aria-label={`Select ${option.name} color`}
                    />
                  ))}
                </div> */}
              {/* </div> */}

              {/* Size Selection */}
              <div className="space-y-2 !-mt-1">
                <div className="flex items-center mt-4 justify-between">
                  <h3 className="text-lg font-medium">Select Size</h3>
                  <span className="text-gray-500">{selectedSize}</span>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 px-4 border rounded-lg text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Quantity</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="px-3 py-1 font-medium min-w-[1rem] text-center">
                      {quantity.toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 text-green-700">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z"/>
                  </svg>
                  <div>
                    <h4 className="font-medium">Fast Delivery</h4>
                    <p className="text-sm text-green-600">
                      Estimated delivery: {product.deliveryDays || '2-3 days'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 py-6 text-lg font-medium rounded-lg"
                  disabled={!selectedSize || !selectedColor}
                >
                  Add to cart
                </Button>
                
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800 py-6 text-lg font-medium rounded-lg"
                  disabled={!selectedSize || !selectedColor}
                  onClick={() => {
                    if (selectedSize && selectedColor) {
                      buyProductNow(product, selectedSize, selectedColor, quantity)
                    }
                  }}
                >
                  Buy it now
                </Button>
              </div>
              {/* Reviews Section */}
              <div className="pt-8 border-t">
                <ReviewSection productId={product.id} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden pt-20">
        {/* Mobile Back Button and Wishlist */}
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="rounded-full"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        {/* Product Image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 to-purple-50">
          <Image
            src={product.images?.[selectedImageIndex] || product.image || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-contain p-4"
            unoptimized
          />
          
          {/* Image indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
            {product.images?.map((_, index) => (
              <button
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  selectedImageIndex === index ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Thumbnail Images */}
        <div className="flex gap-2 p-4 overflow-x-auto">
          {product.images?.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 ${
                selectedImageIndex === index ? "border-black" : "border-gray-200"
              }`}
            >
              <Image
                src={image}
                alt={`${product.name} ${index + 1}`}
                width={64}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            </button>
          ))}
        </div>

        {/* Product Details */}
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">{product.rating}</span>
              </div>
              <span className="text-sm text-gray-500">({product.stock})</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            
            <div>
              {product.hasDiscount && product.originalPrice && product.discountPercentage ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{Number(product.price).toFixed(2)}
                    </p>
                    <p className="text-lg text-gray-500 line-through">
                      ₹{Number(product.originalPrice).toFixed(2)}
                    </p>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      {product.discountPercentage}% OFF
                    </span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    You save ₹{(Number(product.originalPrice) - Number(product.price)).toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Number(product.price).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Color Selection */}
          {/* <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Color</span>
              <span className="text-gray-500 capitalize">{selectedColor}</span>
            </div>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => setSelectedColor(option.name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === option.name
                      ? "border-black scale-110"
                      : "border-gray-200"
                  } ${option.color}`}
                />
              ))}
            </div>
          </div> */}

          {/* Size Selection */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Size</span>
              <span className="text-gray-500">{selectedSize}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {product.sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 px-3 border rounded text-sm font-medium transition-all ${
                    selectedSize === size
                      ? "border-black bg-black text-white"
                      : "border-gray-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                  {quantity.toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z"/>
              </svg>
              <span className="font-medium text-sm">Fast Delivery</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Estimated delivery: {product.deliveryDays || '2-3 days'}
            </p>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-black text-white hover:bg-gray-800 py-4 text-lg font-medium rounded-lg"
            disabled={!selectedSize || !selectedColor}
          >
            Add to cart
          </Button>
        </div>

        {/* Mobile Reviews Section */}
        <div className="p-4">
          <ReviewSection productId={product.id} />
        </div>
      </div>
    </motion.div>
  )
} 