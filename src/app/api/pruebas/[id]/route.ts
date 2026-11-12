import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { exigirPruebaHabilitada, rolDe, exigirAdmin } from '@/lib/auth';
import { pruebaUpdate, pruebaUpdateCrono } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  await exigirPruebaHabilitada(req, id);
  const data = await parseBody(req, rolDe(req) === 'CRONO' ? pruebaUpdateCrono : pruebaUpdate);
  const pr = await prisma.prueba.update({ where: { id }, data });
  return ok(pr);
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  await prisma.prueba.delete({ where: { id } });
  return ok({ ok: true });
});
