import { z } from 'zod';
import { handler, HttpError, ok, parseBody } from '@/lib/api';
import { ipDe } from '@/lib/limiteIntentos';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const LIMITE_MS = 15 * 60 * 1000;
const MAX_EN_VENTANA = 3;
const limitesGlobales = globalThis as typeof globalThis & { limitesOracion?: Map<string, number[]> };
const envios: Map<string, number[]> = limitesGlobales.limitesOracion ?? (limitesGlobales.limitesOracion = new Map<string, number[]>());

const camposComunes = {
  nombre: z.string().trim().max(60).optional(),
  peticion: z.string().trim().min(10).max(600),
  sitioWeb: z.string().max(200).optional(),
};
const schema = z.discriminatedUnion('visibilidad', [
  z.object({ ...camposComunes, visibilidad: z.literal('PRIVADA') }).strict(),
  z.object({ ...camposComunes, visibilidad: z.literal('PUBLICA'), consentimiento: z.literal(true) }).strict(),
]);

// GET: solo peticiones públicas aprobadas, sin exponer el contenido privado ni datos de moderación.
export const GET = handler(async () => {
  const peticiones = await prisma.peticionOracion.findMany({
    where: { visibilidad: 'PUBLICA', estado: 'PUBLICADA' },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 30,
    select: { id: true, nombre: true, peticion: true, oraciones: true, createdAt: true },
  });
  return ok(peticiones);
});

// POST: todo envío queda pendiente; las peticiones privadas nunca aparecen en el muro público.
export const POST = handler(async (req: Request) => {
  const datos = await parseBody(req, schema);
  if (datos.sitioWeb?.trim()) return ok({ recibido: true }, 201);

  const ahora = Date.now();
  const clave = ipDe(req);
  const recientes = (envios.get(clave) ?? []).filter((marca) => ahora - marca < LIMITE_MS);
  if (recientes.length >= MAX_EN_VENTANA) throw new HttpError(429, 'Recibimos varias peticiones desde tu conexión. Inténtalo más tarde.');
  recientes.push(ahora);
  envios.set(clave, recientes);
  if (envios.size > 5000) envios.delete(envios.keys().next().value!);

  await prisma.peticionOracion.create({
    data: {
      nombre: datos.nombre?.trim() || null,
      peticion: datos.peticion,
      visibilidad: datos.visibilidad,
      consentimientoAt: datos.visibilidad === 'PUBLICA' ? new Date() : null,
    },
    select: { id: true },
  });
  return ok({ recibido: true }, 201);
});
