import { handler, ok, type Ctx } from '@/lib/api';
import { resultadosPublicos } from '@/lib/landing/edicion';

export const dynamic = 'force-dynamic';

// GET — resultados públicos de un evento para la página de la edición (sin sesión; solo posiciones y tiempos)
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  return ok(await resultadosPublicos(id));
});
