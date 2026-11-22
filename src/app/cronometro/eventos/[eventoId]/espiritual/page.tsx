'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChurchOutlinedIcon from '@mui/icons-material/ChurchOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { api, fetcher, useClasificacion, useEquipos, useEvento } from '@/lib/client';
import { descuentoEspiritualMs, descuentoPorPuntoSegundos } from '@/lib/espiritual';
import { fmtSegundos } from '@/lib/format';
import type { ActividadEspiritualDTO, EquipoDTO, PruebaDTO, TipoActividadEspiritual } from '@/lib/types';
import { useAppDialog } from '@/components/AppDialog';
import { useRun } from '@/components/Toast';
import Vacio from '@/components/Vacio';
import { COLORS, ESPACIADO_SISTEMA, alfa, superficieVidrio } from '@/theme';

const MAX_PUNTOS = 1_000_000;
type ConfiguracionAbierta = ActividadEspiritualDTO | 'NUEVA' | null;

/** Las actividades se administran como los eventos: tarjeta → configuración → puntajes dentro de ella. */
export default function Espiritual() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { data: evento } = useEvento(eventoId);
  const { data: equipos } = useEquipos(eventoId);
  const { mutate: mutClas } = useClasificacion(eventoId);
  const [configuracion, setConfiguracion] = useState<ConfiguracionAbierta>(null);
  const [actividadAbiertaId, setActividadAbiertaId] = useState<string | null>(null);
  const run = useRun();
  const dialog = useAppDialog();

  const { data: actividades, error, isLoading, mutate: mutActividades } = useSWR<ActividadEspiritualDTO[]>(
    eventoId ? `/api/eventos/${eventoId}/actividades-espirituales` : null,
    fetcher,
  );
  const actividadAbierta = actividades?.find((actividad) => actividad.id === actividadAbiertaId) ?? null;
  const pruebaDe = (id: string | null) => evento?.pruebas.find((prueba) => prueba.id === id);

  const guardarConfiguracion = async (datos: ConfiguracionActividad) => {
    const creada = configuracion === 'NUEVA';
    const ok = await run(async () => {
      if (creada) {
        const actividad = await api<ActividadEspiritualDTO>(`/api/eventos/${eventoId}/actividades-espirituales`, 'POST', datos);
        await mutActividades();
        setActividadAbiertaId(actividad.id);
      } else if (configuracion) {
        await api(`/api/actividades-espirituales/${configuracion.id}`, 'PATCH', datos);
        await mutActividades();
      }
      await mutClas();
    }, creada ? 'Actividad creada' : 'Configuración actualizada');
    if (ok) setConfiguracion(null);
    return ok;
  };

  const eliminarActividad = async (actividad: ActividadEspiritualDTO) => {
    if (!await dialog({
      title: 'Eliminar actividad',
      message: `Se eliminará "${actividad.nombre}" y todos sus puntajes. Esta acción no se puede deshacer.`,
      tone: 'danger',
      confirmLabel: 'Eliminar actividad',
    })) return;
    run(async () => {
      await api(`/api/actividades-espirituales/${actividad.id}`, 'DELETE');
      if (actividadAbiertaId === actividad.id) setActividadAbiertaId(null);
      await Promise.all([mutActividades(), mutClas()]);
    }, 'Actividad eliminada');
  };

  const guardarPuntajes = async (actividad: ActividadEspiritualDTO, puntajes: { equipoId: string; puntos: number }[]) => {
    const guardado = await run(async () => {
      await api(`/api/actividades-espirituales/${actividad.id}/puntajes`, 'PUT', { puntajes });
      await Promise.all([mutActividades(), mutClas()]);
    }, actividad.tipo === 'TIEMPO' ? 'Puntos guardados y clasificación actualizada' : 'Puntos Plus guardados');
    if (guardado) setActividadAbiertaId(null);
    return guardado;
  };

  if (!evento) return null;
  const listaEquipos = equipos ?? [];

  return (
    <Box>
      <Paper sx={{ ...ESPACIADO_SISTEMA.tarjeta, mb: 2, borderColor: `${COLORS.purple}55` }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
            <ChurchOutlinedIcon sx={{ fontSize: 34, color: COLORS.purple }} />
            <Box>
              <Typography variant="h4" sx={{ color: COLORS.purple }}>Actividades espirituales</Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setConfiguracion('NUEVA')}>Nueva actividad</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>No se pudieron cargar las actividades: {error.message}</Alert>}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
      ) : !actividades?.length ? (
        <Vacio icono={<ChurchOutlinedIcon />}>Todavía no hay actividades. Crea la primera para configurarla.</Vacio>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 2.5 }}>
          {actividades.map((actividad) => (
            <TarjetaActividad
              key={actividad.id}
              actividad={actividad}
              prueba={pruebaDe(actividad.pruebaId)}
              onAbrir={() => setActividadAbiertaId(actividad.id)}
              onConfigurar={() => setConfiguracion(actividad)}
              onEliminar={() => eliminarActividad(actividad)}
            />
          ))}
        </Box>
      )}

      <ConfiguracionActividadDialog
        key={configuracion === 'NUEVA' ? 'NUEVA' : configuracion?.id ?? 'CERRADA'}
        abierta={configuracion !== null}
        actividad={configuracion === 'NUEVA' ? null : configuracion}
        pruebas={evento.pruebas}
        onClose={() => setConfiguracion(null)}
        onGuardar={guardarConfiguracion}
      />
      {actividadAbierta && (
        <ActividadDialog
          actividad={actividadAbierta}
          prueba={pruebaDe(actividadAbierta.pruebaId)}
          equipos={listaEquipos}
          onClose={() => setActividadAbiertaId(null)}
          onGuardar={(puntajes) => guardarPuntajes(actividadAbierta, puntajes)}
        />
      )}
    </Box>
  );
}

