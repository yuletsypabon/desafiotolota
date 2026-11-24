import { z } from 'zod';
import { exigirAdmin } from '@/lib/auth';
import { handler, HttpError, ok, parseBody } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const decision = z.object({ id: z.string().min(1).max(30), estado: z.enum(['PUBLICADA', 'RECHAZADA']) }).strict();
const borrarSchema = z.object({ id: z.string().min(1).max(30) }).strict();

export const GET = handler(async (req: Request) => {
  exigirAdmin(req);
  const peticiones = await prisma.peticionOracion.findMany({
    where: { estado: { in: ['PENDIENTE', 'PUBLICADA', 'RECHAZADA'] } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  return ok(peticiones);
});

export const PATCH = handler(async (req: Request) => {
  exigirAdmin(req);
  const { id, estado } = await parseBody(req, decision);
  const estadosPermitidos = estado === 'PUBLICADA'
    ? ['PENDIENTE' as const]
    : ['PENDIENTE' as const, 'PUBLICADA' as const];
  const resultado = await prisma.peticionOracion.updateMany({
    where: { id, estado: { in: estadosPermitidos } },
    data: { estado, revisadoAt: new Date() },
  });
  if (!resultado.count) throw new HttpError(404, 'La petición ya no está disponible o no existe.');
  return ok({ actualizado: true });
});

export const DELETE = handler(async (req: Request) => {
  exigirAdmin(req);
  const { id } = await parseBody(req, borrarSchema);
  const resultado = await prisma.peticionOracion.deleteMany({ where: { id } });
  if (!resultado.count) throw new HttpError(404, 'La petición no existe o ya fue eliminada.');
  return ok({ eliminado: true });
});
