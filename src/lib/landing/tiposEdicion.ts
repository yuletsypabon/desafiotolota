// Datos públicos de la página de una edición (/desafio-2026). Solo lo que se puede mostrar a cualquiera:
// nunca fichas, teléfonos, edades ni información médica.

export interface IntegrantePublico {
  id: string;
  /** Primer nombre y primer apellido */
  nombre: string;
  /** Lugar de origen (residencia de la ficha) */
  lugar: string | null;
  capitan: boolean;
}

export interface EquipoPublico {
  id: string;
  numero: number;
  nombre: string;
  logo: string | null;
  /** Color elegido para la carta del capitán (si no hay, se toma del logo) */
  color: string | null;
  /** Primer nombre y primer apellido del capitán */
  capitan: string | null;
  integrantes: IntegrantePublico[];
}

export interface PruebaPublica {
  id: string;
  nombre: string;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA';
}

export interface EdicionPublica {
  eventoId: string;
  anio: number;
  /** "X6" */
  codigo: string;
  nombre: string;
  logo: string | null;
  pruebas: PruebaPublica[];
  equipos: EquipoPublico[];
}

/** Resultados para la página pública: solo posiciones y tiempos por equipo. */
export interface ResultadosPublicos {
  totalPruebas: number;
  general: { pos: number; equipoId: string; numero: number; nombre: string; completadas: number; totalMs: number }[];
  pruebas: { id: string; nombre: string; estado: PruebaPublica['estado']; filas: { pos: number; equipoId: string; nombre: string; finalMs: number }[] }[];
}
