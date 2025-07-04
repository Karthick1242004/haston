"use client"

import { motion } from "framer-motion"
import { Search, User, ShoppingBag } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"

export default function Header() {
  const { cartCount } = useUIStore()

  const navItems = ["Shop", "Outfits", "About Us", "Customer Care"]

  return (
    <motion.header
      className="absolute top-0 left-0 right-0 z-50 bg-transparent"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between">
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item}
                href="#"
                className="text-gray-700 hover:text-gray-900 text-sm transition-colors duration-200 relative group font-medium"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full" />
              </motion.a>
            ))}
          </nav>

          <motion.div
            className="text-4xl font-light text-gray-800 tracking-normal  mr-20"
            style={{
              fontFamily: "var(--font-anton)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            HEX & HUE
          </motion.div>

          <div className="flex items-center space-x-4">
            <motion.button
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5 text-gray-700" />
            </motion.button>
            <motion.button
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-5 h-5 text-gray-700" />
            </motion.button>
            <motion.button
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
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
    </motion.header>
  )
}
