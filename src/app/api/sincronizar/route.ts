import { handler, ok } from '@/lib/api';
import { destinoNube, sincronizarConNube } from '@/lib/nube';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// GET — ¿está configurada la nube? (no devuelve credenciales)
export const GET = handler(async () => ok({ configurado: destinoNube() !== null, destino: destinoNube() }));

// POST — copia todos los eventos locales a la nube
export const POST = handler(async () => ok(await sincronizarConNube()));
