import { prisma } from '@/lib/prisma';
import { HttpError, handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { actividadEspiritualUpdate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const data = await parseBody(req, actividadEspiritualUpdate);
  const actividad = await prisma.actividadEspiritual.findUnique({
    where: { id },
    select: { id: true, eventoId: true, tipo: true, pruebaId: true },
  });
  if (!actividad) notFound('Actividad');
  const tipo = data.tipo ?? actividad.tipo;
  const pruebaId = tipo === 'TIEMPO' ? (data.pruebaId ?? actividad.pruebaId) : null;
  if (tipo === 'TIEMPO' && !pruebaId) throw new HttpError(400, 'Selecciona la prueba que recibirá el descuento');
  if (pruebaId) {
    const prueba = await prisma.prueba.findFirst({ where: { id: pruebaId, eventoId: actividad.eventoId }, select: { id: true } });
    if (!prueba) throw new HttpError(400, 'La prueba seleccionada no pertenece a este evento');
  }
  return ok(await prisma.actividadEspiritual.update({ where: { id }, data: { ...data, tipo, pruebaId } }));
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const actividad = await prisma.actividadEspiritual.findUnique({ where: { id }, select: { id: true } });
  if (!actividad) notFound('Actividad');
  await prisma.actividadEspiritual.delete({ where: { id } });
  return ok({ ok: true });
});
