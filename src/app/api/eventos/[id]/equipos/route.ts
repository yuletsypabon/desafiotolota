import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { equipoCreate } from '@/lib/validators';
import { siguienteNumero } from '@/lib/data';
import { rolDe, exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const fichas = rolDe(req) === 'ADMIN';
  const equipos = await prisma.equipo.findMany({
    where: { eventoId: id },
    orderBy: [{ numero: 'asc' }, { nombre: 'asc' }],
    include: { participantes: fichas ? { orderBy: { nombre: 'asc' } } : { take: 0 } },
  });
  return ok(equipos);
});

export const POST = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const data = await parseBody(req, equipoCreate);
  const numero = data.numero ?? (await siguienteNumero(id));
  const eq = await prisma.equipo.create({
    data: { ...data, numero, eventoId: id },
    include: { participantes: true },
  });
  return ok(eq, 201);
});
