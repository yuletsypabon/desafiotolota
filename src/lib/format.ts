export const pad = (n: number) => String(n).padStart(2, '0');

/** mm:ss.cc  (si pasa de una hora: h:mm:ss.cc) */
export function fmt(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return (h ? `${h}:` : '') + `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

/** +0.3s / -0.1s */
export function fmtSeg(ms: number): string {
  const s = (ms / 1000).toFixed(1);
  return ms > 0 ? `+${s}s` : `${s}s`;
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
