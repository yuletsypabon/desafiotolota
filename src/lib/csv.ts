import Papa from 'papaparse';

/** Genera CSV con BOM (para que Excel abra bien las tildes). */
export function toCSV(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

export interface FilaEquipoCSV {
  numero: number | null;
  nombre: string;
  capitan: string | null;
  integrantes: string[];
}

const norm = (h: string) =>
  h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

/**
 * Columnas aceptadas: num | numero, nombre_equipo | equipo | nombre, capitan, integrantes (separados por ; o |)
 * La columna "ano" del formato anterior se ignora: el evento se elige en la pantalla.
 */
export function parseEquiposCSV(text: string): { filas: FilaEquipoCSV[]; errores: string[] } {
  const res = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: norm,
  });
  const errores = res.errors.map((e) => `Fila ${(e.row ?? 0) + 2}: ${e.message}`);
  const filas: FilaEquipoCSV[] = [];
  res.data.forEach((row, i) => {
    const nombre = (row['nombre_equipo'] || row['equipo'] || row['nombre'] || '').trim();
    if (!nombre) {
      errores.push(`Fila ${i + 2}: sin nombre de equipo`);
      return;
    }
    const n = parseInt(row['num'] || row['numero'] || row['n'] || '', 10);
    filas.push({
      numero: Number.isFinite(n) ? n : null,
      nombre,
      capitan: (row['capitan'] || '').trim() || null,
      integrantes: (row['integrantes'] || '')
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
  });
  return { filas, errores };
}

export const PLANTILLA_EQUIPOS =
  'num,nombre_equipo,capitan,integrantes\n' +
  '1,Águila Dorada,Juan Pérez,María García;Carlos López;Ana Rodríguez\n' +
  '2,Toro Rojo,Pedro Martínez,Laura Gómez;Diego Torres\n';
