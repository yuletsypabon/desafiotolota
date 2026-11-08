import 'server-only';
import { Prisma, PrismaClient } from '@prisma/client';
import { HttpError } from './api';
import { escribirEventos, exportarTodo } from './respaldo';

/**
 * Sincronización "servidor local → nube".
 * El día del evento la app corre en un portátil con PostgreSQL local (sin internet).
 * Cuando hay conexión, se copia todo a la base de datos en la nube (Supabase), que guarda el histórico.
 *
 * NUBE_DATABASE_URL: conexión a la nube (Supabase → Session pooler, puerto 5432).
 */
const globalNube = globalThis as unknown as { prismaNube?: PrismaClient };

export function nubeUrl() {
  return process.env.NUBE_DATABASE_URL?.trim() || null;
}

/** Solo el servidor y la base, sin usuario ni contraseña (para mostrar en pantalla). */
export function destinoNube() {
  const url = nubeUrl();
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return 'URL inválida';
  }
}

function clienteNube() {
  const url = nubeUrl();
  if (!url) throw new HttpError(400, 'La nube no está configurada: falta NUBE_DATABASE_URL en el archivo .env');
  return (globalNube.prismaNube ??= new PrismaClient({ datasourceUrl: url, log: ['error'] }));
}

/** Evita sincronizar una base consigo misma (configuración equivocada). */
function mismaBase(a?: string, b?: string | null) {
  if (!a || !b) return false;
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.hostname === y.hostname && x.port === y.port && x.pathname === y.pathname;
  } catch {
    return false;
  }
}

/** Traduce los errores de conexión de Prisma a mensajes claros para el usuario. */
function errorNube(e: unknown): never {
  if (e instanceof HttpError) throw e;
  if (e instanceof Prisma.PrismaClientInitializationError)
    throw new HttpError(503, 'No hay conexión con la nube. Revisa que haya internet y que NUBE_DATABASE_URL sea correcta.');
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P1001' || e.code === 'P1002' || e.code === 'P1017')
      throw new HttpError(503, 'No hay conexión con la nube. Revisa internet e inténtalo de nuevo.');
    if (e.code === 'P2021' || e.code === 'P2022')
      throw new HttpError(500, 'La base de datos de la nube no tiene las tablas al día. Ejecuta "npm run nube:migrar".');
    if (e.code === 'P2028') throw new HttpError(504, 'La sincronización tardó demasiado. Inténtalo de nuevo.');
  }
  throw e;
}

/**
 * Copia todos los eventos locales a la nube. Cada evento se reemplaza completo, en una sola
 * transacción: si algo falla, la nube queda como estaba. Los eventos que existen solo en la nube
 * (p. ej. años anteriores ya borrados del portátil) se conservan: el histórico no se pierde.
 */
export async function sincronizarConNube() {
  if (mismaBase(process.env.DATABASE_URL, nubeUrl()))
    throw new HttpError(400, 'NUBE_DATABASE_URL apunta a la misma base que DATABASE_URL. La nube debe ser otra base.');

  const inicio = Date.now();
  const { eventos } = await exportarTodo();
  const nube = clienteNube();
  try {
    await nube.$queryRaw`SELECT 1`;
    const total = await nube.$transaction((tx) => escribirEventos(tx, eventos), { maxWait: 20_000, timeout: 180_000 });
    return { ...total, segundos: Math.round((Date.now() - inicio) / 100) / 10, sincronizadoEn: new Date().toISOString() };
  } catch (e) {
    errorNube(e);
  }
}
