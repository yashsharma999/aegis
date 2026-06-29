/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep heavy server-only libs out of the bundle: PDF.js (unpdf) + the Mastra
  // runtime (now run in-process via app/api/agent/* — see docs/deployment.md).
  serverExternalPackages: ['unpdf', '@mastra/core', '@mastra/memory', '@mastra/pg'],
  experimental: {
    // PDF uploads exceed the default 1 MB Server Action body limit.
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default nextConfig
