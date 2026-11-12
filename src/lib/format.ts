export const pad = (n: number) => String(n).padStart(2, '0');

/** hh:mm:ss:cc (horas:minutos:segundos:centésimas). Las centésimas se truncan, no se redondean. */
export function fmt(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(cs)}`;
}

/** +0.3s / -0.1s */
export function fmtSeg(ms: number): string {
  const s = (ms / 1000).toFixed(1);
  return ms > 0 ? `+${s}s` : `${s}s`;
}

export function fmtMsPreciso(ms: number): string {
  return `${ms.toLocaleString('es-CO', { maximumFractionDigits: 3 })} ms`;
}

export function fHora(d?: string | number | Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function fFecha(d?: string | number | Date | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function horaActual(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function edad(fechaNac?: string | null): string {
  if (!fechaNac) return '';
  const h = new Date();
  const n = new Date(fechaNac);
  if (isNaN(n.getTime())) return '';
  let a = h.getFullYear() - n.getFullYear();
  const dm = h.getMonth() - n.getMonth();
  if (dm < 0 || (dm === 0 && h.getDate() < n.getDate())) a--;
  return `${a} años`;
}

export function inicial(nombre?: string | null) {
  return (nombre || '?').trim().charAt(0).toUpperCase() || '?';
}

/** Dos iniciales de un nombre de persona: "María José García" → "MG". */
export function iniciales(nombre?: string | null) {
  const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primera = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return (primera + ultima).toUpperCase();
}

const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'san']);

/**
 * Primer nombre y primer apellido de un nombre completo, como en una presentación de jugadores:
 * "Juan Pérez" → Juan / Pérez · "Juan Pérez Gómez" → Juan / Pérez · "Ana María Rodríguez Gómez" → Ana / Rodríguez.
 * Con tres palabras se asume nombre + dos apellidos. Las partículas van con su apellido: "Luis de la Cruz" → Luis / de la Cruz.
 */
export function nombreYApellido(completo?: string | null): { nombre: string; apellido: string } {
  const palabras = (completo || '').trim().split(/\s+/).filter(Boolean);
  if (palabras.length <= 1) return { nombre: '', apellido: palabras[0] ?? '' };
  // Se agrupan las partículas con la palabra que sigue ("de la Cruz" cuenta como una sola)
  const partes: string[] = [];
  let pendiente = '';
  for (const p of palabras) {
    if (PARTICULAS.has(p.toLowerCase())) pendiente += `${p} `;
    else {
      partes.push(pendiente + p);
      pendiente = '';
    }
  }
  if (pendiente) partes.push(pendiente.trim());
  const apellido = partes.length >= 4 ? partes[2] : partes[1] ?? '';
  return { nombre: partes[0], apellido };
}

/**
 * Nombre con mayúscula inicial en cada palabra, como se escribe un nombre propio: "jhon NUÑEZ" → "Jhon Nuñez".
 * Las partículas van en minúscula ("Luis de la Cruz"), salvo al inicio.
 */
export function nombrePropio(nombre?: string | null) {
  return (nombre || '').trim().split(/\s+/).filter(Boolean).map((p, i) => {
    const min = p.toLocaleLowerCase('es');
    if (i > 0 && PARTICULAS.has(min)) return min;
    return min.charAt(0).toLocaleUpperCase('es') + min.slice(1);
  }).join(' ');
}
