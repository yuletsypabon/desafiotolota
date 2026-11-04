import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // "standalone" genera un servidor Node autocontenido: ideal para Azure App Service / contenedores.
  // En Vercel se ignora sin problema.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  experimental: {
    // Logos en base64 pueden superar el límite por defecto de 1 MB en server actions/route handlers.
    serverActions: { bodySizeLimit: '5mb' },
  },
};

export default nextConfig;
