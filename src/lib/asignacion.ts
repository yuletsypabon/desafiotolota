// Asignación automática: cada pista libre recibe el siguiente equipo del orden de salida (función pura).

interface PistaMinima {
  equipoId: string | null;
  state: string;
}

/**
 * Devuelve qué equipo va a qué pista libre: `[índice de pista, equipoId]`.
 * - Las pistas libres (`idle`) se llenan en orden: pista 1, luego 2…
 * - `pendientes` viene en orden de salida y sin los equipos que ya terminaron.
 * - Un equipo que ya está en alguna pista no se vuelve a asignar.
 */
export function asignacionesLibres(pistas: PistaMinima[], pendientes: string[]): [number, string][] {
  const ocupados = new Set(pistas.filter((p) => p.state !== 'idle' && p.equipoId).map((p) => p.equipoId!));
  const cola = pendientes.filter((id) => !ocupados.has(id));
  const out: [number, string][] = [];
  pistas.forEach((p, i) => {
    if (p.state === 'idle' && cola.length) out.push([i, cola.shift()!]);
  });
  return out;
}
