/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for API routes
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  
  // Add headers to prevent caching
  async headers() {
    return [
      {
        source: '/api/banner-messages',
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
    ]
  },
  
  // Ensure images are optimized
  images: {
    domains: ['res.cloudinary.com'],
    unoptimized: true,
  },
}

export default nextConfig
