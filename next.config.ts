import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // "standalone" genera un servidor Node autocontenido: ideal para Azure App Service / contenedores.
  // En Vercel se ignora sin problema.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // El sistema se movió de /sistema a /cronometro: los enlaces y marcadores viejos siguen funcionando
  // La página de cada edición se ve como /desafio-2026 (la carpeta es app/desafio/[anio])
  async rewrites() {
    return [{ source: '/desafio-:anio(\\d{4})', destination: '/desafio/:anio' }];
  },
  async redirects() {
    return [
      { source: '/sistema', destination: '/cronometro', permanent: true },
      { source: '/sistema/:ruta*', destination: '/cronometro/:ruta*', permanent: true },
    ];
  },
};
// Nota: los route handlers (/api/*) no tienen límite de cuerpo propio en Next.js, pero Vercel corta
// cualquier petición a ~4.5 MB (ver README). La app no usa server actions, así que no hace falta
// configurar experimental.serverActions.bodySizeLimit.

export default nextConfig;
