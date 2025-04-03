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
  }
}

module.exports = nextConfig 