// Rutas de la app: cada sección del sitio público tiene su propia dirección; el sistema de cronometraje vive bajo /cronometro.

import { EVENTO } from './evento';

/** Página pública de la edición de un año: /desafio-2026 (equipos, pruebas y resultados). */
export const rutaEdicion = (anio: number) => `/desafio-${anio}`;
const ANIO_ACTUAL = EVENTO.inicio.getFullYear();

/** Secciones del sitio público, en el orden del menú. La primera es la edición de este año. */
export const SECCIONES = [
  { ruta: rutaEdicion(ANIO_ACTUAL), nombre: `Desafío ${ANIO_ACTUAL}` },
  { ruta: '/historia', nombre: 'Historia' },
  { ruta: '/ediciones', nombre: 'Ediciones' },
  { ruta: '/espiritual', nombre: 'Espiritual' },
  { ruta: '/recursos', nombre: 'Recursos' },
  { ruta: '/galeria', nombre: 'Galería' },
  { ruta: '/contacto', nombre: 'Contacto' },
] as const;

/** Base del sistema de cronometraje (privado): lista de eventos, cada evento y respaldo. */
const SISTEMA = '/cronometro';

export const RUTAS = {
  inicio: '/',
  login: '/login',
  /** Sistema de cronometraje: lista de eventos (sin sesión, el middleware lleva al login) */
  cronometro: SISTEMA,
  respaldo: `${SISTEMA}/respaldo`,
  /** Pantalla de un evento del sistema: '' (configuración), 'cronometro', 'equipos', 'resultados'… */
  evento: (id: string, seccion = '') => `${SISTEMA}/eventos/${id}${seccion ? `/${seccion}` : ''}`,
} as const;

/** Las rutas privadas exigen sesión; el resto es sitio público. */
export const esRutaPrivada = (ruta: string) => ruta === SISTEMA || ruta.startsWith(`${SISTEMA}/`) || ruta.startsWith('/api/');

const RE_EVENTO = new RegExp(`^${SISTEMA}/eventos/([^/]+)(?:/([^/]+))?`);

/** Evento y sección de una ruta del sistema: "/cronometro/eventos/abc/equipos" → { id: 'abc', seccion: 'equipos' }. */
export function eventoDeRuta(ruta: string): { id: string; seccion: string } | null {
  const m = ruta.match(RE_EVENTO);
  return m ? { id: m[1], seccion: m[2] ?? '' } : null;
}