function TarjetaActividad({
  actividad, prueba, onAbrir, onConfigurar, onEliminar,
}: {
  actividad: ActividadEspiritualDTO;
  prueba?: PruebaDTO;
  onAbrir: () => void;
  onConfigurar: () => void;
  onEliminar: () => void;
}) {
  const esTiempo = actividad.tipo === 'TIEMPO';
  const Icono = esTiempo ? TimerOutlinedIcon : StarsOutlinedIcon;
  const puntos = actividad.puntajes.reduce((total, puntaje) => total + puntaje.puntos, 0);
  const descuento = actividad.puntajes.reduce(
    (total, puntaje) => total + descuentoEspiritualMs(actividad.tipo, puntaje.puntos, actividad.puntosMaximos), 0,
  );

  return (
    <Box component="article" sx={{
      ...superficieVidrio, borderRadius: '28px', p: 1.25, display: 'flex', flexDirection: 'column',
      transition: 'transform .2s ease, border-color .2s ease',
      '&:hover': { transform: 'translateY(-4px)', borderColor: alfa(esTiempo ? COLORS.purple : COLORS.acento, .55) },
    }}>
      <Box sx={{
        minHeight: 132, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        bgcolor: esTiempo ? alfa(COLORS.purple, .18) : alfa(COLORS.acento, .13),
        background: esTiempo ? `linear-gradient(135deg, ${alfa(COLORS.purple, .30)}, transparent)` : `linear-gradient(135deg, ${alfa(COLORS.acento, .24)}, transparent)`,
      }}>
        <Icono sx={{ fontSize: 58, color: esTiempo ? COLORS.purple : COLORS.acento }} />
        <Chip
          size="small" label={esTiempo ? 'TIEMPO' : 'PLUS'} color={esTiempo ? 'secondary' : 'primary'}
          sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700, letterSpacing: '.06em' }}
        />
        <Stack direction="row" spacing={.5} sx={{ position: 'absolute', top: 7, right: 7 }}>
          <IconButton aria-label={`Configurar ${actividad.nombre}`} onClick={onConfigurar} size="small" sx={{ bgcolor: 'rgba(5,5,5,.45)' }}><SettingsOutlinedIcon fontSize="small" /></IconButton>
          <IconButton aria-label={`Eliminar ${actividad.nombre}`} onClick={onEliminar} size="small" sx={{ bgcolor: 'rgba(5,5,5,.45)' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 1.25, pt: 2, pb: 1, flex: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: 21, lineHeight: 1.25, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>
          {actividad.nombre}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .75, minHeight: 40 }}>
          {esTiempo
            ? `${prueba?.nombre ?? 'Prueba eliminada'} · ${actividad.puntosMaximos} pts máx. · 2 min máximos`
            : `${actividad.puntosMaximos} pts máx. · no afecta el cronómetro`}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.25, pt: 1, pb: .75 }}>
        <Stack direction="row" spacing={.5} alignItems="center" color="text.secondary">
          <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={700}>{actividad.puntajes.length}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">{puntos} pts{esTiempo ? ` · −${fmtSegundos(descuento)}` : ''}</Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={onAbrir} sx={{ px: 2.25, bgcolor: 'rgba(255,255,255,.08)', color: 'text.primary', '&:hover': { bgcolor: COLORS.acento, color: COLORS.bg } }}>
          Abrir
        </Button>
      </Stack>
    </Box>
  );
}

