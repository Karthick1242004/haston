export interface ProductColor {
  name: string
  value: string // hex code
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
  category?: string
  badges?: string[] | any // Support array of strings and handle database inconsistencies
  reviews?: Review[] // Product reviews
  reviewCount?: number // Total number of reviews
  deliveryDays?: string // Delivery time (e.g., "2-3 days", "1 week", "Same day")
  createdAt?: string | Date
}

export interface CartItem extends Product {
  quantity: number
  selectedSize: string
  selectedColor: string
}

