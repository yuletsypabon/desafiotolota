import { cookies } from 'next/headers';
import { handler, ok } from '@/lib/api';
import { COOKIE_SESION, leerToken } from '@/lib/sesion';

export const dynamic = 'force-dynamic';

// GET — rol de la sesión actual, o null si no hay. Es pública: el sitio la usa para mostrar
// el acceso al cronómetro solo al administrador. La cookie firmada se verifica aquí mismo.
export const GET = handler(async () => ok({ rol: await leerToken((await cookies()).get(COOKIE_SESION)?.value) }));
