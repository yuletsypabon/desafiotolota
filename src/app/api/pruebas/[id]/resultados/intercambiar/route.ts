import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError, handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { resultadoIntercambio } from '@/lib/validators';
import { exigirPruebaHabilitada, rolDe } from '@/lib/auth';

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
  const rol = rolDe(req);
  if (!rol) throw new HttpError(401, 'Sesión requerida');
  const { equipoA, equipoB, motivo } = await parseBody(req, resultadoIntercambio);

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

    const instantanea = (r: typeof ra) => r ? ({
      resultadoId: r.id,
      equipoId: r.equipoId,
      pista: r.pista,
      salidaAt: r.salidaAt.toISOString(),
      llegadaAt: r.llegadaAt.toISOString(),
      brutoMs: r.brutoMs,
      detencionesMs: r.detencionesMs,
      detenciones: r.detenciones,
    }) : null;
    const antes = { equipoA: instantanea(ra), equipoB: instantanea(rb) };
    let despues: { equipoA: ReturnType<typeof instantanea>; equipoB: ReturnType<typeof instantanea> };

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
      despues = {
        equipoA: { ...instantanea(rb)!, resultadoId: ra.id, equipoId: equipoA },
        equipoB: { ...instantanea(ra)!, resultadoId: rb.id, equipoId: equipoB },
      };
    } else {
      // Solo uno tiene tiempo: se reasigna al otro equipo (no hay choque con la restricción única)
      const r = (ra ?? rb)!;
      const destino = r.equipoId === equipoA ? equipoB : equipoA;
      await tx.resultado.update({ where: { id: r.id }, data: { equipoId: destino } });
      despues = {
        equipoA: destino === equipoA ? { ...instantanea(r)!, equipoId: equipoA } : null,
        equipoB: destino === equipoB ? { ...instantanea(r)!, equipoId: equipoB } : null,
      };
    }

    await tx.resultadoCorreccion.create({
      data: {
        pruebaId: id,
        equipoAId: equipoA,
        equipoBId: equipoB,
        motivo,
        antes: antes as unknown as Prisma.InputJsonValue,
        despues: despues as unknown as Prisma.InputJsonValue,
        rol,
      },
    });
    return { movidos: ra && rb ? 2 : 1 };
  });

  return ok(resumen);
});
