"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { ChevronLeft, Minus, Plus, Trash2, CreditCard, ShoppingBag, User } from "lucide-react"
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
import { ExtendedUser } from "@/lib/mongodb"

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

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount } = useProductStore()
  
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
  const [isFormValid, setIsFormValid] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

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
      alert("Invalid discount code")
    }
  }

  const handleCheckout = () => {
    if (!isFormValid) {
      alert("Please fill in all required fields")
      return
    }
    
    // TODO: Integrate with Razorpay
    console.log("Proceeding to payment with:", { userDetails, cartItems, total })
    alert("Razorpay integration will be added here")
  }

  if (cartItems.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-12 shadow-lg border border-gray-200">
            <ShoppingBag className="w-16 h-16 mx-auto text-amber-950 mb-4" />
            <h2 className="text-2xl font-bold text-amber-950 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to proceed to checkout</p>
            <Button onClick={() => router.push('/')} className="bg-amber-950 text-white hover:bg-amber-800 transition-all">
              Continue Shopping
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
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
                className="flex items-center gap-2 text-amber-950 hover:text-amber-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Shopping
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column - Customer Details and Cart Items */}
              <div className="lg:col-span-2 space-y-8">
                {/* Customer Details Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold text-amber-950">Contact Information</CardTitle>
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
                              <User className="w-8 h-8 text-amber-950" />
                            )}
                            <div className="text-right">
                              <p className="text-sm font-medium text-amber-950">{session.user.name}</p>
                              <p className="text-xs text-gray-600">Signed In</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {!session?.user && (
                        <p className="text-sm text-gray-600 mt-2">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-amber-950 hover:text-amber-800"
                            onClick={() => router.push('/auth/signin')}
                          >
                            Sign in
                          </Button> 
                          {" "}for faster checkout with saved addresses
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Saved Addresses Section for Authenticated Users */}
                      {session?.user && userProfile?.addresses && userProfile.addresses.length > 0 && (
                                                  <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-amber-950">Saved Addresses</h3>
                              <Badge className="bg-gray-100 text-gray-800">
                                {userProfile.addresses.length} saved
                              </Badge>
                            </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {userProfile.addresses.map((address) => (
                              <div
                                key={address.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedAddressId === address.id
                                    ? 'border-amber-950 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleAddressSelection(address.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={address.isDefault ? "default" : "secondary"} className="text-xs">
                                        {address.type}
                                      </Badge>
                                      {address.isDefault && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium">{address.firstName} {address.lastName}</p>
                                    <p className="text-xs text-gray-600">{address.address1}</p>
                                    <p className="text-xs text-gray-600">
                                      {address.city}, {address.state} {address.zipCode}
                                    </p>
                                  </div>
                                  {selectedAddressId === address.id && (
                                    <div className="w-5 h-5 bg-amber-950 rounded-full flex items-center justify-center">
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
                            placeholder="+1 (555) 123-4567"
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={userDetails.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            placeholder="New York"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Select value={userDetails.state} onValueChange={(value) => handleInputChange("state", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ny">New York</SelectItem>
                              <SelectItem value="ca">California</SelectItem>
                              <SelectItem value="tx">Texas</SelectItem>
                              <SelectItem value="fl">Florida</SelectItem>
                              <SelectItem value="wa">Washington</SelectItem>
                              <SelectItem value="or">Oregon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            value={userDetails.zipCode}
                            onChange={(e) => handleInputChange("zipCode", e.target.value)}
                            placeholder="10001"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select value={userDetails.country} onValueChange={(value) => handleInputChange("country", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="au">Australia</SelectItem>
                            <SelectItem value="de">Germany</SelectItem>
                            <SelectItem value="fr">France</SelectItem>
                          </SelectContent>
                        </Select>
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
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="text-2xl font-bold text-amber-950">Your Products</CardTitle>
                      <p className="text-sm text-gray-600 font-medium">{getCartItemsCount()} items in your cart</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {cartItems.map((item, index) => (
                          <motion.div
                            key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    Color: {item.selectedColor} • Size: {item.selectedSize}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* Quantity Controls */}
                                <div className="flex items-center border border-gray-200 rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                    className="h-8 w-8 rounded-l-lg"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="px-4 text-sm font-medium min-w-[3rem] text-center">
                                    {item.quantity.toString().padStart(2, '0')}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                    className="h-8 w-8 rounded-r-lg"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-sm text-gray-500">
                                      ${item.price.toFixed(2)} each
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
                          className="text-amber-950 border-amber-950 hover:text-white hover:bg-amber-950 transition-all"
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
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="text-2xl font-bold text-amber-950">Order Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                            className="px-6 bg-amber-950 text-white border-0 hover:bg-amber-800"
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
                          <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium">
                            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estimated Taxes</span>
                          <span className="font-medium">${taxes.toFixed(2)}</span>
                        </div>

                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Discount ({appliedDiscount}%)</span>
                            <span className="text-green-600 font-medium">-${discount.toFixed(2)}</span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Payment Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={handleCheckout}
                          disabled={!isFormValid}
                          className="w-full bg-amber-950 text-white hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed py-6 text-lg font-medium transition-all"
                        >
                          <CreditCard className="w-5 h-5 mr-2" />
                          {!isFormValid ? "Complete Details to Continue" : "Proceed to Payment"}
                        </Button>

                        {/* Alternative Payment Options */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            disabled={!isFormValid}
                            className="py-3 bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                          >
                            Shop Pay
                          </Button>
                          <Button
                            variant="outline"
                            disabled={!isFormValid}
                            className="py-3 bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                          >
                            PayPal
                          </Button>
                        </div>
                      </div>

                      {!isFormValid && (
                        <p className="text-sm text-red-600 text-center">
                          Please fill in all required fields to enable payment options
                        </p>
                      )}

                      <p className="text-xs text-gray-500 text-center">
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