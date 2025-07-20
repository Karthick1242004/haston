import cloudinary from './cloudinary'

/**
 * Extract public_id from Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/products/abc123.jpg
 * Returns: products/abc123
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    // Match Cloudinary URL pattern and extract public_id
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting public_id from URL:', cloudinaryUrl, error)
    return null
  }
}

/**
 * Delete image from Cloudinary by URL
 */
export async function deleteImageFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    const publicId = extractPublicId(imageUrl)
    if (!publicId) {
      console.error('Could not extract public_id from URL:', imageUrl)
      return false
    }

    console.log(`Deleting image from Cloudinary: ${publicId}`)
    const result = await cloudinary.uploader.destroy(publicId)
    
    if (result.result === 'ok') {
      console.log(`Successfully deleted image: ${publicId}`)
      return true
    } else {
      console.warn(`Failed to delete image: ${publicId}, result:`, result)
      return false
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    return false
  }
}

/**
 * Delete multiple images from Cloudinary by URLs
 */
export async function deleteImagesFromCloudinary(imageUrls: string[]): Promise<void> {
  if (imageUrls.length === 0) return

  console.log(`Deleting ${imageUrls.length} images from Cloudinary`)
  
  // Delete images in parallel for better performance
  const deletePromises = imageUrls.map(url => deleteImageFromCloudinary(url))
  const results = await Promise.allSettled(deletePromises)
  
  // Log results
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to delete image ${imageUrls[index]}:`, result.reason)
    }
  })
}

/**
 * Get difference between two image arrays to find removed images
 */
export function getRemovedImages(oldImages: string[], newImages: string[]): string[] {
  return oldImages.filter(oldUrl => !newImages.includes(oldUrl))
} 