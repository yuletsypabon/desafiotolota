import { handler, ok } from '@/lib/api';
import { estadoClaves } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — ¿qué roles tienen contraseña? (público: lo usa la pantalla de inicio de sesión)
export const GET = handler(async () => ok({ claves: await estadoClaves() }));
