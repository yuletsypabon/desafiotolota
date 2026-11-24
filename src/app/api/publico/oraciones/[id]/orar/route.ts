import { z } from 'zod';
import { handler, HttpError, ok } from '@/lib/api';
import { ipDe } from '@/lib/limiteIntentos';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VENTANA_MS = 12 * 60 * 60 * 1000;
const globalApoyos = globalThis as typeof globalThis & { apoyosOracion?: Map<string, number> };
const apoyos = globalApoyos.apoyosOracion ?? (globalApoyos.apoyosOracion = new Map());

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = z.object({ id: z.string().min(1).max(30) }).parse(await ctx.params);
  const llave = `${ipDe(req)}:${id}`;
  const ahora = Date.now();
  const vence = apoyos.get(llave) ?? 0;
  if (vence > ahora) throw new HttpError(429, 'Ya acompañaste esta petición. Gracias por orar.');

  const actualizado = await prisma.peticionOracion.updateMany({
    where: { id, visibilidad: 'PUBLICA', estado: 'PUBLICADA' },
    data: { oraciones: { increment: 1 } },
  });
  if (!actualizado.count) throw new HttpError(404, 'Esta petición ya no está disponible.');

  apoyos.set(llave, ahora + VENTANA_MS);
  if (apoyos.size > 5000) apoyos.delete(apoyos.keys().next().value!);
  const peticion = await prisma.peticionOracion.findUnique({ where: { id }, select: { oraciones: true } });
  return ok({ oraciones: peticion?.oraciones ?? 0 });
});
