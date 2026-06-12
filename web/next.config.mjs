/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['react-three-fiber', 'framer-motion'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
export default nextConfig;
