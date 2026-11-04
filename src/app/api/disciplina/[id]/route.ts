import { prisma } from '@/lib/prisma';
import { handler, ok, type Ctx } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  await prisma.puntoDisciplina.delete({ where: { id } });
  return ok({ ok: true });
});
