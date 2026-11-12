'use client';
import { Box, Stack, Typography } from '@mui/material';
import { iniciales } from '@/lib/format';
import { esColorClaro, useColorLogo } from '@/lib/colorLogo';
import type { EquipoPublico, IntegrantePublico } from '@/lib/landing/tiposEdicion';
import { COLORS, FONT_DISPLAY, alfa } from '@/theme';

/**
 * Integrantes de un equipo como una alineación: una carta por persona con su lugar de origen arriba, sus iniciales
 * sobre el logo del equipo y el nombre en una franja vertical amarilla. La del capitán va primero y lleva el color
 * del equipo (el elegido en el sistema o, si no, el que más resalta del logo). A la derecha, el nombre del equipo.
 */
export default function Alineacion({ equipo: e }: { equipo: EquipoPublico }) {
  const colorLogo = useColorLogo(e.color ? null : e.logo); // si el equipo tiene color elegido, no hace falta leer el logo
  const colorCapitan = e.color ?? colorLogo ?? COLORS.text;

  return (
    // Dos columnas: las cartas y, a la derecha y a media altura, el nombre del equipo
    <Box sx={{
      pt: 2.5, pb: 3, px: { xs: 0.5, md: 2 }, display: 'grid', gap: { xs: 2, md: 3 }, alignItems: 'start',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) 220px' },
    }}>
      <Stack gap={0.75} sx={{ minWidth: 0, order: { sm: 2 }, textAlign: 'center', alignSelf: { sm: 'center' } }}>
        <Typography sx={{
          fontFamily: FONT_DISPLAY, textTransform: 'uppercase', lineHeight: 1, fontSize: { xs: 34, md: 38 }, pt: '2px',
          color: 'transparent', WebkitTextStroke: `1.2px ${COLORS.acento}`, overflowWrap: 'anywhere',
        }}>
          {e.nombre}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {e.integrantes.length} integrantes{e.capitan ? ` · Capitán: ${e.capitan}` : ''}
        </Typography>
      </Stack>

      {e.integrantes.length ? (
        <Box component="ul" sx={{
          m: 0, p: 0, listStyle: 'none', display: 'grid', gap: { xs: 1.25, md: 1.75 },
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: `repeat(${columnasCartas(e.integrantes.length, 3)}, minmax(0, 1fr))`,
            md: `repeat(${columnasCartas(e.integrantes.length, 6)}, minmax(0, 1fr))`,
          },
        }}>
          {e.integrantes.map((p, i) => <Carta key={p.id} p={p} logo={e.logo} orden={i} capitan={p.capitan ? colorCapitan : null} />)}
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Pronto conocerás a los integrantes de este equipo.</Typography>
      )}
    </Box>
  );
}

/**
 * Columnas de la alineación para que las cartas llenen el ancho: todas en una fila si caben (mínimo 4 para que no
 * queden gigantes) y, si son más, filas parejas (7 → 4 + 3, 9 → 5 + 4).
 */
function columnasCartas(total: number, maximo: number) {
  if (total <= maximo) return Math.min(maximo, Math.max(total, 4));
  return Math.ceil(total / Math.ceil(total / maximo));
}

interface CartaProps {
  p: IntegrantePublico;
  logo: string | null;
  orden: number;
  /** Color de la carta del capitán; null en las demás */
  capitan: string | null;
}

function Carta({ p, logo, orden, capitan }: CartaProps) {
  const franja = capitan ?? COLORS.acento;
  const textoFranja = capitan && !esColorClaro(capitan) ? COLORS.text : COLORS.bg;
  return (
    <Box component="li" sx={{
      // Entrada escalonada: las cartas aparecen una tras otra al desplegar el equipo
      '@keyframes entrarCarta': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'none' } },
      animation: 'entrarCarta .45s cubic-bezier(.2,.7,.2,1) both', animationDelay: `${Math.min(orden, 12) * 45}ms`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    }}>
      <Box sx={{
        position: 'relative', aspectRatio: '3 / 4', overflow: 'hidden', borderRadius: '14px',
        border: `${capitan ? 2 : 1}px solid ${capitan ? alfa(capitan, .8) : COLORS.border}`,
        bgcolor: capitan ? alfa(capitan, .16) : 'rgba(244,243,236,.06)',
        boxShadow: capitan ? `0 0 22px ${alfa(capitan, .28)}` : 'none',
      }}>
        {/* Logo del equipo en gris como fondo de la carta */}
        {logo && (
          <Box aria-hidden="true" sx={{
            position: 'absolute', inset: '18% 22% 6% -8%', backgroundImage: `url(${logo})`, backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'grayscale(1)', opacity: .14,
          }} />
        )}

        {/* Lugar de origen (donde una alineación pondría el número) */}
        <Typography sx={{
          position: 'absolute', top: 8, left: 10, right: 46, fontFamily: FONT_DISPLAY, textTransform: 'uppercase',
          fontSize: 17, lineHeight: 1.2, pt: '2px', color: 'rgba(244,243,236,.62)', overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {p.lugar || 'Sin lugar'}
        </Typography>
        {capitan && (
          <Typography sx={{ position: 'absolute', top: 54, left: 10, fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: capitan }}>
            Capitán
          </Typography>
        )}

        {/* Iniciales grandes en lugar de foto */}
        <Typography aria-hidden="true" sx={{
          position: 'absolute', left: 10, right: 46, bottom: 14, fontFamily: FONT_DISPLAY, fontSize: 56, lineHeight: 1,
          color: capitan ? alfa(capitan, .55) : 'rgba(244,243,236,.32)',
        }}>
          {iniciales(p.nombre)}
        </Typography>

        {/* Franja con el nombre en vertical */}
        <Box sx={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 38, bgcolor: franja, color: textoFranja,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start', py: 1.25,
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
        }}>
          <Box component="span" sx={{
            fontFamily: FONT_DISPLAY, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: 1.25,
            fontSize: p.nombre.length > 22 ? 13 : p.nombre.length > 16 ? 15 : 17, // los nombres largos se achican para caber
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '100%',
          }}>
            {p.nombre}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
