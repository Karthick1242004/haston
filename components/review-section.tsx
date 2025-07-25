"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Review } from "@/types/product"

interface ReviewSectionProps {
  productId: string | number
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [showAddReview, setShowAddReview] = useState(false)

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/products/reviews?productId=${productId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch reviews')
        }
        
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setReviewCount(data.reviewCount)
      } catch (error) {
        console.error('Error fetching reviews:', error)
        toast.error('Failed to load reviews')
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchReviews()
    }
  }, [productId])

  // Update character count
  useEffect(() => {
    setCharacterCount(comment.trim().length)
  }, [comment])

  // Check if user has already reviewed
  const userHasReviewed = reviews.some(review => review.userId === session?.user?.id)

  const handleSubmitReview = async () => {
    if (!session) {
      toast.error('Please sign in to add a review')
      router.push('/auth/signin')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (characterCount < 150) {
      toast.error(`Review must be at least 150 characters. Current: ${characterCount} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/products/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId.toString(),
          rating,
          comment,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add review')
      }

      // Update local state
      setReviews(prev => [...prev, data.review])
      setReviewCount(data.reviewCount)
      setAverageRating(data.averageRating)
      
      // Reset form
      setRating(0)
      setComment("")
      setShowAddReview(false)
      
      toast.success('Review added successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ value, onRate, readonly = false }: { value: number; onRate?: (rating: number) => void; readonly?: boolean }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRate?.(star)}
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Reviews Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {session && !userHasReviewed && (
            <Button
              onClick={() => setShowAddReview(!showAddReview)}
              className="bg-black text-white hover:bg-gray-800"
            >
              Write a Review
            </Button>
          )}
        </div>

        {/* Rating Summary */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <StarRating value={Math.round(averageRating)} readonly />
            <div className="text-sm text-gray-600 mt-1">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          
          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter(r => r.rating === stars).length
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0
              
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{stars}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Review Form */}
      {showAddReview && session && !userHasReviewed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Write Your Review</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <StarRating value={rating} onRate={setRating} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Review
                  <span className="text-sm text-gray-500 ml-2">
                    ({characterCount}/150 characters minimum)
                  </span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <div className="mt-1 text-sm text-gray-500">
                  {characterCount < 150 && (
                    <span className="text-orange-600">
                      {150 - characterCount} more characters needed
                    </span>
                  )}
                  {characterCount >= 150 && (
                    <span className="text-green-600">✓ Minimum character count met</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || characterCount < 150 || isSubmitting}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddReview(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Already Reviewed Message */}
      {session && userHasReviewed && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">Thank you for your review! You have already reviewed this product.</p>
        </div>
      )}

      {/* Sign In Prompt */}
      {!session && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Sign in to write a review</p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="bg-black text-white hover:bg-gray-800"
          >
            Sign In
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold">All Reviews ({reviewCount})</h3>
            {reviews
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.userImage} alt={review.userName} />
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between flex-wrap">
                            <div>
                              <h4 className="font-medium">{review.userName}</h4>
                              <div className="flex items-center gap-2">
                                <StarRating value={review.rating} readonly />
                                <span className="text-sm text-gray-500">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {review.rating} ★
                            </Badge>
                          </div>
                          
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </>
        )}
      </div>
    </motion.div>
  )
} 