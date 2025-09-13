// types/database.ts - CLIENT-SAFE TYPES ONLY
// This file contains only TypeScript interfaces without any MongoDB imports
// Used by client-side components to avoid pulling in the MongoDB driver

export interface ExtendedUser {
  _id?: string
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  emailVerified?: Date | null
  
  // Personal Information
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: Date
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  
  // Addresses (array for multiple addresses)
  addresses?: Address[]
  defaultAddressId?: string
  
  // Shopping Data
  cartItems?: CartItem[]
  wishlist?: string[] // Array of product IDs
  orderHistory?: string[] // Array of order IDs
  
  // Preferences
  preferences?: {
    newsletter?: boolean
    smsUpdates?: boolean
    currency?: string
    language?: string
    theme?: 'light' | 'dark' | 'system'
  }
  
  // Account Information
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date
  isActive?: boolean
  
  // OAuth Information
  accounts?: Array<{
    provider: string
    providerAccountId: string
    type: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
  }>
}

export interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  isDefault: boolean
}

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  selectedSize: string
  selectedColor: string
  quantity: number
  addedAt?: Date
}
