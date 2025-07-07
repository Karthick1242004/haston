"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Product } from "@/types/product"

const PRODUCT_IMAGE_URL = "https://i.pinimg.com/736x/7e/43/34/7e43342236d1dd193800325d0b99a991.jpg"

const products: Product[] = [
  { 
    id: 1, 
    name: "Nike ACG \"Wolf Tree\" Polartec", 
    price: 250.00, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Portage", "Forest Green", "Black", "Pink"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    description: "Celebrate the power and simplicity of the Swoosh. This warm, brushed fleece hoodie is made with some extra room through the shoulder.",
    rating: 5.0,
    stock: 50,
    category: "Outerwear"
  },
  { 
    id: 2, 
    name: "Light Knit Vest", 
    price: 120, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Blue", "Gray", "Black"],
    sizes: ["S", "M", "L", "XL"],
    description: "Lightweight vest perfect for layering.",
    rating: 4.5,
    stock: 30,
    category: "Tops"
  },
  { 
    id: 3, 
    name: "Dark Green Polo", 
    price: 110, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Green", "Navy", "White"],
    sizes: ["S", "M", "L", "XL"],
    description: "Classic polo shirt in premium cotton.",
    rating: 4.3,
    stock: 25,
    category: "Tops"
  },
  { 
    id: 4, 
    name: "White Linen Shorts", 
    price: 135, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["White", "Beige", "Light Blue"],
    sizes: ["28", "30", "32", "34", "36"],
    description: "Comfortable linen shorts for summer.",
    rating: 4.7,
    stock: 40,
    category: "Bottoms"
  },
  { 
    id: 5, 
    name: "Beige Blazer", 
    price: 320, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Beige", "Navy", "Charcoal"],
    sizes: ["S", "M", "L", "XL"],
    description: "Sophisticated blazer for formal occasions.",
    rating: 4.8,
    stock: 15,
    category: "Outerwear"
  },
  { 
    id: 6, 
    name: "Light Gray Suit", 
    price: 450, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Light Gray", "Charcoal", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    description: "Premium suit for professional wear.",
    rating: 4.9,
    stock: 12,
    category: "Suits"
  },
  { 
    id: 7, 
    name: "Casual Trousers", 
    price: 180, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Khaki", "Navy", "Black"],
    sizes: ["28", "30", "32", "34", "36"],
    description: "Versatile trousers for everyday wear.",
    rating: 4.4,
    stock: 35,
    category: "Bottoms"
  },
  { 
    id: 8, 
    name: "Cream Suit", 
    price: 420, 
    image: PRODUCT_IMAGE_URL,
    images: [PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL, PRODUCT_IMAGE_URL],
    colors: ["Cream", "Ivory", "Light Beige"],
    sizes: ["S", "M", "L", "XL"],
    description: "Elegant suit perfect for special occasions.",
    rating: 4.6,
    stock: 18,
    category: "Suits"
  },
]

export default function PopularProducts() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()

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
