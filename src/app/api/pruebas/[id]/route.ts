import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { pruebaUpdate } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const data = await parseBody(req, pruebaUpdate);
  const pr = await prisma.prueba.update({ where: { id }, data });
  return ok(pr);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  await prisma.prueba.delete({ where: { id } });
  return ok({ ok: true });
});
