"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Product } from "@/types/product"

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()

  // fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=8')
        const json = await res.json()
        setProducts(json.products || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchProducts()
  }, [])

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`)
  }

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl md:text-8xl font-sans text-orange-950 tracking-tight" style={{ fontFamily: "var(--font-anton)" }}>
            Popular Products
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="group cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => handleProductClick(product.id)}
            >
              <motion.div
                className="relative aspect-[3/4] overflow-hidden mb-4 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </motion.div>

              <div className="flex flex-row justify-between items-center">
                <h3 className="font-bold text-gray-800 text-xs mb-1">{product.name}</h3>
                <p className="text-lg font-semibold text-amber-900">${product.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
