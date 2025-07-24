export interface ProductColor {
  name: string
  value: string // hex code
}

export interface Product {
  id: string | number
  name: string
  price: number
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
  createdAt?: string | Date
}

export interface CartItem extends Product {
  quantity: number
  selectedSize: string
  selectedColor: string
}
