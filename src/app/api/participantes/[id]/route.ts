import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { participanteUpdate } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const data = await parseBody(req, participanteUpdate);
  const p = await prisma.participante.update({ where: { id }, data });
  return ok(p);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  await prisma.participante.delete({ where: { id } });
  return ok({ ok: true });
});
