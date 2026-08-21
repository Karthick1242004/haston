/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for API routes
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  
  // Add headers to prevent caching
  async headers() {
    return [
      // Baseline security headers on every response.
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Razorpay's checkout widget is injected as a script and an iframe,
            // so its origins have to be allowed explicitly. 'unsafe-inline' and
            // 'unsafe-eval' are required by the Next.js dev/runtime bundle.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://lh4.googleusercontent.com https://lh5.googleusercontent.com https://lh6.googleusercontent.com https://avatars.githubusercontent.com https://via.placeholder.com https://*.razorpay.com",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com",
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
      // Per-user and privileged endpoints must never be cached. Next's default
      // for these was `public, max-age=0, must-revalidate`, which let a browser
      // replay a stale cart on history navigation — deleting an item and
      // refreshing brought it back — and, worse, marked per-customer responses
      // `public` with no Vary on the cookie, so any shared cache in front of the
      // site could hand one customer's cart or orders to another.
      // /api/products, /api/hero-slides and /api/banner-messages are genuinely
      // public and keep their own caching rules below.
      ...['/api/user/:path*', '/api/orders/:path*', '/api/returns/:path*',
          '/api/coupons/:path*', '/api/admin/:path*', '/api/auth/:path*',
          '/api/razorpay/:path*'].map((source) => ({
        source,
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Vary', value: 'Cookie' },
        ],
      })),
      // `/api/orders` and `/api/returns` exactly, which the :path* patterns miss.
      ...['/api/orders', '/api/returns'].map((source) => ({
        source,
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Vary', value: 'Cookie' },
        ],
      })),
      {
        source: '/api/admin/banner-messages',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Hero slides caching - allow caching for public endpoint
      {
        source: '/api/hero-slides',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      // Admin hero slides - keep no-cache for admin functionality
      {
        source: '/api/admin/hero-slides',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
  
  // Optimized image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
