import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { equiposImport } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * POST — importa equipos (desde CSV ya parseado en el navegador).
 * Si el equipo ya existe (mismo nombre en el evento) se actualiza; los integrantes
 * se agregan como participantes si aún no existen con ese nombre.
 */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { filas } = await parseBody(req, equiposImport);

  const resumen = await prisma.$transaction(async (tx) => {
    let creados = 0;
    let actualizados = 0;
    let participantes = 0;
    const max = await tx.equipo.aggregate({ where: { eventoId: id }, _max: { numero: true } });
    let next = (max._max.numero ?? 0) + 1;

    for (const f of filas) {
      const existente = await tx.equipo.findUnique({
        where: { eventoId_nombre: { eventoId: id, nombre: f.nombre } },
        include: { participantes: { select: { nombre: true } } },
      });
      const numero = f.numero ?? existente?.numero ?? next++;
      const eq = existente
        ? await tx.equipo.update({ where: { id: existente.id }, data: { numero, capitan: f.capitan || existente.capitan } })
        : await tx.equipo.create({ data: { eventoId: id, nombre: f.nombre, numero, capitan: f.capitan || null } });
      if (existente) actualizados++;
      else creados++;

      const ya = new Set((existente?.participantes ?? []).map((p) => p.nombre.toLowerCase()));
      const nuevos = (f.integrantes ?? []).filter((n) => !ya.has(n.toLowerCase()));
      if (nuevos.length) {
        await tx.participante.createMany({ data: nuevos.map((nombre) => ({ equipoId: eq.id, nombre })) });
        participantes += nuevos.length;
      }
    }
    return { creados, actualizados, participantes };
  });

  return ok(resumen);
});
