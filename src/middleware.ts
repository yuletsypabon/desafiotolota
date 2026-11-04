import { NextResponse, type NextRequest } from 'next/server';

/**
 * Protección opcional con usuario/contraseña (HTTP Basic).
 * Se activa sólo si la variable ADMIN_PASSWORD está definida.
 */
export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return NextResponse.next();
  const user = process.env.ADMIN_USER || 'admin';

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const [u, ...rest] = atob(auth.slice(6)).split(':');
      if (u === user && rest.join(':') === pass) return NextResponse.next();
    } catch {
      /* cabecera inválida */
    }
  }
  return new NextResponse('Autenticación requerida', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Desafio Tolota", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
