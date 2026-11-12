// Vueltas del reloj del cronómetro: la barra de cada pista se llena cada 30 minutos.

/** Una vuelta completa de la barra (30 minutos). */
export const VUELTA_MS = 30 * 60 * 1000;

/** Fracción de la vuelta actual (0 a 1) para un tiempo en ms. */
export const progresoVuelta = (ms: number) => (Math.max(0, ms) % VUELTA_MS) / VUELTA_MS;

/** Número de vuelta (1, 2, …) para un tiempo en ms. */
export const numeroVuelta = (ms: number) => Math.floor(Math.max(0, ms) / VUELTA_MS) + 1;

/**
 * Hora actual en ms para cronometrar. Usa el reloj monótono del navegador (performance.now) sumado a la hora en que
 * se abrió la página: si el dispositivo ajusta su hora en plena carrera (al conectarse a internet, por ejemplo), los
 * tiempos no saltan.
 */
export const ahora = () =>
  Math.round(typeof performance !== 'undefined' && performance.timeOrigin ? performance.timeOrigin + performance.now() : Date.now());
