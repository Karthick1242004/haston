// Client-safe ObjectId type (string representation)
export type ObjectId = string

// Client-side Order interface (for frontend use)
export interface Order {
  _id?: ObjectId
  orderId: string
  userId: string
  userEmail: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentDetails: PaymentDetails
  orderSummary: OrderSummary
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  estimatedDelivery?: Date
  createdAt: Date
  updatedAt?: Date
  
  // Cancellation fields
  cancelledAt?: Date
  cancellationReason?: string
  refundDetails?: RefundDetails
}

// Server-side Order interface (for MongoDB operations)
export interface ServerOrder {
  _id?: import('mongodb').ObjectId
  orderId: string
  userId: string
  userEmail: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentDetails: PaymentDetails
  orderSummary: OrderSummary
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  estimatedDelivery?: Date
  createdAt: Date
  updatedAt?: Date
  
  // Cancellation fields
  cancelledAt?: Date
  cancellationReason?: string
  refundDetails?: RefundDetails
}

export interface RefundDetails {
  refund_id: string
  amount: number
  status: string
  created_at: Date
  speed_processed?: string
}

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

export interface PaymentDetails {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
  amount: number
  currency: string
  status: 'success' | 'failed'
  created_at?: Date
}

export interface OrderSummary {
  subtotal: number
  shipping: number
  taxes: number
  discount: number
  discountCode?: string
  total: number
} 