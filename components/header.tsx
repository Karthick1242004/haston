"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, User, ShoppingBag, Menu, X, LogOut, Settings, Shield } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useProductStore } from "@/stores/product-store"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useIsAdmin } from '@/hooks/use-admin'

export default function Header() {
  const { cartCount } = useUIStore()
  const { setCartOpen } = useProductStore()
  const { data: session, status } = useSession()
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  const navItems = ["Shop","About Us", "Privacy Policy"]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    setIsUserDropdownOpen(false)
  }

  const handleProfile = () => {
    router.push('/profile')
    setIsUserDropdownOpen(false)
  }

  return (
    <>
      <motion.header
        className="absolute top-9 left-0 right-0 z-50 bg-white"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Desktop Navigation / Mobile Menu */}
            <div className="flex-1 flex justify-start">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item}
                    href={item === "Shop" ? "/shop" : item === "About Us" ? "/about" : item === "Privacy Policy" ? "/privacy-policy" : "#"}
                    className="text-gray-700 hover:text-gray-900 text-md transition-colors duration-200 relative group !font-light"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{
                      fontFamily: "var(--font-nunito)",
                    }}
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full" />
                  </motion.a>
                ))}
              </nav>

              {/* Mobile Menu Button */}
              <motion.button
                className="md:hidden p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                onClick={toggleMobileMenu}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </motion.button>
            </div>

            {/* Center Section - Logo */}
            <div className="flex justify-center">
              <motion.a
                href="/"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Image
                  src="/new-trans-logo.jpeg"
                  alt="HEX & HUE"
                  width={100}
                  height={100}
                  className="object-contain"
                  priority
                />
              </motion.a>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex-1 flex justify-end">
              <div className="flex items-center space-x-4">
                {/* <motion.button
                  className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="w-5 h-5 text-gray-700" />
                </motion.button> */}
                
                {/* User Authentication Button */}
                <div className="relative">
                  {session ? (
                    <>
                      <motion.button
                        className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 flex items-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      >
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            width={22}
                            height={22}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-700" />
                        )}
                      </motion.button>

                      {/* User Dropdown */}
                      <AnimatePresence>
                        {isUserDropdownOpen && (
                          <motion.div
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {session.user?.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {session.user?.email}
                              </p>
                            </div>
                            <button
                              onClick={handleProfile}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4 mr-3" />
                              Profile
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => router.push('/admin')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Shield className="w-4 h-4 mr-3" />
                                Admin Dashboard
                              </button>
                            )}
                            <button
                              onClick={handleSignOut}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Sign Out
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <motion.button
                      className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSignIn}
                    >
                      <User className="w-5 h-5 text-gray-700" />
                    </motion.button>
                  )}
                </div>
                <motion.button
                  className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingBag className="w-5 h-5 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
            />
            
            {/* Mobile Menu */}
            <motion.div
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 md:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="p-6">
                {/* Logo in Mobile Menu */}
                <div className="flex items-center justify-between mb-8">
                  <a
                    href="/"
                    className="text-2xl font-bold text-gray-800 tracking-normal hover:text-gray-600 transition-colors"
                    style={{
                      fontFamily: "var(--font-nunito)",
                    }}
                    onClick={toggleMobileMenu}
                  >
                    HEX & HUE
                  </a>
                  <button
                    onClick={toggleMobileMenu}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    aria-label="Close mobile menu"
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-4">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item}
                      href={item === "Shop" ? "/shop" : item === "About Us" ? "/about" : item === "Privacy Policy" ? "/privacy-policy" : "#"}
                      className="block text-gray-700 hover:text-gray-900 text-lg font-medium py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={toggleMobileMenu}
                    >
                      {item}
                    </motion.a>
                  ))}
                </nav>

                {/* Mobile Action Buttons */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="space-y-4">
                    <motion.button
                      className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Search className="w-5 h-5 text-gray-700" />
                      <span className="text-gray-700 font-medium">Search</span>
                    </motion.button>
                    {session ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {session.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt={session.user.name || 'User'}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-700" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {session.user?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {session.user?.email}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                          onClick={() => {
                            handleProfile()
                            toggleMobileMenu()
                          }}
                        >
                          <Settings className="w-5 h-5 text-gray-700" />
                          <span className="text-gray-700 font-medium">Profile</span>
                        </motion.button>
                        <motion.button
                          className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          onClick={() => {
                            handleSignOut()
                            toggleMobileMenu()
                          }}
                        >
                          <LogOut className="w-5 h-5 text-gray-700" />
                          <span className="text-gray-700 font-medium">Sign Out</span>
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        onClick={() => {
                          handleSignIn()
                          toggleMobileMenu()
                        }}
                      >
                        <User className="w-5 h-5 text-gray-700" />
                        <span className="text-gray-700 font-medium">Sign In</span>
                      </motion.button>
                    )}
                    <motion.button
                      className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      onClick={() => {
                        setCartOpen(true)
                        toggleMobileMenu()
                      }}
                    >
                      <ShoppingBag className="w-5 h-5 text-gray-700" />
                      <span className="text-gray-700 font-medium">
                        Cart {cartCount > 0 && `(${cartCount})`}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
