import { NextResponse, type NextRequest } from 'next/server';
import { RUTAS, esRutaPrivada, eventoDeRuta } from '@/lib/rutas';
import { esPeticionAjena } from '@/lib/seguridad';
import { COOKIE_HISTORICO, COOKIE_SESION, HEADER_ROL, leerToken, leerTokenHistorico, permitidoCrono } from '@/lib/sesion';

/**
 * El sitio público se ve sin sesión; el sistema (/cronometro) y la API exigen iniciar sesión
 * (Administrador o Cronometrador). El rol verificado se pasa a las rutas en una cabecera interna;
 * la que mande el navegador se descarta siempre.
 */
// Sin sesión: iniciar sesión y, en /api/publico, lo que muestra el sitio (p. ej. resultados de la edición)
const API_PUBLICA = /^\/api\/(auth\/(login|estado|sesion)|publico\/.+)$/;

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.delete(HEADER_ROL);

  const esApi = pathname.startsWith('/api/');
  // CSRF: ninguna página de otro sitio puede enviar cambios a la API (ni siquiera el inicio de sesión)
  if (esApi && esPeticionAjena(req.method, req.headers.get('origin'), req.headers.get('host'), req.headers.get('sec-fetch-site')))
    return NextResponse.json({ error: 'Petición rechazada: no viene de este sitio' }, { status: 403 });

  if (!esRutaPrivada(pathname) || API_PUBLICA.test(pathname)) return NextResponse.next({ request: { headers } });

  const rol = await leerToken(req.cookies.get(COOKIE_SESION)?.value);

  if (!rol) {
    if (esApi) return NextResponse.json({ error: 'Inicia sesión para continuar' }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = RUTAS.login;
    url.search = pathname === RUTAS.cronometro ? '' : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  const historicoAutorizado = rol === 'CRONO'
    ? await leerTokenHistorico(req.cookies.get(COOKIE_HISTORICO)?.value)
    : rol === 'ADMIN';

  if (rol === 'CRONO' && !permitidoCrono(req.method, pathname, searchParams, historicoAutorizado)) {
    if (esApi) return NextResponse.json({ error: 'El cronometrador no tiene acceso a esta sección' }, { status: 403 });
    // Dentro de un evento, volver a su cronómetro; si no, a la lista de eventos
    const evento = eventoDeRuta(pathname);
    const url = req.nextUrl.clone();
    url.pathname = evento ? RUTAS.evento(evento.id, 'cronometro') : RUTAS.cronometro;
    url.search = '';
    return NextResponse.redirect(url);
  }

  headers.set(HEADER_ROL, rol);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|marca/|fotos/).*)'],
};
