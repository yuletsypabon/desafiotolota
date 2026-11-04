'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { api, useEvento } from '@/lib/client';
import { useRun } from '@/components/Toast';
import LogoUpload from '@/components/LogoUpload';
import type { EstadoPrueba, EventoDTO, PruebaDTO } from '@/lib/types';
import { ESTADOS } from '@/lib/estados';
import { COLORS, FONT_DISPLAY } from '@/theme';


type Form = Pick<EventoDTO, 'anio' | 'nombre' | 'logo' | 'numPistas' | 'pulsadorKey'> & {
  penLeve: string; penMedia: string; penGrave: string; bonPositivo: string;
};

const toSeg = (ms: number) => String(ms / 1000);
const toMs = (s: string) => Math.round((parseFloat(s.replace(',', '.')) || 0) * 1000);

export default function ConfigEvento() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const router = useRouter();
  const run = useRun();
  const { data: ev, mutate } = useEvento(eventoId);
  const [f, setF] = useState<Form | null>(null);
  const [nueva, setNueva] = useState('');

  useEffect(() => {
    if (ev && !f)
      setF({
        anio: ev.anio, nombre: ev.nombre, logo: ev.logo, numPistas: ev.numPistas, pulsadorKey: ev.pulsadorKey,
        penLeve: toSeg(ev.penLeveMs), penMedia: toSeg(ev.penMediaMs), penGrave: toSeg(ev.penGraveMs), bonPositivo: toSeg(ev.bonPositivoMs),
      });
  }, [ev, f]);

  if (!ev || !f) return null;
  const set = (p: Partial<Form>) => setF({ ...f, ...p });

  const guardar = () =>
    run(async () => {
      await api(`/api/eventos/${eventoId}`, 'PATCH', {
        anio: f.anio, nombre: f.nombre, logo: f.logo, numPistas: f.numPistas, pulsadorKey: f.pulsadorKey.toUpperCase(),
        penLeveMs: toMs(f.penLeve), penMediaMs: toMs(f.penMedia), penGraveMs: toMs(f.penGrave), bonPositivoMs: toMs(f.bonPositivo),
      });
      await mutate();
    }, '✅ Evento guardado');

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
  const borrarPrueba = (p: PruebaDTO) => {
    const n = p._count?.resultados ?? 0;
    if (!confirm(`¿Eliminar la prueba "${p.nombre}"?${n ? `\nSe borrarán ${n} tiempos registrados y su disciplina.` : ''}`)) return;
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
    }, '✅ Prueba agregada');
  };
  const borrarEvento = () => {
    const txt = prompt(`Esto borra TODO el evento (equipos, fichas, tiempos, disciplina).\nEscribe el año (${ev.anio}) para confirmar:`);
    if (txt !== String(ev.anio)) return;
    run(async () => {
      await api(`/api/eventos/${eventoId}`, 'DELETE');
      router.push('/');
    }, 'Evento eliminado');
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Datos del evento</Typography>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField label="Año" type="number" value={f.anio} onChange={(e) => set({ anio: parseInt(e.target.value) || 0 })} sx={{ maxWidth: 120 }} />
            <TextField label="Nombre" value={f.nombre} onChange={(e) => set({ nombre: e.target.value })} />
          </Stack>
          <LogoUpload value={f.logo} onChange={(logo) => set({ logo })} label="Logo del evento" nombre={f.nombre} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Pistas simultáneas" value={f.numPistas} onChange={(e) => set({ numPistas: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
            <TextField
              label="Tecla del pulsador"
              value={f.pulsadorKey}
              slotProps={{ htmlInput: { maxLength: 1, style: { textTransform: 'uppercase', textAlign: 'center' } } }}
              onChange={(e) => set({ pulsadorKey: e.target.value.toUpperCase() })}
              helperText="Letra que emite tu encoder USB"
            />
          </Stack>
          <Box>
            <Typography variant="overline" color="text.secondary">Disciplina (segundos)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              <TextField label="⚠️ Leve +" value={f.penLeve} onChange={(e) => set({ penLeve: e.target.value })} />
              <TextField label="🔶 Media +" value={f.penMedia} onChange={(e) => set({ penMedia: e.target.value })} />
              <TextField label="🔴 Grave +" value={f.penGrave} onChange={(e) => set({ penGrave: e.target.value })} />
              <TextField label="✅ Positivo −" value={f.bonPositivo} onChange={(e) => set({ bonPositivo: e.target.value })} />
            </Box>
          </Box>
          <Stack direction="row" justifyContent="space-between">
            <Button color="error" onClick={borrarEvento}>Eliminar evento</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={guardar}>Guardar cambios</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Pruebas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Renombra (se guarda al salir del campo), ordena, cambia el estado o agrega pruebas en cualquier momento.
        </Typography>
        {pruebas.map((p, i) => (
          <Stack key={p.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.75, borderBottom: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.gold, width: 22 }}>{i + 1}</Typography>
            <TextField
              defaultValue={p.nombre}
              key={p.id + p.nombre}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== p.nombre && patchPrueba(p, { nombre: e.target.value.trim() })}
            />
            <TextField
              select
              value={p.estado}
              onChange={(e) => patchPrueba(p, { estado: e.target.value as EstadoPrueba })}
              sx={{ width: 150, flexShrink: 0 }}
            >
              {(Object.keys(ESTADOS) as EstadoPrueba[]).map((k) => (
                <MenuItem key={k} value={k}><Chip size="small" color={ESTADOS[k].color} label={ESTADOS[k].label} /></MenuItem>
              ))}
            </TextField>
            <Tooltip title="Tiempos registrados"><Chip size="small" label={`${p._count?.resultados ?? 0} ⏱`} /></Tooltip>
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
    </Box>
  );
}
