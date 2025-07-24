"use client";
import React, { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {

  const lastLog = useRef<number>(0)
  const handleUpdate = (latest: { y: string | number }) => {
    const now = Date.now()
    if (now - lastLog.current > 500) {
      lastLog.current = now
    }
  }

  // Use animation controls for more reliable looping
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      y: ["0%", "-50%"],
      transition: {
        duration: props.duration || 10,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      },
    })
  }, [controls, props.duration])

  // Create testimonial cards
  const testimonialCards = props.testimonials.map(({ text, image, name, role }, i) => (
    <div 
      className="p-4 sm:p-8 rounded-2xl border border-gray-200 shadow-lg shadow-blue-950/5 max-w-xs w-full bg-white hover:shadow-xl transition-shadow duration-300 mb-6" 
      key={`card-${i}`}
    >
      <div className="text-gray-700 leading-relaxed text-sm mb-6">"{text}"</div>
      <div className="flex items-center flex-wrap gap-3">
        <img
          width={48}
          height={48}
          src={image}
          alt={name}
          className="h-12 w-12 rounded-full object-cover border-2 border-amber-100"
        />
        <div className="flex flex-col">
          <div 
            className="font-medium tracking-normal leading-5 text-blue-950 text-sm" 
            style={{ fontFamily: "var(--font-anton)" }}
          >
            {name}
          </div>
          <div className="leading-5 text-gray-600 tracking-tight text-xs">
            {role}
          </div>
        </div>
      </div>
    </div>
  ));

  return (
    <div className={`${props.className} overflow-hidden relative`}>
      <motion.div
        animate={controls}
        onUpdate={handleUpdate}
        className="flex flex-col"
        style={{ 
          willChange: "transform",
        }}
      >
        {/* First set of testimonials */}
        <div className="flex flex-col">
          {testimonialCards}
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="flex flex-col">
          {testimonialCards}
        </div>
      </motion.div>
    </div>
  );
};