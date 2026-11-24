import type { EstadoPrueba } from './types';

/** Estado visible de cada comprobación antes de abrir el cronómetro. */
export type EstadoChequeo = 'ok' | 'advertencia' | 'pendiente' | 'error';

export interface PruebaPreparacion {
  id: string;
  nombre: string;
  estado: EstadoPrueba;
  habilitadaDesde: string | null;
}

export interface DatosPreparacion {
  servidorDisponible: boolean;
  equipos: number;
  pistas: number;
  prueba: PruebaPreparacion | null;
  respaldoEn: string | null;
  mandoDetectado: boolean;
  mandoProbado: boolean;
  recuperacion: ResumenRecuperacion;
}

export interface ChequeoPreparacion {
  id: 'servidor' | 'equipos' | 'pistas' | 'prueba' | 'recuperacion' | 'mando' | 'respaldo';
  estado: EstadoChequeo;
  titulo: string;
  detalle: string;
  /** Solo estos chequeos impiden abrir la operación desde esta pantalla. */
  bloquea: boolean;
}

/** Estado mínimo que se conserva en el portátil para reconstruir una pista si se recarga la página. */
export interface PistaGuardada {
  state?: string;
  guardado?: string;
}

export interface ResumenRecuperacion {
  activas: number;
  sinGuardar: number;
}

/** Cuenta pistas que deben revisarse al volver a abrir la misma prueba. */
export function resumirPistasGuardadas(pistas: PistaGuardada[] | null | undefined): ResumenRecuperacion {
  let activas = 0;
  let sinGuardar = 0;
  for (const pista of pistas ?? []) {
    if (pista.state === 'run' || pista.state === 'det') activas++;
    if (pista.state === 'fin' && pista.guardado !== 'si') sinGuardar++;
  }
  return { activas, sinGuardar };
}

/**
 * Convierte el estado técnico del evento en una lista breve y comprobable para el día de la prueba.
 * El mando y el respaldo se señalan, pero no bloquean: siempre quedan los controles manuales y el
 * cronometraje debe seguir sirviendo sin conexión a internet.
 */
export function evaluarPreparacion(datos: DatosPreparacion): ChequeoPreparacion[] {
  const pruebaHabilitada = Boolean(datos.prueba?.habilitadaDesde);

  return [
    {
      id: 'servidor',
      estado: datos.servidorDisponible ? 'ok' : 'error',
      titulo: 'Base local',
      detalle: datos.servidorDisponible ? 'PostgreSQL respondió correctamente.' : 'No se pudo leer el evento desde PostgreSQL.',
      bloquea: !datos.servidorDisponible,
    },
    {
      id: 'equipos',
      estado: datos.equipos > 0 ? 'ok' : 'error',
      titulo: 'Equipos cargados',
      detalle: datos.equipos > 0 ? `${datos.equipos} equipo${datos.equipos === 1 ? '' : 's'} disponible${datos.equipos === 1 ? '' : 's'}.` : 'Carga al menos un equipo antes de iniciar.',
      bloquea: datos.equipos === 0,
    },
    {
      id: 'pistas',
      estado: datos.pistas > 0 ? 'ok' : 'error',
      titulo: 'Pistas configuradas',
      detalle: datos.pistas > 0 ? `${datos.pistas} pista${datos.pistas === 1 ? '' : 's'} base configurada${datos.pistas === 1 ? '' : 's'}.` : 'Configura por lo menos una pista.',
      bloquea: datos.pistas === 0,
    },
    {
      id: 'prueba',
      estado: !datos.prueba ? 'error' : pruebaHabilitada ? 'ok' : 'advertencia',
      titulo: 'Prueba de trabajo',
      detalle: !datos.prueba
        ? 'Selecciona la prueba que vas a operar.'
        : pruebaHabilitada
          ? `${datos.prueba.nombre} está habilitada para el cronometrador.`
          : `${datos.prueba.nombre} aún no está habilitada para el cronometrador.`,
      bloquea: !datos.prueba,
    },
    {
      id: 'recuperacion',
      estado: datos.recuperacion.sinGuardar || datos.recuperacion.activas ? 'advertencia' : 'ok',
      titulo: 'Recuperación local',
      detalle: datos.recuperacion.sinGuardar
        ? `${datos.recuperacion.sinGuardar} llegada${datos.recuperacion.sinGuardar === 1 ? '' : 's'} sin guardar: revisa esa${datos.recuperacion.sinGuardar === 1 ? '' : 's'} pista${datos.recuperacion.sinGuardar === 1 ? '' : 's'} antes de continuar.`
        : datos.recuperacion.activas
          ? `${datos.recuperacion.activas} pista${datos.recuperacion.activas === 1 ? '' : 's'} activa${datos.recuperacion.activas === 1 ? '' : 's'} guardada${datos.recuperacion.activas === 1 ? '' : 's'} en este portátil.`
          : 'No hay pistas pendientes de recuperar.',
      bloquea: false,
    },
    {
      id: 'mando',
      estado: datos.mandoProbado ? 'ok' : datos.mandoDetectado ? 'pendiente' : 'advertencia',
      titulo: 'Pulsador arcade',
      detalle: datos.mandoProbado
        ? 'Se detectó una pulsación. El botón rojo solo actuará sobre la pista seleccionada.'
        : datos.mandoDetectado
          ? 'Mando conectado. Pulsa y mantén un botón para comprobarlo.'
          : 'No se detecta un mando. Puedes continuar usando los botones manuales.',
      bloquea: false,
    },
    {
      id: 'respaldo',
      estado: datos.respaldoEn ? 'ok' : 'advertencia',
      titulo: 'Copia de seguridad',
      detalle: datos.respaldoEn
        ? `Última descarga iniciada en este navegador: ${new Date(datos.respaldoEn).toLocaleString('es-CO')}.`
        : 'No hay una descarga registrada en este navegador.',
      bloquea: false,
    },
  ];
}

export function preparacionLista(chequeos: ChequeoPreparacion[]) {
  return chequeos.every((chequeo) => !chequeo.bloquea || chequeo.estado === 'ok');
}
