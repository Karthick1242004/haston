export interface OrderItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  selectedSize: string
  selectedColor: string
  subtotal: number
}

export interface PaymentDetails {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
  amount: number
  currency: string
  status: 'success' | 'failed' | 'pending'
  payment_method?: string
  created_at: Date
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface OrderSummary {
  subtotal: number
  shipping: number
  taxes: number
  discount: number
  discountCode?: string
  total: number
}

export interface Order {
  _id?: string
  orderId: string
  userId: string
  userEmail: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentDetails: PaymentDetails
  orderSummary: OrderSummary
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  estimatedDelivery?: Date
} 