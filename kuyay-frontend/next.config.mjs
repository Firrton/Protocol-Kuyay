/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Required for Netlify static export
  },
  // Required for Netlify
  output: 'standalone',
}

export default nextConfig;

