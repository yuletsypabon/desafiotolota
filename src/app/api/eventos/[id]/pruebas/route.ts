import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { pruebaCreate, pruebasReorder } from '@/lib/validators';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST — agrega una prueba al final
export const POST = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const { nombre } = await parseBody(req, pruebaCreate);
  const max = await prisma.prueba.aggregate({ where: { eventoId: id }, _max: { posicion: true } });
  const pr = await prisma.prueba.create({
    data: { eventoId: id, nombre, posicion: (max._max.posicion ?? -1) + 1 },
  });
  return ok(pr, 201);
});

// PUT — reordena: { ids: [pruebaId, ...] }
export const PUT = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const { ids } = await parseBody(req, pruebasReorder);
  await prisma.$transaction(
    ids.map((pid, i) => prisma.prueba.update({ where: { id: pid, eventoId: id }, data: { posicion: i } })),
  );
  return ok({ ok: true });
});
