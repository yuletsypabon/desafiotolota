// Reserva de equipos entre dispositivos que cronometran la misma prueba.

/** Cada cuánto el dispositivo informa sus pistas al servidor. */
export const INTERVALO_RESERVA_MS = 4000;

/** Si un dispositivo no se reporta en este tiempo (se cerró o perdió la red), sus reservas vencen. */
export const VENCE_RESERVA_MS = 2 * 60 * 1000;

/** Equipos que un dispositivo tiene en sus pistas (cargados, en pista, detenidos o llegados sin liberar). */
export function equiposEnPistas(lanes: { equipoId: string | null; state: string }[]) {
  return lanes.flatMap((l, i) => (l.equipoId && l.state !== 'idle' ? [{ equipoId: l.equipoId, pista: i + 1 }] : []));
}
