"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PageTransition from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Shield, Eye, Lock, Mail, Clock, Users, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PrivacyPolicyPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLDivElement>(null)
  
  const heroInView = useInView(heroRef, { once: true })
  const contentInView = useInView(contentRef, { once: true, margin: "-100px" })
  const sectionsInView = useInView(sectionsRef, { once: true, margin: "-100px" })

  const policyHighlights = [
    { title: "Data Protection", description: "Your personal information is secured with industry-standard encryption", icon: Shield },
    { title: "Transparency", description: "Clear and honest about what data we collect and how it's used", icon: Eye },
    { title: "Your Control", description: "You have full control over your personal data and can request deletion anytime", icon: Lock },
    { title: "No Spam", description: "We only send emails you've specifically requested", icon: Mail },
  ]

  const sections = [
    {
      title: "Information We Collect",
      content: [
        "Personal Information: When you create an account, make a purchase, or contact us, we may collect personal information such as your name, email address, phone number, shipping address, and payment information.",
        "Usage Data: We automatically collect information about how you interact with our website, including your IP address, browser type, pages visited, and time spent on our site.",
        "Cookies: We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze website traffic."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "Order Processing: To process and fulfill your orders, including payment processing, shipping, and customer service.",
        "Communication: To send you order confirmations, shipping updates, and respond to your inquiries.",
        "Marketing: With your consent, we may send you promotional emails about new products, special offers, and company updates.",
        "Website Improvement: To analyze website usage and improve our services, user experience, and website functionality."
      ]
    },
    {
      title: "Information Sharing",
      content: [
        "We do not sell, trade, or rent your personal information to third parties.",
        "Service Providers: We may share your information with trusted third-party service providers who help us operate our business, such as payment processors, shipping companies, and email service providers.",
        "Legal Requirements: We may disclose your information if required by law or to protect our rights, safety, or the rights and safety of others."
      ]
    },
    {
      title: "Data Security",
      content: [
        "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
        "Payment information is processed through secure, encrypted connections and we do not store complete credit card information on our servers.",
        "While we strive to protect your personal information, no method of transmission over the internet is 100% secure."
      ]
    },
    {
      title: "Your Rights",
      content: [
        "Access: You have the right to request access to the personal information we hold about you.",
        "Correction: You can request that we correct any inaccurate or incomplete personal information.",
        "Deletion: You can request that we delete your personal information, subject to certain legal obligations.",
        "Opt-out: You can unsubscribe from our marketing communications at any time by clicking the unsubscribe link in our emails."
      ]
    },
    {
      title: "Cookies Policy",
      content: [
        "Essential Cookies: These are necessary for the website to function properly and cannot be disabled.",
        "Analytics Cookies: These help us understand how visitors interact with our website by collecting and reporting information anonymously.",
        "Marketing Cookies: These track visitors across websites to display relevant and engaging advertisements.",
        "You can control cookie preferences through your browser settings, though this may affect website functionality."
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
                className="text-5xl md:text-7xl lg:text-8xl text-blue-950 leading-none tracking-tight mb-6 font-bold"
                style={{ fontFamily: "var(--font-nunito)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={heroInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                PRIVACY{" "}Policy
              </motion.h1>
              
              <motion.p
                className="text-lg text-center text-gray-600 mx-auto max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Your privacy is important to us. This policy explains how we collect, 
                use, and protect your personal information when you use our services.
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

        {/* Policy Highlights */}
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
                className="text-4xl md:text-6xl text-blue-950 leading-tight mb-6 font-bold"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                OUR{" "}Commitment
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We are committed to protecting your privacy and being transparent about our data practices.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial={{ opacity: 0, y: 50 }}
              animate={contentInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {policyHighlights.map((highlight, index) => {
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
                      className="text-xl font-bold  text-blue-950 mb-3"
                      // style={{ fontFamily: "var(--font-poppins)" }}
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

        {/* Policy Sections */}
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
                    className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 flex items-center gap-3"
                    // style={{ fontFamily: "var(--font-poppins)" }}
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

        {/* Contact Section */}
        {/* <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-purple-100/50" />
          <div className="relative w-full px-6 md:px-12">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={sectionsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <h2 
                className="text-4xl md:text-6xl text-blue-950 leading-tight mb-6 font-bold"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                QUESTIONS{" "}
                <span 
                  style={{ fontFamily: "var(--font-allura)" }}
                  className="text-5xl md:text-7xl text-blue-950"
                >
                  ?
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                If you have any questions about this Privacy Policy or how we handle your data, 
                please don't hesitate to contact us. We're here to help and ensure your privacy is protected.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-blue-950 text-white hover:bg-blue-800 transition-all duration-300 px-8 py-4 text-sm rounded-none"
                  onClick={() => router.push('/contact')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white transition-all duration-300 px-8 py-4 text-sm rounded-none"
                  onClick={() => router.push('/shop')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </motion.div>
          </div>
        </section> */}

        <Footer />
      </div>
    </PageTransition>
  )
} 