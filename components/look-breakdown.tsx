"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLookStore } from "@/stores/look-store"
import type { Look, CenterLook } from "@/types/look"

const looks: Look[] = [
  {
    id: 1,
    title: "White Casual Look",
    image: "/img1.png",
    items: [
      { name: "White Shirt", price: 120 },
      { name: "Knit Vest (White & Green)", price: 140 },
      { name: "Stone Beige Trousers", price: 180 },
      { name: "Slim Frame Sunglasses", price: 90 },
    ],
    totalPrice: 530,
    bundlePrice: 450,
  },
  {
    id: 2,
    title: "Gray-Brown Check Look",
    image: "/img2.png",
    items: [
      { name: "Gray-Brown Checked Blazer", price: 320 },
      { name: "Gray-Brown Checked Trousers", price: 190 },
      { name: "Turtleneck", price: 160 },
      
    ],
    totalPrice: 860,
    bundlePrice: 731,
  },
]

const centerLooks: CenterLook[] = [
  {
    id: 3,
    title: "Classic Elegance",
    image: "/img3.png",
    leftItems: [
      { name: "Beige Linen Blazer", price: 340 },
      { name: "Beige Linen Trousers", price: 210 },
      { name: "White Shirt", price: 120 },
      { name: "Blue Silk Tie", price: 80 },
      { name: "Blue Pocket Square", price: 40 },
      { name: "Silver Cufflinks with White Inlay", price: 75 },
    ],
    rightItems: [
      { name: "Long-Sleeve Polo", price: 110 },
      { name: "Gray Linen Trousers", price: 180 },
    ],
    leftTotal: 865,
    leftBundlePrice: 735,
    rightTotal: 290,
    rightBundlePrice: 246.5,
  },
  {
    id: 4,
    title: "Summer Casual",
    image: "https://i.pinimg.com/736x/7e/43/34/7e43342236d1dd193800325d0b99a991.jpg",
    leftItems: [
      { name: "White Linen Shirt", price: 150 },
      { name: "White Linen Shorts", price: 130 },
      { name: "Brown Leather Belt", price: 90 },
      { name: "Brown Sunglasses", price: 120 },
    ],
    rightItems: [
      { name: "Gray Button-Up Shirt", price: 140 },
      { name: "White Trousers", price: 180 },
      { name: "Brown Leather Belt", price: 90 },
      { name: "Beige Trench Coat", price: 420 },
    ],
    leftTotal: 490,
    leftBundlePrice: 416.5,
    rightTotal: 830,
    rightBundlePrice: 705,
  },
  
]

