// "Corregir pista": intercambio de equipos entre pistas / tiempos guardados (funciones puras).

/**
 * Cambia el equipo `a` por `b` y viceversa en las pistas. Los tiempos, detenciones y estado
 * se quedan en su pista: solo cambia a qué equipo pertenecen.
 */
export function intercambiarEnPistas<L extends { equipoId: string | null }>(lanes: L[], a: string, b: string): L[] {
  return lanes.map((l) =>
    l.equipoId === a ? { ...l, equipoId: b } : l.equipoId === b ? { ...l, equipoId: a } : l,
  );
}

/** Intercambia la pertenencia de `a` y `b` en un conjunto (p. ej. equipos ya finalizados). */
export function intercambiarEnSet(s: Set<string>, a: string, b: string): Set<string> {
  const n = new Set(s);
  const tieneA = s.has(a);
  const tieneB = s.has(b);
  n.delete(a);
  n.delete(b);
  if (tieneA) n.add(b);
  if (tieneB) n.add(a);
  return n;
}
