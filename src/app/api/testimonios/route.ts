import { z } from 'zod';
import { exigirAdmin } from '@/lib/auth';
import { handler, HttpError, ok, parseBody } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const decision = z.object({
  id: z.string().min(1).max(30),
  estado: z.enum(['PUBLICADO', 'RECHAZADO']),
}).strict();
const borrarSchema = z.object({ id: z.string().min(1).max(30) }).strict();

// GET /api/testimonios: bandeja de revisión, reservada al administrador.
export const GET = handler(async (req: Request) => {
  exigirAdmin(req);
  const testimonios = await prisma.testimonio.findMany({
    where: { estado: { in: ['PENDIENTE', 'PUBLICADO', 'RECHAZADO'] } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  return ok(testimonios);
});

// PATCH /api/testimonios: publica o rechaza una experiencia pendiente.
export const PATCH = handler(async (req: Request) => {
  exigirAdmin(req);
  const { id, estado } = await parseBody(req, decision);
  const estadosPermitidos = estado === 'PUBLICADO'
    ? ['PENDIENTE' as const]
    : ['PENDIENTE' as const, 'PUBLICADO' as const];
  const resultado = await prisma.testimonio.updateMany({
    where: { id, estado: { in: estadosPermitidos } },
    data: { estado, revisadoAt: new Date() },
  });
  if (!resultado.count) throw new HttpError(404, 'El comentario ya no está disponible o no existe.');
  return ok({ actualizado: true });
});

export const DELETE = handler(async (req: Request) => {
  exigirAdmin(req);
  const { id } = await parseBody(req, borrarSchema);
  const resultado = await prisma.testimonio.deleteMany({ where: { id } });
  if (!resultado.count) throw new HttpError(404, 'El comentario no existe o ya fue eliminado.');
  return ok({ eliminado: true });
});
