'use client';
import { useState, type ReactNode } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Box, Container, ListItemIcon, ListItemText, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { useEvento, useEventos } from '@/lib/client';
import EquipoAvatar from '@/components/EquipoAvatar';
import { BarraEventoProvider } from '@/components/crono/BarraEvento';
import { RUTAS, eventoDeRuta } from '@/lib/rutas';
import { COLORS, ESPACIADO_SISTEMA, VIDRIO_SISTEMA } from '@/theme';

/**
 * Marco de un evento: franja con el selector de evento (cambia de evento sin salir de la sección), un espacio a su
 * lado para los controles de la sección (p. ej. la barra de prueba del cronometraje) y el contenido.
 */
export default function EventoLayout({ children }: { children: ReactNode }) {
  const { eventoId } = useParams<{ eventoId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { data: ev, error } = useEvento(eventoId);
  const { data: eventos } = useEventos();
  const seccion = eventoDeRuta(pathname)?.seccion ?? '';
  // Del más reciente al más antiguo, como en la lista de eventos
  const opciones = [...(eventos ?? [])].sort((a, b) => b.anio - a.anio);
  const [barra, setBarra] = useState<HTMLDivElement | null>(null);

  return (
    <Box>
      <Box sx={{ bgcolor: VIDRIO_SISTEMA.fondo, backdropFilter: 'blur(18px)', borderBottom: `1px solid ${COLORS.border}` }}>
        <Container maxWidth="xl" sx={{ px: ESPACIADO_SISTEMA.pagina.px, py: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minHeight: 44, flexWrap: 'wrap', rowGap: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>Evento</Typography>
            {ev && opciones.length ? (
              <TextField
                select
                fullWidth={false}
                value={eventoId}
                onChange={(e) => router.push(RUTAS.evento(e.target.value, seccion))}
                aria-label="Elegir evento"
                sx={{
                  minWidth: { xs: '100%', sm: 300 },
                  '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1.25, py: 0.75 },
                }}
                slotProps={{ select: { renderValue: () => <EventoOpcion nombre={ev.nombre} logo={ev.logo} anio={ev.anio} /> } }}
              >
                {opciones.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    <ListItemIcon sx={{ minWidth: 40 }}><EquipoAvatar nombre={o.nombre} logo={o.logo} size={28} square /></ListItemIcon>
                    <ListItemText primary={o.nombre} secondary={`Edición ${o.anio} · ${o._count?.equipos ?? 0} equipos`} />
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Skeleton variant="rounded" width={28} height={28} />
                <Typography variant="body2" color="text.secondary">{error ? 'Evento no encontrado' : 'Cargando…'}</Typography>
              </Stack>
            )}
            {/* Controles de la sección (se llenan con <EnBarraEvento>) */}
            <Box ref={setBarra} sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', '&:empty': { display: 'none' } }} />
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={ESPACIADO_SISTEMA.pagina}>
        <BarraEventoProvider value={barra}>{children}</BarraEventoProvider>
      </Container>
    </Box>
  );
}

/** Evento elegido dentro del selector: logo, nombre y año. */
function EventoOpcion({ nombre, logo, anio }: { nombre: string; logo: string | null; anio: number }) {
  return (
    <>
      <EquipoAvatar nombre={nombre} logo={logo} size={26} square />
      <Box component="span" sx={{ fontWeight: 700, color: COLORS.acento, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</Box>
      <Box component="span" sx={{ color: 'text.secondary', fontSize: 13 }}>{anio}</Box>
    </>
  );
}
