import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody } from '@/lib/api';
import { eventoCreate } from '@/lib/validators';
import { pruebasHabilitadas, rolDe } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/eventos — lista (sin logos de equipos), ordenada por año desc
export const GET = handler(async (req: Request) => {
  const eventos = await prisma.evento.findMany({
    orderBy: [{ anio: 'desc' }, { createdAt: 'desc' }],
    include: {
      pruebas: {
        where: rolDe(req) === 'CRONO' ? pruebasHabilitadas() : undefined,
        orderBy: { posicion: 'asc' },
        include: { _count: { select: { resultados: true } } },
      },
      _count: { select: { equipos: true } },
    },
  });
  return ok(eventos);
});

// POST /api/eventos — crea evento (+ pruebas iniciales, + copia opcional de equipos)
export const POST = handler(async (req: Request) => {
  const { pruebas, copiarEquiposDe, ...data } = await parseBody(req, eventoCreate);
  const evento = await prisma.$transaction(async (tx) => {
    const ev = await tx.evento.create({
      data: {
        ...data,
        pruebas: pruebas?.length ? { create: pruebas.map((nombre, i) => ({ nombre, posicion: i })) } : undefined,
      },
    });
    if (copiarEquiposDe) {
      const origen = await tx.equipo.findMany({ where: { eventoId: copiarEquiposDe }, include: { participantes: true } });
      for (const e of origen) {
        await tx.equipo.create({
          data: {
            eventoId: ev.id,
            numero: e.numero,
            nombre: e.nombre,
            capitan: e.capitan,
            logo: e.logo,
            participantes: {
              create: e.participantes.map(({ id: _id, equipoId: _eq, createdAt: _c, updatedAt: _u, ...p }) => p),
            },
          },
        });
      }
    }
    return ev;
  }, { timeout: 30_000 }); // copiar equipos hace una consulta por equipo
  return ok(evento, 201);
});
