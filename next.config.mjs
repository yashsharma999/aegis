/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep heavy server-only libs out of the bundle: PDF.js (unpdf) + Mastra runtime.
  serverExternalPackages: ['unpdf', '@mastra/core'],
  experimental: {
    // PDF uploads exceed the default 1 MB Server Action body limit.
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default nextConfig
