import { prisma } from '@/lib/prisma';
import { handler, notFound, ok, type Ctx } from '@/lib/api';
import { exigirPruebaHabilitada } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE — elimina un tiempo (el equipo vuelve a la cola de salida)
export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const r = await prisma.resultado.findUnique({ where: { id }, select: { pruebaId: true } });
  if (!r) notFound('Tiempo');
  await exigirPruebaHabilitada(req, r.pruebaId);
  await prisma.resultado.delete({ where: { id } });
  return ok({ ok: true });
});
