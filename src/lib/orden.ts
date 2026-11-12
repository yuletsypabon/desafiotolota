// Orden de salida: patrones y cálculo del orden efectivo.

export type Patron = 'normal' | 'inv' | 'centro' | 'mitad' | 'inter' | 'azar';

export const PATRONES: { id: Patron; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'inv', label: 'Invertido' },
  { id: 'centro', label: 'Desde centro' },
  { id: 'mitad', label: 'Mitad abajo' },
  { id: 'inter', label: 'Intercalado' },
  { id: 'azar', label: 'Aleatorio' },
];

/** `base` debe venir ordenado por número de inscripción. */
export function aplicarPatron<T>(base: T[], p: Patron, random: () => number = Math.random): T[] {
  const n = base.length;
  switch (p) {
    case 'normal':
      return base.slice();
    case 'inv':
      return base.slice().reverse();
    case 'centro': {
      // Desde el centro hacia afuera: m, m+1, m-1, m+2, m-2…
      const o: T[] = [];
      const m = Math.floor((n - 1) / 2);
      if (n) o.push(base[m]);
      for (let d = 1; o.length < n; d++) {
        if (m + d < n) o.push(base[m + d]);
        if (m - d >= 0) o.push(base[m - d]);
      }
      return o;
    }
    case 'mitad':
      return base.slice(Math.floor(n / 2)).concat(base.slice(0, Math.floor(n / 2)));
    case 'inter':
      return base.filter((_, i) => i % 2 === 0).concat(base.filter((_, i) => i % 2 !== 0));
    case 'azar': {
      // Fisher–Yates: todas las permutaciones con la misma probabilidad
      const o = base.slice();
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
      }
      return o;
    }
  }
}

/**
 * Orden efectivo: primero los IDs guardados (si el equipo existe),
 * luego los equipos nuevos que no estaban en el orden, por número.
 */
export function ordenEfectivo<E extends { id: string; numero: number }>(ordenSalida: string[], equipos: E[]): E[] {
  const map = new Map(equipos.map((e) => [e.id, e]));
  const vistos = new Set<string>();
  const out: E[] = [];
  for (const id of ordenSalida) {
    const e = map.get(id);
    if (e && !vistos.has(id)) {
      out.push(e);
      vistos.add(id);
    }
  }
  const resto = equipos.filter((e) => !vistos.has(e.id)).sort((a, b) => a.numero - b.numero);
  return out.concat(resto);
}
