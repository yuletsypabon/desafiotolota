import { createTheme } from '@mui/material/styles';

import { COLORS, FONT_DISPLAY, FONT_MONO } from './colors';

export { COLORS, FONT_DISPLAY, FONT_MONO };

const display = { fontFamily: FONT_DISPLAY, letterSpacing: '0.08em', fontWeight: 400 };

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: COLORS.gold, contrastText: '#000' },
    secondary: { main: COLORS.blue },
    success: { main: COLORS.green, contrastText: '#000' },
    warning: { main: COLORS.orange, contrastText: '#000' },
    error: { main: COLORS.red },
    info: { main: COLORS.blue },
    background: { default: COLORS.bg, paper: COLORS.card },
    divider: COLORS.border,
    text: { primary: COLORS.text, secondary: COLORS.dim },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: { ...display, fontSize: '2.4rem' },
    h2: { ...display, fontSize: '2rem' },
    h3: { ...display, fontSize: '1.6rem' },
    h4: { ...display, fontSize: '1.35rem', color: COLORS.gold },
    h5: { ...display, fontSize: '1.15rem' },
    h6: { ...display, fontSize: '1rem' },
    button: { fontWeight: 700, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.06em' },
  },
  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none', border: `1px solid ${COLORS.border}` } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { background: COLORS.surf, borderBottom: `2px solid ${COLORS.gold}`, borderTop: 0, borderLeft: 0, borderRight: 0 },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiTableCell: { styleOverrides: { root: { borderColor: COLORS.border, padding: '6px 10px' }, head: { color: COLORS.dim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' } } },
    MuiTab: { styleOverrides: { root: { fontWeight: 700, minHeight: 44 } } },
    MuiDialog: { defaultProps: { fullWidth: true } },
  },
});
