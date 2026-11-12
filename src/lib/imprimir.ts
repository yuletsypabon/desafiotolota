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
  const filas = o.equipos.length
    ? o.equipos.map((q, i) => `
        <tr>
          <td class="order"><span>${i + 1}</span></td>
          <td class="number">${q.numero}</td>
          <td class="team"><strong>${e(q.nombre)}</strong></td>
          <td class="captain">${q.capitan ? e(q.capitan) : '<span class="blank">—</span>'}</td>
          <td class="write-in"><span></span></td>
          <td class="write-in"><span></span></td>
        </tr>`)
      .join('')
    : '<tr><td class="empty" colspan="6">No hay equipos en el orden de salida.</td></tr>';
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Orden de salida — ${e(o.prueba)}</title>
<style>
  @page { size: A4 portrait; margin: 13mm 14mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #17212b; margin: 0; font-size: 12px; }
  header { position: relative; padding: 0 0 16px; margin-bottom: 20px; border-bottom: 2px solid #b8892b; text-align: center; }
  .brand { display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 24px; }
  .brand-name { color: #8a6a1f; font-size: 11px; font-weight: 800; letter-spacing: 2.2px; text-transform: uppercase; }
  .document-type { border: 1px solid #d8dfe4; border-radius: 20px; color: #576574; padding: 6px 11px; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .eyebrow { color: #697887; font-size: 10px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; margin-bottom: 5px; }
  h1 { color: #17212b; font-size: 27px; line-height: 1.15; margin: 0 0 5px; }
  .event-name { color: #6d7780; font-size: 15px; font-weight: 600; }
  .summary { display: flex; justify-content: center; gap: 10px; margin: 0 auto 20px; max-width: 600px; }
  .summary-item { flex: 1; border: 1px solid #dfe4e8; border-top: 3px solid #b8892b; border-radius: 5px; padding: 9px 11px; min-height: 48px; text-align: center; }
  .summary-label { display: block; color: #7a858e; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .summary-value { color: #263440; font-size: 11px; font-weight: 700; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; font-size: 12px; }
  thead { display: table-header-group; }
  th { background: #263b43; color: #fff; text-align: center; font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; padding: 11px 9px; }
  th:first-child { border-radius: 5px 0 0 0; }
  th:last-child { border-radius: 0 5px 0 0; }
  td { border-bottom: 1px solid #dce1e4; padding: 13px 9px; vertical-align: middle; height: 48px; }
  tbody tr:nth-child(even) td { background: #f5f7f8; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .order, .number { text-align: center; width: 52px; }
  .order span { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; border: 1px solid #c69b42; border-radius: 50%; color: #765915; font-weight: 800; }
  .number { color: #66737d; font-weight: 700; }
  .team { width: 31%; font-size: 13px; text-align: center; }
  .captain { width: 25%; text-align: center; }
  .write-in { width: 15%; text-align: center; }
  .write-in span { display: block; width: 85%; height: 17px; border-bottom: 1px solid #aeb8bf; margin: 0 auto; }
  .blank { color: #9aa4ab; }
  .empty { text-align: center; color: #697887; padding: 28px 10px; }
  .instructions { margin-top: 12px; color: #6d7780; font-size: 10px; text-align: center; }
  footer { position: fixed; bottom: -9mm; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; border-top: 1px solid #dce1e4; padding-top: 7px; color: #77828a; font-size: 9px; }
  @media screen {
    body { max-width: 900px; margin: 30px auto; padding: 0 28px; }
    header { padding-top: 12px; }
  }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style></head><body>
<header>
  <div class="brand">
    <div class="brand-name">Desafío Tolotá</div>
    <div class="document-type">Cronometraje · Orden oficial</div>
  </div>
  <div class="eyebrow">Orden de salida</div>
  <h1>${e(o.prueba)}</h1>
  <div class="event-name">${e(o.evento)}</div>
</header>
<section class="summary" aria-label="Resumen del orden">
  <div class="summary-item"><span class="summary-label">Fecha de impresión</span><span class="summary-value">${e(fecha)}</span></div>
  <div class="summary-item"><span class="summary-label">Equipos en competencia</span><span class="summary-value">${o.equipos.length}</span></div>
</section>
<table>
  <thead><tr><th class="order">Orden</th><th class="number">N.º</th><th class="team">Equipo</th><th class="captain">Capitán</th><th class="write-in">Pista</th><th class="write-in">Hora de salida</th></tr></thead>
  <tbody>${filas}</tbody>
</table>
<div class="instructions">Registra la pista asignada y la hora de salida de cada equipo antes de iniciar la prueba.</div>
<footer><span>Desafío Tolotá · Sistema de cronometraje</span><span>Hoja de orden de salida</span></footer>
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
