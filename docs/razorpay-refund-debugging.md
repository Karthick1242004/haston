# Razorpay Refund Debugging Guide

## 🚨 Issue: BAD_REQUEST_ERROR during refund

You're getting a `BAD_REQUEST_ERROR` when trying to process refunds. This guide will help you debug and fix the issue.

## 🔧 Step 1: Basic Razorpay Connection Test

First, test if your Razorpay API connection is working:

```bash
GET http://localhost:3000/api/debug/razorpay
```

This will return:
- ✅ API key configuration
- ✅ Connection status
- ✅ Test/Live mode detection
- ✅ Basic API connectivity

**Expected Response:**
```json
{
  "razorpay_connection": "testing...",
  "api_key_id": "rzp_test_xxxxx",
  "api_key_secret_exists": true,
  "test_mode": true,
  "api_connectivity": "success",
  "sample_payment_count": 10
}
```

## 🔍 Step 2: Check Specific Payment Details

Test a specific payment that failed to refund:

```bash
GET http://localhost:3000/api/debug/razorpay?payment_id=pay_xxxxx
```

This will show:
- 📋 Payment status and details
- ✅ Whether payment exists
- 📊 Payment amount and capture status

## 🧪 Step 3: Test Refund with Debug Endpoint

Test a small refund (₹1) to check if the refund mechanism works:

```bash
POST http://localhost:3000/api/debug/razorpay
Content-Type: application/json

{
  "payment_id": "pay_xxxxx",
  "test_refund": true
}
```

This will:
- 🔍 Check payment eligibility
- 💰 Attempt a ₹1 test refund
- 📝 Show detailed error messages if it fails

## 🚀 Step 4: Try Order Cancellation with Enhanced Logging

Now try cancelling an order and check the server logs. The enhanced cancellation endpoint will show:

1. **Payment Details Being Processed:**
```
Processing refund for order: ORD-xxx
Payment ID: pay_xxxxx
Order total: 1234.56
Payment status: success
```

2. **Payment Fetch from Razorpay:**
```
Fetching payment details from Razorpay...
Payment details from Razorpay: {
  id: "pay_xxxxx",
  status: "captured",
  amount: 123456,
  captured: true,
  method: "card"
}
```

3. **Refund Request Details:**
```
Refund request data: {
  amount: 123456,
  speed: "normal",
  notes: {...},
  receipt: "refund_xxx"
}
```

## 🔎 Common Issues & Solutions

### Issue 1: Payment Not Captured
**Error:** `Payment status is 'authorized', only captured payments can be refunded`

**Solution:** 
- Check Razorpay dashboard if payments are being auto-captured
- Enable auto-capture in Razorpay settings
- Or manually capture payments before allowing cancellations

### Issue 2: Invalid Payment ID
**Error:** `Payment not found or invalid`

**Solution:**
- Verify payment ID format (should start with `pay_`)
- Check if you're using test payment IDs with live API keys (or vice versa)
- Verify the payment exists in your Razorpay dashboard

### Issue 3: Test/Live Mode Mismatch
**Error:** `BAD_REQUEST_ERROR`

**Solution:**
- Ensure your API keys match the payment mode:
  - Test payments: Use `rzp_test_` keys
  - Live payments: Use `rzp_live_` keys
- Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your `.env`

### Issue 4: Payment Already Refunded
**Error:** `Payment has already been refunded`

**Solution:**
- Check Razorpay dashboard for existing refunds
- Modify code to check refund status before attempting new refund

### Issue 5: Insufficient Settlement Balance
**Error:** `Insufficient settlement balance`

**Solution:**
- Check your Razorpay account balance
- Ensure you have enough settled funds to process refunds

## 🛠️ Enhanced Error Handling

The updated cancellation endpoint now:

1. **✅ Validates payment ID format**
2. **🔍 Fetches payment details before refund attempt**
3. **📊 Checks payment eligibility (captured status)**
4. **💰 Validates payment amount**
5. **🎯 Provides specific error messages**
6. **🔄 Falls back to manual refund processing if auto-refund fails**

## 🔧 Temporary Workaround

If automatic refunds continue to fail, the system will:
- ✅ Still cancel the order
- 📝 Mark refund as "manual_processing_required"
- 💼 Show "Refund will be processed manually within 2-3 business days"
- 📋 Store error details for admin review

## 🧪 Testing Commands

**1. Test Razorpay Connection:**
```bash
curl http://localhost:3000/api/debug/razorpay
```

**2. Test Specific Payment:**
```bash
curl "http://localhost:3000/api/debug/razorpay?payment_id=pay_xxxxx"
```

**3. Test Small Refund:**
```bash
curl -X POST http://localhost:3000/api/debug/razorpay \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "pay_xxxxx", "test_refund": true}'
```

**4. Test Order Cancellation:**
```bash
curl -X POST http://localhost:3000/api/orders/ORDER_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"reason": "Test cancellation"}'
```

## 📋 Checklist for Debugging

- [ ] API keys are correctly set in `.env`
- [ ] Using correct test/live mode consistently
- [ ] Payment exists and is in `captured` status
- [ ] Payment ID format is correct (`pay_xxxxx`)
- [ ] Razorpay account has sufficient balance
- [ ] No existing refunds for the payment
- [ ] Payment amount matches order amount

## 🆘 Next Steps

1. **Run the debug endpoints** to identify the specific issue
2. **Check server logs** for detailed error messages
3. **Verify in Razorpay dashboard** that payments are captured
4. **Test with a small refund first** using the debug endpoint
5. **Contact Razorpay support** if issues persist with specific payment IDs

The enhanced error handling should now provide much clearer information about what's failing in the refund process!