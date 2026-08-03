/**
 * Reviews are embedded in the product document and both /api/products and
 * /api/products/reviews are public, so the reviewer's email and account id must
 * be removed before a review leaves the server. The UI renders only userName
 * and userImage.
 */
export function stripReviewPii(review: any) {
  const { userEmail, userId, ...safe } = review || {}
  return safe
}
