'use client';
import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from '@mui/material';
import { api, fetcher } from '@/lib/client';
import { ROL_LABEL, type Rol } from '@/lib/sesion';
import { useToast } from '@/components/Toast';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

type EstadoClaves = Record<Rol, boolean> & { HISTORICO: boolean };

/** Tarjeta "Contraseñas" (solo administrador): cambia la suya y la del cronometrador. */
export default function Contrasenas() {
  const { data: claves, mutate } = useSWR<EstadoClaves>('/api/auth/claves', fetcher);

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><LockOutlinedIcon />Contraseñas</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Se guardan cifradas en este computador y no se copian a la nube. Mínimo 4 caracteres.
      </Typography>
      <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
        <FormClave rol="ADMIN" pedirActual configurada={claves?.ADMIN} onGuardada={() => mutate()} />
        <FormClave rol="CRONO" configurada={claves?.CRONO} onGuardada={() => mutate()} />
        <FormClaveHistorico configurada={claves?.HISTORICO} onGuardada={() => mutate()} />
      </Stack>
    </Paper>
  );
}

function FormClaveHistorico({ configurada, onGuardada }: { configurada?: boolean; onGuardada: () => void }) {
  const toast = useToast();
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const noCoinciden = !!confirmar && nueva !== confirmar;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api('/api/auth/historico-clave', 'PUT', { nueva });
      setNueva('');
      setConfirmar('');
      onGuardada();
      toast('Contraseña adicional del histórico actualizada');
      setAbierto(false);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ py: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>
            <VpnKeyOutlinedIcon fontSize="small" /> Contraseña adicional del Histórico
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {configurada === false ? 'Sin contraseña configurada' : configurada ? 'Contraseña actual: ****' : ' '}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {configurada === false && <Chip size="small" color="warning" label="Sin contraseña" />}
          <Button size="small" variant="outlined" onClick={() => setAbierto(true)}>
            {configurada ? 'Cambiar contraseña' : 'Configurar contraseña'}
          </Button>
        </Stack>
      </Stack>
      <Dialog open={abierto} onClose={() => !enviando && setAbierto(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={guardar}>
          <DialogTitle>Contraseña adicional · Histórico</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                El cronometrador deberá ingresarla después de iniciar sesión para consultar resultados históricos.
              </Typography>
              <TextField type="password" label="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
              <TextField
                type="password"
                label="Confirmar contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                error={noCoinciden}
                helperText={noCoinciden ? 'No coincide' : 'Mínimo 4 caracteres'}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={enviando || nueva.length < 4 || nueva !== confirmar}>
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
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
  const [abierto, setAbierto] = useState(false);
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
      toast(`Contraseña del ${ROL_LABEL[rol].toLowerCase()} actualizada`);
      setAbierto(false);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ py: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>
            {rol === 'ADMIN' ? <AdminPanelSettingsOutlinedIcon fontSize="small" /> : <TimerOutlinedIcon fontSize="small" />}
            {' '}Contraseña {ROL_LABEL[rol]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {configurada === false ? 'Sin contraseña configurada' : configurada ? 'Contraseña actual: ****' : ' '}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {configurada === false && <Chip size="small" color="warning" label="Sin contraseña" />}
          <Button size="small" variant="outlined" onClick={() => setAbierto(true)}>
            Cambiar contraseña
          </Button>
        </Stack>
      </Stack>
      <Dialog open={abierto} onClose={() => !enviando && setAbierto(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={guardar}>
          <DialogTitle>Cambiar contraseña · {ROL_LABEL[rol]}</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              {pedirActual && (
                <TextField type="password" label="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
              )}
              <TextField type="password" label="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
              <TextField
                type="password"
                label="Confirmar contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                error={noCoinciden}
                helperText={noCoinciden ? 'No coincide' : 'Mínimo 4 caracteres'}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={enviando || nueva.length < 4 || nueva !== confirmar || (pedirActual && !actual)}>
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
