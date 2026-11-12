import 'server-only';
import { prisma } from '@/lib/prisma';
import { EDICION_PROXIMA, codigoEdicion, tituloCategoria } from '@/lib/evento';

/** Edición que anuncia el chip del hero: «2026 · Desafío X6: Ge'ullah». */
export interface EdicionPortada {
  anio: number;
  codigo: string;
  nombre: string | null;
}

/** "Desafío X2: La Travesía", o null si el evento aún no tiene ese nombre (no se muestra «(nombre)»). */
const categoria = (c: 'X2' | 'X4', nombre?: string | null) => (nombre?.trim() ? tituloCategoria(c, nombre) : null);

/**
 * Datos de la portada desde la base, del próximo evento (el del año en curso o siguiente; si no hay, el más
 * reciente): su edición y los nombres del reto X2 y X4. Al crear un evento nuevo en el sistema, la portada lo
 * anuncia sola. Si la base falla, se muestra la edición de lib/evento y sin nombres de X2/X4.
 */
export async function datosPortada() {
  try {
    const anio = new Date().getFullYear();
    const campos = { anio: true, nombre: true, nombreX2: true, nombreX4: true } as const;
    const [ev, anios] = await Promise.all([
      prisma.evento
        .findFirst({ where: { anio: { gte: anio } }, orderBy: [{ anio: 'asc' }, { createdAt: 'desc' }], select: campos })
        .then((e) => e ?? prisma.evento.findFirst({ orderBy: [{ anio: 'desc' }, { createdAt: 'desc' }], select: campos })),
      prisma.evento.findMany({ select: { anio: true }, distinct: ['anio'] }),
    ]);
    const edicion: EdicionPortada = ev
      ? { anio: ev.anio, codigo: codigoEdicion(ev.anio, anios.map((a) => a.anio)), nombre: ev.nombre.trim() || null }
      : EDICION_PROXIMA;
    return { edicion, nombreX2: categoria('X2', ev?.nombreX2), nombreX4: categoria('X4', ev?.nombreX4) };
  } catch (e) {
    console.error('Portada: no se pudieron leer los datos del evento', e);
    return { edicion: EDICION_PROXIMA as EdicionPortada, nombreX2: null, nombreX4: null };
  }
}
