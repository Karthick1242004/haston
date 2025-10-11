"use client"

import { motion, AnimatePresence } from "framer-motion"
import {  useMemo } from "react"
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
import { useAuthCart } from "@/hooks/use-auth-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useRouter } from "next/navigation"
import type { Product, ProductCategory } from "@/types/product"
import { CATEGORIES, getCategoryDisplayName } from "@/lib/categories"

// Products will be fetched from backend
import { useEffect, useState } from "react"
import { CardMain } from "@/components/ui/cardmain"

interface FilterState {
  categories: string[]
  mainCategories: string[]
  subCategories: string[]
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
  "Grey": "bg-gray-500",
  "Navy": "bg-blue-900",
  "Blue": "bg-blue-500",
  "Light Blue": "bg-blue-300",
  "Dark Blue": "bg-blue-800",
  "Green": "bg-green-600",
  "Forest Green": "bg-green-700",
  "Light Green": "bg-green-400",
  "Dark Green": "bg-green-800",
  "Beige": "bg-amber-100",
  "Light Beige": "bg-amber-50",
  "Brown": "bg-amber-700",
  "Dark Brown": "bg-amber-900",
  "Light Brown": "bg-amber-300",
  "Pink": "bg-pink-400",
  "Light Pink": "bg-pink-200",
  "Hot Pink": "bg-pink-500",
  "Red": "bg-red-500",
  "Dark Red": "bg-red-700",
  "Maroon": "bg-red-800",
  "Orange": "bg-orange-500",
  "Yellow": "bg-yellow-400",
  "Purple": "bg-purple-500",
  "Violet": "bg-violet-500",
  "Indigo": "bg-indigo-500",
  "Teal": "bg-teal-500",
  "Cyan": "bg-cyan-500",
  "Lime": "bg-lime-500",
  "Emerald": "bg-emerald-500",
  "Rose": "bg-rose-500",
  "Fuchsia": "bg-fuchsia-500",
  "Sky": "bg-sky-500",
  "Amber": "bg-amber-500",
  "Slate": "bg-slate-500",
  "Zinc": "bg-zinc-500",
  "Neutral": "bg-neutral-500",
  "Stone": "bg-stone-500",
  "Portage": "bg-blue-400",
  "Charcoal": "bg-gray-700",
  "Khaki": "bg-yellow-600",
  "Cream": "bg-yellow-50",
  "Ivory": "bg-yellow-100",
  "Coral": "bg-coral-400",
  "Mint": "bg-green-200",
  "Lavender": "bg-purple-200",
  "Peach": "bg-orange-200",
  "Turquoise": "bg-teal-400",
  "Gold": "bg-yellow-500",
  "Silver": "bg-gray-300",
  "Bronze": "bg-amber-600"
}

