import { fail, handler, ok, type Ctx } from '@/lib/api';
import { resultadosPublicos, resultadosPublicosDisponibles } from '@/lib/landing/edicion';

export const dynamic = 'force-dynamic';

// GET — resultados públicos de un evento para la página de la edición (sin sesión; solo posiciones y tiempos)
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  if (!(await resultadosPublicosDisponibles(id))) return fail('Los resultados se publicarán cuando finalice el evento.', 404);
  return ok(await resultadosPublicos(id));
});
