// Hoja imprimible del orden de salida (sirve también para "Guardar como PDF" desde el diálogo de impresión).

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

interface FilaOrden {
  numero: number;
  nombre: string;
  capitan: string | null;
}

/** HTML completo de la hoja de orden de salida, listo para imprimir. Funciona sin internet. */
export function htmlOrdenSalida(o: { evento: string; prueba: string; equipos: FilaOrden[]; fecha?: Date }): string {
  const e = escapeHtml;
  const fecha = (o.fecha ?? new Date()).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const filas = o.equipos
    .map(
      (q, i) =>
        `<tr><td class="c">${i + 1}</td><td class="c">${q.numero}</td><td><b>${e(q.nombre)}</b></td><td>${e(q.capitan ?? '')}</td><td></td><td></td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Orden de salida — ${e(o.prueba)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  header { border-bottom: 3px solid #b8892b; padding-bottom: 8px; margin-bottom: 14px; }
  .ev { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #8a6a1f; font-weight: 700; }
  h1 { font-size: 22px; margin: 4px 0 2px; }
  .meta { font-size: 12px; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; border-bottom: 2px solid #333; padding: 6px; }
  td { border-bottom: 1px solid #ccc; padding: 9px 6px; }
  tr { break-inside: avoid; }
  .c { text-align: center; width: 48px; }
  th.w, td:nth-child(5), td:nth-child(6) { width: 90px; }
  footer { margin-top: 14px; font-size: 11px; color: #777; }
</style></head><body>
<header>
  <div class="ev">${e(o.evento)}</div>
  <h1>Orden de salida · ${e(o.prueba)}</h1>
  <div class="meta">${e(fecha)} · ${o.equipos.length} equipos</div>
</header>
<table>
  <thead><tr><th class="c">Orden</th><th class="c">N.º</th><th>Equipo</th><th>Capitán</th><th class="w">Pista</th><th class="w">Hora salida</th></tr></thead>
  <tbody>${filas}</tbody>
</table>
<footer>Desafío Tolotá — Sistema de cronometraje</footer>
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`;
}

/** Abre la hoja en una ventana nueva y lanza el diálogo de impresión. Devuelve false si el navegador bloqueó la ventana. */
export function imprimirHtml(html: string): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
