import { z } from 'zod';
import { handler, HttpError, ok, parseBody } from '@/lib/api';
import { ipDe } from '@/lib/limiteIntentos';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const LIMITE_MS = 15 * 60 * 1000;
const MAX_EN_VENTANA = 3;
const enviosGlobales = globalThis as typeof globalThis & {
  limiteTestimonios?: Map<string, number[]>;
};
const envios: Map<string, number[]> = enviosGlobales.limiteTestimonios ??
  (enviosGlobales.limiteTestimonios = new Map<string, number[]>());

const schema = z.object({
  nombre: z.string().trim().min(2).max(60),
  anio: z.number().int().min(2016).max(new Date().getFullYear()),
  comentario: z.string().trim().min(20).max(600),
  consentimiento: z.literal(true),
  sitioWeb: z.string().max(200).optional(),
}).strict();

// GET /api/publico/testimonios: únicamente experiencias aprobadas.
export const GET = handler(async () => {
  const testimonios = await prisma.testimonio.findMany({
    where: { estado: 'PUBLICADO' },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 24,
    select: { id: true, nombre: true, anio: true, comentario: true },
  });
  return ok(testimonios);
});

// POST /api/publico/testimonios: valida, limita envíos y deja todo pendiente de moderación.
export const POST = handler(async (req: Request) => {
  const datos = await parseBody(req, schema);

  // Campo trampa para robots: respondemos como si se hubiera recibido, pero no guardamos el contenido.
  if (datos.sitioWeb?.trim()) return ok({ recibido: true }, 201);

  const ahora = Date.now();
  const clave = ipDe(req);
  const recientes = (envios.get(clave) ?? []).filter((marca) => ahora - marca < LIMITE_MS);
  if (recientes.length >= MAX_EN_VENTANA) throw new HttpError(429, 'Ya recibimos varios mensajes desde tu conexión. Inténtalo más tarde.');
  recientes.push(ahora);
  envios.set(clave, recientes);
  if (envios.size > 5000) envios.delete(envios.keys().next().value!);

  await prisma.testimonio.create({
    data: {
      nombre: datos.nombre,
      anio: datos.anio,
      comentario: datos.comentario,
      consentimientoAt: new Date(),
    },
    select: { id: true },
  });
  return ok({ recibido: true }, 201);
});
