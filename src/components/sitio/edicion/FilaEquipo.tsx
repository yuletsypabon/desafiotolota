'use client';
import { Box, Collapse, Typography } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EquipoAvatar from '@/components/EquipoAvatar';
import Alineacion from './Alineacion';
import type { EquipoPublico } from '@/lib/landing/tiposEdicion';
import { COLORS, FONT_DISPLAY, alfa } from '@/theme';

interface Props {
  equipo: EquipoPublico;
  abierto: boolean;
  onAlternar: () => void;
}

/**
 * Un equipo como franja de presentación: nombre a la izquierda, logo grande que sobresale por encima de la franja y,
 * a la derecha, el capitán con el acceso a los integrantes. El color de la franja sale del propio logo (desenfocado
 * de fondo). Al tocarla se despliega debajo la alineación con sus integrantes.
 */
export default function FilaEquipo({ equipo: e, abierto, onAlternar }: Props) {
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={abierto}
        aria-label={`${e.nombre}: ${abierto ? 'ocultar' : 'ver'} integrantes`}
        onClick={onAlternar}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            onAlternar();
          }
        }}
        sx={{
          position: 'relative', cursor: 'pointer', mt: { xs: 3.5, sm: 6.5, md: 10.5 }, height: { xs: 116, sm: 140, md: 164 },
          display: 'grid', alignItems: 'center', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto' }, columnGap: 2,
          px: { xs: 2, md: 4 }, borderRadius: '14px',
          outline: `1px solid ${abierto ? alfa(COLORS.acento, .7) : COLORS.border}`,
          transition: 'outline-color .2s ease',
          '&:hover': { outlineColor: alfa(COLORS.acento, .7) },
          '&:hover .logoEquipo': { transform: { xs: 'scale(1.04)', sm: 'translate(-50%, -4px) scale(1.04)' } },
          '&:hover .fondoLogo': { filter: 'blur(26px) saturate(1.6) brightness(.62)' },
          '&:focus-visible': { outline: `2px solid ${COLORS.acento}`, outlineOffset: 2 },
        }}
      >
        {/* Franja: el logo estirado y desenfocado le da a cada equipo su color */}
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
          <Box
            className="fondoLogo"
            sx={{
              position: 'absolute', inset: -40, transition: 'filter .3s ease',
              backgroundImage: e.logo ? `url(${e.logo})` : `linear-gradient(90deg, ${alfa(COLORS.acento, .25)}, transparent)`,
              backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(26px) saturate(1.5) brightness(.5)',
            }}
          />
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,5,5,.55), rgba(5,5,5,.2) 50%, rgba(5,5,5,.6))' }} />
        </Box>

        {/* Logo grande que sobresale por arriba de la franja */}
        <Box
          className="logoEquipo"
          aria-hidden="true"
          sx={{
            position: 'absolute', zIndex: 1, bottom: { xs: 12, md: 22 }, right: { xs: 4, sm: 'auto' }, left: { sm: '58%' }, transform: { sm: 'translateX(-50%)' },
            height: { xs: 116, sm: 170, md: 224 }, width: { xs: 116, sm: 170, md: 224 }, display: 'grid', placeItems: 'end center',
            transition: 'transform .25s ease', pointerEvents: 'none',
          }}
        >
          {e.logo
            // Posición absoluta: el tope de alto se mide contra la caja fija del logo, así un logo alto (vertical) se
            // achica en vez de salirse por debajo de la franja
            ? <Box component="img" src={e.logo} alt="" sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0, mx: 'auto', width: '100%', height: '100%',
                objectFit: 'contain', objectPosition: 'center bottom', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.6))',
              }} />
            : <Box sx={{ mb: 2 }}><EquipoAvatar nombre={e.nombre} size={64} /></Box>}
        </Box>

        {/* Izquierda: número y nombre del equipo */}
        <Box sx={{ position: 'relative', zIndex: 2, minWidth: 0, pr: { xs: '120px', sm: '24%', md: 0 }, maxWidth: { md: '47%' } }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, md: 20 }, lineHeight: 1.1, color: 'rgba(244,243,236,.85)' }}>
            Equipo {e.numero}
          </Typography>
          <Typography sx={{
            fontFamily: FONT_DISPLAY, textTransform: 'uppercase', lineHeight: 1.08, letterSpacing: '.01em', pt: '2px',
            fontSize: { xs: 34, sm: 54, md: 'clamp(56px, 5.6vw, 84px)' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textShadow: '0 2px 12px rgba(0,0,0,.4)',
          }}>
            {e.nombre}
          </Typography>
          {/* En celular el capitán va debajo del nombre (el logo ocupa la derecha) */}
          <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 11.5, fontWeight: 700, color: 'rgba(244,243,236,.8)' }} noWrap>
            {e.capitan ? `Capitán: ${e.capitan}` : 'Sin capitán'}
          </Typography>
          <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}><PildoraIntegrantes abierto={abierto} total={e.integrantes.length} /></Box>
        </Box>

        {/* Derecha: capitán y acceso a los integrantes */}
        <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'right', display: { xs: 'none', sm: 'flex' }, minWidth: 0, maxWidth: { sm: 220, md: 320 }, flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
          <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
            <Typography sx={{ fontSize: { sm: 13, md: 16 }, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(244,243,236,.75)' }}>
              Capitán
            </Typography>
            {/* Solo primer nombre y primer apellido, del mismo tamaño */}
            <Typography
              sx={{ fontWeight: 700, fontSize: { sm: 22, md: 30 }, lineHeight: 1.1, textTransform: 'uppercase', color: e.capitan ? 'text.primary' : 'rgba(244,243,236,.7)' }}
              noWrap
            >
              {e.capitan ?? 'Sin asignar'}
            </Typography>
          </Box>
          <PildoraIntegrantes abierto={abierto} total={e.integrantes.length} />
        </Box>
      </Box>

      <Collapse in={abierto} timeout={380} unmountOnExit>
        <Alineacion equipo={e} />
      </Collapse>
    </Box>
  );
}

/** Acceso a los integrantes: texto blanco subrayado (no es un botón: toda la franja responde al clic). */
function PildoraIntegrantes({ abierto, total }: { abierto: boolean; total: number }) {
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.6, pb: 0.25,
      fontSize: { xs: 12, md: 14 }, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      color: COLORS.text, borderBottom: `1.5px solid ${abierto ? COLORS.text : 'rgba(244,243,236,.55)'}`,
      transition: 'border-color .2s ease',
    }}>
      <GroupsOutlinedIcon sx={{ fontSize: 17 }} />
      {abierto ? 'Ocultar integrantes' : `Integrantes · ${total}`}
    </Box>
  );
}
