/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Suprimir la advertencia de deprecación de punycode
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ]
    return config
  }
}

module.exports = nextConfig 