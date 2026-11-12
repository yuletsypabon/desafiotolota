import { handler, ok } from '@/lib/api';
import { estadoClavesAcceso } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — ¿qué roles tienen contraseña? (público: lo usa la pantalla de inicio de sesión)
export const GET = handler(async () => {
  return ok({ claves: await estadoClavesAcceso() });
});
