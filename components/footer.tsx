"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Facebook, Instagram, MapPin, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


export default function Footer() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [email, setEmail] = useState("")
  const [focused, setFocused] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail("")
  }

  return (
    <motion.footer
      ref={ref}
      className="bg-gray-100 py-16"
      initial={{ opacity: 0, y: 100 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Use next/image for optimized images in Next.js */}
            {/* If not using Next.js, replace with <img ... /> */}
            {/* If using Next.js, make sure to import: import Image from "next/image" */}
            <img
              src="/logomain.png"
              alt="HEX & HUE"
              width={100}
              height={100}
              className="object-contain"
              loading="eager"
            />
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4" />
                <span>hexhueclothing@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4" />
                <span>+91 70604 77331</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-1" />
                <div>
                  <p>1247 Fashion District, Noida</p>
                  <p>201301, India</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-xl font-light font-sans tracking-wide text-blue-950 mb-6" style={{ fontFamily: "var(--font-anton)" }}>COMPANY</h4>
            <ul className="space-y-3 text-xs text-gray-600">
              <li>
                <a href="/about" className="hover:text-blue-950 transition-colors duration-200">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-950 transition-colors duration-200">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="/orders" className="hover:text-blue-950 transition-colors duration-200">
                  Shipping Information
                </a>
              </li>
              <li>
                <a href="/size-guide" className="hover:text-blue-950 transition-colors duration-200">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:text-blue-950 transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:text-blue-950 transition-colors duration-200">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Shop */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-xl font-thin font-sans tracking-wide text-blue-950 mb-6" style={{ fontFamily: "var(--font-anton)" }}>SHOP</h4>
            <ul className="space-y-3 text-xs text-gray-600">
              <li>
                <a href="#" className="hover:text-blue-950 transition-colors duration-200">
                  Summer Collection 2025
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-950 transition-colors duration-200">
                  Outfits
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-950 transition-colors duration-200">
                  Essentials
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-950 transition-colors duration-200">
                  Best Sellers
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h4 className="text-xl font-thin font-sans tracking-wide text-blue-950 mb-6" style={{ fontFamily: "var(--font-anton)" }}>STAY CONNECTED</h4>
            <p className="text-gray-600 mb-6 text-sm">
              Subscribe to Our Newsletter for the Latest Updates, Offers, and Exclusive Releases
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <motion.div
                animate={{
                  boxShadow: focused ? "0 0 0 2px rgba(146, 64, 14, 0.2)" : "0 0 0 0px transparent",
                }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  type="email"
                  placeholder="E-mail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full rounded-none"
                  required
                />
              </motion.div>
              <Button
                type="submit"
                className="w-full bg-blue-950 rounded-none hover:bg-blue-950 text-white transition-colors duration-200"
              >
                Subscribe
              </Button>
            </form>

            <div className="flex space-x-4 mt-8">
              {[Facebook, Instagram, MapPin].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  className="p-2 bg-blue-950 text-white rounded-full hover:bg-blue-950 transition-colors duration-200"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  )
}
