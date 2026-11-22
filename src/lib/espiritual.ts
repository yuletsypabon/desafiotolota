/** Dos minutos son el descuento máximo, expresado en segundos para la configuración. */
export const DESCUENTO_ESPIRITUAL_MAXIMO_SEGUNDOS = 2 * 60;

export type TipoActividadEspiritual = 'PLUS' | 'TIEMPO';

/** Valor de un punto para una actividad concreta. Nunca depende de una configuración global del evento. */
export function descuentoPorPuntoSegundos(puntosMaximos: number): number {
  return DESCUENTO_ESPIRITUAL_MAXIMO_SEGUNDOS / Math.max(1, puntosMaximos);
}

/** Las actividades Plus conservan sus puntos, pero no alteran ningún tiempo. */
export function descuentoEspiritualMs(tipo: TipoActividadEspiritual, puntos: number, puntosMaximos: number): number {
  if (tipo !== 'TIEMPO') return 0;
  // El cronómetro persiste milisegundos; la regla de negocio y la interfaz trabajan en segundos.
  return Math.round(Math.max(0, puntos) * descuentoPorPuntoSegundos(puntosMaximos) * 1000);
}