interface ConfiguracionActividad {
  nombre: string;
  tipo: TipoActividadEspiritual;
  pruebaId: string | null;
  puntosMaximos: number;
}

/** Se muestra solo al crear o configurar una tarjeta; no ocupa la pantalla de actividades. */
function ConfiguracionActividadDialog({
  abierta, actividad, pruebas, onClose, onGuardar,
}: {
  abierta: boolean;
  actividad: ActividadEspiritualDTO | null;
  pruebas: PruebaDTO[];
  onClose: () => void;
  onGuardar: (datos: ConfiguracionActividad) => Promise<boolean>;
}) {
  const [nombre, setNombre] = useState(actividad?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoActividadEspiritual>(actividad?.tipo ?? 'PLUS');
  const [pruebaId, setPruebaId] = useState(actividad?.pruebaId ?? '');
  const [puntosMaximos, setPuntosMaximos] = useState(String(actividad?.puntosMaximos ?? 100));
  const [guardando, setGuardando] = useState(false);
  const maximo = Number(puntosMaximos);

  const guardar = async () => {
    if (!nombre.trim() || !Number.isInteger(maximo) || maximo < 1 || maximo > MAX_PUNTOS) return;
    if (tipo === 'TIEMPO' && !pruebaId) return;
    setGuardando(true);
    try {
      await onGuardar({ nombre: nombre.trim(), tipo, pruebaId: tipo === 'TIEMPO' ? pruebaId : null, puntosMaximos: maximo });
    } finally {
      setGuardando(false);
    }
  };

  const invalido = !nombre.trim() || !Number.isInteger(maximo) || maximo < 1 || maximo > MAX_PUNTOS || (tipo === 'TIEMPO' && !pruebaId);
  return (
    <Dialog open={abierta} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{actividad ? `Configurar · ${actividad.nombre}` : 'Nueva actividad espiritual'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ pt: .5 }}>
          <TextField label="Nombre de la actividad" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus slotProps={{ htmlInput: { maxLength: 200 } }} />
          <TextField select label="Tipo de actividad" value={tipo} onChange={(e) => setTipo(e.target.value as TipoActividadEspiritual)}>
            <MenuItem value="PLUS">Plus · no modifica tiempo</MenuItem>
            <MenuItem value="TIEMPO">Tiempo · descuenta una prueba</MenuItem>
          </TextField>
          {tipo === 'TIEMPO' && (
            <TextField select label="Prueba que recibirá el descuento" value={pruebaId} onChange={(e) => setPruebaId(e.target.value)} disabled={!pruebas.length}>
              {pruebas.map((prueba, indice) => <MenuItem key={prueba.id} value={prueba.id}>{indice + 1}. {prueba.nombre}</MenuItem>)}
            </TextField>
          )}
          <TextField
            type="number" label="Puntos máximos" value={puntosMaximos} onChange={(e) => setPuntosMaximos(e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: MAX_PUNTOS, step: 1 } }}
            helperText={tipo === 'TIEMPO' && Number.isInteger(maximo) && maximo > 0
              ? `Cada punto descuenta ${descuentoPorPuntoSegundos(maximo).toLocaleString('es-CO', { maximumFractionDigits: 3 })} s; el máximo descuenta 2 min.`
              : 'Define el máximo de puntos que se podrá asignar a cada equipo.'}
          />
          {tipo === 'PLUS' && <Alert severity="info">Los puntos Plus se guardan en el histórico espiritual, sin modificar ningún tiempo.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => void guardar()} disabled={invalido || guardando}>{guardando ? 'Guardando…' : actividad ? 'Guardar cambios' : 'Crear actividad'}</Button>
      </DialogActions>
    </Dialog>
  );
}

