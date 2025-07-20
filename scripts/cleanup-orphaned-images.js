/**
 * Cleanup Orphaned Images Script
 * 
 * This script finds and optionally deletes images in Cloudinary that are no longer
 * referenced by any products in the database. Run this periodically to clean up
 * storage and reduce costs.
 * 
 * Usage:
 * - Dry run (see what would be deleted): node scripts/cleanup-orphaned-images.js
 * - Actually delete orphaned images: node scripts/cleanup-orphaned-images.js --delete
 */

const { MongoClient } = require('mongodb')
const cloudinary = require('cloudinary').v2

// Configure Cloudinary (ensure environment variables are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MONGODB_URI = process.env.MONGODB_URI
const DRY_RUN = !process.argv.includes('--delete')

async function getAllProductImages() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db('hex')
    const products = await db.collection('products').find({}).toArray()
    
    const allImageUrls = new Set()
    
    products.forEach(product => {
      // Add main image
      if (product.image) {
        allImageUrls.add(product.image)
      }
      
      // Add all images
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(url => allImageUrls.add(url))
      }
      
      // Add look images
      if (product.lookImages && Array.isArray(product.lookImages)) {
        product.lookImages.forEach(url => allImageUrls.add(url))
      }
    })
    
    console.log(`Found ${allImageUrls.size} unique images referenced in ${products.length} products`)
    return Array.from(allImageUrls)
  } finally {
    await client.close()
  }
}

function extractPublicId(cloudinaryUrl) {
  try {
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting public_id from URL:', cloudinaryUrl, error)
    return null
  }
}

async function getAllCloudinaryImages() {
  try {
    console.log('Fetching all images from Cloudinary products folder...')
    const result = await cloudinary.search
      .expression('folder:products')
      .sort_by([['created_at', 'desc']])
      .max_results(500) // Adjust if you have more images
      .execute()
    
    console.log(`Found ${result.resources.length} images in Cloudinary`)
    return result.resources.map(resource => ({
      public_id: resource.public_id,
      url: resource.secure_url,
      created_at: resource.created_at,
      bytes: resource.bytes
    }))
  } catch (error) {
    console.error('Error fetching Cloudinary images:', error)
    return []
  }
}

async function findOrphanedImages() {
  const [productImages, cloudinaryImages] = await Promise.all([
    getAllProductImages(),
    getAllCloudinaryImages()
  ])
  
  const productImageIds = new Set(
    productImages
      .map(url => extractPublicId(url))
      .filter(id => id !== null)
  )
  
  const orphanedImages = cloudinaryImages.filter(image => 
    !productImageIds.has(image.public_id)
  )
  
  return orphanedImages
}

async function deleteOrphanedImages(orphanedImages) {
  console.log(`\n${DRY_RUN ? 'DRY RUN: Would delete' : 'Deleting'} ${orphanedImages.length} orphaned images...`)
  
  let deletedCount = 0
  let totalBytes = 0
  
  for (const image of orphanedImages) {
    totalBytes += image.bytes || 0
    
    if (DRY_RUN) {
      console.log(`Would delete: ${image.public_id} (${(image.bytes / 1024 / 1024).toFixed(2)}MB)`)
      deletedCount++
    } else {
      try {
        const result = await cloudinary.uploader.destroy(image.public_id)
        if (result.result === 'ok') {
          console.log(`✓ Deleted: ${image.public_id}`)
          deletedCount++
        } else {
          console.log(`✗ Failed to delete: ${image.public_id} - ${result.result}`)
        }
      } catch (error) {
        console.error(`Error deleting ${image.public_id}:`, error.message)
      }
    }
  }
  
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2)
  
  if (DRY_RUN) {
    console.log(`\nDRY RUN SUMMARY:`)
    console.log(`Would delete ${deletedCount} orphaned images`)
    console.log(`Would free up ${totalMB}MB of storage`)
    console.log(`\nTo actually delete these images, run: node scripts/cleanup-orphaned-images.js --delete`)
  } else {
    console.log(`\nCLEANUP SUMMARY:`)
    console.log(`Successfully deleted ${deletedCount} orphaned images`)
    console.log(`Freed up ${totalMB}MB of storage`)
  }
}

async function main() {
  try {
    console.log('🧹 Cloudinary Orphaned Images Cleanup Tool')
    console.log('==========================================')
    
    if (DRY_RUN) {
      console.log('🔍 Running in DRY RUN mode - no images will be deleted')
    } else {
      console.log('⚠️  LIVE MODE - Images will be permanently deleted!')
    }
    
    const orphanedImages = await findOrphanedImages()
    
    if (orphanedImages.length === 0) {
      console.log('✅ No orphaned images found! Your Cloudinary storage is clean.')
      return
    }
    
    console.log(`\n📋 Found ${orphanedImages.length} orphaned images:`)
    orphanedImages.forEach(image => {
      const sizeMB = (image.bytes / 1024 / 1024).toFixed(2)
      console.log(`  - ${image.public_id} (${sizeMB}MB, created: ${image.created_at})`)
    })
    
    await deleteOrphanedImages(orphanedImages)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the script
main().then(() => {
  console.log('\n✅ Cleanup completed!')
  process.exit(0)
}) 