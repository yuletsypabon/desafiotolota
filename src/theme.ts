import { createTheme } from '@mui/material/styles';

import { COLORS, FONT_DISPLAY, FONT_MONO, alfa } from './colors';
import { FONDO_FOTO, FUENTE_TEXTO, MARCA, VIDRIO } from './lib/marca';

export { COLORS, FONT_DISPLAY, FONT_MONO, alfa };

/** Escala de espacio del sistema: pasos de 4 px, con márgenes y tarjetas que responden al ancho. */
export const ESPACIADO_SISTEMA = {
  pagina: { px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } },
  tarjeta: { p: { xs: 2, sm: 2.5 } },
  seccion: 2,
} as const;

/** Vidrio esmerilado del sistema (mismo efecto que el sitio, algo más opaco para leer tiempos y tablas). */
export const VIDRIO_SISTEMA = {
  fondo: 'rgba(22,22,27,.62)',
  fondoSuave: 'rgba(255,255,255,.04)', // cajas dentro de un panel
  radio: `${VIDRIO.radio - 6}px`,
  radioChico: '12px',
} as const;

/** `sx` de una superficie de vidrio: `<Box sx={{ ...superficieVidrio, p: 2 }}>`. */
export const superficieVidrio = {
  bgcolor: VIDRIO_SISTEMA.fondo,
  backdropFilter: VIDRIO.desenfoque,
  border: `1px solid ${MARCA.vidrioBorde}`,
  borderRadius: VIDRIO_SISTEMA.radio,
  boxShadow: VIDRIO.brillo,
} as const;

/** `sx` de una caja dentro de un panel de vidrio (listas, filas arrastrables, bloques de código). */
export const cajaVidrio = {
  bgcolor: VIDRIO_SISTEMA.fondoSuave,
  border: `1px solid ${MARCA.vidrioBorde}`,
  borderRadius: VIDRIO_SISTEMA.radioChico,
} as const;

// Títulos: Anton en mayúsculas, como el sitio público (Anton tiene un solo grosor: 400)
const display = { fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: '0.01em', textTransform: 'uppercase' as const, lineHeight: 1.05 };

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: COLORS.acento, contrastText: COLORS.bg },
    secondary: { main: COLORS.blue },
    success: { main: COLORS.green, contrastText: '#000' },
    warning: { main: COLORS.detenido, contrastText: '#000' },
    error: { main: COLORS.red, contrastText: COLORS.bg },
    info: { main: COLORS.blue },
    background: { default: COLORS.bg, paper: COLORS.card },
    divider: COLORS.border,
    text: { primary: COLORS.text, secondary: COLORS.dim },
  },
  shape: { borderRadius: 2 },
  typography: {
    fontFamily: FUENTE_TEXTO,
    h1: { ...display, fontSize: '2.6rem' },
    h2: { ...display, fontSize: '2.1rem' },
    h3: { ...display, fontSize: '1.7rem' },
    h4: { ...display, fontSize: '1.45rem', color: COLORS.acento },
    h5: { ...display, fontSize: '1.2rem' },
    h6: { ...display, fontSize: '1.05rem' },
    button: { fontWeight: 500, textTransform: 'none' },
    overline: { fontWeight: 500, letterSpacing: '0.04em' },
  },
  components: {
    MuiPaper: {
      // Vidrio esmerilado, algo más opaco que en el sitio para leer bien tablas y tiempos
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: VIDRIO_SISTEMA.fondo,
          backdropFilter: VIDRIO.desenfoque,
          border: `1px solid ${MARCA.vidrioBorde}`,
          borderRadius: VIDRIO_SISTEMA.radio,
          boxShadow: VIDRIO.brillo,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      // Píldora, como en el sitio público
      styleOverrides: { root: { letterSpacing: '.04em', borderRadius: 999, fontWeight: 700, paddingInline: 18 }, containedPrimary: { '&:hover': { backgroundColor: MARCA.primarioHover } } },
    },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiFilledInput: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiDialog: { defaultProps: { fullWidth: true }, styleOverrides: { paper: { borderRadius: VIDRIO.radio, backgroundColor: 'rgba(22,22,27,.9)' } } },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: 'rgba(22,22,27,.92)' } } },
    MuiCssBaseline: {
      // Fondo: la foto del bosque oscurecida, en una capa fija que cubre siempre toda la ventana
      // (no depende de lo largo del contenido y funciona también en celulares, donde `background-attachment: fixed` falla)
      styleOverrides: {
        body: {
          backgroundColor: COLORS.bg,
          '&::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            pointerEvents: 'none',
            background: `linear-gradient(rgba(5,5,5,.6), rgba(5,5,5,.78)), url(${FONDO_FOTO}) center / cover no-repeat`,
          },
        },
      },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiTableCell: { styleOverrides: { root: { borderColor: COLORS.border, padding: '6px 10px' }, head: { color: COLORS.dim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' } } },
    MuiTab: { styleOverrides: { root: { fontWeight: 700, minHeight: 44 } } },
  },
});
