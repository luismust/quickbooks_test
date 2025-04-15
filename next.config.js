/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ajustar según el tipo de despliegue
  // Para Vercel: comentar la línea output
  // Para exportación estática: descomentar la línea output
  // output: 'export',
  
  // Agregar trailing slash para mejorar compatibilidad
  trailingSlash: true,
  
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