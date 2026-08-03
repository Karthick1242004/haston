// Guards every Cloudinary upload path. Route handlers have no default body-size
// limit, so `Buffer.from(await file.arrayBuffer())` on an unchecked upload will
// materialise the whole request in memory and can take the process down.

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB
export const MAX_IMAGES_PER_REQUEST = 5

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])

export class UploadValidationError extends Error {
  status = 400
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

/** Narrows a FormData entry to a real File; `formData.get()` returns a string for text fields. */
export function isUploadedFile(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as File).arrayBuffer === 'function' &&
    typeof (value as File).size === 'number'
  )
}

export function assertValidImage(value: unknown, label = 'image'): File {
  if (!isUploadedFile(value)) {
    throw new UploadValidationError(`The ${label} field must be an uploaded file`)
  }
  if (value.size === 0) {
    throw new UploadValidationError(`The uploaded ${label} is empty`)
  }
  if (value.size > MAX_IMAGE_BYTES) {
    throw new UploadValidationError(
      `Each ${label} must be ${MAX_IMAGE_BYTES / (1024 * 1024)} MB or smaller`
    )
  }
  if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
    throw new UploadValidationError(
      `Unsupported ${label} format. Allowed: JPEG, PNG, WebP, AVIF, GIF`
    )
  }
  return value
}

export function assertValidImages(values: unknown[], label = 'image'): File[] {
  if (values.length > MAX_IMAGES_PER_REQUEST) {
    throw new UploadValidationError(`At most ${MAX_IMAGES_PER_REQUEST} images may be uploaded at once`)
  }
  return values.map((value) => assertValidImage(value, label))
}
