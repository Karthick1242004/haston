import { MongoClient, Db, Collection, ObjectId } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db("hex")
}

export async function getUsersCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("users")
}

export async function getProductsCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("products")
}

export async function getAdminsCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("admins")
}

// Extended User Schema for scalability
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
  phone?: string
  isDefault?: boolean
}

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  selectedSize: string
  selectedColor: string
  quantity: number
  addedAt: Date
}

// Helper functions for user operations
export async function findUserByEmail(email: string): Promise<ExtendedUser | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ email }) as ExtendedUser | null
}

export async function findUserById(id: string): Promise<ExtendedUser | null> {
  const collection = await getUsersCollection()
  return await collection.findOne({ _id: new ObjectId(id) }) as ExtendedUser | null
}

export async function updateUser(id: string, updates: Partial<ExtendedUser>): Promise<boolean> {
  const collection = await getUsersCollection()
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date() 
      } 
    }
  )
  return result.modifiedCount > 0
}

export async function createUserProfile(user: Partial<ExtendedUser>): Promise<ExtendedUser | null> {
  const collection = await getUsersCollection()
  const now = new Date()
  
  const { _id, ...userWithoutId } = user
  const newUser = {
    ...userWithoutId,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    isActive: true,
    cartItems: [],
    wishlist: [],
    orderHistory: [],
    addresses: [],
    preferences: {
      newsletter: false,
      smsUpdates: false,
      currency: 'USD',
      language: 'en',
      theme: 'system' as 'light' | 'dark' | 'system'
    }
  }
  
  const result = await collection.insertOne(newUser)
  return result.insertedId ? { ...newUser, _id: result.insertedId.toString() } as ExtendedUser : null
} 