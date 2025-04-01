/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración para exportación estática
  output: 'export',
  
  // Deshabilitar imagen optimizada para exportación estática
  images: {
    unoptimized: true,
  },
  
  // Desactivar verificación de tipos (para compilación en producción solamente)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Suprimir advertencias
  webpack: (config, { isServer }) => {
    // Suprimir la advertencia de deprecación de punycode
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ]
    return config
  }
}

module.exports = nextConfig 