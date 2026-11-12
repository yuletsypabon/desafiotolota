import { FUENTE_MONO, FUENTE_TITULOS, MARCA, OSCURO } from '@/lib/marca';

/** Naranja de detención: distinto del amarillo de acento y del rojo de disciplina. */
const NARANJA = '#ff8a3d';

/** Colores del sistema: misma identidad que el sitio (negro, blanco hueso y amarillo; rojo para disciplina/errores). */
export const COLORS = {
  bg: OSCURO.fondo,
  surf: OSCURO.superficie,
  card: OSCURO.tarjeta,
  border: MARCA.vidrioBorde, // bordes finos como los del vidrio
  acento: MARCA.destacado, // amarillo: títulos, botones y acciones principales
  destacado: MARCA.destacado,
  gold: MARCA.destacado, // tiempos finales y títulos de resultados: el mismo amarillo de la marca
  orange: NARANJA, // detenciones
  text: OSCURO.texto,
  dim: OSCURO.textoSuave,
  muted: '#77766f',
  // Estados del cronómetro: distinguibles a simple vista entre sí y del amarillo de acento
  green: '#5fd17a', // en pista
  red: '#ef5350', // tiempo en contra por disciplina
  detenido: NARANJA,
  blue: '#6aa8f5', // pista seleccionada
  cronoActivo: '#6aa8f5',
  cronoPausado: NARANJA,
  cronoFinalizado: '#5fd17a',
  purple: '#b69cf5', // espiritual
};

/** Color con transparencia: alfa('#fbbf24', .14) → 'rgba(251,191,36,0.14)'. */
export function alfa(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const FONT_DISPLAY = FUENTE_TITULOS;
export const FONT_MONO = FUENTE_MONO;
