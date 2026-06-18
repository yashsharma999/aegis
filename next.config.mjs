/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // PDF.js (via unpdf) is a large native-ish lib — keep it out of the bundle.
  serverExternalPackages: ['unpdf'],
  experimental: {
    // PDF uploads exceed the default 1 MB Server Action body limit.
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default nextConfig
