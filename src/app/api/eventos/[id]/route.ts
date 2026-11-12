import { prisma } from '@/lib/prisma';
import { handler, notFound, ok, parseBody, type Ctx } from '@/lib/api';
import { eventoUpdate } from '@/lib/validators';
import { pruebasHabilitadas, rolDe, exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const ev = await prisma.evento.findUnique({
    where: { id },
    include: {
      pruebas: {
        where: rolDe(req) === 'CRONO' ? pruebasHabilitadas() : undefined,
        orderBy: { posicion: 'asc' },
        include: { _count: { select: { resultados: true } } },
      },
      _count: { select: { equipos: true } },
    },
  });
  if (!ev) notFound('Evento');
  return ok(ev);
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const data = await parseBody(req, eventoUpdate);
  const ev = await prisma.evento.update({ where: { id }, data });
  return ok(ev);
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  await prisma.evento.delete({ where: { id } });
  return ok({ ok: true });
});
