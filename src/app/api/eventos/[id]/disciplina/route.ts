import { prisma } from '@/lib/prisma';
import { HttpError, handler, ok, parseBody, type Ctx } from '@/lib/api';
import { puntoCreate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const puntos = await prisma.puntoDisciplina.findMany({
    where: { prueba: { eventoId: id } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(puntos);
});

export const POST = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const d = await parseBody(req, puntoCreate);
  // Validar que prueba y equipo pertenecen al evento
  const [pr, eq] = await Promise.all([
    prisma.prueba.findFirst({ where: { id: d.pruebaId, eventoId: id }, select: { id: true } }),
    prisma.equipo.findFirst({ where: { id: d.equipoId, eventoId: id }, select: { id: true } }),
  ]);
  if (!pr || !eq) throw new HttpError(400, 'La prueba o el equipo no pertenecen a este evento');
  const p = await prisma.puntoDisciplina.create({ data: { ...d, participanteId: d.participanteId || null } });
  return ok(p, 201);
});
