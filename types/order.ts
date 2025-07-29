export interface Order {
  _id?: string
  orderId: string
  userEmail: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentDetails: PaymentDetails
  orderSummary: OrderSummary
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  estimatedDelivery?: string
  createdAt: string
  updatedAt?: string
  
  // Cancellation fields
  cancelledAt?: string
  cancellationReason?: string
  refundDetails?: RefundDetails
}

export interface RefundDetails {
  refund_id: string
  amount: number
  status: string
  created_at: number
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
}

export interface OrderSummary {
  subtotal: number
  shipping: number
  taxes: number
  discount: number
  discountCode?: string
  total: number
} 