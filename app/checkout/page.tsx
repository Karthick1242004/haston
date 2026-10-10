"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { ChevronLeft, Minus, Plus, Trash2, CreditCard, ShoppingBag, User, Loader2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import { useProductStore } from "@/stores/product-store"
import { ExtendedUser, Address } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { computeTotals } from "@/lib/pricing"
import { COUNTRIES, statesFor } from "@/lib/locations"
import { productHref } from "@/lib/cart"
import { CartItemSkeleton, SkeletonBox, SkeletonRegion } from "@/components/ui/skeletons"

interface UserDetails {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

/**
 * A saved address carries the whole shipping identity, not just the lines —
 * the recipient's name and phone belong to it too. Every field falls back to
 * whatever is already in the form, so an address missing a value cannot blank
 * something the customer has typed. Nothing here is locked: the inputs stay
 * editable after an address is applied.
 */
function fieldsFromAddress(address: Address, prev: UserDetails): UserDetails {
  return {
    ...prev,
    firstName: address.firstName || prev.firstName,
    lastName: address.lastName || prev.lastName,
    phone: address.phone || prev.phone,
    // address2 was being dropped on the floor; flat numbers live there.
    address: [address.address1, address.address2].filter(Boolean).join(', '),
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    country: address.country,
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { cartItems, cartHydrated, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, clearCart } = useProductStore()
  const { toast } = useToast()
  
  // Helper function to safely get color name
  const getColorName = (color: string | { name: string; value: string } | any): string => {
    if (typeof color === 'string') {
      return color
    }
    if (color && typeof color === 'object' && color.name) {
      return color.name
    }
    return 'Unknown'
  }
  
  const [userProfile, setUserProfile] = useState<ExtendedUser | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  })
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [availableCoupons, setAvailableCoupons] = useState<{code: string, discountPercentage: number}[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [isFormValid, setIsFormValid] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle')

  // Display only. The server re-prices the cart from the products collection and
  // charges its own figure; see lib/pricing.ts for the shared formula.
  const subtotal = getCartTotal()
  const { discount, shipping, taxes, total } = computeTotals(subtotal, appliedDiscount)

  // Wait until the cart has been reconciled with the server. Redirecting on the
  // store's initial empty state bounced anyone who refreshed or opened
  // /checkout directly straight back to the homepage, cart intact but unseen.
  useEffect(() => {
    if (cartHydrated && cartItems.length === 0) {
      router.push('/')
    }
  }, [cartHydrated, cartItems, router])

  // Fetch user profile if authenticated
  useEffect(() => {
    if (session?.user && !userProfile) {
      fetchUserProfile()
    }
  }, [session, userProfile])

  useEffect(() => {
    if (session?.user) {
      const fetchAvailableCoupons = async () => {
        try {
          const res = await fetch('/api/coupons/available')
          const data = await res.json()
          if (data.success) {
            setAvailableCoupons(data.coupons || [])
          }
        } catch (error) {
          console.error('Failed to fetch coupons:', error)
        } finally {
          setCouponsLoading(false)
        }
      }
      fetchAvailableCoupons()
    } else if (status !== 'loading') {
      // No session means no coupons to load; without this the skeleton would
      // never resolve for a signed-out shopper.
      setCouponsLoading(false)
    }
  }, [session, status])

  // Pre-fill form with session data
  useEffect(() => {
    if (session?.user && !userDetails.email) {
      setUserDetails(prev => ({
        ...prev,
        email: session.user?.email || '',
        firstName: userProfile?.firstName || '',
        lastName: userProfile?.lastName || '',
        phone: userProfile?.phone || '',
      }))
    }
  }, [session, userProfile, userDetails.email])

  const fetchUserProfile = async () => {
    if (!session?.user) return
    
    setIsLoadingProfile(true)
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        
        // Pre-fill form with user data
        setUserDetails(prev => ({
          ...prev,
          email: session.user?.email || '',
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
        }))

        // Set default address if available
        const defaultAddress = data.user.addresses?.find((addr: any) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setUserDetails(prev => fieldsFromAddress(defaultAddress, prev))
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => {
    const requiredFields = [
      userDetails.email,
      userDetails.firstName,
      userDetails.lastName,
      userDetails.phone,
      userDetails.address,
      userDetails.city,
      userDetails.state,
      userDetails.zipCode,
      userDetails.country
    ]
    
    const isValid = requiredFields.every(field => field.trim() !== "")
    setIsFormValid(isValid)
  }, [userDetails])

  // A stored address can carry a country or state we do not list. Surfacing it
  // as an extra option keeps the saved value visible and selected instead of
  // the field falling back to its placeholder.
  const countryOptions = useMemo(
    () =>
      userDetails.country && !COUNTRIES.includes(userDetails.country)
        ? [userDetails.country, ...COUNTRIES]
        : COUNTRIES,
    [userDetails.country]
  )

  const stateOptions = useMemo(() => {
    const known = statesFor(userDetails.country)
    if (known.length === 0) return known
    return userDetails.state && !known.includes(userDetails.state)
      ? [userDetails.state, ...known]
      : known
  }, [userDetails.country, userDetails.state])

  const handleInputChange = (field: keyof UserDetails, value: string) => {
    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCountryChange = (country: string) => {
    setUserDetails(prev => ({
      ...prev,
      country,
      // The old state belongs to the old country, so it cannot stand. City is
      // typed by hand and is just as likely to still be right, so it stays.
      state: statesFor(country).includes(prev.state) ? prev.state : "",
    }))
  }

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId)
    const selectedAddress = userProfile?.addresses?.find(addr => addr.id === addressId)
    if (selectedAddress) {
      setUserDetails(prev => fieldsFromAddress(selectedAddress, prev))
    }
  }

  const applyDiscountCode = async (codeToApply?: any) => {
    // If it's an event handler it passes an event. So strictly check if codeToApply is a string
    const code = typeof codeToApply === 'string' ? codeToApply : discountCode;
    
    if (!code) {
      toast({
        title: "Code Required",
        description: "Please enter a discount code to apply",
        variant: "destructive"
      })
      return
    }
    
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setAppliedDiscount(data.discountPercentage)
        setDiscountCode(data.code) // update exact formatting
        toast({
          title: "Discount Applied",
          description: `Successfully applied ${data.discountPercentage}% discount!`
        })
      } else {
        setAppliedDiscount(0)
        toast({
          title: "Invalid Code",
          description: data.error || "The discount code you entered is not valid",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Apply coupon error:', error)
      toast({
        title: "Error",
        description: "Failed to apply discount code",
        variant: "destructive"
      })
    }
  }

  const handleCheckout = async () => {
    if (!isFormValid) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive"
      })
      return
    }
    
