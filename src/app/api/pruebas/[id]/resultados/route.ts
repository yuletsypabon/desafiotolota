import { prisma } from '@/lib/prisma';
import { HttpError, handler, ok, parseBody, type Ctx } from '@/lib/api';
import { resultadoUpsert } from '@/lib/validators';
import { sumaDetenciones } from '@/lib/scoring';
import { exigirPruebaHabilitada, exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const rs = await prisma.resultado.findMany({ where: { pruebaId: id }, orderBy: { llegadaAt: 'asc' } });
  return ok(rs);
});

// PUT — guarda (o reemplaza) el tiempo de un equipo en la prueba. Se llama al marcar LLEGADA.
export const PUT = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  await exigirPruebaHabilitada(req, id);
  const d = await parseBody(req, resultadoUpsert);
  const prueba = await prisma.prueba.findUnique({ where: { id }, select: { eventoId: true } });
  if (!prueba) throw new HttpError(404, 'Prueba no encontrada');
  if (!(await prisma.equipo.count({ where: { id: d.equipoId, eventoId: prueba.eventoId } })))
    throw new HttpError(400, 'El equipo no pertenece al evento de esta prueba');
  const data = {
    pista: d.pista ?? null,
    salidaAt: d.salidaAt,
    llegadaAt: d.llegadaAt,
    brutoMs: d.brutoMs,
    detenciones: d.detenciones,
    detencionesMs: sumaDetenciones(d.detenciones),
    observacion: d.observacion,
  };
  const [r] = await prisma.$transaction([
    prisma.resultado.upsert({
      where: { pruebaId_equipoId: { pruebaId: id, equipoId: d.equipoId } },
      create: { ...data, pruebaId: id, equipoId: d.equipoId },
      update: data,
    }),
    prisma.prueba.updateMany({ where: { id, estado: 'PENDIENTE' }, data: { estado: 'EN_CURSO' } }),
  ]);
  return ok(r);
});
