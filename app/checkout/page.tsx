"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Script from "next/script"
import { ChevronLeft, Minus, Plus, Trash2, CreditCard, ShoppingBag, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CountrySelect, StateSelect, CitySelect } from "react-country-state-city"
import "react-country-state-city/dist/react-country-state-city.css"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import { useProductStore } from "@/stores/product-store"
import { ExtendedUser } from "@/types/database"
import { useToast } from "@/hooks/use-toast"

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

interface LocationState {
  countryId: number
  stateId: number
  cityId: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, clearCart } = useProductStore()
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
  
  const [locationState, setLocationState] = useState<LocationState>({
    countryId: 0,
    stateId: 0,
    cityId: 0
  })
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [isFormValid, setIsFormValid] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle')

  const subtotal = getCartTotal()
  const shipping = subtotal > 200 ? 0 : 12.00
  const taxRate = 0.08 // 8% tax
  const taxes = subtotal * taxRate
  const discount = (subtotal * appliedDiscount) / 100
  const total = subtotal + shipping + taxes - discount

  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/')
    }
  }, [cartItems, router])

  // Fetch user profile if authenticated
  useEffect(() => {
    if (session?.user && !userProfile) {
      fetchUserProfile()
    }
  }, [session, userProfile])

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
          setUserDetails(prev => ({
            ...prev,
            address: defaultAddress.address1,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode,
            country: defaultAddress.country,
            phone: defaultAddress.phone || prev.phone,
          }))
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

  const handleInputChange = (field: keyof UserDetails, value: string) => {
    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCountryChange = (e: any) => {
    setLocationState(prev => ({
      ...prev,
      countryId: e.id,
      stateId: 0,
      cityId: 0
    }))
    setUserDetails(prev => ({
      ...prev,
      country: e.name,
      state: "",
      city: ""
    }))
  }

  const handleStateChange = (e: any) => {
    setLocationState(prev => ({
      ...prev,
      stateId: e.id,
      cityId: 0
    }))
    setUserDetails(prev => ({
      ...prev,
      state: e.name,
      city: ""
    }))
  }

  const handleCityChange = (e: any) => {
    setLocationState(prev => ({
      ...prev,
      cityId: e.id
    }))
    setUserDetails(prev => ({
      ...prev,
      city: e.name
    }))
  }

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId)
    const selectedAddress = userProfile?.addresses?.find(addr => addr.id === addressId)
    if (selectedAddress) {
      setUserDetails(prev => ({
        ...prev,
        address: selectedAddress.address1,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country,
        phone: selectedAddress.phone || prev.phone,
      }))
      
      // Note: For saved addresses, we don't set locationState IDs as they require lookup
      // The form will show the text values but won't populate the select components
      // This is a limitation when working with saved addresses vs dynamic selection
    }
  }

  const applyDiscountCode = () => {
    // Mock discount codes
    const discountCodes: { [key: string]: number } = {
      "SAVE10": 10,
      "WELCOME15": 15,
      "SUMMER20": 20
    }
    
    if (discountCodes[discountCode.toUpperCase()]) {
      setAppliedDiscount(discountCodes[discountCode.toUpperCase()])
    } else {
      setAppliedDiscount(0)
      toast({
        title: "Invalid Code",
        description: "The discount code you entered is not valid",
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
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            customer_name: `${userDetails.firstName} ${userDetails.lastName}`,
            customer_email: userDetails.email,
            items_count: getCartItemsCount(),
          },
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
        name: 'Haston E-commerce',
        description: 'Purchase from Haston Store',
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
              
              // Create order in database
              const orderData = {
                items: cartItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  image: item.image,
                  price: item.price,
                  quantity: item.quantity,
                  selectedSize: item.selectedSize,
                  selectedColor: item.selectedColor,
                  subtotal: item.price * item.quantity
                })),
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
                },
                paymentDetails: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: total,
                  currency: 'INR',
                  status: 'success' as const
                },
                orderSummary: {
                  subtotal,
                  shipping,
                  taxes,
                  discount,
                  discountCode: appliedDiscount > 0 ? discountCode : undefined,
                  total
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
                      {session?.user && userProfile?.addresses && userProfile.addresses.length > 0 && (
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

                      {/* Country, State, City Selection - Dynamic */}
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <div className="mt-1">
                          <CountrySelect
                            onChange={handleCountryChange}
                            placeHolder="Select Country"
                            containerClassName="!border !border-gray-200 !rounded-md"
                            inputClassName="!border-0 !outline-none !ring-0 !bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="state">State/Province *</Label>
                          <div className="mt-1">
                            <StateSelect
                              countryid={locationState.countryId}
                              onChange={handleStateChange}
                              placeHolder="Select State/Province"
                              containerClassName="!border !border-gray-200 !rounded-md"
                              inputClassName="!border-0 !outline-none !ring-0 !bg-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="city">City/District *</Label>
                          <div className="mt-1">
                            <CitySelect
                              countryid={locationState.countryId}
                              stateid={locationState.stateId}
                              onChange={handleCityChange}
                              placeHolder="Select City/District"
                              containerClassName="!border !border-gray-200 !rounded-md"
                              inputClassName="!border-0 !outline-none !ring-0 !bg-transparent"
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
                            {/* Product Image */}
                            <div className="flex-shrink-0">
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
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words line-clamp-2">{item.name}</h3>
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
                          <p className="text-sm text-green-600 mt-2">
                            {appliedDiscount}% discount applied!
                          </p>
                        )}
                      </div>

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