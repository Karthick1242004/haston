"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PageTransition from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Shield, UserCheck, CreditCard, Truck, Scale, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TermsPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLDivElement>(null)
  
  const heroInView = useInView(heroRef, { once: true })
  const contentInView = useInView(contentRef, { once: true, margin: "-100px" })
  const sectionsInView = useInView(sectionsRef, { once: true, margin: "-100px" })

  const termsHighlights = [
    { title: "Fair Terms", description: "Clear and reasonable terms that protect both you and us", icon: Scale },
    { title: "User Rights", description: "Your rights as a customer are clearly defined and protected", icon: UserCheck },
    { title: "Secure Payments", description: "Safe and secure payment processing with buyer protection", icon: CreditCard },
    { title: "Clear Policies", description: "Transparent shipping, return, and refund policies", icon: Truck },
  ]

  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These terms constitute a legally binding agreement between you and our company.",
        "Your continued use of the website signifies your acceptance of any changes to these terms."
      ]
    },
    {
      title: "Eligibility and Account Registration",
      content: [
        "You must be at least 18 years old or have parental consent to use our services.",
        "You are responsible for maintaining the confidentiality of your account information.",
        "You must provide accurate, current, and complete information during registration.",
        "You are responsible for all activities that occur under your account.",
        "We reserve the right to suspend or terminate accounts that violate these terms."
      ]
    },
    {
      title: "Orders and Payments",
      content: [
        "All orders are subject to acceptance and product availability.",
        "Prices are subject to change without notice but confirmed orders will honor the original price.",
        "Payment must be received before order processing and shipping.",
        "We accept major credit cards, debit cards, and other specified payment methods.",
        "Any additional fees (taxes, shipping) will be clearly displayed before checkout."
      ]
    },
    {
      title: "Shipping and Delivery",
      content: [
        "Shipping costs and delivery times vary based on location and shipping method selected.",
        "Risk of loss and title for products pass to you upon delivery to the carrier.",
        "Delivery times are estimates and not guaranteed; delays may occur due to circumstances beyond our control.",
        "You must inspect packages upon delivery and report any damage or missing items within 48 hours."
      ]
    },
    {
      title: "Returns and Refunds",
      content: [
        "Items may be returned within 30 days of purchase in original condition with tags attached.",
        "Custom or personalized items are generally not eligible for return unless defective.",
        "Return shipping costs are the responsibility of the customer unless the item was defective.",
        "Refunds will be processed to the original payment method within 5-10 business days.",
        "Sale items may have different return policies as specified at the time of purchase."
      ]
    },
    {
      title: "Intellectual Property Rights",
      content: [
        "All content on this website is protected by copyright, trademark, and other intellectual property laws.",
        "You may not reproduce, distribute, or create derivative works without express written permission.",
        "Product images, descriptions, and designs are proprietary and protected.",
        "Any unauthorized use of our intellectual property may result in legal action."
      ]
    },
    {
      title: "User Conduct and Prohibited Activities",
      content: [
        "You agree not to use the website for any unlawful or prohibited activities.",
        "You may not interfere with or disrupt the website or servers connected to the website.",
        "You may not attempt to gain unauthorized access to any portion of the website.",
        "Harassment, abuse, or inappropriate behavior towards staff or other users is prohibited.",
        "Reviews and comments must be honest, relevant, and respectful."
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        "Our liability is limited to the maximum extent permitted by law.",
        "We are not liable for any indirect, incidental, special, or consequential damages.",
        "Our total liability for any claim shall not exceed the amount paid for the specific product or service.",
        "We do not warrant that the website will be uninterrupted, error-free, or completely secure.",
        "Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you."
      ]
    },
    {
      title: "Privacy and Data Protection",
      content: [
        "Your privacy is important to us and is governed by our Privacy Policy.",
        "By using our services, you consent to the collection and use of information as outlined in our Privacy Policy.",
        "We implement reasonable security measures to protect your personal information.",
        "You have the right to access, correct, or delete your personal information."
      ]
    },
    {
      title: "Modifications to Terms",
      content: [
        "We reserve the right to modify these terms at any time without prior notice.",
        "Changes will be effective immediately upon posting on the website.",
        "Your continued use of the website after changes constitutes acceptance of the new terms.",
        "It is your responsibility to review these terms periodically for changes.",
        "Material changes may be communicated through email or prominent website notices."
      ]
    }
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        <Header />
        
        {/* Hero Section */}
        <section ref={heroRef} className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 via-transparent to-purple-200/30" />
          </div>
          
          <div className="relative w-full px-6 md:px-12">
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-950 hover:text-blue-800 mb-8"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              
              <motion.h1
                className="text-5xl md:text-7xl lg:text-8xl text-blue-950 leading-none tracking-tight mb-6 font-light"
                style={{ fontFamily: "var(--font-anton)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={heroInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                TERMS{" "}
                <span 
                  style={{ fontFamily: "var(--font-allura)" }} 
                  className="text-6xl md:text-8xl lg:text-9xl text-blue-950"
                >
                  & Conditions
                </span>
              </motion.h1>
              
              <motion.p
                className="text-lg text-center text-gray-600 mx-auto max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Please read these terms and conditions carefully before using our services. 
                These terms govern your use of our website and services.
              </motion.p>
              
              <motion.div
                className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last updated: December 2024
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Terms Highlights */}
        <section ref={contentRef} className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-purple-100/50" />
          <div className="relative w-full px-6 md:px-12">
            <motion.div
              className="mb-16 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={contentInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 
                className="text-4xl md:text-6xl text-blue-950 leading-tight mb-6"
                style={{ fontFamily: "var(--font-anton)" }}
              >
                OUR{" "}
                <span 
                  style={{ fontFamily: "var(--font-allura)" }}
                  className="text-5xl md:text-7xl text-blue-950"
                >
                  Promise
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We believe in fair and transparent terms that protect both our customers and our business.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial={{ opacity: 0, y: 50 }}
              animate={contentInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {termsHighlights.map((highlight, index) => {
                const IconComponent = highlight.icon
                return (
                  <motion.div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={contentInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-950 text-white rounded-full mb-4">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 
                      className="text-xl font-bold text-blue-950 mb-3"
                    >
                      {highlight.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {highlight.description}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* Terms Sections */}
        <section ref={sectionsRef} className="py-20">
          <div className="w-full px-6 md:px-12">
            <div className="max-w-4xl mx-auto">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  className="mb-12 bg-white p-8 rounded-xl shadow-lg border border-gray-100"
                  initial={{ opacity: 0, y: 50 }}
                  animate={sectionsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <h3 
                    className="text-2xl md:text-3xl font-thin text-blue-950 mb-6 flex items-center gap-3"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    <div className="w-8 h-8 bg-blue-950 text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-gray-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
    </div>
    </PageTransition>
  )
}
