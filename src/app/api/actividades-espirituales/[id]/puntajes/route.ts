import { prisma } from '@/lib/prisma';
import { handler, HttpError, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { puntajesEspiritualesUpdate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const { puntajes } = await parseBody(req, puntajesEspiritualesUpdate);
  const actividad = await prisma.actividadEspiritual.findUnique({
    where: { id },
    select: { id: true, prueba: { select: { eventoId: true } } },
  });
  if (!actividad) notFound('Actividad');

  const equipos = await prisma.equipo.findMany({
    where: { eventoId: actividad.prueba.eventoId, id: { in: puntajes.map((p) => p.equipoId) } },
    select: { id: true },
  });
  if (equipos.length !== puntajes.length) {
    throw new HttpError(400, 'Uno o más equipos no pertenecen al evento de esta actividad.');
  }

  const guardados = await prisma.$transaction(async (tx) => {
    await tx.puntajeEspiritual.deleteMany({ where: { actividadId: id } });
    const conPuntos = puntajes.filter((p) => p.puntos > 0);
    if (conPuntos.length) {
      await tx.puntajeEspiritual.createMany({
        data: conPuntos.map((p) => ({ actividadId: id, equipoId: p.equipoId, puntos: p.puntos })),
      });
    }
    return tx.puntajeEspiritual.findMany({
      where: { actividadId: id },
      orderBy: { equipo: { numero: 'asc' } },
      include: { equipo: { select: { id: true, numero: true, nombre: true } } },
    });
  });

  return ok(guardados);
});
