import { prisma } from '@/lib/prisma';
import { handler, ok, type Ctx } from '@/lib/api';

export const dynamic = 'force-dynamic';

// DELETE — elimina un tiempo (el equipo vuelve a la cola de salida)
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  await prisma.resultado.delete({ where: { id } });
  return ok({ ok: true });
});
