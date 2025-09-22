import { TestimonialsColumn } from "./testimonials-column";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const testimonials = [
  {
    text: "Absolutely love the quality of the clothing! The fabric feels premium and the fit is perfect. Haston has become my go-to for stylish, comfortable pieces.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Sarah Johnson",
    role: "Fashion Blogger",
  },
  {
    text: "The customer service is exceptional. They helped me find the perfect size and the delivery was super fast. My Nike hoodie is exactly what I wanted!",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Marcus Chen",
    role: "Regular Customer",
  },
  {
    text: "I've ordered multiple times and every piece exceeds my expectations. The attention to detail and style curation is amazing. Highly recommend!",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Emily Rodriguez",
    role: "Stylist",
  },
  {
    text: "The shopping experience is seamless from browsing to checkout. Love how easy it is to find exactly what I'm looking for. Great selection!",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David Thompson",
    role: "Business Owner",
  },
  {
    text: "Quality clothing at reasonable prices. The materials are top-notch and the designs are always on-trend. Haston never disappoints!",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Jessica Lee",
    role: "Designer",
  },
  {
    text: "Fast shipping and excellent packaging. Every order arrives perfectly and the clothes look even better in person than online.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Amanda Wilson",
    role: "Content Creator",
  },
  {
    text: "The size guide is accurate and helpful. I've never had an issue with fit, and the return policy gives me confidence to try new styles.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Michael Park",
    role: "Fitness Trainer",
  },
  {
    text: "Discovered some amazing pieces that have become wardrobe staples. The quality-to-price ratio is unbeatable. Will definitely shop again!",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Rachel Davis",
    role: "Marketing Manager",
  },
  {
    text: "The website is user-friendly and the product photos are accurate. What you see is what you get. Great shopping experience overall!",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Alex Kumar",
    role: "Software Developer",
  },
];


const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);


const Testimonials = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-[#F1EFEE] py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16"
        >
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="border border-blue-950/20 py-2 px-6 rounded-full bg-white/50 backdrop-blur-sm">
              <span 
                className="text-blue-950 font-bold text-sm"
              >
                Testimonials
              </span>
            </div>
          </motion.div>

          <motion.h2 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-normal text-center text-blue-950 mb-6 leading-none"
            style={{ fontFamily: "var(--font-poppins)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            What Our Customers Say
          </motion.h2>
          
          <motion.p 
            className="text-center text-gray-600 text-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover why thousands of customers love shopping with us
          </motion.p>
        </motion.div>

        <motion.div 
          className="flex justify-center gap-1 sm:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <TestimonialsColumn 
            key="column-1"
            testimonials={firstColumn} 
            duration={15} 
          />
          <TestimonialsColumn 
            key="column-2"
            testimonials={secondColumn} 
            className="block" 
            duration={19} 
          />
          <TestimonialsColumn 
            key="column-3"
            testimonials={thirdColumn} 
            className="hidden lg:block" 
            duration={17} 
          />
        </motion.div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/10 via-transparent to-orange-200/10" />
    </section>
  );
};

export default Testimonials;