import { handler, ok } from '@/lib/api';
import { rolDe } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — rol de la sesión actual (el middleware ya exigió que exista)
export const GET = handler(async (req: Request) => ok({ rol: rolDe(req) }));
