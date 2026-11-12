import { prisma } from '@/lib/prisma';
import { handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { actividadEspiritualCreate } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const prueba = await prisma.prueba.findUnique({ where: { id }, select: { id: true } });
  if (!prueba) notFound('Prueba');

  const actividades = await prisma.actividadEspiritual.findMany({
    where: { pruebaId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      puntajes: {
        orderBy: { equipo: { numero: 'asc' } },
        include: { equipo: { select: { id: true, numero: true, nombre: true } } },
      },
    },
  });
  return ok(actividades);
});

export const POST = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const { nombre } = await parseBody(req, actividadEspiritualCreate);
  const prueba = await prisma.prueba.findUnique({ where: { id }, select: { id: true } });
  if (!prueba) notFound('Prueba');

  return ok(await prisma.actividadEspiritual.create({ data: { pruebaId: id, nombre } }), 201);
});
