import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getProductsCollection, getOrdersCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { stripReviewPii } from '@/lib/reviews'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// GET - Fetch reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const collection = await getProductsCollection()
    const product = await collection.findOne({
      _id: new ObjectId(productId)
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const reviews = (product.reviews || []).map(stripReviewPii)

    return NextResponse.json({
      reviews,
      reviewCount: reviews.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : 0
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST - Add a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please sign in to write a review.' },
        { status: 401 }
      )
    }

    const limited = await enforceRateLimit(request, RATE_LIMITS.reviewCreate, session.user.id)
    if (limited) return limited

    const body = await request.json()
    const { productId, rating, comment } = body

    // Validation
    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Please choose a rating and write your review.' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    if (typeof comment !== 'string') {
      return NextResponse.json({ error: 'Comment must be text' }, { status: 400 })
    }

    // Must be an integer 1-5. A bare `< 1 || > 5` comparison lets non-numbers
    // through (both sides are false for NaN) and parseInt then stores NaN,
    // permanently poisoning this product's average. Booleans are excluded
    // explicitly because Number(true) === 1 would otherwise pass as a 1-star.
    const parsedRating = typeof rating === 'number' ? rating : NaN
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: 'Please select a rating between 1 and 5 stars.' },
        { status: 400 }
      )
    }

    // There is no minimum length — a one-word review is a valid review. The
    // upper bound stays because reviews are embedded in the product document,
    // which Mongo caps at 16MB for the whole array.
    if (comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please write a few words about the product.' },
        { status: 400 }
      )
    }

    if (comment.length > 5000) {
      return NextResponse.json(
        { error: 'Your review is too long. Please keep it under 5,000 characters.' },
        { status: 400 }
      )
    }

    const collection = await getProductsCollection()

    // Check if product exists
    const product = await collection.findOne({
      _id: new ObjectId(productId)
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Reviews are verified-purchase only: the reviewer must own an order
    // containing this product. Order status is not checked — placing the order
    // is enough. Dropping the ownership check entirely would let any signed-in
    // account rate any product, which is the cheapest review-spam vector there
    // is, so that part stays.
    const orders = await getOrdersCollection()
    const purchased = await orders.findOne({
      userEmail: session.user.email,
      'items.id': productId.toString(),
    })

    if (!purchased) {
      return NextResponse.json(
        { error: 'You can review this product once you have ordered it.' },
        { status: 403 }
      )
    }

    // Check if user has already reviewed this product
    const existingReviews = product.reviews || []
    const userReview = existingReviews.find((review: any) => review.userId === session.user.id)

    if (userReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product.' },
        { status: 400 }
      )
    }

    // Create new review
    const newReview = {
      id: new ObjectId().toString(),
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      userEmail: session.user.email || '',
      userImage: session.user.image || '',
      rating: parsedRating,
      comment: comment.trim(),
      // Always true: an order containing this product is required to get here.
      // Stored so the UI can show a "Verified purchase" badge.
      verifiedPurchase: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // $push against a filter that still excludes this reviewer. Rewriting the
    // whole array instead let concurrent reviewers clobber each other and let
    // one user slip several reviews past the duplicate check.
    const write = await collection.updateOne(
      {
        _id: new ObjectId(productId),
        'reviews.userId': { $ne: session.user.id },
      },
      { $push: { reviews: newReview } as any }
    )

    if (write.matchedCount === 0) {
      return NextResponse.json(
        { error: 'You have already reviewed this product.' },
        { status: 400 }
      )
    }

    // Recompute the aggregate from what is actually stored now.
    const updated = await collection.findOne(
      { _id: new ObjectId(productId) },
      { projection: { reviews: 1 } }
    )
    const storedReviews = updated?.reviews || []
    const averageRating =
      storedReviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) /
      (storedReviews.length || 1)

    await collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          reviewCount: storedReviews.length,
          rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
        }
      }
    )

    return NextResponse.json(
      {
        message: 'Review added successfully',
        review: stripReviewPii(newReview),
        reviewCount: storedReviews.length,
        averageRating: Math.round(averageRating * 10) / 10
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    )
  }
} 