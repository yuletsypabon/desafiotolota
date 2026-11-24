'use client';

import { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import useSWR from 'swr';
import { api, fetcher } from '@/lib/client';
import { ESPACIADO_SISTEMA } from '@/theme';
import { useAppDialog } from '@/components/AppDialog';

type PeticionPendiente = {
  id: string;
  nombre: string | null;
  peticion: string;
  visibilidad: 'PRIVADA' | 'PUBLICA';
  createdAt: string;
  estado: 'PENDIENTE' | 'PUBLICADA' | 'RECHAZADA';
};

export default function OracionesAdmin() {
  const { data, error, isLoading, mutate } = useSWR<PeticionPendiente[]>('/api/oraciones', fetcher);
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState<'PENDIENTE' | 'PUBLICADA' | 'RECHAZADA'>('PENDIENTE');
  const dialog = useAppDialog();
  const peticiones = data ?? [];
  const visibles = peticiones.filter((peticion) => peticion.estado === vista);

  const decidir = async (peticion: PeticionPendiente, estado: 'PUBLICADA' | 'RECHAZADA') => {
    const publicar = estado === 'PUBLICADA';
    const confirmado = await dialog({
      title: publicar ? (peticion.visibilidad === 'PUBLICA' ? 'Publicar petición' : 'Marcar como atendida') : 'Rechazar petición',
      message: publicar
        ? peticion.visibilidad === 'PUBLICA' ? 'La petición quedará visible en el muro público.' : 'La petición privada seguirá oculta y dejará de aparecer en pendientes.'
        : 'La petición no se mostrará en el sitio público.',
      tone: publicar ? 'success' : 'danger',
      confirmLabel: publicar ? 'Confirmar' : 'Rechazar',
    });
    if (!confirmado) return;
    setMensaje('');
    try {
      await api('/api/oraciones', 'PATCH', { id: peticion.id, estado });
      await mutate();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo actualizar la petición.');
    }
  };

  const eliminar = async (peticion: PeticionPendiente) => {
    const confirmado = await dialog({
      title: 'Eliminar petición definitivamente',
      message: 'Se borrará de forma permanente y no se podrá recuperar. Si solo quieres ocultarla del muro, usa «Retirar del muro».',
      tone: 'danger',
      confirmLabel: 'Eliminar definitivamente',
    });
    if (!confirmado) return;
    setMensaje('');
    try {
      await api('/api/oraciones', 'DELETE', { id: peticion.id });
      await mutate();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo eliminar la petición.');
    }
  };

  return (
    <Container maxWidth="lg" sx={ESPACIADO_SISTEMA.pagina}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="warning.main">Moderación del sitio</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>Muro de oración</Typography>
          <Typography color="text.secondary">Las peticiones públicas requieren aprobación. Las privadas solo se ven aquí.</Typography>
        </Box>
        {error && <Alert severity="error">No se pudo cargar la bandeja. Verifica tu sesión e inténtalo de nuevo.</Alert>}
        {mensaje && <Alert severity="error">{mensaje}</Alert>}
        {isLoading && <Skeleton variant="rounded" height={180} />}
        <ToggleButtonGroup
          exclusive
          value={vista}
          onChange={(_, value: 'PENDIENTE' | 'PUBLICADA' | 'RECHAZADA' | null) => value && setVista(value)}
          aria-label="Filtrar peticiones"
          size="small"
        >
          <ToggleButton value="PENDIENTE">Pendientes ({peticiones.filter((item) => item.estado === 'PENDIENTE').length})</ToggleButton>
          <ToggleButton value="PUBLICADA">Publicadas / atendidas ({peticiones.filter((item) => item.estado === 'PUBLICADA').length})</ToggleButton>
          <ToggleButton value="RECHAZADA">Rechazadas / retiradas ({peticiones.filter((item) => item.estado === 'RECHAZADA').length})</ToggleButton>
        </ToggleButtonGroup>
        {!isLoading && !error && !visibles.length && <Alert severity="info">{vista === 'PENDIENTE' ? 'No hay peticiones pendientes.' : vista === 'PUBLICADA' ? 'No hay peticiones publicadas o atendidas.' : 'No hay peticiones rechazadas o retiradas.'}</Alert>}
        <Stack spacing={2}>
          {visibles.map((peticion) => (
            <Paper key={peticion.id} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography variant="h6">{peticion.nombre || 'Anónimo'}</Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                    <Chip size="small" color={peticion.estado === 'PUBLICADA' ? 'success' : peticion.estado === 'RECHAZADA' ? 'default' : peticion.visibilidad === 'PUBLICA' ? 'warning' : 'default'} label={peticion.estado === 'PUBLICADA' ? peticion.visibilidad === 'PUBLICA' ? 'Visible en el muro' : 'Atendida · privada' : peticion.estado === 'RECHAZADA' ? 'Rechazada / retirada' : peticion.visibilidad === 'PUBLICA' ? 'Solicita publicar' : 'Solo organización'} />
                  </Stack>
                </Stack>
                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{peticion.peticion}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Recibida {new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(peticion.createdAt))}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                  {peticion.estado === 'PENDIENTE' ? <>
                    <Button color="error" variant="outlined" startIcon={<BlockOutlinedIcon />} onClick={() => void decidir(peticion, 'RECHAZADA')}>Rechazar</Button>
                    <Button color="success" variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => void decidir(peticion, 'PUBLICADA')}>
                      {peticion.visibilidad === 'PUBLICA' ? 'Aprobar y publicar' : 'Marcar atendida'}
                    </Button>
                  </> : peticion.estado === 'PUBLICADA' && peticion.visibilidad === 'PUBLICA' ? (
                    <Button color="warning" variant="outlined" startIcon={<BlockOutlinedIcon />} onClick={() => void decidir(peticion, 'RECHAZADA')}>Retirar del muro</Button>
                  ) : null}
                  <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => void eliminar(peticion)}>Eliminar definitivamente</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
