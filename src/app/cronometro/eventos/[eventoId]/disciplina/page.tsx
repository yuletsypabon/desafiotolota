'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { api, useClasificacion, useEquipos, useEvento, usePuntos } from '@/lib/client';
import { horaActual, fmtSeg } from '@/lib/format';
import { TIPOS } from '@/lib/estados';
import { valorPunto } from '@/lib/scoring';
import { useRun } from '@/components/Toast';
import { useAppDialog } from '@/components/AppDialog';
import Vacio from '@/components/Vacio';
import type { TipoPunto } from '@/lib/types';
import { COLORS, alfa } from '@/theme';

const ICONO_TIPO: Record<TipoPunto, typeof WarningAmberIcon> = {
  LEVE: WarningAmberIcon,
  MEDIA: ReportProblemOutlinedIcon,
  GRAVE: ErrorOutlineIcon,
  POSITIVO: CheckCircleOutlineIcon,
};

export default function Disciplina() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { data: ev } = useEvento(eventoId);
  const { data: equipos } = useEquipos(eventoId);
  const { data: puntos, mutate } = usePuntos(eventoId);
  const { mutate: mutClas } = useClasificacion(eventoId);
  const run = useRun();
  const dialog = useAppDialog();

  const [tipo, setTipo] = useState<TipoPunto | null>(null);
  const [pruebaId, setPruebaId] = useState('');
  const [equipoId, setEquipoId] = useState('');
  const [participanteId, setParticipanteId] = useState('');
  const [hora, setHora] = useState(horaActual());
  const [desc, setDesc] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    if (!ev || pruebaId) return;
    const def = ev.pruebas.find((p) => p.estado === 'EN_CURSO') ?? ev.pruebas.find((p) => p.estado === 'PENDIENTE') ?? ev.pruebas[0];
    if (def) setPruebaId(def.id);
  }, [ev, pruebaId]);

  const equipo = equipos?.find((e) => e.id === equipoId);
  const eqMap = useMemo(() => new Map((equipos ?? []).map((e) => [e.id, e])), [equipos]);
  const partMap = useMemo(() => new Map((equipos ?? []).flatMap((e) => e.participantes.map((p) => [p.id, p.nombre] as const))), [equipos]);
  const prMap = useMemo(() => new Map((ev?.pruebas ?? []).map((p) => [p.id, p.nombre])), [ev]);

  if (!ev || !equipos) return null;

  const registrar = () =>
    run(async () => {
      if (!tipo) throw new Error('Selecciona el tipo');
      if (!pruebaId) throw new Error('Selecciona la prueba');
      if (!equipoId) throw new Error('Selecciona el equipo');
      await api(`/api/eventos/${eventoId}/disciplina`, 'POST', {
        tipo, pruebaId, equipoId, participanteId: participanteId || null, hora, descripcion: desc,
      });
      setDesc('');
      setParticipanteId('');
      setHora(horaActual());
      await Promise.all([mutate(), mutClas()]);
    }, `Punto registrado: ${prMap.get(pruebaId) ?? ''}`);

  const borrar = async (id: string) => {
    if (!await dialog({
      title: 'Eliminar punto',
      message: '¿Quieres eliminar este punto de disciplina?',
      tone: 'danger',
      confirmLabel: 'Eliminar punto',
    })) return;
    run(async () => {
      await api(`/api/disciplina/${id}`, 'DELETE');
      await Promise.all([mutate(), mutClas()]);
    }, 'Eliminado');
  };

  const lista = (puntos ?? []).filter((p) => !filtro || p.pruebaId === filtro);
  const resumen = new Map<string, number>();
  lista.forEach((p) => resumen.set(p.equipoId, (resumen.get(p.equipoId) ?? 0) + valorPunto(p.tipo, ev)));

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(300px, 0.8fr) minmax(0, 1.6fr)' }, gap: 2, alignItems: 'start' }}>
      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Typography variant="h4" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><GavelOutlinedIcon />Registrar punto</Typography>
        <Stack spacing={1.5}>
          <ToggleButtonGroup exclusive value={tipo} onChange={(_, v) => v && setTipo(v)} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            {(Object.keys(TIPOS) as TipoPunto[]).map((t) => (
              (() => {
                const Icono = ICONO_TIPO[t];
                return (
                  <ToggleButton key={t} value={t} sx={{
                    flexDirection: 'column', border: `2px solid ${COLORS.border} !important`, borderRadius: '8px !important', py: 0.75,
                    '&.Mui-selected': { borderColor: `${TIPOS[t].color} !important`, color: TIPOS[t].color, bgcolor: `${TIPOS[t].color}14` },
                  }}>
                    <Icono fontSize="small" />
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{TIPOS[t].label}</span>
                    <small>{fmtSeg(valorPunto(t, ev))}</small>
                  </ToggleButton>
                );
              })()
            ))}
          </ToggleButtonGroup>
          <TextField select label="Prueba" value={pruebaId} onChange={(e) => setPruebaId(e.target.value)}>
            {ev.pruebas.map((p, i) => <MenuItem key={p.id} value={p.id}>{i + 1}. {p.nombre}</MenuItem>)}
          </TextField>
          <TextField select label="Equipo" value={equipoId} onChange={(e) => { setEquipoId(e.target.value); setParticipanteId(''); }}>
            {equipos.map((e) => <MenuItem key={e.id} value={e.id}>{e.numero}. {e.nombre}</MenuItem>)}
          </TextField>
          <TextField select label="Aplica a" value={participanteId} onChange={(e) => setParticipanteId(e.target.value)} disabled={!equipo}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Todo el equipo</MenuItem>
            {equipo?.participantes.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </TextField>
          <TextField label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Descripción (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Llegaron tarde al culto" />
          <Button variant="contained" size="large" onClick={registrar}>Registrar punto</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h4" sx={{ flex: 1 }}>Registro</Typography>
          <TextField select size="small" label="Filtrar prueba" value={filtro} onChange={(e) => setFiltro(e.target.value)} sx={{ width: { xs: '100%', sm: 260 } }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Todas</MenuItem>
            {ev.pruebas.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </TextField>
        </Stack>
        {resumen.size > 0 && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {[...resumen.entries()].sort((a, b) => b[1] - a[1]).map(([id, ms]) => (
              <Chip key={id} size="small" label={`${eqMap.get(id)?.nombre ?? '?'} ${fmtSeg(ms)}`}
                sx={{ color: ms > 0 ? COLORS.red : COLORS.green, bgcolor: ms > 0 ? alfa(COLORS.red, .12) : alfa(COLORS.green, .12) }} />
            ))}
          </Stack>
        )}
        {!lista.length && <Vacio icono={<NoteAltOutlinedIcon />}>Sin puntos registrados.</Vacio>}
        {lista.map((p) => (
          <Box key={p.id} sx={{ py: 1, borderBottom: `1px solid ${COLORS.border}` }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={`${TIPOS[p.tipo].label} ${fmtSeg(valorPunto(p.tipo, ev))}`}
                sx={{ color: TIPOS[p.tipo].color, bgcolor: `${TIPOS[p.tipo].color}22`, fontWeight: 700 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{eqMap.get(p.equipoId)?.nombre ?? '—'}</Typography>
              <IconButton size="small" onClick={() => borrar(p.id)}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {p.participanteId ? `Integrante: ${partMap.get(p.participanteId) ?? '—'}` : 'Todo el equipo'}
              {p.hora ? ` · ${p.hora}` : ''}{p.descripcion ? ` · ${p.descripcion}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.blue, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PushPinOutlinedIcon sx={{ fontSize: 14 }} />{prMap.get(p.pruebaId)}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
