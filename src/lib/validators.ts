import { z } from 'zod';

const optStr = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

// Logos: data URL de imagen (máx ~1.5 MB en texto)
const logo = z
  .string()
  .max(1_500_000, 'El logo es demasiado grande')
  .refine((v) => v === '' || v.startsWith('data:image/') || /^https?:\/\//.test(v), 'Logo inválido')
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const ms = z.number().int().min(0).max(600_000);

export const eventoCreate = z.object({
  anio: z.number().int().min(2000).max(2100),
  nombre: z.string().trim().min(1, 'Nombre obligatorio').max(200),
  logo,
  numPistas: z.number().int().min(1).max(8).optional(),
  pulsadorKey: z.string().trim().length(1).optional(),
  penLeveMs: ms.optional(),
  penMediaMs: ms.optional(),
  penGraveMs: ms.optional(),
  bonPositivoMs: ms.optional(),
  /** Nombres de pruebas iniciales */
  pruebas: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  /** Copiar equipos (sin resultados) de otro evento */
  copiarEquiposDe: z.string().optional(),
});

export const eventoUpdate = eventoCreate.omit({ pruebas: true, copiarEquiposDe: true }).partial();

export const pruebaCreate = z.object({ nombre: z.string().trim().min(1).max(200) });

export const pruebaUpdate = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    estado: z.enum(['PENDIENTE', 'EN_CURSO', 'FINALIZADA']),
    ordenSalida: z.array(z.string()).max(500),
    /** null = deshabilitada para el cronometrador */
    habilitadaDesde: z.coerce.date().nullable(),
  })
  .partial();

/** Lo único que el cronometrador puede cambiar de una prueba */
export const pruebaUpdateCrono = pruebaUpdate.pick({ estado: true, ordenSalida: true }).strict();

export const pruebasReorder = z.object({ ids: z.array(z.string()).min(1) });

export const equipoCreate = z.object({
  numero: z.number().int().min(0).max(100000).optional(),
  nombre: z.string().trim().min(1, 'Nombre obligatorio').max(200),
  capitan: optStr,
  logo,
});
export const equipoUpdate = equipoCreate.partial();

export const equiposImport = z.object({
  filas: z
    .array(
      z.object({
        numero: z.number().int().optional().nullable(),
        nombre: z.string().trim().min(1),
        capitan: z.string().optional().nullable(),
        integrantes: z.array(z.string().trim().min(1)).optional(),
      }),
    )
    .min(1)
    .max(1000),
});

export const participanteFields = z.object({
  nombre: z.string().trim().min(1, 'Nombre obligatorio').max(200),
  fechaNacimiento: optStr,
  telefono: optStr,
  email: optStr,
  residencia: optStr,
  profesion: optStr,
  contactoNombre: optStr,
  contactoParentesco: optStr,
  contactoTelefono: optStr,
  tipoSangre: optStr,
  alergias: optStr,
  enfermedades: optStr,
  medicamentos: optStr,
  limitaciones: optStr,
  observaciones: optStr,
});
export const participanteUpdate = participanteFields.partial().extend({ equipoId: z.string().optional() });

export const detencion = z.object({ num: z.number().int(), dur: z.number().int().min(0) });

export const resultadoUpsert = z.object({
  equipoId: z.string().min(1),
  pista: z.number().int().min(1).max(8).optional().nullable(),
  salidaAt: z.coerce.date(),
  llegadaAt: z.coerce.date(),
  brutoMs: z.number().int().min(0),
  detenciones: z.array(detencion).max(200).default([]),
  observacion: optStr,
});

/** Corregir pista: los tiempos de A pasan a B y los de B a A */
export const resultadoIntercambio = z
  .object({ equipoA: z.string().min(1), equipoB: z.string().min(1) })
  .refine((d) => d.equipoA !== d.equipoB, { message: 'Elige dos equipos distintos' });

export const puntoCreate = z.object({
  pruebaId: z.string().min(1),
  equipoId: z.string().min(1),
  participanteId: z.string().optional().nullable(),
  tipo: z.enum(['LEVE', 'MEDIA', 'GRAVE', 'POSITIVO']),
  descripcion: optStr,
  hora: optStr,
});

// ── Sesión y contraseñas ──────────────────────────────────────
const rol = z.enum(['ADMIN', 'CRONO']);
export const MIN_CLAVE = 4;
const clave = z.string().min(MIN_CLAVE, `Mínimo ${MIN_CLAVE} caracteres`).max(100);

export const login = z.object({ rol, clave: z.string().min(1, 'Escribe la contraseña').max(100) });

/** Contraseñas iniciales (comando `npm run claves`) */
export const clavesIniciales = z
  .object({ admin: clave, crono: clave })
  .refine((d) => d.admin !== d.crono, { message: 'Usa contraseñas distintas para cada rol' });

export const cambioClave = z.object({ rol, nueva: clave, actual: z.string().max(100).optional() });
