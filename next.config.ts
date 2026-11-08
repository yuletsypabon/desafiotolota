import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // "standalone" genera un servidor Node autocontenido: ideal para Azure App Service / contenedores.
  // En Vercel se ignora sin problema.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};
// Nota: los route handlers (/api/*) no tienen límite de cuerpo propio en Next.js, pero Vercel corta
// cualquier petición a ~4.5 MB (ver README). La app no usa server actions, así que no hace falta
// configurar experimental.serverActions.bodySizeLimit.

export default nextConfig;
