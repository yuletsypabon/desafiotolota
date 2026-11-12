// Datos públicos del DESAFÍO Tolotá: la próxima edición y la línea de tiempo de ediciones.

export const EVENTO = {
  edicion: 'X6',
  /** 2026 es la 9.ª edición (8 ediciones entre 2016 y 2025) */
  numero: 9,
  /** Recepción de equipos: 15 de diciembre a las 12:00 m. (hora de Colombia) */
  inicio: new Date('2026-12-15T12:00:00-05:00'),
  fin: new Date('2026-12-21T23:59:59-05:00'),
  fechas: '15 – 21 DIC 2026',
  sede: 'Finca El Faisán Dorado',
  lugar: 'Gámbita, Santander',
  lugarDetalle: 'Vía Vado Real – Gámbita, Santander',
  mapa: 'https://www.google.com/maps?q=' + encodeURIComponent('Vado Real Gámbita Santander Colombia'),
  diasCampamento: 6,
  /** Tema de la cartilla bíblica del año */
  tema: { nombre: "Ge'ullah", significado: 'redención', idioma: 'hebrea', versiculos: ['Lucas 21:28', '1 Corintios 1:30'] },
} as const;

/** Año en que empezó el Desafío (como dice la insignia: «Desde 2016»). */
export const ANIO_INICIO = 2016;

export interface Edicion {
  codigo: string;
  anio: number;
  /** Nombre de la edición; null mientras no se revela */
  nombre: string | null;
  proxima?: boolean;
  /** Foto opcional en /public/hero/ediciones/ (se muestra en la tarjeta) */
  foto?: string;
}

export const EDICIONES: Edicion[] = [
  { codigo: 'X1', anio: 2017, nombre: 'La Primera' },
  { codigo: 'X2', anio: 2019, nombre: null },
  { codigo: 'X3', anio: 2023, nombre: null },
  { codigo: 'X4', anio: 2024, nombre: null },
  { codigo: 'X5', anio: 2025, nombre: null },
  { codigo: 'X6', anio: 2026, nombre: "Ge'ullah", proxima: true },
];

/** "Desafío X6: Ge'ullah" o "Desafío X2" (formato oficial de las ediciones). */
export const tituloEdicion = (e: Pick<Edicion, 'codigo' | 'nombre'>) => `Desafío ${e.codigo}${e.nombre ? `: ${e.nombre}` : ''}`;

/** La edición que la portada anuncia (por defecto, la marcada como próxima en EDICIONES). */
export const EDICION_PROXIMA = EDICIONES.find((e) => e.proxima) ?? EDICIONES[EDICIONES.length - 1];

/**
 * Código de la edición de un año ("X6"). Los años de EDICIONES conservan su código; cada evento creado
 * después en el sistema suma una edición: con eventos en 2027 y 2028, 2028 es X8.
 */
export function codigoEdicion(anio: number, aniosEventos: number[]): string {
  const conocida = EDICIONES.find((e) => e.anio === anio);
  if (conocida) return conocida.codigo;
  const ultima = EDICIONES[EDICIONES.length - 1];
  const nuevas = new Set(aniosEventos.filter((a) => a > ultima.anio && a <= anio));
  nuevas.add(anio);
  return `X${Number(ultima.codigo.slice(1)) + nuevas.size}`;
}

export interface Cuenta {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  terminada: boolean;
}

/** Tiempo que falta hasta `objetivo` (ms). Nunca negativo. */
export function cuentaRegresiva(ahora: number, objetivo: number): Cuenta {
  const ms = Math.max(0, objetivo - ahora);
  const s = Math.floor(ms / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    terminada: ms === 0,
  };
}

/** Categorías de equipo: X2 (2 integrantes) y X4 (4 integrantes). */
export type Categoria = 'X2' | 'X4';

/** "Desafío X2: La Travesía"; si aún no hay nombre, "Desafío X2: (nombre)". */
export const tituloCategoria = (categoria: Categoria, nombre?: string | null) =>
  `Desafío ${categoria}: ${nombre?.trim() || '(nombre)'}`;
