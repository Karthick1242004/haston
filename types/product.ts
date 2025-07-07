export interface Product {
  id: number
  name: string
  price: number
  image: string
  images?: string[]
  size?: string
  color?: string
  colors?: string[]
  sizes?: string[]
  description?: string
  rating?: number
  stock?: number
  category?: string
}

export interface CartItem extends Product {
  quantity: number
  selectedSize: string
  selectedColor: string
}
