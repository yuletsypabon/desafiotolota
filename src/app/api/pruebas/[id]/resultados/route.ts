import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { resultadoUpsert } from '@/lib/validators';
import { sumaDetenciones } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const rs = await prisma.resultado.findMany({ where: { pruebaId: id }, orderBy: { llegadaAt: 'asc' } });
  return ok(rs);
});

// PUT — guarda (o reemplaza) el tiempo de un equipo en la prueba. Se llama al marcar LLEGADA.
export const PUT = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const d = await parseBody(req, resultadoUpsert);
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
