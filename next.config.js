/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@azure/cosmos', 'bcryptjs'],
  },
}

module.exports = nextConfig
