import { prisma } from '@/lib/prisma';
import { handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { actividadEspiritualUpdate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const data = await parseBody(req, actividadEspiritualUpdate);
  const actividad = await prisma.actividadEspiritual.findUnique({ where: { id }, select: { id: true } });
  if (!actividad) notFound('Actividad');
  return ok(await prisma.actividadEspiritual.update({ where: { id }, data }));
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const actividad = await prisma.actividadEspiritual.findUnique({ where: { id }, select: { id: true } });
  if (!actividad) notFound('Actividad');
  await prisma.actividadEspiritual.delete({ where: { id } });
  return ok({ ok: true });
});
