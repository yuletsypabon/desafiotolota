import Papa from 'papaparse';

/**
 * Genera CSV con BOM (para que Excel abra bien las tildes). Los textos que empiezan con = + - @ (o tabulador) llevan
 * un apóstrofo delante: así Excel no los ejecuta como fórmula (inyección de fórmulas desde un nombre o una ficha).
 */
export function toCSV(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

/**
 * Texto de un archivo CSV. Excel en español a veces guarda en Windows-1252 en lugar de UTF-8:
 * si el archivo no es UTF-8 válido se lee como Windows-1252 para no dañar las tildes.
 */
export function decodificarCSV(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

/** Campos de la ficha de un participante que se pueden importar (todos opcionales menos el nombre). */
export const CAMPOS_FICHA = [
  'fechaNacimiento', 'telefono', 'email', 'residencia', 'profesion', 'contactoNombre', 'contactoParentesco',
  'contactoTelefono', 'tipoSangre', 'alergias', 'enfermedades', 'medicamentos', 'limitaciones', 'observaciones',
] as const;
type CampoFicha = (typeof CAMPOS_FICHA)[number];

export type FichaCSV = { nombre: string } & Partial<Record<CampoFicha, string>>;

export interface FilaEquipoCSV {
  numero: number | null;
  nombre: string;
  capitan: string | null;
  integrantes: FichaCSV[];
}

/** "Tel. emergencia" → "telemergencia": sin tildes, espacios, puntos ni guiones bajos. */
const norm = (h: string) =>
  h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Nombres de columna aceptados (ya normalizados). Incluye los de la exportación «Fichas (CSV)».
const COL_EQUIPO = ['nombreequipo', 'equipo', 'nombredelequipo'];
const COL_NUMERO = ['num', 'numero', 'n', 'no', 'nro'];
const COL_PARTICIPANTE = ['participante', 'integrante', 'nombreparticipante', 'nombredelparticipante', 'nombrecompleto'];
const COL_FICHA: Record<CampoFicha, string[]> = {
  fechaNacimiento: ['nacimiento', 'fechanacimiento', 'fechadenacimiento'],
  telefono: ['telefono', 'celular', 'tel'],
  email: ['email', 'correo', 'correoelectronico'],
  residencia: ['residencia', 'ciudad', 'direccion'],
  profesion: ['profesion', 'ocupacion'],
  contactoNombre: ['contactoemergencia', 'contactodeemergencia', 'contacto', 'nombrecontacto'],
  contactoParentesco: ['parentesco'],
  contactoTelefono: ['telemergencia', 'telefonoemergencia', 'telefonodeemergencia', 'teldeemergencia', 'telefonocontacto'],
  tipoSangre: ['sangre', 'tiposangre', 'tipodesangre', 'rh', 'gruposanguineo'],
  alergias: ['alergias'],
  enfermedades: ['enfermedades'],
  medicamentos: ['medicamentos'],
  limitaciones: ['limitaciones'],
  observaciones: ['observaciones'],
};

/** Valor de la primera columna que exista de la lista. */
const valor = (row: Record<string, string>, cols: string[]) => {
  for (const c of cols) {
    const v = row[c]?.trim();
    if (v) return v;
  }
  return '';
};

/** Fechas de Excel (31/12/2008 o 31-12-2008) a AAAA-MM-DD; lo demás se deja igual. */
export function normalizarFecha(v: string): string {
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : v;
}

/**
 * Lee equipos y fichas desde un CSV (separado por coma o punto y coma). Dos formatos:
 *  - Una fila por participante, con su ficha: equipo, participante, nacimiento, teléfono, … (el de la plantilla
 *    y el de la exportación «Fichas (CSV)»). Las filas del mismo equipo se agrupan.
 *  - Una fila por equipo: num, nombre_equipo, capitan, integrantes (solo nombres, separados por ; o |).
 */
export function parseEquiposCSV(text: string): { filas: FilaEquipoCSV[]; errores: string[] } {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, '').trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: norm,
  });
  const columnas = res.meta.fields ?? [];
  const hayColumnaEquipo = COL_EQUIPO.some((c) => columnas.includes(c));
  // "nombre" es el del equipo en el formato por equipo, y el del participante si hay columna de equipo aparte
  const colEquipo = hayColumnaEquipo ? COL_EQUIPO : [...COL_EQUIPO, 'nombre'];
  const colParticipante = hayColumnaEquipo ? [...COL_PARTICIPANTE, 'nombre'] : COL_PARTICIPANTE;

  const errores = res.errors.map((e) => `Fila ${(e.row ?? 0) + 2}: ${e.message}`);
  const porEquipo = new Map<string, FilaEquipoCSV>();

  res.data.forEach((row, i) => {
    const nombre = valor(row, colEquipo);
    if (!nombre) {
      errores.push(`Fila ${i + 2}: sin nombre de equipo`);
      return;
    }
    const clave = nombre.toLowerCase();
    let eq = porEquipo.get(clave);
    if (!eq) {
      eq = { numero: null, nombre, capitan: null, integrantes: [] };
      porEquipo.set(clave, eq);
    }
    const n = parseInt(valor(row, COL_NUMERO), 10);
    if (eq.numero === null && Number.isFinite(n)) eq.numero = n;
    eq.capitan ??= valor(row, ['capitan']) || null;

    // Formato por participante: la fila trae la ficha completa
    const participante = valor(row, colParticipante);
    if (participante) {
      const ficha: FichaCSV = { nombre: participante };
      for (const campo of CAMPOS_FICHA) {
        const v = valor(row, COL_FICHA[campo]);
        if (v) ficha[campo] = campo === 'fechaNacimiento' ? normalizarFecha(v) : v;
      }
      eq.integrantes.push(ficha);
    }
    // Formato por equipo: solo nombres
    for (const nombreIntegrante of valor(row, ['integrantes']).split(/[;|]/)) {
      if (nombreIntegrante.trim()) eq.integrantes.push({ nombre: nombreIntegrante.trim() });
    }
  });
  return { filas: [...porEquipo.values()], errores };
}

