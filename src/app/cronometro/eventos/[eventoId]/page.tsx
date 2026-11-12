'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { api, useEvento } from '@/lib/client';
import { useRun } from '@/components/Toast';
import { useAppDialog } from '@/components/AppDialog';
import Contrasenas from '@/components/Contrasenas';
import RespaldoDatos from '@/components/RespaldoDatos';
import SincronizarNube from '@/components/SincronizarNube';
import type { EstadoPrueba, PruebaDTO } from '@/lib/types';
import HabilitacionPrueba from '@/components/HabilitacionPrueba';
import { ESTADOS } from '@/lib/estados';
import { COLORS, ESPACIADO_SISTEMA, FONT_DISPLAY } from '@/theme';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';


export default function ConfigEvento() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const run = useRun();
  const dialog = useAppDialog();
  const { data: ev, mutate } = useEvento(eventoId);
  const [nueva, setNueva] = useState('');

  if (!ev) return null;

  const pruebas = ev.pruebas;
  const mover = (i: number, d: -1 | 1) => {
    const ids = pruebas.map((p) => p.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(async () => {
      await api(`/api/eventos/${eventoId}/pruebas`, 'PUT', { ids });
      await mutate();
    });
  };
  const patchPrueba = (p: PruebaDTO, data: Partial<PruebaDTO>) =>
    run(async () => {
      await api(`/api/pruebas/${p.id}`, 'PATCH', data);
      await mutate();
    });
  const borrarPrueba = async (p: PruebaDTO) => {
    const n = p._count?.resultados ?? 0;
    if (!await dialog({
      title: 'Eliminar prueba',
      message: `¿Eliminar la prueba "${p.nombre}"?${n ? `\nSe borrarán ${n} tiempos registrados y su disciplina.` : ''}`,
      tone: 'danger',
      confirmLabel: 'Eliminar prueba',
    })) return;
    run(async () => {
      await api(`/api/pruebas/${p.id}`, 'DELETE');
      await mutate();
    }, 'Prueba eliminada');
  };
  const agregar = () => {
    if (!nueva.trim()) return;
    run(async () => {
      await api(`/api/eventos/${eventoId}/pruebas`, 'POST', { nombre: nueva.trim() });
      setNueva('');
      await mutate();
    }, 'Prueba agregada');
  };
  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SettingsOutlinedIcon />Configuración del sistema</Typography>
      <Stack spacing={2.5}>
        <Paper sx={ESPACIADO_SISTEMA.tarjeta}>
          <Typography variant="h4" sx={{ mb: 1 }}>Pruebas</Typography>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Programación de acceso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Renombra, ordena y cambia el estado de las pruebas. Configura cuándo puede acceder el cronometrador.
          </Typography>
          {pruebas.map((p, i) => (
            <Stack key={p.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ py: 1, borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.acento, width: 22 }}>{i + 1}</Typography>
              <TextField
                defaultValue={p.nombre}
                key={p.id + p.nombre}
                onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== p.nombre && patchPrueba(p, { nombre: e.target.value.trim() })}
              />
              <TextField
                select
                value={p.estado}
                onChange={(e) => patchPrueba(p, { estado: e.target.value as EstadoPrueba })}
                sx={{ width: { xs: '100%', sm: 150 }, flexShrink: 0 }}
              >
                {(Object.keys(ESTADOS) as EstadoPrueba[]).map((k) => (
                  <MenuItem key={k} value={k}><Chip size="small" color={ESTADOS[k].color} label={ESTADOS[k].label} /></MenuItem>
                ))}
              </TextField>
              <HabilitacionPrueba desde={p.habilitadaDesde} onCambiar={(habilitadaDesde) => patchPrueba(p, { habilitadaDesde })} />
              <Tooltip title="Tiempos registrados"><Chip size="small" icon={<TimerOutlinedIcon />} label={p._count?.resultados ?? 0} /></Tooltip>
              <IconButton size="small" onClick={() => mover(i, -1)} disabled={i === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => mover(i, 1)} disabled={i === pruebas.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => borrarPrueba(p)}><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
          ))}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <TextField placeholder="Nombre de la nueva prueba" value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()} />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={agregar} sx={{ flexShrink: 0 }}>Agregar</Button>
          </Stack>
        </Paper>
      </Stack>
      <Contrasenas />
      <SincronizarNube />
      <RespaldoDatos />
    </Stack>
  );
}
