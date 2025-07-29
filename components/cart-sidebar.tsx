"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { X, Minus, Plus, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useProductStore } from "@/stores/product-store"

export default function CartSidebar() {
  const router = useRouter()
  const { 
    cartItems, 
    isCartOpen, 
    setCartOpen, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal,
    getCartItemsCount,
    isLoading,
    error 
  } = useProductStore()

  const total = getCartTotal()
  const itemCount = getCartItemsCount()

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

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-lg bg-white p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold text-gray-900">
                Your Bag ({itemCount})
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
              <p className="text-sm text-blue-600">Syncing cart...</p>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="popLayout">
              {cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-500 text-lg">Your bag is empty</p>
                  <p className="text-gray-400 text-sm mt-2">Add some items to get started</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex gap-4 bg-white"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={item.image || '/placeholder.jpg'}
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
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                            {item.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => await removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                            className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-lg font-bold text-gray-900">
                          ₹{item.price.toFixed(2)}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Size: {item.selectedSize}</span>
                          <span>•</span>
                          <span>Color: {getColorName(item.selectedColor)}</span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center border border-gray-200 rounded-full">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => await updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                              className="h-8 w-8 rounded-full hover:bg-gray-100"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-4 text-sm font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => await updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                              className="h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-gray-100 bg-white p-6 space-y-4"
            >
              {/* Order Note */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto font-normal"
                >
                  Add order note
                </Button>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              
              <p className="text-sm text-gray-500">
                Tax included. Shipping calculated at checkout
              </p>

              {/* Checkout Button */}
              <Button 
                className="w-full bg-black text-white hover:bg-gray-900 rounded-none py-6 text-lg font-medium"
                onClick={() => {
                  setCartOpen(false)
                  router.push("/checkout")
                }}
              >
                Checkout
              </Button>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 