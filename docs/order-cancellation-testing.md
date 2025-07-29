# Order Cancellation & Refund Testing Guide

## 📋 Overview

This guide explains how to test the order cancellation and refund functionality implemented with Razorpay integration.

## 🧪 Testing Scenarios

### Scenario 1: Valid Cancellation (3+ Days Before Delivery)

**Setup:**
1. Place a test order using Razorpay test mode
2. Set an estimated delivery date that is 3+ days in the future
3. Ensure order status is 'pending' or 'confirmed'

**Steps:**
1. Navigate to `/orders` page
2. Find the test order
3. Click "Cancel Order" button (should be visible)
4. Fill in cancellation reason (optional)
5. Confirm cancellation

**Expected Results:**
- ✅ Order status changes to 'cancelled'
- ✅ Refund is processed via Razorpay
- ✅ Order card highlights in red
- ✅ Refund details are displayed
- ✅ Success toast notification appears

### Scenario 2: Invalid Cancellation (Less than 3 Days)

**Setup:**
1. Place a test order
2. Set delivery date to 1-2 days from today
3. Order status: 'pending' or 'confirmed'

**Steps:**
1. Navigate to `/orders` page
2. Find the test order

**Expected Results:**
- ❌ Cancel button should NOT be visible
- ⚠️ Warning message: "Delivery is only X day(s) away"

### Scenario 3: Invalid Cancellation (Shipped/Delivered Orders)

**Setup:**
1. Create order with status 'shipped' or 'delivered'

**Expected Results:**
- ❌ Cancel button should NOT be visible
- ⚠️ Warning message: "Order cannot be cancelled"

## 🎛️ Admin Dashboard Testing

### Viewing Cancelled Orders

1. Login to admin dashboard (`/admin`)
2. Navigate to Orders tab
3. Look for cancelled orders

**Expected Admin View:**
- 🔴 Orders highlighted with red border and background
- 🏷️ "CANCELLED & REFUNDED" badge
- 💰 Crossed-out total amount with "(REFUNDED)" label
- 📋 Detailed refund information section showing:
  - Refund ID
  - Refund amount
  - Refund status
  - Cancellation date
  - Cancellation reason

### Order Detail Modal

1. Click "View" on a cancelled order
2. Check the order details modal

**Expected Features:**
- 🔴 Special cancellation section with refund details
- 📝 Cancellation reason display
- ⚠️ Note about refund processing time
- ❌ Edit button should be disabled for cancelled orders

## 🔧 Technical Testing

### API Endpoints

Test the cancellation API directly:

```bash
POST /api/orders/{orderId}/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "refundDetails": {
    "refund_id": "rfnd_xxx",
    "amount": 1234.56,
    "status": "processed",
    "created_at": 1640995200,
    "speed_processed": "normal"
  }
}
```

### Date Logic Testing

Test the 3-day rule with different scenarios:

| Today's Date | Delivery Date | Days Difference | Can Cancel? |
|--------------|---------------|----------------|-------------|
| 2025-01-08   | 2025-01-11   | 3 days         | ✅ Yes      |
| 2025-01-08   | 2025-01-12   | 4 days         | ✅ Yes      |
| 2025-01-08   | 2025-01-10   | 2 days         | ❌ No       |
| 2025-01-08   | 2025-01-09   | 1 day          | ❌ No       |

## 💳 Razorpay Integration Testing

### Test Mode Setup

Ensure you're using test API keys:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=test_secret_xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Verifying Refunds

1. **Razorpay Dashboard:**
   - Login to Razorpay test dashboard
   - Navigate to Payments → Refunds
   - Verify refund appears with correct amount and status

2. **Database Verification:**
   - Check order document in MongoDB
   - Verify refundDetails object is populated
   - Confirm status is 'cancelled'

## 🚨 Error Scenarios

### Test Error Handling

1. **Invalid Order ID:**
   ```bash
   POST /api/orders/invalid_id/cancel
   ```
   Expected: 404 error

2. **Already Cancelled:**
   - Try to cancel an already cancelled order
   - Expected: 400 error with message

3. **Razorpay API Failure:**
   - Use invalid API keys
   - Expected: 500 error with refund failure message

## 📱 Mobile Testing

Test cancellation functionality on mobile devices:

1. **Responsive Design:**
   - Cancel button should be properly sized
   - Dialog should be mobile-friendly
   - Text should be readable

2. **Touch Interactions:**
   - Cancel button should be easily tappable
   - Dialog interactions should work smoothly

## ✅ Test Checklist

- [ ] Valid cancellation (3+ days) works
- [ ] Invalid cancellation (< 3 days) blocked
- [ ] Shipped/delivered orders cannot be cancelled
- [ ] Refund is processed via Razorpay
- [ ] Admin dashboard highlights cancelled orders
- [ ] Refund details are displayed correctly
- [ ] Error handling works for edge cases
- [ ] Mobile interface is functional
- [ ] Database is updated correctly
- [ ] Razorpay dashboard shows refunds

## 🔍 Debugging Tips

1. **Check Browser Console:**
   - Look for API call errors
   - Verify network requests

2. **Server Logs:**
   - Check for Razorpay API errors
   - Monitor database connection issues

3. **Database Queries:**
   ```javascript
   // Check order status
   db.orders.findOne({orderId: "ORDER_ID"})
   
   // Check refund details
   db.orders.findOne({orderId: "ORDER_ID"}).refundDetails
   ```

4. **Environment Variables:**
   - Verify all Razorpay keys are correctly set
   - Ensure test mode is enabled

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables
3. Check Razorpay dashboard for API status
4. Review server logs for detailed error messages