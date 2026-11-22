import { prisma } from '@/lib/prisma';
import { HttpError, handler, notFound, ok, type Ctx } from '@/lib/api';
import { puedeVerHistorico, rolDe } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Bitácora de correcciones: lectura para administrador o cronometrador con acceso al histórico. */
export const GET = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const prueba = await prisma.prueba.findUnique({ where: { id }, select: { id: true } });
  if (!prueba) notFound('Prueba');
  if (rolDe(req) !== 'ADMIN' && !await puedeVerHistorico(req)) {
    throw new HttpError(403, 'Ingresa la contraseña del Histórico para consultar correcciones');
  }
  return ok(await prisma.resultadoCorreccion.findMany({
    where: { pruebaId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, equipoAId: true, equipoBId: true, motivo: true, rol: true, createdAt: true },
  }));
});
