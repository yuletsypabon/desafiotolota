'use client';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChurchOutlinedIcon from '@mui/icons-material/ChurchOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { api, fetcher, useClasificacion, useEquipos, useEvento } from '@/lib/client';
import { fmtMsPreciso } from '@/lib/format';
import type { ActividadEspiritualDTO, EquipoDTO } from '@/lib/types';
import { useAppDialog } from '@/components/AppDialog';
import { useRun } from '@/components/Toast';
import Vacio from '@/components/Vacio';
import { COLORS, ESPACIADO_SISTEMA } from '@/theme';

export default function Espiritual() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { data: ev, mutate: mutEvento } = useEvento(eventoId);
  const { data: equipos } = useEquipos(eventoId);
  const { mutate: mutClas } = useClasificacion(eventoId);
  const [pruebaId, setPruebaId] = useState('');
  const [nombre, setNombre] = useState('');
  const [tasa, setTasa] = useState('0.02');
  const [actividadId, setActividadId] = useState<string | null>(null);
  const [actividadEditId, setActividadEditId] = useState<string | null>(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const run = useRun();
  const dialog = useAppDialog();

  const { data: actividades, error, isLoading, mutate: mutActividades } = useSWR<ActividadEspiritualDTO[]>(
    pruebaId ? `/api/pruebas/${pruebaId}/actividades-espirituales` : null,
    fetcher,
  );
  const tasaPersistida = ev?.descuentoEspiritualPorPuntoMs;

  useEffect(() => {
    if (!ev || pruebaId) return;
    const def = ev.pruebas.find((p) => p.estado === 'EN_CURSO')
      ?? ev.pruebas.find((p) => p.estado === 'PENDIENTE')
      ?? ev.pruebas[0];
    if (def) setPruebaId(def.id);
  }, [ev, pruebaId]);

  useEffect(() => {
    if (tasaPersistida !== undefined) setTasa(String(tasaPersistida));
  }, [tasaPersistida]);

  const actividad = actividades?.find((a) => a.id === actividadId) ?? null;
  const tasaNumerica = Number(tasa);
  const prueba = ev?.pruebas.find((p) => p.id === pruebaId);
  const resumen = useMemo(() => {
    const resultado = new Map<string, { puntos: number; descuento: number }>();
    for (const a of actividades ?? []) {
      for (const puntaje of a.puntajes) {
        const anterior = resultado.get(puntaje.equipoId) ?? { puntos: 0, descuento: 0 };
        anterior.puntos += puntaje.puntos;
        anterior.descuento += puntaje.puntos * (ev?.descuentoEspiritualPorPuntoMs ?? 0);
        resultado.set(puntaje.equipoId, anterior);
      }
    }
    return resultado;
  }, [actividades, ev?.descuentoEspiritualPorPuntoMs]);

  const crearActividad = () => run(async () => {
    if (!pruebaId) throw new Error('Selecciona una prueba');
    const creada = await api<ActividadEspiritualDTO>(
      `/api/pruebas/${pruebaId}/actividades-espirituales`, 'POST', { nombre },
    );
    setNombre('');
    await mutActividades();
    setActividadId(creada.id);
  }, 'Actividad creada');

  const guardarTasa = () => run(async () => {
    const valor = Number(tasa);
    if (!Number.isFinite(valor) || valor < 0) throw new Error('Ingresa un valor válido, igual o mayor que cero');
    await api(`/api/eventos/${eventoId}`, 'PATCH', { descuentoEspiritualPorPuntoMs: valor });
    await Promise.all([mutEvento(), mutClas()]);
  }, 'Descuento por punto guardado');

  const guardarNombre = (id: string) => run(async () => {
    await api(`/api/actividades-espirituales/${id}`, 'PATCH', { nombre: nombreEdit });
    setActividadEditId(null);
    await mutActividades();
  }, 'Actividad actualizada');

  const eliminarActividad = async (item: ActividadEspiritualDTO) => {
    if (!await dialog({
      title: 'Eliminar actividad',
      message: `Se eliminará "${item.nombre}" y todos sus puntajes. Esta acción no se puede deshacer.`,
      tone: 'danger',
      confirmLabel: 'Eliminar actividad',
    })) return;
    run(async () => {
      await api(`/api/actividades-espirituales/${item.id}`, 'DELETE');
      if (actividadId === item.id) setActividadId(null);
      await Promise.all([mutActividades(), mutClas()]);
    }, 'Actividad eliminada');
  };

  const guardarPuntajes = async (puntajes: { equipoId: string; puntos: number }[]) => {
    if (!actividad) return false;
    const guardado = await run(async () => {
      await api(`/api/actividades-espirituales/${actividad.id}/puntajes`, 'PUT', { puntajes });
      await Promise.all([mutActividades(), mutClas()]);
    }, 'Puntos guardados y clasificación actualizada');
    if (guardado) setActividadId(null);
    return guardado;
  };

  if (!ev || !equipos) return null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(280px, .75fr) minmax(0, 1.5fr)' }, gap: 2, alignItems: 'start' }}>
      <Stack spacing={2}>
        <Paper sx={{ ...ESPACIADO_SISTEMA.tarjeta, borderColor: `${COLORS.purple}55` }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ChurchOutlinedIcon sx={{ fontSize: 32, color: COLORS.purple }} />
              <Box>
                <Typography variant="h4" sx={{ color: COLORS.purple }}>Componente espiritual</Typography>
                <Typography variant="body2" color="text.secondary">Crea actividades por prueba y asigna puntos a cada equipo.</Typography>
              </Box>
            </Stack>
            <TextField
              select
              fullWidth
              label="Prueba"
              value={pruebaId}
              onChange={(e) => {
                setPruebaId(e.target.value);
                setActividadId(null);
              }}
              disabled={!ev.pruebas.length}
            >
              {ev.pruebas.map((p, i) => <MenuItem key={p.id} value={p.id}>{i + 1}. {p.nombre}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Descuento por punto (ms)"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              helperText={`Ejemplo: 8 puntos descontarán ${fmtMsPreciso((Number.isFinite(tasaNumerica) ? tasaNumerica : 0) * 8)}.`}
            />
            <Button variant="outlined" onClick={guardarTasa}>Guardar valor por punto</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ mb: 1.5 }}>Nueva actividad</Typography>
          {!prueba ? (
            <Typography color="text.secondary">Este evento aún no tiene pruebas.</Typography>
          ) : (
            <Stack spacing={1.5}>
              <TextField
                label="Nombre de la actividad"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && nombre.trim()) crearActividad(); }}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
              <Button variant="contained" startIcon={<AddIcon />} disabled={!nombre.trim()} onClick={crearActividad}>
                Crear actividad
              </Button>
            </Stack>
          )}
        </Paper>
      </Stack>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ mb: 1.5 }}>Actividades de {prueba?.nombre ?? 'la prueba'}</Typography>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>No se pudieron cargar las actividades: {error.message}</Alert>}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={26} /></Box>
          ) : !actividades?.length ? (
            <Vacio icono={<ChurchOutlinedIcon />}>Todavía no hay actividades para esta prueba.</Vacio>
          ) : (
            <Stack spacing={1.25}>
              {actividades.map((item) => {
                const puntos = item.puntajes.reduce((suma, p) => suma + p.puntos, 0);
                const descuento = puntos * ev.descuentoEspiritualPorPuntoMs;
                const editando = actividadEditId === item.id;
                return (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderColor: 'divider' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        <GroupsOutlinedIcon color="action" />
                        {editando ? (
                          <TextField size="small" fullWidth value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} />
                        ) : (
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700} noWrap>{item.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.puntajes.length} equipos · {puntos} puntos · −{fmtMsPreciso(descuento)}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                      {editando ? (
                        <>
                          <Button size="small" onClick={() => guardarNombre(item.id)} disabled={!nombreEdit.trim()}>Guardar</Button>
                          <Button size="small" color="inherit" onClick={() => setActividadEditId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="contained" onClick={() => setActividadId(item.id)}>Asignar puntos</Button>
                          <IconButton aria-label={`Editar ${item.nombre}`} onClick={() => { setActividadEditId(item.id); setNombreEdit(item.nombre); }}>
                            <EditOutlinedIcon />
                          </IconButton>
                          <IconButton aria-label={`Eliminar ${item.nombre}`} color="error" onClick={() => eliminarActividad(item)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ mb: 1.5 }}>Puntos por equipo en {prueba?.nombre ?? 'esta prueba'}</Typography>
          {!resumen.size ? (
            <Vacio icono={<GroupsOutlinedIcon />}>Aún no se han asignado puntos.</Vacio>
          ) : (
            <Stack spacing={1}>
              {equipos.map((equipo) => {
                const item = resumen.get(equipo.id);
                if (!item) return null;
                return (
                  <Stack key={equipo.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: '1px solid', borderColor: 'divider', py: .75 }}>
                    <Typography>{equipo.numero}. {equipo.nombre}</Typography>
                    <Typography fontWeight={700}>{item.puntos} pts · −{fmtMsPreciso(item.descuento)}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Stack>

      {actividad && (
        <PuntajesDialog
          actividad={actividad}
          pruebaNombre={prueba?.nombre ?? ''}
          equipos={equipos}
          tasa={ev.descuentoEspiritualPorPuntoMs}
          onClose={() => setActividadId(null)}
          onSave={guardarPuntajes}
        />
      )}
    </Box>
  );
}

/**
 * Puntos de una actividad para todos los equipos a la vez: una fila por equipo con su casilla de puntos y el
 * descuento que le da. Se guarda todo junto; los equipos en 0 o vacíos quedan sin puntos.
 */
function PuntajesDialog({
  actividad, pruebaNombre, equipos, tasa, onClose, onSave,
}: {
  actividad: ActividadEspiritualDTO;
  pruebaNombre: string;
  equipos: EquipoDTO[];
  tasa: number;
  onClose: () => void;
  onSave: (puntajes: { equipoId: string; puntos: number }[]) => Promise<boolean>;
}) {
  const inicial = () => Object.fromEntries(actividad.puntajes.map((p) => [p.equipoId, String(p.puntos)]));
  const [valores, setValores] = useState<Record<string, string>>(inicial);
  const [guardando, setGuardando] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de actividad
  useEffect(() => setValores(inicial()), [actividad.id]);

  const numero = (v: string | undefined) => (v === undefined || v.trim() === '' ? 0 : Number(v));
  const invalido = (v: string | undefined) => {
    const n = numero(v);
    return !Number.isInteger(n) || n < 0 || n > 1_000_000;
  };
  const hayInvalidos = equipos.some((e) => invalido(valores[e.id]));
  const total = equipos.reduce((suma, e) => suma + (invalido(valores[e.id]) ? 0 : numero(valores[e.id])), 0);

  const guardar = async () => {
    if (hayInvalidos) return;
    setGuardando(true);
    try {
      await onSave(equipos.map((e) => ({ equipoId: e.id, puntos: numero(valores[e.id]) })).filter((p) => p.puntos > 0));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Asignar puntos · {actividad.nombre}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Prueba: <b>{pruebaNombre}</b>. Escribe los puntos de cada equipo; cada punto descuenta {fmtMsPreciso(tasa)} de su tiempo en esta prueba.
        </Typography>
        {!equipos.length ? (
          <Alert severity="info">Agrega equipos al evento antes de asignar puntos.</Alert>
        ) : (
          <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
            {equipos.map((e) => {
              const v = valores[e.id] ?? '';
              const malo = invalido(v);
              return (
                <Stack key={e.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75 }}>
                  <Typography sx={{ flex: 1, minWidth: 0 }} noWrap>{e.numero}. {e.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right' }}>
                    {!malo && numero(v) > 0 ? `−${fmtMsPreciso(numero(v) * tasa)}` : ''}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={v}
                    placeholder="0"
                    error={malo}
                    onChange={(ev) => setValores((s) => ({ ...s, [e.id]: ev.target.value }))}
                    slotProps={{ htmlInput: { min: 0, max: 1_000_000, step: 1, 'aria-label': `Puntos de ${e.nombre}` } }}
                    sx={{ width: 110 }}
                  />
                </Stack>
              );
            })}
          </Stack>
        )}
        {hayInvalidos && <Alert severity="error" sx={{ mt: 2 }}>Los puntos deben ser números enteros entre 0 y 1.000.000.</Alert>}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Typography variant="body2" color="text.secondary">Total: <b>{total}</b> puntos</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button onClick={() => void guardar()} variant="contained" disabled={guardando || hayInvalidos || !equipos.length}>
            {guardando ? 'Guardando…' : 'Guardar puntos'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
