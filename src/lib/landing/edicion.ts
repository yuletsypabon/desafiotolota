import 'server-only';
import { prisma } from '@/lib/prisma';
import { codigoEdicion } from '@/lib/evento';
import { nombrePropio, nombreYApellido } from '@/lib/format';
import { getClasificacion } from '@/lib/data';
import type { EdicionPublica, ResultadosPublicos } from './tiposEdicion';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Primer nombre y primer apellido, con mayúscula inicial: "jhon alexander nuñez" → "Jhon Nuñez". */
const corto = (nombre: string) => {
  const { nombre: n, apellido } = nombreYApellido(nombre);
  return nombrePropio([n, apellido].filter(Boolean).join(' '));
};

/**
 * Datos públicos del evento de un año (el más reciente si hay varios): pruebas y equipos con sus integrantes.
 * De cada persona solo sale su primer nombre, primer apellido y lugar de origen.
 */
export async function datosEdicion(anio: number): Promise<EdicionPublica | null> {
  const [ev, anios] = await Promise.all([
    prisma.evento.findFirst({
      where: { anio },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, anio: true, nombre: true, logo: true,
        pruebas: { orderBy: { posicion: 'asc' }, select: { id: true, nombre: true, estado: true } },
        equipos: {
          orderBy: [{ numero: 'asc' }, { nombre: 'asc' }],
          select: {
            id: true, numero: true, nombre: true, logo: true, color: true, capitan: true,
            participantes: { orderBy: { nombre: 'asc' }, select: { id: true, nombre: true, residencia: true } },
          },
        },
      },
    }),
    prisma.evento.findMany({ select: { anio: true }, distinct: ['anio'] }),
  ]);
  if (!ev) return null;

  return {
    eventoId: ev.id,
    anio: ev.anio,
    codigo: codigoEdicion(ev.anio, anios.map((a) => a.anio)),
    nombre: ev.nombre,
    logo: ev.logo,
    pruebas: ev.pruebas,
    equipos: ev.equipos.map((e) => {
      const capitan = e.capitan ? normalizar(e.capitan) : null;
      const integrantes = e.participantes
        .map((p) => ({ id: p.id, nombre: corto(p.nombre), lugar: p.residencia?.trim() || null, capitan: normalizar(p.nombre) === capitan }))
        .sort((a, b) => Number(b.capitan) - Number(a.capitan)); // el capitán primero
      return { id: e.id, numero: e.numero, nombre: e.nombre, logo: e.logo, color: e.color, capitan: e.capitan ? corto(e.capitan) : null, integrantes };
    }),
  };
}

/** Resultados públicos de un evento: posiciones y tiempo final por equipo (sin salidas, pistas ni detalles). */
export async function resultadosPublicos(eventoId: string): Promise<ResultadosPublicos> {
  const c = await getClasificacion(eventoId);
  return {
    totalPruebas: c.totalPruebas,
    general: c.general.map((g) => ({ pos: g.pos, equipoId: g.equipoId, numero: g.numero, nombre: g.nombre, completadas: g.completadas, totalMs: g.totalMs })),
    pruebas: c.pruebas.map((p) => ({
      id: p.id, nombre: p.nombre, estado: p.estado,
      filas: p.filas.map((f) => ({ pos: f.pos, equipoId: f.equipoId, nombre: f.nombre, finalMs: f.finalMs })),
    })),
  };
}
