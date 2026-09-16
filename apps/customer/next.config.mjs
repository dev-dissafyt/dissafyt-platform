/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dissafyt/ui', '@dissafyt/database', '@dissafyt/api'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'customer.localhost:3000',
        'admin.localhost:3000',
        'pos.localhost:3000',
        'studio.localhost:3000',
        'dissafyt.com',
        '*.dissafyt.com',
      ],
    },
  },
};

export default nextConfig;
