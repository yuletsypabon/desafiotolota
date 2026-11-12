// Tipos compartidos entre API y cliente (fechas serializadas como string ISO)

export type EstadoPrueba = 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA';
export type TipoPunto = 'LEVE' | 'MEDIA' | 'GRAVE' | 'POSITIVO';

export interface PruebaDTO {
  id: string;
  eventoId: string;
  nombre: string;
  posicion: number;
  estado: EstadoPrueba;
  ordenSalida: string[];
  /** ISO; null = no habilitada para el cronometrador */
  habilitadaDesde: string | null;
  _count?: { resultados: number };
}

export interface PenalizacionCfg {
  penLeveMs: number;
  penMediaMs: number;
  penGraveMs: number;
  bonPositivoMs: number;
}

export interface EventoDTO extends PenalizacionCfg {
  id: string;
  anio: number;
  nombre: string;
  logo: string | null;
  numPistas: number;
  pulsadorKey: string;
  descuentoEspiritualPorPuntoMs: number;
  nombreX2: string | null;
  nombreX4: string | null;
  pruebas: PruebaDTO[];
  _count?: { equipos: number };
}

export interface ParticipanteDTO {
  id: string;
  equipoId: string;
  nombre: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  residencia: string | null;
  profesion: string | null;
  contactoNombre: string | null;
  contactoParentesco: string | null;
  contactoTelefono: string | null;
  tipoSangre: string | null;
  alergias: string | null;
  enfermedades: string | null;
  medicamentos: string | null;
  limitaciones: string | null;
  observaciones: string | null;
}

export interface EquipoDTO {
  id: string;
  eventoId: string;
  numero: number;
  nombre: string;
  capitan: string | null;
  logo: string | null;
  /** Color de la carta del capitán (#rrggbb); null = se toma del logo */
  color: string | null;
  participantes: ParticipanteDTO[];
}

export interface PuntajeEspiritualDTO {
  id: string;
  actividadId: string;
  equipoId: string;
  puntos: number;
  equipo: { id: string; numero: number; nombre: string };
}

export interface ActividadEspiritualDTO {
  id: string;
  pruebaId: string;
  nombre: string;
  puntajes: PuntajeEspiritualDTO[];
}

export interface Detencion {
  num: number;
  dur: number;
}

export interface PuntoDTO {
  id: string;
  pruebaId: string;
  equipoId: string;
  participanteId: string | null;
  tipo: TipoPunto;
  descripcion: string | null;
  hora: string | null;
  createdAt: string;
}

export interface FilaPrueba {
  pos: number;
  equipoId: string;
  numero: number;
  nombre: string;
  resultadoId: string;
  pista: number | null;
  salidaAt: string;
  llegadaAt: string;
  brutoMs: number;
  detencionesMs: number;
  detenciones: Detencion[];
  penMs: number;
  puntosEspirituales: number;
  descuentoEspiritualMs: number;
  netoMs: number; // bruto − detenciones
  finalMs: number; // neto ± disciplina
}

export interface FilaGeneral {
  pos: number;
  equipoId: string;
  numero: number;
  nombre: string;
  completadas: number;
  totalMs: number;
  penMs: number;
  descuentoEspiritualMs: number;
  porPrueba: Record<string, { finalMs: number; pos: number }>;
}

export interface ClasificacionPrueba {
  id: string;
  nombre: string;
  estado: EstadoPrueba;
  posicion: number;
  filas: FilaPrueba[];
}

export interface Clasificacion {
  evento: { id: string; nombre: string; anio: number };
  totalPruebas: number;
  pruebas: ClasificacionPrueba[];
  general: FilaGeneral[];
}
