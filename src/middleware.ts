import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESION, HEADER_ROL, leerToken, permitidoCrono } from '@/lib/sesion';

/**
 * Toda la app exige iniciar sesión (Administrador o Cronometrador).
 * El rol verificado se pasa a las rutas en una cabecera interna; la que mande el navegador se descarta.
 */
const PUBLICAS = [/^\/login$/, /^\/api\/auth\/(login|estado)$/];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.delete(HEADER_ROL);

  if (PUBLICAS.some((re) => re.test(pathname))) return NextResponse.next({ request: { headers } });

  const esApi = pathname.startsWith('/api/');
  const rol = await leerToken(req.cookies.get(COOKIE_SESION)?.value);

  if (!rol) {
    if (esApi) return NextResponse.json({ error: 'Inicia sesión para continuar' }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  if (rol === 'CRONO' && !permitidoCrono(req.method, pathname, searchParams)) {
    if (esApi) return NextResponse.json({ error: 'El cronometrador no tiene acceso a esta sección' }, { status: 403 });
    // Dentro de un evento, volver a su cronómetro; si no, al inicio
    const m = pathname.match(/^\/eventos\/([^/]+)/);
    const url = req.nextUrl.clone();
    url.pathname = m ? `/eventos/${m[1]}/cronometro` : '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  headers.set(HEADER_ROL, rol);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
