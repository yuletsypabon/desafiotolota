'use client';

import { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import useSWR from 'swr';
import { api, fetcher } from '@/lib/client';
import { ESPACIADO_SISTEMA } from '@/theme';
import { useAppDialog } from '@/components/AppDialog';

type TestimonioPendiente = {
  id: string;
  nombre: string;
  anio: number;
  comentario: string;
  createdAt: string;
  estado: 'PENDIENTE' | 'PUBLICADO' | 'RECHAZADO';
};

export default function TestimoniosAdmin() {
  const { data, error, isLoading, mutate } = useSWR<TestimonioPendiente[]>('/api/testimonios', fetcher);
  const dialog = useAppDialog();
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState<'PENDIENTE' | 'PUBLICADO' | 'RECHAZADO'>('PENDIENTE');
  const testimonios = data ?? [];
  const visibles = testimonios.filter((item) => item.estado === vista);

  const decidir = async (item: TestimonioPendiente, estado: 'PUBLICADO' | 'RECHAZADO') => {
    const publicar = estado === 'PUBLICADO';
    const confirmo = await dialog({
      title: publicar ? 'Publicar experiencia' : 'Rechazar experiencia',
      message: publicar
        ? `El comentario de ${item.nombre} será visible en la página de Historia.`
        : `El comentario de ${item.nombre} no se mostrará en la página pública.`,
      tone: publicar ? 'success' : 'danger',
      confirmLabel: publicar ? 'Publicar' : 'Rechazar',
    });
    if (!confirmo) return;
    setMensaje('');
    try {
      await api('/api/testimonios', 'PATCH', { id: item.id, estado });
      await mutate();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo actualizar el comentario.');
    }
  };

  const eliminar = async (item: TestimonioPendiente) => {
    const confirmado = await dialog({
      title: 'Eliminar testimonio definitivamente',
      message: 'Se borrará de forma permanente y no se podrá recuperar. Si solo quieres ocultarlo de Historia, usa «Retirar de Historia».',
      tone: 'danger',
      confirmLabel: 'Eliminar definitivamente',
    });
    if (!confirmado) return;
    setMensaje('');
    try {
      await api('/api/testimonios', 'DELETE', { id: item.id });
      await mutate();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo eliminar el testimonio.');
    }
  };

  return (
    <Container maxWidth="lg" sx={ESPACIADO_SISTEMA.pagina}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="warning.main">Moderación del sitio</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>Testimonios</Typography>
          <Typography color="text.secondary">Revisa cada experiencia antes de que aparezca en la página pública.</Typography>
        </Box>

        {error && <Alert severity="error">No se pudo cargar la bandeja. Verifica tu sesión e inténtalo de nuevo.</Alert>}
        {mensaje && <Alert severity="error">{mensaje}</Alert>}
        {isLoading && <Skeleton variant="rounded" height={180} />}
        <ToggleButtonGroup
          exclusive
          value={vista}
          onChange={(_, value: 'PENDIENTE' | 'PUBLICADO' | 'RECHAZADO' | null) => value && setVista(value)}
          aria-label="Filtrar testimonios"
          size="small"
        >
          <ToggleButton value="PENDIENTE">Pendientes ({testimonios.filter((item) => item.estado === 'PENDIENTE').length})</ToggleButton>
          <ToggleButton value="PUBLICADO">Publicados ({testimonios.filter((item) => item.estado === 'PUBLICADO').length})</ToggleButton>
          <ToggleButton value="RECHAZADO">Rechazados / retirados ({testimonios.filter((item) => item.estado === 'RECHAZADO').length})</ToggleButton>
        </ToggleButtonGroup>
        {!isLoading && !error && !visibles.length && <Alert severity="info">{vista === 'PENDIENTE' ? 'No hay comentarios pendientes de revisión.' : vista === 'PUBLICADO' ? 'No hay testimonios publicados.' : 'No hay testimonios rechazados o retirados.'}</Alert>}

        <Stack spacing={2}>
          {visibles.map((item) => (
            <Paper key={item.id} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <FormatQuoteIcon color="warning" />
                    <Typography variant="h6">{item.nombre}</Typography>
                  </Stack>
                  <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                    <Chip size="small" label={`Desafío ${item.anio}`} />
                    <Chip size="small" color={item.estado === 'PUBLICADO' ? 'success' : item.estado === 'RECHAZADO' ? 'default' : 'warning'} label={item.estado === 'PUBLICADO' ? 'Visible en Historia' : item.estado === 'RECHAZADO' ? 'Rechazado / retirado' : 'Pendiente'} />
                  </Stack>
                </Stack>
                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{item.comentario}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Recibido {new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                  {item.estado === 'PENDIENTE' ? <>
                    <Button color="error" variant="outlined" startIcon={<BlockOutlinedIcon />} onClick={() => void decidir(item, 'RECHAZADO')}>
                      Rechazar
                    </Button>
                    <Button color="success" variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => void decidir(item, 'PUBLICADO')}>
                      Aprobar y publicar
                    </Button>
                  </> : item.estado === 'PUBLICADO' ? (
                    <Button color="warning" variant="outlined" startIcon={<BlockOutlinedIcon />} onClick={() => void decidir(item, 'RECHAZADO')}>
                      Retirar de Historia
                    </Button>
                  ) : null}
                  <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => void eliminar(item)}>
                    Eliminar definitivamente
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
