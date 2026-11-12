'use client';
import Link from 'next/link';
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import MarcoLogo from '@/components/MarcoLogo';
import type { EventoDTO } from '@/lib/types';
import { RUTAS } from '@/lib/rutas';
import { FUENTE_TEXTO } from '@/lib/marca';
import { COLORS, alfa, superficieVidrio } from '@/theme';

/** Estado del evento según sus pruebas: todas finalizadas, alguna en curso o sin empezar. */
function estadoEvento(ev: EventoDTO) {
  const total = ev.pruebas.length;
  const hechas = ev.pruebas.filter((p) => p.estado === 'FINALIZADA').length;
  if (total > 0 && hechas === total) return { hechas, total, insignia: { Icono: VerifiedIcon, color: COLORS.green, texto: 'Evento completado' } };
  if (ev.pruebas.some((p) => p.estado === 'EN_CURSO')) return { hechas, total, insignia: { Icono: TimerOutlinedIcon, color: COLORS.acento, texto: 'Prueba en curso' } };
  return { hechas, total, insignia: null };
}

/**
 * Tarjeta de un evento: imagen arriba en un marco redondeado, nombre con insignia de estado, descripción
 * y, abajo, cifras (equipos y pruebas) con el botón para entrar al cronometraje.
 */
export default function TarjetaEvento({ ev, onEditar }: { ev: EventoDTO; onEditar?: () => void }) {
  const { hechas, total, insignia } = estadoEvento(ev);
  const destino = RUTAS.evento(ev.id, 'cronometro');

  return (
    <Box
      component="article"
      sx={{
        ...superficieVidrio,
        borderRadius: '28px',
        p: 1.25,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .2s ease, border-color .2s ease',
        '&:hover': { transform: 'translateY(-4px)', borderColor: alfa(COLORS.acento, .45) },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <MarcoLogo component={Link} href={destino} aria-label={`Abrir el cronometraje de ${ev.nombre}`} logo={ev.logo} nombre={ev.nombre} />
        {onEditar && (
          <Tooltip title="Editar evento">
            <IconButton
              onClick={onEditar}
              aria-label={`Editar ${ev.nombre}`}
              size="small"
              sx={{
                position: 'absolute', top: 10, right: 10,
                bgcolor: 'rgba(5,5,5,.55)', backdropFilter: 'blur(12px)', border: `1px solid ${COLORS.border}`,
                '&:hover': { bgcolor: 'rgba(5,5,5,.75)', color: COLORS.acento, borderColor: COLORS.acento },
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ px: 1.25, pt: 2, pb: 0.5, flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {/* Space Grotesk en negrita: Anton en minúsculas se ve muy cargada en nombres largos */}
          <Typography
            component="h2"
            sx={{ fontFamily: FUENTE_TEXTO, fontWeight: 700, fontSize: 21, lineHeight: 1.25, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}
          >
            {ev.nombre}
          </Typography>
          {insignia && (
            <Tooltip title={insignia.texto}>
              <insignia.Icono aria-label={insignia.texto} sx={{ color: insignia.color, fontSize: 22, flexShrink: 0 }} />
            </Tooltip>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
          Edición {ev.anio} · {ev.numPistas} pistas de cronometraje
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 1.25, pt: 2, pb: 0.75 }}>
        <Tooltip title="Equipos">
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
            <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{ev._count?.equipos ?? 0}</Typography>
          </Stack>
        </Tooltip>
        <Tooltip title="Pruebas finalizadas">
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
            <FlagOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{hechas}/{total}</Typography>
          </Stack>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button
          component={Link}
          href={destino}
          size="small"
          sx={{ px: 2.25, bgcolor: 'rgba(255,255,255,.08)', color: 'text.primary', '&:hover': { bgcolor: COLORS.acento, color: COLORS.bg } }}
        >
          Entrar
        </Button>
      </Stack>
    </Box>
  );
}
