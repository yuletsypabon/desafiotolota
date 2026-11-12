import type { NextConfig } from 'next';

const desarrollo = process.env.NODE_ENV !== 'production';

/**
 * Política de contenido (CSP): el navegador solo carga scripts, estilos, imágenes y fuentes del propio sitio (más
 * imágenes data:/blob: de los logos). Bloquea scripts inyectados desde otros dominios, que el sitio se muestre dentro
 * de otra página (clickjacking) y formularios que envíen a otro lado. 'unsafe-inline' hace falta para el arranque de
 * Next.js y los estilos de MUI; en desarrollo se permite además eval y el websocket de recarga en caliente.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${desarrollo ? ' ws: wss:' : ''}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const cabecerasSeguridad = [
  { key: 'Content-Security-Policy', value: csp },
  // HTTPS obligatorio por 2 años en el sitio publicado (los navegadores lo ignoran en http://, p. ej. el portátil del evento)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  // "standalone" genera un servidor Node autocontenido: ideal para Azure App Service / contenedores.
  // En Vercel se ignora sin problema.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // No anunciar la tecnología del servidor
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:ruta*', headers: cabecerasSeguridad }];
  },
  // La página de cada edición se ve como /desafio-2026 (la carpeta es app/desafio/[anio])
  async rewrites() {
    return [{ source: '/desafio-:anio(\\d{4})', destination: '/desafio/:anio' }];
  },
  // El sistema se movió de /sistema a /cronometro: los enlaces y marcadores viejos siguen funcionando
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
