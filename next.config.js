/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Add rule for HTML files
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader'
    });
    
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        // Add rule for HTML files in Turbopack
        '*.html': ['ignore-loader']
      }
    }
  }
}

module.exports = nextConfig 