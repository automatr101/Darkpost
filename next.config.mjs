/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['isomorphic-dompurify'],
  },
};

export default nextConfig;