    setIsProcessingPayment(true)
    setPaymentStatus('idle')

    try {
      // Create order with Razorpay
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No amount is sent: the server prices the cart itself.
        body: JSON.stringify({
          discountCode: appliedDiscount > 0 ? discountCode : undefined,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Hex & Hue',
        description: 'Purchase from Hex & Hue Store',
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              setPaymentStatus('success')

              // Items and totals are rebuilt server-side from the checkout
              // intent created above; only proof of payment and the delivery
              // address travel from the browser.
              const orderData = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress: {
                  firstName: userDetails.firstName,
                  lastName: userDetails.lastName,
                  email: userDetails.email,
                  phone: userDetails.phone,
                  address: userDetails.address,
                  city: userDetails.city,
                  state: userDetails.state,
                  zipCode: userDetails.zipCode,
                  country: userDetails.country
                }
              }

              // Save order to database
              const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
              })

              const orderResult = await orderResponse.json()

              if (orderResult.success) {
                // Clear cart and redirect to success page
                setTimeout(async () => {
                  await clearCart()
                  router.push(`/order-success?orderId=${orderResult.orderId}`)
              }, 2000)
              } else {
                console.error('Failed to save order:', orderResult.error)
                // Still clear cart and redirect but show warning
                setTimeout(async () => {
                  await clearCart()
                  router.push('/?payment=success&warning=order-save-failed')
                }, 2000)
              }
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            setPaymentStatus('failed')
          } finally {
            setIsProcessingPayment(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false)
            setPaymentStatus('idle')
          }
        },
        prefill: {
          name: `${userDetails.firstName} ${userDetails.lastName}`,
          email: userDetails.email,
          contact: userDetails.phone,
        },
        theme: {
          color: '#92400e', // blue-950
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error)
        setPaymentStatus('failed')
        setIsProcessingPayment(false)
      })

      rzp.open()
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive"
      })
      setIsProcessingPayment(false)
      setPaymentStatus('failed')
    }
  }

  // Same trap as the redirect above: until the cart has been reconciled with
  // the server, "empty" is not a fact. Showing this during the fetch told a
  // shopper their cart was gone moments before their items appeared.
  if (!cartHydrated) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] px-4 py-10">
          <SkeletonRegion label="Loading checkout" className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonBox className="h-8 w-56" />
              <SkeletonBox className="h-64 w-full rounded-lg" />
              <SkeletonBox className="h-48 w-full rounded-lg" />
            </div>
            <div className="space-y-4">
              <SkeletonBox className="h-8 w-40" />
              <CartItemSkeleton />
              <CartItemSkeleton />
              <SkeletonBox className="h-40 w-full rounded-lg" />
            </div>
          </SkeletonRegion>
        </div>
      </PageTransition>
    )
  }

  if (cartItems.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center px-4">
          <div className="text-center bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-gray-200 max-w-md w-full">
            <ShoppingBag className="w-16 h-16 mx-auto text-blue-950 mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-blue-950 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">Add some items to proceed to checkout</p>
            <Button onClick={() => router.push('/')} className="bg-blue-950 text-white hover:bg-blue-800 transition-all w-full sm:w-auto">
              Continue Shopping
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <style jsx global>{`
        .css-1hwfws3 {
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          min-height: 40px !important;
          font-size: 14px !important;
          background-color: white !important;
        }
        .css-1hwfws3:focus {
          outline: none !important;
          border-color: #92400e !important;
          box-shadow: 0 0 0 1px #92400e !important;
        }
        .css-1hwfws3 .react-select__control {
          border: none !important;
          box-shadow: none !important;
          min-height: 38px !important;
        }
        .css-1hwfws3 .react-select__value-container {
          padding: 0 !important;
        }
        .css-1hwfws3 .react-select__input-container {
          margin: 0 !important;
          padding: 0 !important;
        }
        .css-1hwfws3 .react-select__placeholder {
          color: #9ca3af !important;
          font-size: 14px !important;
        }
        .css-1hwfws3 .react-select__single-value {
          color: #111827 !important;
          font-size: 14px !important;
        }
        .css-1hwfws3 .react-select__menu {
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }
        .css-1hwfws3 .react-select__option:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        .css-1hwfws3 .react-select__option--is-selected {
          background-color: #92400e !important;
          color: white !important;
        }
      `}</style>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-[#F1EFEE]">
        {/* Header */}
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-950 hover:text-blue-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Shopping</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column - Customer Details and Cart Items */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Customer Details Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-blue-950">Contact Information</CardTitle>
                        {session?.user && (
                          <div className="flex items-center space-x-3">
                            {session.user.image ? (
                              <Image
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-8 h-8 text-blue-950" />
                            )}
                            <div className="text-right">
                              <p className="text-sm font-medium text-blue-950 truncate max-w-[120px]">{session.user.name}</p>
                              <p className="text-xs text-gray-600">Signed In</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {!session?.user && (
                        <p className="text-sm text-gray-600 mt-2">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-950 hover:text-blue-800"
                            onClick={() => router.push('/auth/signin')}
                          >
                            Sign in
                          </Button> 
                          {" "}for faster checkout with saved addresses
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6 px-4 sm:px-6">
                      {/* Saved Addresses Section for Authenticated Users */}
                      {session?.user && isLoadingProfile && (
                        <SkeletonRegion label="Loading saved addresses" className="space-y-3 mb-4">
                          <SkeletonBox className="h-4 w-36" />
                          <SkeletonBox className="h-20 w-full rounded-lg" />
                        </SkeletonRegion>
                      )}

                      {session?.user && !isLoadingProfile && userProfile?.addresses && userProfile.addresses.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-lg font-semibold text-blue-950">Saved Addresses</h3>
                            <Badge className="bg-gray-100 text-gray-800 w-fit">
                              {userProfile.addresses.length} saved
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {userProfile.addresses.map((address) => (
                              <div
                                key={address.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedAddressId === address.id
                                    ? 'border-blue-950 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleAddressSelection(address.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <Badge variant={address.isDefault ? "default" : "secondary"} className="text-xs">
                                        {address.type}
                                      </Badge>
                                      {address.isDefault && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium truncate">{address.firstName} {address.lastName}</p>
                                    <p className="text-xs text-gray-600 break-words">{address.address1}</p>
                                    <p className="text-xs text-gray-600 break-words">
                                      {address.city}, {address.state} {address.zipCode}
                                    </p>
                                  </div>
                                  {selectedAddressId === address.id && (
                                    <div className="w-5 h-5 bg-blue-950 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <Separator />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userDetails.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="john@example.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={userDetails.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={userDetails.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            placeholder="John"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={userDetails.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            placeholder="Doe"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                          id="address"
                          value={userDetails.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="123 Main Street, Apartment 4B"
                          className="mt-1"
                        />
                      </div>

                      {/* A saved address may hold a country or state spelled
                          differently from our list; keep its value selectable
                          so loading an address never silently blanks a field. */}
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <div className="mt-1">
                          <Select value={userDetails.country} onValueChange={handleCountryChange}>
                            <SelectTrigger id="country">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((name) => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="state">State/Province *</Label>
                          <div className="mt-1">
                            {stateOptions.length > 0 ? (
                              <Select
                                value={userDetails.state}
                                onValueChange={(state) => handleInputChange("state", state)}
                              >
                                <SelectTrigger id="state">
                                  <SelectValue placeholder="Select State/Province" />
                                </SelectTrigger>
                                <SelectContent>
                                  {stateOptions.map((name) => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              // No country chosen yet, or one we hold no states
                              // for. Typing it is better than a dead dropdown.
                              <Input
                                id="state"
                                value={userDetails.state}
                                onChange={(e) => handleInputChange("state", e.target.value)}
                                placeholder="Enter state/province"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="city">City/District *</Label>
                          <div className="mt-1">
                            <Input
                              id="city"
                              value={userDetails.city}
                              onChange={(e) => handleInputChange("city", e.target.value)}
                              placeholder="Enter city/district"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="zipCode">ZIP/PIN Code *</Label>
                        <Input
                          id="zipCode"
                          value={userDetails.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          placeholder="Enter ZIP/PIN code"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Cart Items */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white px-4 sm:px-6">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-blue-950">Your Products</CardTitle>
                      <p className="text-sm text-gray-600 font-medium">{getCartItemsCount()} items in your cart</p>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-4 sm:space-y-6">
                        {cartItems.map((item, index) => (
                          <motion.div
                            key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Product Image — links through to the product page */}
                            <Link
                              href={productHref(item.id)}
                              aria-label={`View ${item.name}`}
                              className="flex-shrink-0 touch-manipulation active:opacity-70 transition-opacity"
                            >
                              <div className="relative w-20 h-24 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={item.image || 'https://via.placeholder.com/150'}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                  quality={75}
                                />
                              </div>
                            </Link>

                            {/* Product Details */}
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  {/* Only the image and title navigate, so tapping
                                      the quantity controls never leaves checkout. */}
                                  <Link href={productHref(item.id)} className="touch-manipulation">
                                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words line-clamp-2 hover:text-blue-950 hover:underline underline-offset-2 active:opacity-70 transition-colors">
                                      {item.name}
                                    </h3>
                                  </Link>
                                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                                    Color: {getColorName(item.selectedColor)} • Size: {item.selectedSize}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => await removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                                  className="text-gray-400 hover:text-red-600 flex-shrink-0 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between gap-2 flex-wrap-reverse">
                                {/* Quantity Controls */}
                                <div className="flex items-center border border-gray-200 rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => await updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                    className="h-8 w-8 rounded-l-lg"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="px-2 sm:px-4 text-sm font-medium min-w-[2rem] sm:min-w-[3rem] text-center">
                                    {item.quantity.toString().padStart(2, '0')}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => await updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                    className="h-8 w-8 rounded-r-lg"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                  <p className="text-base sm:text-lg font-bold text-gray-900">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs sm:text-sm text-gray-500">
                                      ₹{item.price.toFixed(2)} each
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => router.push('/')}
                          className="text-blue-950 border-blue-950 hover:text-white hover:bg-blue-950 transition-all w-full sm:w-auto"
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="sticky top-24"
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white px-4 sm:px-6">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-blue-950">Order Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-4 sm:px-6">
                      {/* Discount Code */}
                      <div>
                        <Label htmlFor="discount">Discount Code</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="discount"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Enter code"
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={applyDiscountCode}
                            className="px-4 sm:px-6 bg-blue-950 text-white border-0 hover:bg-blue-800 flex-shrink-0"
                          >
                            Apply
                          </Button>
                        </div>
                        {appliedDiscount > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-green-600">
                              {appliedDiscount}% discount applied!
                            </p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setAppliedDiscount(0)
                                setDiscountCode("")
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Available Coupons */}
                      {!appliedDiscount && couponsLoading && (
                        <SkeletonRegion label="Loading available coupons" className="space-y-3 mt-4">
                          <SkeletonBox className="h-4 w-32" />
                          <SkeletonBox className="h-16 w-full rounded-lg" />
                        </SkeletonRegion>
                      )}

                      {!appliedDiscount && !couponsLoading && availableCoupons.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <p className="text-sm font-medium text-gray-700">Available Coupons</p>
                          {availableCoupons.map((coupon) => (
                            <div key={coupon.code} className="bg-green-50/50 border border-green-200/60 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors hover:bg-green-50">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-green-800">
                                  <Tag className="w-4 h-4 fill-green-800 text-green-800" />
                                  <span className="font-bold tracking-tight">{coupon.code}</span>
                                  <span className="text-sm font-medium">Save {(getCartTotal() * coupon.discountPercentage) / 100 > 0 ? `₹${((getCartTotal() * coupon.discountPercentage) / 100).toFixed(0)}` : `${coupon.discountPercentage}%`}</span>
                                </div>
                                <p className="text-xs text-gray-600">Congrats! '{coupon.code}' unlocked. Use at checkout to get {coupon.discountPercentage}% OFF</p>
                              </div>
                              <Button
                                variant="outline"
                                className="w-full sm:w-auto shrink-0 uppercase text-xs font-semibold tracking-wider text-green-900 border-green-300 bg-white hover:bg-green-100 hover:text-green-950 px-4 h-8"
                                onClick={() => applyDiscountCode(coupon.code)}
                                disabled={isProcessingPayment}
                              >
                                {coupon.code}
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Separator />

                      {/* Order Summary */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium">
                            {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estimated Taxes</span>
                          <span className="font-medium">₹{taxes.toFixed(2)}</span>
                        </div>

                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Discount ({appliedDiscount}%)</span>
                            <span className="text-green-600 font-medium">-₹{discount.toFixed(2)}</span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Payment Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={handleCheckout}
                          disabled={!isFormValid || isProcessingPayment}
                          className="w-full bg-blue-950 text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed py-4 sm:py-6 text-base sm:text-lg font-medium transition-all"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              <span className="hidden sm:inline">Processing Payment...</span>
                              <span className="sm:hidden">Processing...</span>
                            </>
                          ) : paymentStatus === 'success' ? (
                            <>
                              <CreditCard className="w-5 h-5 mr-2" />
                              <span className="hidden sm:inline">Payment Successful!</span>
                              <span className="sm:hidden">Success!</span>
                            </>
                          ) : paymentStatus === 'failed' ? (
                            <>
                              <CreditCard className="w-5 h-5 mr-2" />
                              <span className="hidden sm:inline">Payment Failed - Try Again</span>
                              <span className="sm:hidden">Try Again</span>
                            </>
                          ) : !isFormValid ? (
                            <>
                              <CreditCard className="w-5 h-5 mr-2" />
                              <span className="hidden sm:inline">Complete Details to Continue</span>
                              <span className="sm:hidden">Complete Details</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5 mr-2" />
                              <span className="hidden sm:inline">Proceed to Payment</span>
                              <span className="sm:hidden">Pay Now</span>
                            </>
                          )}
                        </Button>

                        {/* Alternative Payment Options */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            disabled={!isFormValid || isProcessingPayment}
                            className="py-3 bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-500 transition-all text-sm"
                          >
                            Shop Pay
                          </Button>
                          <Button
                            variant="outline"
                            disabled={!isFormValid || isProcessingPayment}
                            className="py-3 bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-500 transition-all text-sm"
                          >
                            PayPal
                          </Button>
                        </div>
                      </div>

                      {/* Status Messages */}
                      {paymentStatus === 'success' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-green-800 font-medium break-words">
                            🎉 Payment successful! Redirecting you shortly...
                          </p>
                        </div>
                      )}
                      
                      {paymentStatus === 'failed' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-red-800 font-medium break-words">
                            ❌ Payment failed. Please try again or contact support.
                          </p>
                        </div>
                      )}

                      {!isFormValid && !isProcessingPayment && (
                        <p className="text-sm text-red-600 text-center break-words">
                          Please fill in all required fields to enable payment options
                        </p>
                      )}

                      {isProcessingPayment && (
                        <p className="text-sm text-blue-600 text-center break-words">
                          🔐 Redirecting to secure payment gateway...
                        </p>
                      )}

                      <p className="text-xs text-gray-500 text-center break-words">
                        Your payment information is secure and encrypted
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 