export default function ShopPage() {
  const router = useRouter()
  const { addProductToCart } = useAuthCart()
  const { toggleWishlist, isInWishlist, isLoading: wishlistLoading } = useWishlist()

  const [products, setProducts] = useState<Product[]>([])

  useEffect(()=>{
    fetch('/api/products')
      .then(r=>r.json())
      .then(d=>{
        const productsToSet = d.products || []
        setProducts(productsToSet)
      })
      .catch(err => {
        console.error('API Error:', err)
      })
  },[])
  
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    mainCategories: [],
    subCategories: [],
    colors: [],
    sizes: [],
    priceRange: [0, 10000], // Increased max price to 10,000
    inStock: false
  })
  
  const [sortBy, setSortBy] = useState("popularity")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  const itemsPerPage = 12

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) {
      return []
    }
    
    let filtered = products.filter((product, index) => {
      // Legacy category filter (for backward compatibility)
      if (filters.categories.length > 0 && !filters.categories.includes(product.category || "")) {
        return false
      }
      
      // New main category filter
      if (filters.mainCategories.length > 0) {
        const productMainCategory = product.productCategory?.main
        if (!productMainCategory || !filters.mainCategories.includes(productMainCategory)) {
          return false
        }
      }
      
      // New subcategory filter
      if (filters.subCategories.length > 0) {
        const productSubCategory = product.productCategory?.sub
        if (!productSubCategory || !filters.subCategories.includes(productSubCategory)) {
          return false
        }
      }
      
      // Color filter
      if (filters.colors.length > 0) {
        const hasMatchingColor = Array.isArray(product.colors) && product.colors.some(color => filters.colors.includes(color))
        if (!hasMatchingColor) {
          return false
        }
      }
      
      // Size filter
      if (filters.sizes.length > 0) {
        const hasMatchingSize = product.sizes?.some(size => filters.sizes.includes(size))
        if (!hasMatchingSize) {
          return false
        }
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
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "popularity":
        default:
          return (b.rating || 0) * (b.stock || 0) - (a.rating || 0) * (a.stock || 0)
      }
    })

    return filtered
  }, [products, filters, sortBy])

  const paginatedProducts = filteredAndSortedProducts.slice(0, currentPage * itemsPerPage)
  const hasMore = filteredAndSortedProducts.length > currentPage * itemsPerPage

  const handleFilterChange = (type: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const toggleFilter = (type: "categories" | "colors" | "sizes" | "mainCategories" | "subCategories", value: string) => {
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
      mainCategories: [],
      subCategories: [],
      colors: [],
      sizes: [],
      priceRange: [0, 10000], 
      inStock: false
    })
    setCurrentPage(1)
  }

  const handleToggleWishlist = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleWishlist(productId)
  }

  const handleProductClick = (productId: string | number) => {
    router.push(`/product/${productId}`)
  }

  const FilterSidebar = () => (
    <div>
      <div className="h-full max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain pr-2 -mr-2">
        <div className="space-y-6 pb-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
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

          {/* Main Categories */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Main Category</h4>
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.mainCategories.includes(category.value)}
                    onCheckedChange={() => toggleFilter("mainCategories", category.value)}
                  />
                  <span className="text-sm text-gray-600">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subcategories (only show if main category is selected) */}
          {filters.mainCategories.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Subcategory</h4>
              <div className="space-y-2">
                {CATEGORIES
                  .filter(cat => filters.mainCategories.includes(cat.value))
                  .flatMap(cat => cat.subcategories || [])
                  .map((subcategory) => (
                    <label key={subcategory.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.subCategories.includes(subcategory.value)}
                        onCheckedChange={() => toggleFilter("subCategories", subcategory.value)}
                      />
                      <span className="text-sm text-gray-600">{subcategory.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Legacy Categories (for backward compatibility) */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Legacy Category</h4>
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
            <div className="grid grid-cols-4 gap-2">
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
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleFilter("sizes", size)}
                  className={`py-1 px-1 text-sm border rounded transition-all ${
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
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>₹{filters.priceRange[0]}</span>
                <span>₹{filters.priceRange[1]}</span>
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
    </div>
  )

  return (
    <motion.div
      className="min-h-screen bg-[#fbfbfb]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="relative p">
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm"></div>
        <Header />
      </div>


      {/* Banner Section */}
      <section className="relative pt-20 pb-8 px-6 md:px-8 lg:px-12  rounded-3xl mx-4  overflow-hidden">
        <div className="container mt-10 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center md:text-left mb-6 md:mb-0"
            >
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                Explore a World of Style,
              </h1>
              <p
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 font-bold"
                style={{ fontFamily: "var(--font-nunito)" }}
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
                {/* Fashion Item Image */}
                <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-2xl shadow-lg transform rotate-6 hover:rotate-3 transition-transform duration-300 overflow-hidden">
                  <Image
                    src="/bannerimage.jpg"
                    alt="Fashion banner"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                  />
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
        <div className="flex gap-4">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-48 shrink-0 sticky top-24 h-fit">
            <FilterSidebar />
          </div>

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
                  <SheetContent side="left" className="w-72 flex flex-col">
                    <SheetHeader className="flex-shrink-0">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 mt-6 min-h-0">
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
                <div className={`grid gap-2 ${
                  viewMode === "grid" 
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
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
                      <CardMain className="overflow-hidden bg-white ">
                        <div className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className={`${
                              viewMode === "grid" ? "aspect-[3/4]" : "aspect-square w-48"
                            } overflow-hidden`}>
                              <Image
                                src={product.image || product.images?.[0] || '/placeholder.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover transition-all duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                quality={80}
                              />
                              {/* Gradient overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          
                          {/* Stock Status */}
                          {(product.stock || 0) <= 5 && (product.stock || 0) > 0 && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
                                {product.stock} left
                              </Badge>
                            </div>
                          )}
                          
                          {/* Out of stock badge */}
                          {(product.stock || 0) === 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                              <Badge className="bg-gray-800 text-white px-3 py-1 text-sm">
                                Out of Stock
                              </Badge>
                            </div>
                          )}
                          
                          

                          {/* Wishlist Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white backdrop-blur-sm transition-all duration-200 rounded-full w-8 h-8"
                            onClick={(e) => handleToggleWishlist(typeof product.id === 'string' ? parseInt(product.id, 16) : product.id, e)}
                            disabled={wishlistLoading}
                          >
                            <Heart
                              className={`w-4 h-4 transition-all duration-200 ${
                                isInWishlist(typeof product.id === 'string' ? parseInt(product.id, 16) : product.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-600 hover:text-red-400"
                              }`}
                            />
                          </Button>

                          {/* Quick Add to Cart */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                            <Button
                              size="sm"
                              className="bg-white text-black hover:bg-gray-200 transition-all duration-200 rounded-full px-2.5 py-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                const defaultSize = product.sizes?.[0] || "M"
                                const defaultColor = Array.isArray(product.colors) ? product.colors[0] : "Black"
                                addProductToCart(product, defaultSize, defaultColor, 1)
                              }}
                              disabled={(product.stock || 0) === 0}
                            >
                              <ShoppingBag className="w-3 h-3" />
                              
                            </Button>
                          </div>
                        </div>

                        <CardContent className="py-3 px-0 bg-[#fbfbfb]">
                          <div className={`${viewMode === "list" ? "flex justify-between items-start" : ""}`}>
                            <div className={viewMode === "list" ? "flex-1" : ""}>
                              {/* Product Name */}
                              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                {product.name}
                              </h3>
                              
                              {/* Rating and Reviews */}
                              {/* <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium text-yellow-700 ml-1">{product.rating}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  ({product.stock})
                                </span>
                              </div> */}

                              {/* Price Display */}
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-lg font-bold text-gray-900">
                                  ₹{product.price.toFixed(2)}
                                </p>
                                {product.price > 1000 && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ₹{(product.price * 1.2).toFixed(2)}
                                  </p>
                                )}
                              </div>
                              
                              {/* Color Options - moved to content section */}
                              {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs text-gray-500">Colors:</span>
                                  <div className="flex gap-1">
                                    {product.colors.slice(0, 4).map((color, colorIndex) => {
                                      // Handle both old format (string) and new format (object with name/value)
                                      const colorName = typeof color === 'object' && color.name ? color.name : color
                                      const colorValue = typeof color === 'object' && color.value ? color.value : null
                                      
                                      return (
                                        <div
                                          key={colorIndex}
                                          className={`w-3.5 h-3.5 p-0.5 rounded-sm border border-gray-300 ${
                                            colorValue 
                                              ? '' 
                                              : (colorMap[colorName] || "bg-green-600")
                                          }`}
                                          style={colorValue ? { backgroundColor: colorValue } : {}}
                                          title={colorName}
                                        />
                                      )
                                    })}
                                    {Array.isArray(product.colors) && product.colors.length > 4 && (
                                      <span className="text-xs text-gray-500 font-medium">+{product.colors.length - 4}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* Sizes */}
                              {/* {product.sizes && product.sizes.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Sizes:</span>
                                  <div className="flex gap-1">
                                    {product.sizes.slice(0, 3).map((size, idx) => (
                                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                                        {size}
                                      </span>
                                    ))}
                                    {product.sizes.length > 3 && (
                                      <span className="text-xs text-gray-400">+{product.sizes.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )} */}
                            </div>
                          </div>
                        </CardContent>
                      </CardMain>
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