export default function LookBreakdown() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { addToCart } = useLookStore()

  const allSections = [
    { type: "side-by-side", data: looks },
    ...centerLooks.map((look) => ({ type: "center", data: look })),
  ]

  return (
    <section ref={ref} className="py-20 bg-[#F1EFEE]">
      <div className="w-full px-6 md:px-12">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center gap-8 mb-6">
            <h2 className="text-6xl md:text-8xl mt-4 font-medium tracking-tight text-amber-950" style={{ fontFamily: "var(--font-anton)" }}>
              THE{" "}
              <span style={{ fontFamily: "var(--font-allura)" }} className="text-7xl md:text-9xl text-amber-950 font-medium">
                Look
              </span>{" "}
              BREAKDOWN
            </h2>
            <p className="text-sm text-gray-600 max-w-md leading-relaxed">
              Effortless style, made simple. Shop the complete outfit with just one click—each piece carefully selected
              for a refined, timeless look. Find the details, see the quality, and build your wardrobe with confidence.
            </p>
          </div>
        </motion.div>

        <div className="space-y-8">
          {allSections.map((section, index) => {
            if (section.type === "side-by-side") {
              const [look1, look2] = section.data as Look[]
              return (
                <motion.div
                  key={index}
                  className=" overflow-hidden mb-8"
                  initial={{ opacity: 0, y: 100 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8 }}
                >
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left Outfit Block */}
                    <div className="grid md:grid-cols-2 gap-0 h-full">
                      {/* Image */}
                      <motion.div
                        className="relative aspect-[3/4] h-max overflow-hidden"
                        initial={{ opacity: 0, y: 50 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <Image
                          src={look1.image || "/placeholder.svg"}
                          alt={look1.title}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </motion.div>

                      {/* Details */}
                      <motion.div
                        className="p-6 flex flex-col h-full"
                        initial={{ opacity: 0, y: 50 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <div className="flex-1 mt-[-8%] overflow-y-auto max-h-80">
                          <div className="space-y-3 pr-2">
                            {look1.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="font-semibold mt-1 text-yellow-950 text-sm">{item.name}</p>
                                  <p className="font-semibold text-yellow-950 text-sm">${item.price}</p>
                                </div>
                                <Select>
                                  <SelectTrigger className="w-1/2 rounded-none h-8 border border-gray-400 bg-transparent text-gray-400 text-sm">
                                    <SelectValue placeholder="Select Size" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-40 overflow-y-auto">
                                    <SelectItem value="xs">XS</SelectItem>
                                    <SelectItem value="s">S</SelectItem>
                                    <SelectItem value="m">M</SelectItem>
                                    <SelectItem value="l">L</SelectItem>
                                    <SelectItem value="xl">XL</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto pt-11">
                          <div className="border-t border-gray-200 pt-4 ">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-bold text-yellow-950">Total Price:</p>
                              <p className="text-gray-400 line-through text-sm">${look1.totalPrice}</p>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-sm font-bold text-yellow-950">Bundle Price:</p>
                              <p className="text-sm font-bold text-yellow-950">${look1.bundlePrice}</p>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full rounded-none bg-transparent border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white py-1 text-sm font-medium transition-all duration-300"
                              onClick={() => addToCart(look1)}
                            >
                              Add Outfit to Cart
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Outfit Block */}
                    <div className="grid md:grid-cols-2 gap-0 h-full">
                      {/* Image */}
                      <motion.div
                        className="relative aspect-[3/4] h-max overflow-hidden"
                        initial={{ opacity: 0, y: 50 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        <Image
                          src={look2.image || "/placeholder.svg"}
                          alt={look2.title}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </motion.div>

                      {/* Details */}
                      <motion.div
                        className="p-6 flex flex-col h-full"
                        initial={{ opacity: 0, y: 50 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <div className="flex-1 mt-[-8%] overflow-y-auto max-h-80">
                          <div className="space-y-3 pr-2">
                            {look2.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="font-semibold mt-1 text-yellow-950 text-sm">{item.name}</p>
                                  <p className="font-semibold text-yellow-950 text-sm">${item.price}</p>
                                </div>
                                <Select>
                                  <SelectTrigger className="w-1/2 rounded-none h-8 border border-gray-400 bg-transparent text-gray-400 text-sm">
                                    <SelectValue placeholder="Select Size" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-40 overflow-y-auto">
                                    <SelectItem value="xs">XS</SelectItem>
                                    <SelectItem value="s">S</SelectItem>
                                    <SelectItem value="m">M</SelectItem>
                                    <SelectItem value="l">L</SelectItem>
                                    <SelectItem value="xl">XL</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto pt-11">
                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-bold text-yellow-950">Total Price:</p>
                              <p className="text-gray-400 line-through text-sm">${look1.totalPrice}</p>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-sm font-bold text-yellow-950">Bundle Price:</p>
                              <p className="text-sm font-bold text-yellow-950">${look1.bundlePrice}</p>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full rounded-none bg-transparent border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white py-1 text-sm font-medium transition-all duration-300"
                              onClick={() => addToCart(look1)}
                            >
                              Add Outfit to Cart
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            } else if (section.type === "center") {
              const look = section.data as CenterLook
              return (
                <motion.div
                  key={index}
                  className="bg-stone-100 overflow-hidden shadow-sm mb-8 border border-stone-200"
                  initial={{ opacity: 0, y: 100 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <div className="grid lg:grid-cols-3 gap-0">
                    {/* Left Items */}
                    <motion.div
                      className="p-6 flex flex-col h-full "
                      initial={{ opacity: 0, x: -50 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
                    >
                      <div className="flex-1 overflow-y-auto max-h-80">
                        <div className="space-y-3 pr-2">
                          {look.leftItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold mt-1 text-yellow-950 text-sm">{item.name}</p>
                                <p className="font-semibold text-yellow-950 text-sm">${item.price}</p>
                              </div>
                              <Select>
                                <SelectTrigger className="w-1/2 rounded-none h-8 border border-gray-400 bg-transparent text-gray-400 text-sm">
                                  <SelectValue placeholder="Select Size" />
                                </SelectTrigger>
                                <SelectContent className="max-h-40 overflow-y-auto">
                                  <SelectItem value="xs">XS</SelectItem>
                                  <SelectItem value="s">S</SelectItem>
                                  <SelectItem value="m">M</SelectItem>
                                  <SelectItem value="l">L</SelectItem>
                                  <SelectItem value="xl">XL</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-6">
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-lg font-bold text-gray-800">Total Look Price:</p>
                            <div className="text-right">
                              <p className="text-gray-400 line-through text-lg">${look.leftTotal}</p>
                              <p className="text-xl font-bold text-amber-950">${look.leftBundlePrice}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-4">Bundle Price (-15%)</p>
                          <Button 
                            variant="outline"
                             className="w-full rounded-none bg-transparent border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white py-1 text-sm font-medium transition-all duration-300"
                          >
                            Add Outfit to Cart
                          </Button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Center Image */}
                    <motion.div
                      className="relative aspect-[3/4] w-full overflow-hidden"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                    >
                      <Image
                        src={look.image || "/placeholder.svg"}
                        alt={look.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </motion.div>

                    {/* Right Items */}
                    <motion.div
                      className="p-6 flex flex-col h-full"
                      initial={{ opacity: 0, x: 50 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
                    >
                      <div className="flex-1 overflow-y-auto max-h-80">
                        <div className="space-y-3 pr-2">
                          {look.rightItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold mt-1 text-yellow-950 text-sm">{item.name}</p>
                                <p className="font-semibold text-yellow-950 text-sm">${item.price}</p>
                              </div>
                              <Select>
                                <SelectTrigger className="w-1/2 rounded-none h-8 border border-gray-400 bg-transparent text-gray-400 text-sm">
                                  <SelectValue placeholder="Select Size" />
                                </SelectTrigger>
                                <SelectContent className="max-h-40 overflow-y-auto">
                                  <SelectItem value="xs">XS</SelectItem>
                                  <SelectItem value="s">S</SelectItem>
                                  <SelectItem value="m">M</SelectItem>
                                  <SelectItem value="l">L</SelectItem>
                                  <SelectItem value="xl">XL</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-6">
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-lg font-bold text-gray-800">Total Look Price:</p>
                            <div className="text-right">
                              <p className="text-gray-400 line-through text-lg">${look.rightTotal}</p>
                              <p className="text-xl font-bold text-amber-950">${look.rightBundlePrice}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-4">Bundle Price (-15%)</p>
                          <Button 
                            variant="outline"
                             className="w-full rounded-none bg-transparent border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white py-1 text-sm font-medium transition-all duration-300"
                          >
                            Add Outfit to Cart
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            }
            return null
          })}
        </div>

        {/* Bottom Text */}
        <motion.div
          className="flex flex-row justify-between items-center mt-32 flex-wrap"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-md text-gray-600 max-w-3xl leading-relaxed mb-8">
            Our outfits are meticulously designed by fashion experts to save you time while ensuring a refined, cohesive
            look. Every piece is thoughtfully selected for its perfect balance of textures, materials, and seasonal
            adaptability—so you can step out with confidence, no matter the occasion.
          </p>
          <Button 
            variant="outline"
            className="border rounded-none font-semibold bg-transparent border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white px-10 py-4  transition-all duration-300 "
          >
            View All Outfits
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
