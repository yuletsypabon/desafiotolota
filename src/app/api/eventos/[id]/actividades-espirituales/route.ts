import { prisma } from '@/lib/prisma';
import { HttpError, handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { actividadEspiritualCreate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Actividades de un evento: Plus (sin tiempo) y Tiempo (vinculadas a una prueba). */
export const GET = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const evento = await prisma.evento.findUnique({ where: { id }, select: { id: true } });
  if (!evento) notFound('Evento');

  return ok(await prisma.actividadEspiritual.findMany({
    where: { eventoId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      puntajes: {
        orderBy: { equipo: { numero: 'asc' } },
        include: { equipo: { select: { id: true, numero: true, nombre: true } } },
      },
    },
  }));
});

export const POST = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const data = await parseBody(req, actividadEspiritualCreate);
  const evento = await prisma.evento.findUnique({ where: { id }, select: { id: true } });
  if (!evento) notFound('Evento');

  const pruebaId = data.tipo === 'TIEMPO' ? data.pruebaId! : null;
  if (pruebaId) {
    const prueba = await prisma.prueba.findFirst({ where: { id: pruebaId, eventoId: id }, select: { id: true } });
    if (!prueba) throw new HttpError(400, 'La prueba seleccionada no pertenece a este evento');
  }

  return ok(await prisma.actividadEspiritual.create({
    data: { eventoId: id, nombre: data.nombre, tipo: data.tipo, pruebaId, puntosMaximos: data.puntosMaximos },
  }), 201);
});
