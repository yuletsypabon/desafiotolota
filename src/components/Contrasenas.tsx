'use client';
import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import { api, fetcher } from '@/lib/client';
import { ROL_LABEL, type Rol } from '@/lib/sesion';
import { useToast } from '@/components/Toast';

/** Tarjeta "Contraseñas" (solo administrador): cambia la suya y la del cronometrador. */
export default function Contrasenas() {
  const { data: claves, mutate } = useSWR<Record<Rol, boolean>>('/api/auth/claves', fetcher);

  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>🔐 Contraseñas</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Se guardan cifradas en este computador y no se copian a la nube. Mínimo 4 caracteres.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <FormClave rol="ADMIN" pedirActual configurada={claves?.ADMIN} onGuardada={() => mutate()} />
        <FormClave rol="CRONO" configurada={claves?.CRONO} onGuardada={() => mutate()} />
      </Box>
    </Paper>
  );
}

function FormClave({
  rol, pedirActual = false, configurada, onGuardada,
}: {
  rol: Rol;
  pedirActual?: boolean;
  configurada?: boolean;
  onGuardada: () => void;
}) {
  const toast = useToast();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const noCoinciden = !!confirmar && nueva !== confirmar;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api('/api/auth/claves', 'PUT', { rol, nueva, actual: pedirActual ? actual : undefined });
      setActual('');
      setNueva('');
      setConfirmar('');
      onGuardada();
      toast(`✅ Contraseña del ${ROL_LABEL[rol].toLowerCase()} actualizada`);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box component="form" onSubmit={guardar}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>{rol === 'ADMIN' ? '🛡' : '⏱'} {ROL_LABEL[rol]}</Typography>
        {configurada === false && <Chip size="small" color="warning" label="Sin contraseña" />}
      </Stack>
      <Stack spacing={1.25}>
        {pedirActual && (
          <TextField type="password" label="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
        )}
        <TextField type="password" label="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
        <TextField
          type="password"
          label="Confirmar"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
          error={noCoinciden}
          helperText={noCoinciden ? 'No coincide' : ' '}
        />
        <Button type="submit" variant="outlined" disabled={enviando || !nueva || nueva !== confirmar || (pedirActual && !actual)}>
          {enviando ? 'Guardando…' : 'Cambiar contraseña'}
        </Button>
      </Stack>
    </Box>
  );
}
