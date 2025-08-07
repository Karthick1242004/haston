export interface ProductColor {
  name: string
  value: string // hex code
}

export interface ProductCategory {
  main: string // Main category: "Men" | "Women"
  sub: string  // Sub category: "regular" | "oversized-tees" | "tank-tops"
}

export interface CategoryFilter {
  id: string
  name: string
  value: string
  subcategories?: SubcategoryFilter[]
}

export interface SubcategoryFilter {
  id: string
  name: string
  value: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  userEmail: string
  userImage?: string
  rating: number // 1-5 stars
  comment: string
  createdAt: Date | string
  updatedAt?: Date | string
}

// Product Specifications Interface
export interface ProductSpecifications {
  // Basic specifications
  fit?: string // e.g., "Bootcut", "Skinny", "Regular"
  waistRise?: string // e.g., "High-Rise", "Mid-Rise", "Low-Rise"
  features?: string // e.g., "Plain", "Embroidered", "Printed"
  length?: string // e.g., "Regular", "Long", "Short"
  closure?: string // e.g., "Slip-On", "Button", "Zipper"
  flyType?: string // e.g., "No Fly", "Zipper Fly", "Button Fly"
  
  // Detailed product information
  productDetails?: string[] // Array of bullet point descriptions
  
  // Size and fit information
  sizeAndFit?: {
    fitType?: string // e.g., "Regular Fit", "Slim Fit"
    modelInfo?: string // e.g., "The model (height 5'8) is wearing a size 28"
    additionalInfo?: string // Any additional size/fit information
  }
  
  // Material and care
  materialAndCare?: {
    material?: string // e.g., "Nylon", "Cotton", "Polyester"
    careInstructions?: string[] // Array of care instructions
  }
}

export interface Product {
  id: string | number
  name: string
  price: number // This will be the selling price (what customer pays)
  originalPrice?: number // Calculated price before discount
  discountPercentage?: number // Discount percentage (e.g., 25 for 25% off)
  hasDiscount?: boolean // Whether this product has a discount
  image?: string
  images?: string[]
  size?: string
  color?: string
  colors?: ProductColor[] | string[] | any // Support multiple formats and database inconsistencies
  sizes?: string[]
  description?: string
  rating?: number
  stock?: number
  category?: string // Legacy field - will be replaced by productCategory
  productCategory?: ProductCategory // New structured category system
  badges?: string[] | any // Support array of strings and handle database inconsistencies
  reviews?: Review[] // Product reviews
  reviewCount?: number // Total number of reviews
  deliveryDays?: string // Delivery time (e.g., "2-3 days", "1 week", "Same day")
  createdAt?: string | Date
  isLook?: boolean // Whether this product should be used in Look Breakdown slider
  
  // Product specifications
  specifications?: ProductSpecifications
}

export interface CartItem extends Product {
  quantity: number
  selectedSize: string
  selectedColor: string
}

