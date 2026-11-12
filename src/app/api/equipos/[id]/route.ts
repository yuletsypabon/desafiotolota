import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { equipoUpdate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const data = await parseBody(req, equipoUpdate);
  const eq = await prisma.equipo.update({ where: { id }, data, include: { participantes: true } });
  return ok(eq);
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  await prisma.equipo.delete({ where: { id } });
  return ok({ ok: true });
});