/** Plantilla: una fila por participante, con las mismas columnas que la exportación de fichas. */
export const PLANTILLA_EQUIPOS = toCSV([
  ['N°', 'Equipo', 'Capitán', 'Participante', 'Nacimiento', 'Teléfono', 'Email', 'Residencia', 'Profesión',
    'Contacto emergencia', 'Parentesco', 'Tel. emergencia', 'Sangre', 'Alergias', 'Enfermedades', 'Medicamentos',
    'Limitaciones', 'Observaciones'],
  [1, 'Águila Dorada', 'Juan Pérez', 'Juan Pérez', '15/03/2004', '3001234567', 'juan@correo.com', 'Medellín', 'Estudiante',
    'Rosa Pérez', 'Madre', '3007654321', 'O+', 'Ninguna', '', '', '', ''],
  [1, 'Águila Dorada', 'Juan Pérez', 'María García', '02/11/2005', '3109876543', '', 'Bello', '', 'Luis García', 'Padre',
    '3101112233', 'A+', 'Penicilina', '', '', '', ''],
]);

/**
 * Número de cada equipo al importar, respetando el orden del archivo: si la fila trae número se usa; si no, toma el
 * siguiente al del equipo anterior del archivo (1, 2, 3… si ninguno trae número).
 */
export function numerosSegunArchivo(filas: { numero?: number | null }[]): number[] {
  // Si los números se repiten entre equipos no son de equipo (p. ej. el N° de cada integrante dentro de su
  // equipo: 1, 2, 3… en cada uno). En ese caso se ignoran y manda el orden del archivo.
  const dados = filas.map((f) => f.numero).filter((n): n is number => n != null);
  const usarNumeros = new Set(dados).size === dados.length;
  let ultimo = 0;
  return filas.map((f) => (ultimo = (usarNumeros ? f.numero : null) ?? ultimo + 1));
}
