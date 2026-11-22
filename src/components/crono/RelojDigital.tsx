import { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { fmt } from '@/lib/format';
import { numeroVuelta, progresoVuelta } from '@/lib/reloj';
import { FUENTE_TEXTO } from '@/lib/marca';

/**
 * Reloj de una pista: hh:mm:ss grande y las centésimas más pequeñas al lado. Debajo, una barra delgada que se llena
 * cada 15 minutos para ver de un vistazo cuánto lleva el equipo en pista.
 */
function RelojDigital({ ms, color }: { ms: number; color: string }) {
  const [h, m, s, cs] = fmt(ms).split(':');
  const vuelta = numeroVuelta(ms);

  return (
    <Box role="timer" aria-label={`Tiempo ${fmt(ms)}`} sx={{ width: '100%', color, textAlign: 'center' }}>
      <Typography
        component="div"
        sx={{
          // Space Grotesk es la tipografía de lectura del sitio: más abierta que la monoespaciada para el reloj principal.
          fontFamily: FUENTE_TEXTO, fontWeight: 700, lineHeight: 1, color: 'inherit',
          fontSize: 'clamp(36px, 2.65vw, 50px)', fontVariantNumeric: 'tabular-nums slashed-zero', letterSpacing: '-.04em', whiteSpace: 'nowrap',
        }}
      >
        {h}:{m}:{s}
        <Box component="span" sx={{ fontSize: '0.55em', opacity: 0.75, ml: 0.25 }}>.{cs}</Box>
      </Typography>

      {/* Barra de la vuelta actual (una vuelta = 15 min) */}
      <Box sx={{ mt: 1.25, height: 4, borderRadius: 999, bgcolor: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${progresoVuelta(ms) * 100}%`, bgcolor: 'currentColor', borderRadius: 999 }} />
      </Box>
      {vuelta > 1 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'inherit', opacity: 0.75, letterSpacing: '0.1em' }}>
          Vuelta {vuelta} · cada vuelta son 15 min
        </Typography>
      )}
    </Box>
  );
}

export default memo(RelojDigital);