/** Dentro de una actividad se ven su configuración y los puntos de todos los equipos. */
function ActividadDialog({
  actividad, prueba, equipos, onClose, onGuardar,
}: {
  actividad: ActividadEspiritualDTO;
  prueba?: PruebaDTO;
  equipos: EquipoDTO[];
  onClose: () => void;
  onGuardar: (puntajes: { equipoId: string; puntos: number }[]) => Promise<boolean>;
}) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const esTiempo = actividad.tipo === 'TIEMPO';

  useEffect(() => {
    setValores(Object.fromEntries(actividad.puntajes.map((puntaje) => [puntaje.equipoId, String(puntaje.puntos)])));
  }, [actividad.id, actividad.puntajes]);

  const numero = (valor: string | undefined) => (valor === undefined || valor.trim() === '' ? 0 : Number(valor));
  const invalido = (valor: string | undefined) => {
    const puntos = numero(valor);
    return !Number.isInteger(puntos) || puntos < 0 || puntos > actividad.puntosMaximos;
  };
  const hayInvalidos = equipos.some((equipo) => invalido(valores[equipo.id]));
  const total = equipos.reduce((suma, equipo) => suma + (invalido(valores[equipo.id]) ? 0 : numero(valores[equipo.id])), 0);

  const guardar = async () => {
    if (hayInvalidos) return;
    setGuardando(true);
    try {
      await onGuardar(equipos.map((equipo) => ({ equipoId: equipo.id, puntos: numero(valores[equipo.id]) })).filter((puntaje) => puntaje.puntos > 0));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{actividad.nombre}</DialogTitle>
      <DialogContent dividers>
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderColor: esTiempo ? `${COLORS.purple}88` : `${COLORS.acento}66` }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Chip label={esTiempo ? 'ACTIVIDAD DE TIEMPO' : 'ACTIVIDAD PLUS'} color={esTiempo ? 'secondary' : 'primary'} />
            <Typography variant="body2" color="text.secondary">
              {esTiempo
                ? `${prueba?.nombre ?? 'Prueba eliminada'} · ${actividad.puntosMaximos} pts máx. · cada punto descuenta ${descuentoPorPuntoSegundos(actividad.puntosMaximos).toLocaleString('es-CO', { maximumFractionDigits: 3 })} s.`
                : `${actividad.puntosMaximos} pts máximos por equipo · no modifica tiempo ni clasificación.`}
            </Typography>
          </Stack>
        </Paper>
        {!equipos.length ? (
          <Alert severity="info">Agrega equipos al evento antes de asignar puntos.</Alert>
        ) : (
          <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
            {equipos.map((equipo) => {
              const valor = valores[equipo.id] ?? '';
              const malo = invalido(valor);
              const puntos = numero(valor);
              return (
                <Stack key={equipo.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: .9 }}>
                  <Typography sx={{ flex: 1, minWidth: 0 }} noWrap>{equipo.numero}. {equipo.nombre}</Typography>
                  {esTiempo && (
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 92, textAlign: 'right' }}>
                      {!malo && puntos > 0 ? `−${fmtSegundos(descuentoEspiritualMs('TIEMPO', puntos, actividad.puntosMaximos))}` : ''}
                    </Typography>
                  )}
                  <TextField
                    size="small" type="number" value={valor} placeholder="0" error={malo}
                    onChange={(event) => setValores((actual) => ({ ...actual, [equipo.id]: event.target.value }))}
                    slotProps={{ htmlInput: { min: 0, max: actividad.puntosMaximos, step: 1, 'aria-label': `Puntos de ${equipo.nombre}` } }}
                    sx={{ width: 110 }}
                  />
                </Stack>
              );
            })}
          </Stack>
        )}
        {hayInvalidos && <Alert severity="error" sx={{ mt: 2 }}>Los puntos deben ser números enteros entre 0 y {actividad.puntosMaximos}.</Alert>}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Typography variant="body2" color="text.secondary">Total: <b>{total}</b> puntos</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} color="inherit">Cerrar</Button>
          <Button variant="contained" onClick={() => void guardar()} disabled={guardando || hayInvalidos || !equipos.length}>{guardando ? 'Guardando…' : 'Guardar puntos'}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
