import { prisma } from '@/lib/prisma';
import { handler, ok, type Ctx } from '@/lib/api';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  await prisma.puntoDisciplina.delete({ where: { id } });
  return ok({ ok: true });
});
