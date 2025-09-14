import { MongoClient, Db, Collection, ObjectId } from "mongodb"
import { ExtendedUser, Address, CartItem } from '@/types/database'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
  // Add connection options for better reliability
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

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
  try {
    const client = await clientPromise
    
    // Test the connection
    await client.db("admin").command({ ping: 1 })
    
    const db = client.db("hex")
    
    // Log successful connection (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ MongoDB connected successfully to database:', db.databaseName)
    }
    
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
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

export async function getOrdersCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("orders")
}

// Re-export types from database types file for server-side usage
// This ensures API routes can still use these types while keeping client bundle clean
export type { ExtendedUser, Address, CartItem } from '@/types/database'

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
      currency: 'INR',
      language: 'en',
      theme: 'system' as 'light' | 'dark' | 'system'
    }
  }
  
  const result = await collection.insertOne(newUser)
  return result.insertedId ? { ...newUser, _id: result.insertedId.toString() } as ExtendedUser : null
} 