'use client';
import { useState } from 'react';
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BlockIcon from '@mui/icons-material/Block';

/** Estado de acceso del cronometrador a una prueba. */
export function estadoHabilitacion(desde: string | null, ahora = Date.now()) {
  if (!desde) return { label: 'No habilitada', color: 'default' as const };
  const d = new Date(desde);
  if (d.getTime() > ahora)
    return {
      label: `Desde ${d.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
      color: 'info' as const,
    };
  return { label: 'Habilitada', color: 'success' as const };
}

/** "2026-11-08T14:30" en hora local, para el campo datetime-local */
const aLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

/**
 * Chip que muestra y cambia cuándo puede usar la prueba el cronometrador:
 * habilitar ahora, programar una fecha y hora, o deshabilitar.
 */
export default function HabilitacionPrueba({
  desde, onCambiar,
}: {
  desde: string | null;
  onCambiar: (habilitadaDesde: string | null) => void;
}) {
  const [ancla, setAncla] = useState<HTMLElement | null>(null);
  const [programar, setProgramar] = useState(false);
  const [fecha, setFecha] = useState('');
  const est = estadoHabilitacion(desde);
  const EstadoIcono = !desde ? LockOutlinedIcon : est.color === 'info' ? ScheduleIcon : CheckCircleOutlineIcon;

  const elegir = (valor: string | null) => {
    setAncla(null);
    onCambiar(valor);
  };

  return (
    <>
      <Chip size="small" color={est.color} icon={<EstadoIcono />} label={est.label} onClick={(e) => setAncla(e.currentTarget)} sx={{ flexShrink: 0 }} />
      <Menu anchorEl={ancla} open={!!ancla} onClose={() => setAncla(null)}>
        <MenuItem onClick={() => elegir(new Date().toISOString())}>
          <ListItemIcon><PlayArrowIcon /></ListItemIcon>
          <ListItemText primary="Habilitar ahora" secondary="El cronometrador la ve de inmediato" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAncla(null);
            setFecha(aLocal(desde ? new Date(desde) : new Date()));
            setProgramar(true);
          }}
        >
          <ListItemIcon><ScheduleIcon /></ListItemIcon>
          <ListItemText primary="Programar…" secondary="Se habilita sola a la fecha y hora elegidas" />
        </MenuItem>
        <MenuItem onClick={() => elegir(null)} disabled={!desde}>
          <ListItemIcon><BlockIcon /></ListItemIcon>
          <ListItemText primary="Deshabilitar" secondary="Deja de aparecerle al cronometrador" />
        </MenuItem>
      </Menu>

      <Dialog open={programar} onClose={() => setProgramar(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ScheduleIcon color="primary" />Programar acceso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Desde esta fecha y hora el cronometrador podrá usar la prueba.
          </Typography>
          <TextField type="datetime-local" fullWidth value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setProgramar(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!fecha}
            onClick={() => {
              setProgramar(false);
              onCambiar(new Date(fecha).toISOString());
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
