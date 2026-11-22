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
 * Marco de un evento: selector a la izquierda, control principal de la sección al centro y acciones a la derecha.
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
  const [barraCentro, setBarraCentro] = useState<HTMLDivElement | null>(null);
  const [barraAcciones, setBarraAcciones] = useState<HTMLDivElement | null>(null);
  // El sistema ocupa el ancho disponible; el margen crece en pantallas grandes sin dejar bandas vacías.
  const margenPagina = { xs: 2, sm: 3, lg: 'clamp(32px, 3vw, 56px)' };

  return (
    <Box>
      <Box sx={{ bgcolor: VIDRIO_SISTEMA.fondo, backdropFilter: 'blur(18px)', borderBottom: `1px solid ${COLORS.border}` }}>
        <Container maxWidth={false} sx={{ px: margenPagina, py: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(260px, 1fr) minmax(0, 1fr) auto' }, gap: 1.25, alignItems: 'center', minHeight: 44 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1, flexShrink: 0 }}>Evento</Typography>
              {ev && opciones.length ? (
                <TextField
                  select
                  fullWidth={false}
                  value={eventoId}
                  onChange={(e) => router.push(RUTAS.evento(e.target.value, seccion))}
                  aria-label="Elegir evento"
                  sx={{ minWidth: 0, width: { xs: '100%', sm: 300 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1.25, py: 0.75 } }}
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
                <Stack direction="row" spacing={1} alignItems="center"><Skeleton variant="rounded" width={28} height={28} /><Typography variant="body2" color="text.secondary">{error ? 'Evento no encontrado' : 'Cargando…'}</Typography></Stack>
              )}
            </Stack>
            {/* Control principal de la sección (p. ej. prueba activa del cronometraje). */}
            <Box ref={setBarraCentro} sx={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', lg: 'flex-end' }, gap: 1, '&:empty': { display: 'none' } }} />
            {/* Acciones secundarias de la sección. */}
            <Box ref={setBarraAcciones} sx={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', lg: 'flex-end' }, gap: 1, flexWrap: 'wrap', '&:empty': { display: 'none' } }} />
          </Box>
        </Container>
      </Box>
      <Container maxWidth={false} sx={{ px: margenPagina, py: ESPACIADO_SISTEMA.pagina.py }}>
        <BarraEventoProvider value={{ centro: barraCentro, acciones: barraAcciones }}>{children}</BarraEventoProvider>
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
