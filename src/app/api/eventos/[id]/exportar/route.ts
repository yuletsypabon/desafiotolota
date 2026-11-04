import { prisma } from '@/lib/prisma';
import { HttpError, handler, type Ctx } from '@/lib/api';
import { getClasificacion } from '@/lib/data';
import { toCSV } from '@/lib/csv';
import { fmt, fHora } from '@/lib/format';

export const dynamic = 'force-dynamic';

function csvResponse(nombre: string, csv: string) {
  const safe = nombre.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, '').replace(/\s+/g, '_');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.csv`,
    },
  });
}

/**
 * GET /api/eventos/:id/exportar?tipo=general|prueba|todas|participantes[&pruebaId=]
 */
export const GET = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const url = new URL(req.url);
  const tipo = url.searchParams.get('tipo') || 'general';

  if (tipo === 'participantes') {
    const ev = await prisma.evento.findUnique({ where: { id }, select: { nombre: true } });
    const eqs = await prisma.equipo.findMany({
      where: { eventoId: id },
      orderBy: { numero: 'asc' },
      include: { participantes: { orderBy: { nombre: 'asc' } } },
    });
    const rows: (string | number | null)[][] = [
      ['N°', 'Equipo', 'Capitán', 'Participante', 'Nacimiento', 'Teléfono', 'Email', 'Residencia', 'Profesión',
        'Contacto emergencia', 'Parentesco', 'Tel. emergencia', 'Sangre', 'Alergias', 'Enfermedades', 'Medicamentos',
        'Limitaciones', 'Observaciones'],
    ];
    for (const e of eqs)
      for (const p of e.participantes)
        rows.push([e.numero, e.nombre, e.capitan, p.nombre, p.fechaNacimiento, p.telefono, p.email, p.residencia,
          p.profesion, p.contactoNombre, p.contactoParentesco, p.contactoTelefono, p.tipoSangre, p.alergias,
          p.enfermedades, p.medicamentos, p.limitaciones, p.observaciones]);
    return csvResponse(`Fichas_${ev?.nombre ?? id}`, toCSV(rows));
  }

  const c = await getClasificacion(id);

  if (tipo === 'general') {
    const rows: (string | number)[][] = [
      ['Pos', 'N°', 'Equipo', 'Pruebas completadas', ...c.pruebas.map((p) => p.nombre), 'Disciplina (s)', 'Total', 'Total (ms)'],
    ];
    for (const g of c.general)
      rows.push([
        g.pos, g.numero, g.nombre, `${g.completadas}/${c.totalPruebas}`,
        ...c.pruebas.map((p) => (g.porPrueba[p.id] ? fmt(g.porPrueba[p.id].finalMs) : '—')),
        (g.penMs / 1000).toFixed(1), fmt(g.totalMs), g.totalMs,
      ]);
    return csvResponse(`General_${c.evento.nombre}`, toCSV(rows));
  }

  const pruebas =
    tipo === 'prueba' ? c.pruebas.filter((p) => p.id === url.searchParams.get('pruebaId')) : c.pruebas;
  if (!pruebas.length) throw new HttpError(404, 'Prueba no encontrada');
  const rows: (string | number | null)[][] = [
    ['Prueba', 'Pos', 'N°', 'Equipo', 'Pista', 'Salida', 'Llegada', 'Bruto', 'Detenciones', 'Neto', 'Disciplina (s)', 'Final', 'Final (ms)'],
  ];
  for (const p of pruebas)
    for (const f of p.filas)
      rows.push([p.nombre, f.pos, f.numero, f.nombre, f.pista, fHora(f.salidaAt), fHora(f.llegadaAt), fmt(f.brutoMs),
        fmt(f.detencionesMs), fmt(f.netoMs), (f.penMs / 1000).toFixed(1), fmt(f.finalMs), f.finalMs]);
  const nombre = tipo === 'prueba' ? `${c.evento.nombre}_${pruebas[0].nombre}` : `Pruebas_${c.evento.nombre}`;
  return csvResponse(nombre, toCSV(rows));
});
