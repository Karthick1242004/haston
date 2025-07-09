"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo } from "react"
import { Filter, ChevronDown, Grid, List, Star, Heart, ShoppingBag, X, SlidersHorizontal } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useProductStore } from "@/stores/product-store"
import { useRouter } from "next/navigation"
import type { Product } from "@/types/product"

// Mock expanded product data for the shop
const PRODUCT_IMAGE_URL = "https://i.pinimg.com/736x/7e/43/34/7e43342236d1dd193800325d0b99a991.jpg"

const shopProducts: Product[] = [
  {
    id: 1,
    name: "Nike ACG Wolf Tree Polartec",
    price: 250.00,
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Portage", "Forest Green", "Black", "Pink"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    description: "Celebrate the power and simplicity of the Swoosh.",
    rating: 5.0,
    stock: 50,
    category: "Outerwear"
  },
  {
    id: 2,
    name: "Light Knit Vest",
    price: 120,
    image: PRODUCT_IMAGE_URL,
    colors: ["Blue", "Gray", "Black"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.5,
    stock: 30,
    category: "Tops"
  },
  {
    id: 3,
    name: "Dark Green Polo",
    price: 110,
    image: PRODUCT_IMAGE_URL,
    colors: ["Green", "Navy", "White"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.3,
    stock: 25,
    category: "Tops"
  },
  {
    id: 4,
    name: "White Linen Shorts",
    price: 135,
    image: PRODUCT_IMAGE_URL,
    colors: ["White", "Beige", "Light Blue"],
    sizes: ["28", "30", "32", "34", "36"],
    rating: 4.7,
    stock: 40,
    category: "Bottoms"
  },
  {
    id: 5,
    name: "Beige Blazer",
    price: 320,
    image: PRODUCT_IMAGE_URL,
    colors: ["Beige", "Navy", "Charcoal"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    stock: 15,
    category: "Outerwear"
  },
  {
    id: 6,
    name: "Light Gray Suit",
    price: 450,
    image: PRODUCT_IMAGE_URL,
    colors: ["Light Gray", "Charcoal", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    stock: 12,
    category: "Suits"
  },
  {
    id: 7,
    name: "Casual Trousers",
    price: 180,
    image: PRODUCT_IMAGE_URL,
    colors: ["Khaki", "Navy", "Black"],
    sizes: ["28", "30", "32", "34", "36"],
    rating: 4.4,
    stock: 35,
    category: "Bottoms"
  },
  {
    id: 8,
    name: "Cream Suit",
    price: 420,
    image: PRODUCT_IMAGE_URL,
    colors: ["Cream", "Ivory", "Light Beige"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    stock: 18,
    category: "Suits"
  },
  {
    id: 9,
    name: "Denim Jacket",
    price: 180,
    image: PRODUCT_IMAGE_URL,
    colors: ["Blue", "Black", "Light Blue"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.2,
    stock: 28,
    category: "Outerwear"
  },
  {
    id: 10,
    name: "Cotton T-Shirt",
    price: 45,
    image: PRODUCT_IMAGE_URL,
    colors: ["White", "Black", "Gray", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.1,
    stock: 100,
    category: "Tops"
  },
  {
    id: 11,
    name: "Leather Boots",
    price: 280,
    image: PRODUCT_IMAGE_URL,
    colors: ["Brown", "Black"],
    sizes: ["7", "8", "9", "10", "11", "12"],
    rating: 4.7,
    stock: 22,
    category: "Footwear"
  },
  {
    id: 12,
    name: "Wool Sweater",
    price: 160,
    image: PRODUCT_IMAGE_URL,
    colors: ["Charcoal", "Cream", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.5,
    stock: 33,
    category: "Tops"
  }
]

interface FilterState {
  categories: string[]
  colors: string[]
  sizes: string[]
  priceRange: [number, number]
  inStock: boolean
}

interface SortOption {
  value: string
  label: string
}

const sortOptions: SortOption[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Newest" },
]

const categories = ["Outerwear", "Tops", "Bottoms", "Suits", "Footwear", "Accessories"]
const colors = ["Black", "White", "Gray", "Navy", "Blue", "Green", "Beige", "Brown", "Pink", "Red"]
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "7", "8", "9", "10", "11", "12"]

const colorMap: Record<string, string> = {
  "Black": "bg-black",
  "White": "bg-white border-2 border-gray-300",
  "Gray": "bg-gray-500",
  "Navy": "bg-blue-900",
  "Blue": "bg-blue-500",
  "Light Blue": "bg-blue-300",
  "Green": "bg-green-600",
  "Forest Green": "bg-green-700",
  "Beige": "bg-amber-100",
  "Light Beige": "bg-amber-50",
  "Brown": "bg-amber-700",
  "Pink": "bg-pink-400",
  "Red": "bg-red-500",
  "Portage": "bg-blue-400",
  "Charcoal": "bg-gray-700",
  "Khaki": "bg-yellow-600",
  "Cream": "bg-yellow-50",
  "Ivory": "bg-yellow-100"
}

export default function ShopPage() {
  const router = useRouter()
  const { addToCart } = useProductStore()
  
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    colors: [],
    sizes: [],
    priceRange: [0, 500],
    inStock: false
  })
  
  const [sortBy, setSortBy] = useState("popularity")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set())
  
  const itemsPerPage = 12

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = shopProducts.filter((product) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category || "")) {
        return false
      }
      
      // Color filter
      if (filters.colors.length > 0) {
        const hasMatchingColor = product.colors?.some(color => filters.colors.includes(color))
        if (!hasMatchingColor) return false
      }
      
      // Size filter
      if (filters.sizes.length > 0) {
        const hasMatchingSize = product.sizes?.some(size => filters.sizes.includes(size))
        if (!hasMatchingSize) return false
      }
      
      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }
      
      // Stock filter
      if (filters.inStock && (product.stock || 0) <= 0) {
        return false
      }
      
      return true
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
          return b.id - a.id
        case "popularity":
        default:
          return (b.rating || 0) * (b.stock || 0) - (a.rating || 0) * (a.stock || 0)
      }
    })

    return filtered
  }, [filters, sortBy])

  const paginatedProducts = filteredAndSortedProducts.slice(0, currentPage * itemsPerPage)
  const hasMore = filteredAndSortedProducts.length > currentPage * itemsPerPage

  const handleFilterChange = (type: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const toggleFilter = (type: "categories" | "colors" | "sizes", value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }))
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      colors: [],
      sizes: [],
      priceRange: [0, 500],
      inStock: false
    })
    setCurrentPage(1)
  }

  const toggleLike = (productId: number) => {
    setLikedProducts(prev => {
      const newLiked = new Set(prev)
      if (newLiked.has(productId)) {
        newLiked.delete(productId)
      } else {
        newLiked.add(productId)
      }
      return newLiked
    })
  }

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`)
  }

  const FilterSidebar = ({ className }: { className?: string }) => (
    <div className={className}>
      <div className="space-y-6">
        {/* Filter Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Category</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => toggleFilter("categories", category)}
                />
                <span className="text-sm text-gray-600">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Color</h4>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => toggleFilter("colors", color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  filters.colors.includes(color)
                    ? "border-black scale-110"
                    : "border-gray-300 hover:border-gray-400"
                } ${colorMap[color] || "bg-gray-400"}`}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Size</h4>
          <div className="grid grid-cols-4 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleFilter("sizes", size)}
                className={`py-2 px-3 text-sm border rounded transition-all ${
                  filters.sizes.includes(size)
                    ? "border-black bg-black text-white"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Price</h4>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => handleFilterChange("priceRange", value as [number, number])}
              max={500}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.inStock}
              onCheckedChange={(checked) => handleFilterChange("inStock", checked)}
            />
            <span className="text-sm text-gray-600">In stock only</span>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm"></div>
        <Header />
      </div>

      {/* Banner Section */}
      <section className="relative pt-20 pb-8 px-6 md:px-8 lg:px-12 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 rounded-3xl mx-4 mt-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center md:text-left mb-6 md:mb-0"
            >
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-800 tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-anton)" }}
              >
                Explore a World of Style,
              </h1>
              <p
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 font-light"
                style={{ fontFamily: "var(--font-anton)" }}
              >
                Crafted for You
              </p>
            </motion.div>

            {/* Right Side - Fashion Item */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex-shrink-0 md:ml-8"
            >
              <div className="relative">
                {/* Fashion Item Image/Icon */}
                <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-gray-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-3 transition-transform duration-300">
                  <div className="text-white text-3xl md:text-4xl lg:text-5xl">
                    👕
                  </div>
                </div>
                
                {/* Small decorative dots */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-pink-300 rounded-full opacity-70"></div>
                <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-purple-300 rounded-full opacity-70"></div>
                <div className="absolute top-1/2 -right-4 w-2 h-2 bg-orange-300 rounded-full opacity-70"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <a href="/" className="hover:text-gray-700 transition-colors">Home</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">Shop</span>
        </nav>
      </div>

      {/* Main Content */}
      <div id="products-section" className="container mx-auto px-4 pb-20">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <FilterSidebar className="hidden lg:block w-80 shrink-0" />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Clothing
                </h2>
                <span className="text-sm text-gray-500">
                  ({filteredAndSortedProducts.length} products)
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                {/* Mobile Filter Button */}
                <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden flex-shrink-0">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                  <span className="text-sm text-gray-600 hidden md:block flex-shrink-0">Sort by</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32 sm:w-36 md:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center border border-gray-200 rounded-md flex-shrink-0">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none px-3"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <Button onClick={clearAllFilters} className="mt-4">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${
                  viewMode === "grid" 
                    ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}>
                  {paginatedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="group cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="relative">
                          <div className={`${
                            viewMode === "grid" ? "aspect-[3/4]" : "aspect-square w-48"
                          } overflow-hidden`}>
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              unoptimized
                            />
                          </div>
                          
                          {/* Color Options Indicator */}
                          {product.colors && product.colors.length > 1 && (
                            <div className="absolute top-3 left-3 flex gap-1">
                              {product.colors.slice(0, 4).map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className={`w-3 h-3 rounded-full border border-white shadow-sm ${
                                    colorMap[color] || "bg-gray-400"
                                  }`}
                                />
                              ))}
                              {product.colors.length > 4 && (
                                <div className="w-3 h-3 rounded-full bg-gray-300 border border-white shadow-sm flex items-center justify-center">
                                  <span className="text-[6px] text-gray-600">+</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Wishlist Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 bg-white/80 hover:bg-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLike(product.id)
                            }}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                likedProducts.has(product.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-600"
                              }`}
                            />
                          </Button>

                          {/* Quick Add to Cart */}
                          <Button
                            size="sm"
                            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add default size and color for quick add
                              const defaultSize = product.sizes?.[0] || "M"
                              const defaultColor = product.colors?.[0] || "Black"
                              addToCart(product, defaultSize, defaultColor, 1)
                            }}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                        </div>

                        <CardContent className="p-4">
                          <div className={`${viewMode === "list" ? "flex justify-between items-start" : ""}`}>
                            <div className={viewMode === "list" ? "flex-1" : ""}>
                              <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-gray-700 transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium ml-1">{product.rating}</span>
                                </div>
                                <span className="text-sm text-gray-500">({product.stock})</span>
                              </div>

                              <p className="text-lg font-bold text-gray-900">
                                ${product.price.toFixed(2)}
                              </p>

                              {product.category && (
                                <Badge variant="secondary" className="mt-2">
                                  {product.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-12">
                    <Button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="px-8 py-3 bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300"
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </motion.div>
  )
} 