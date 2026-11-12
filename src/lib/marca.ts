import type React from 'react';

// Identidad visual del DESAFÍO Tolotá: una sola fuente de colores y fuentes para el sitio y el cronometraje.
// Negro profundo, texto blanco hueso y amarillo como único acento (diseño de Figma).
// Los nombres describen la función del color, no el color: así se puede cambiar la paleta sin renombrar nada.

export const MARCA = {
  fondo: '#050505',
  fondo2: '#111114', // secciones alternas
  panel: '#1b1b22', // bloques destacados (p. ej. «Mucho más que un reto»)
  primario: '#ffcc00', // amarillo: botones y acciones
  primarioHover: '#ffd633',
  destacado: '#ffcc00', // amarillo: palabras resaltadas, etiquetas, foco
  texto: '#f4f3ec', // blanco hueso
  textoSuave: '#b8b7ae', // párrafos y etiquetas
  linea: 'rgba(244,243,236,.16)', // divisores finos
  vidrio: 'rgba(255,255,255,.06)', // tarjetas de vidrio esmerilado (semitransparentes)
  vidrioBorde: 'rgba(255,255,255,.14)',
} as const;

/** Efecto vidrio esmerilado: desenfoque de lo que hay detrás + borde fino luminoso. */
export const VIDRIO = {
  desenfoque: 'blur(18px) saturate(140%)',
  radio: 22, // px
  brillo: 'inset 0 1px 0 rgba(255,255,255,.08), 0 20px 50px rgba(0,0,0,.35)',
} as const;

/** Foto de fondo liviana (WebP de 86 KB) para páginas y sistema, bajo un velo oscuro. */
export const FONDO_FOTO = '/fotos/fondo-bosque.webp';

/** Superficies del sistema de cronometraje (mismo negro, tarjetas apenas más claras). */
export const OSCURO = {
  fondo: MARCA.fondo,
  superficie: '#0e0e11',
  tarjeta: '#16161b',
  linea: '#2a2a31',
  texto: MARCA.texto,
  textoSuave: MARCA.textoSuave,
} as const;

/** Logo oficial (insignia circular). */
export const LOGO = '/marca/logo-desafio-tolota.webp';

export const FUENTE_TITULOS = '"Anton", "Arial Narrow", sans-serif';
export const FUENTE_TEXTO = '"Space Grotesk", system-ui, sans-serif';
export const FUENTE_MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** Los tokens como variables CSS (--fondo, --texto…), aplicadas en <html> para que cualquier CSS las use. */
export const VARIABLES_CSS = {
  '--fondo': MARCA.fondo,
  '--fondo2': MARCA.fondo2,
  '--panel': MARCA.panel,
  '--primario': MARCA.primario,
  '--primario-hover': MARCA.primarioHover,
  '--destacado': MARCA.destacado,
  '--destacado-rgb': '255,204,0',
  '--texto': MARCA.texto,
  '--textoSuave': MARCA.textoSuave,
  '--linea': MARCA.linea,
  '--vidrio': MARCA.vidrio,
  '--vidrio-borde': MARCA.vidrioBorde,
  '--vidrio-desenfoque': VIDRIO.desenfoque,
  '--vidrio-radio': `${VIDRIO.radio}px`,
  '--vidrio-brillo': VIDRIO.brillo,
  '--fondo-foto': `url(${FONDO_FOTO})`,
  '--font-display': FUENTE_TITULOS,
  '--font-body': FUENTE_TEXTO,
  '--font-mono': FUENTE_MONO,
} as React.CSSProperties;
