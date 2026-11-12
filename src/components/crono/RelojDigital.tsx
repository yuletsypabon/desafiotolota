import { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { fmt } from '@/lib/format';
import { numeroVuelta, progresoVuelta } from '@/lib/reloj';
import { FONT_MONO } from '@/theme';

/**
 * Reloj de una pista: hh:mm:ss grande y las centésimas más pequeñas al lado. Debajo, una barra delgada que se llena
 * cada 30 minutos para ver de un vistazo cuánto lleva el equipo en pista.
 */
function RelojDigital({ ms, color }: { ms: number; color: string }) {
  const [h, m, s, cs] = fmt(ms).split(':');
  const vuelta = numeroVuelta(ms);

  return (
    <Box role="timer" aria-label={`Tiempo ${fmt(ms)}`} sx={{ width: '100%', color, textAlign: 'center' }}>
      <Typography
        component="div"
        sx={{
          fontFamily: FONT_MONO, fontWeight: 600, lineHeight: 1, color: 'inherit',
          fontSize: 'clamp(30px, 2.6vw, 42px)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}
      >
        {h}:{m}:{s}
        <Box component="span" sx={{ fontSize: '0.55em', opacity: 0.75, ml: 0.25 }}>.{cs}</Box>
      </Typography>

      {/* Barra de la vuelta actual (una vuelta = 30 min) */}
      <Box sx={{ mt: 1.25, height: 4, borderRadius: 999, bgcolor: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${progresoVuelta(ms) * 100}%`, bgcolor: 'currentColor', borderRadius: 999 }} />
      </Box>
      {vuelta > 1 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'inherit', opacity: 0.75, letterSpacing: '0.1em' }}>
          Vuelta {vuelta} · cada vuelta son 30 min
        </Typography>
      )}
    </Box>
  );
}

export default memo(RelojDigital);
