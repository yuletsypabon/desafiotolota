import { prisma } from '@/lib/prisma';
import { HttpError, handler, ok, parseBody, type Ctx } from '@/lib/api';
import { exigirPruebaHabilitada } from '@/lib/auth';
import { reservasSync } from '@/lib/validators';
import { VENCE_RESERVA_MS } from '@/lib/reservas';

export const dynamic = 'force-dynamic';

/**
 * PUT — { dispositivo, equipos: [{ equipoId, pista }] }: el dispositivo informa qué equipos tiene cargados en sus
 * pistas (lo repite cada pocos segundos). Se reservan los que estén libres; los que ya tiene otro dispositivo vuelven
 * como `conflictos`. Responde además qué equipos tienen reservados los demás (`otros`), para sacarlos de la cola.
 */
export const PUT = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  await exigirPruebaHabilitada(req, id);
  const { dispositivo, equipos } = await parseBody(req, reservasSync);

  const prueba = await prisma.prueba.findUnique({ where: { id }, select: { eventoId: true } });
  if (!prueba) throw new HttpError(404, 'Prueba no encontrada');
  const ids = equipos.map((e) => e.equipoId);
  if (ids.length && (await prisma.equipo.count({ where: { id: { in: ids }, eventoId: prueba.eventoId } })) !== ids.length)
    throw new HttpError(400, 'Hay equipos que no pertenecen al evento de la prueba');

  const resultado = await prisma.$transaction(async (tx) => {
    // Las reservas de dispositivos que dejaron de reportarse vencen; las que este ya no tiene cargadas se sueltan
    await tx.reserva.deleteMany({ where: { pruebaId: id, updatedAt: { lt: new Date(Date.now() - VENCE_RESERVA_MS) } } });
    await tx.reserva.deleteMany({ where: { pruebaId: id, dispositivo, equipoId: { notIn: ids } } });

    const conflictos: string[] = [];
    for (const { equipoId, pista } of equipos) {
      const actual = await tx.reserva.findUnique({ where: { pruebaId_equipoId: { pruebaId: id, equipoId } } });
      if (!actual) await tx.reserva.create({ data: { pruebaId: id, equipoId, dispositivo, pista } });
      else if (actual.dispositivo === dispositivo) await tx.reserva.update({ where: { id: actual.id }, data: { pista } });
      else conflictos.push(equipoId);
    }
    const otros = await tx.reserva.findMany({
      where: { pruebaId: id, dispositivo: { not: dispositivo } },
      select: { equipoId: true, pista: true },
    });
    return { otros, conflictos };
  });
  return ok(resultado);
});
