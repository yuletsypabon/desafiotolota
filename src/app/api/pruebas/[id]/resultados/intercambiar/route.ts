import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError, handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { resultadoIntercambio } from '@/lib/validators';
import { exigirPruebaHabilitada } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST — "Corregir pista": intercambia los tiempos registrados de dos equipos en la prueba.
 * Se usa cuando se detuvo/registró el cronómetro al equipo equivocado.
 *  - Si los dos tienen tiempo, se intercambian los datos de tiempo (salida, llegada, bruto, detenciones, pista).
 *  - Si solo uno tiene tiempo, ese tiempo pasa al otro equipo.
 * Los puntos de disciplina no se mueven: pertenecen al equipo, no al tiempo.
 */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  await exigirPruebaHabilitada(req, id);
  const { equipoA, equipoB } = await parseBody(req, resultadoIntercambio);

  const prueba = await prisma.prueba.findUnique({ where: { id }, select: { eventoId: true } });
  if (!prueba) notFound('Prueba');
  const equipos = await prisma.equipo.count({ where: { id: { in: [equipoA, equipoB] }, eventoId: prueba.eventoId } });
  if (equipos !== 2) throw new HttpError(400, 'Los dos equipos deben pertenecer al evento de la prueba');

  const resumen = await prisma.$transaction(async (tx) => {
    const [ra, rb] = await Promise.all([
      tx.resultado.findUnique({ where: { pruebaId_equipoId: { pruebaId: id, equipoId: equipoA } } }),
      tx.resultado.findUnique({ where: { pruebaId_equipoId: { pruebaId: id, equipoId: equipoB } } }),
    ]);
    if (!ra && !rb) return { movidos: 0 };

    if (ra && rb) {
      const tiempo = (r: typeof ra) => ({
        pista: r.pista,
        salidaAt: r.salidaAt,
        llegadaAt: r.llegadaAt,
        brutoMs: r.brutoMs,
        detencionesMs: r.detencionesMs,
        detenciones: (r.detenciones ?? []) as Prisma.InputJsonValue,
      });
      await tx.resultado.update({ where: { id: ra.id }, data: tiempo(rb) });
      await tx.resultado.update({ where: { id: rb.id }, data: tiempo(ra) });
      return { movidos: 2 };
    }

    // Solo uno tiene tiempo: se reasigna al otro equipo (no hay choque con la restricción única)
    const r = (ra ?? rb)!;
    await tx.resultado.update({ where: { id: r.id }, data: { equipoId: r.equipoId === equipoA ? equipoB : equipoA } });
    return { movidos: 1 };
  });

  return ok(resumen);
});
