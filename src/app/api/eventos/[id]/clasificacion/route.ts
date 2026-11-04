import { handler, ok, type Ctx } from '@/lib/api';
import { getClasificacion } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET — resultados por prueba (con disciplina aplicada) + tabla general acumulada
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  return ok(await getClasificacion(id));
});
