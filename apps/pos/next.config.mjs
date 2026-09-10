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
};

export default nextConfig;
