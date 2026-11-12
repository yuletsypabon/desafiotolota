'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import DownloadIcon from '@mui/icons-material/Download';
import FlagIcon from '@mui/icons-material/Flag';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PrintIcon from '@mui/icons-material/Print';
import { api, store, useClasificacion, useEquipos, useEvento, useSesion } from '@/lib/client';
import { ordenEfectivo } from '@/lib/orden';
import { intercambiarEnPistas, intercambiarEnSet } from '@/lib/intercambio';
import { asignacionesLibres } from '@/lib/asignacion';
import { accionDeBoton, useBotonesGamepad } from '@/lib/gamepad';
import { htmlOrdenSalida, imprimirHtml } from '@/lib/imprimir';
import { fHora, fmt, fmtSeg } from '@/lib/format';
import { ESTADOS } from '@/lib/estados';
import { useRun, useToast } from '@/components/Toast';
import EquipoAvatar from '@/components/EquipoAvatar';
import PosChip from '@/components/PosChip';
import Vacio from '@/components/Vacio';
import LaneCard, { laneVacia, type Lane } from '@/components/crono/LaneCard';
import OrdenDialog from '@/components/crono/OrdenDialog';
import DetalleDialog from '@/components/crono/DetalleDialog';
import CorregirDialog, { type OpcionCorregir } from '@/components/crono/CorregirDialog';
import type { EquipoDTO, FilaPrueba } from '@/lib/types';
import { COLORS, FONT_MONO } from '@/theme';

const KEYS_DET = 'QWERTYUI';
const MAX_PISTAS = 8; // teclas 1–8 y Q…I
const ESTADO_PISTA: Record<Lane['state'], string> = {
  idle: 'Libre', rdy: 'Lista para salir', run: 'En pista', det: 'Detenido', fin: 'Llegó a meta',
};

export default function Cronometro() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { data: ev, mutate: mutEv } = useEvento(eventoId);
  const { esAdmin } = useSesion();
  const { data: equipos } = useEquipos(eventoId);
  const { data: clas, mutate: mutClas } = useClasificacion(eventoId, 4000);
  const toast = useToast();
  const run = useRun();

  const [pruebaId, setPruebaId] = useState('');
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [cargado, setCargado] = useState('');
  const [focus, setFocus] = useState<number | null>(null);
  const [libDlg, setLibDlg] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<FilaPrueba | null>(null);
  const [ordenOpen, setOrdenOpen] = useState(false);
  const [finLocal, setFinLocal] = useState<Set<string>>(new Set());
  const [corregir, setCorregir] = useState<OpcionCorregir[] | null>(null);
  const [auto, setAuto] = useState(true);

  // Asignación automática: preferencia de cada dispositivo
  useEffect(() => setAuto(store.get('crono:auto', true)), []);
  const cambiarAuto = (v: boolean) => {
    setAuto(v);
    store.set('crono:auto', v);
  };

  const pistasEvento = ev?.numPistas ?? 3;
  const [extra, cambiarExtra] = usePistasExtra(eventoId, pistasEvento);
  const numPistas = pistasEvento + extra;
  const prueba = ev?.pruebas.find((p) => p.id === pruebaId);

  // Prueba por defecto: la última usada en este equipo, o la primera en curso / pendiente
  useEffect(() => {
    if (!ev || pruebaId) return;
    const last = store.get<string>(`crono:prueba:${eventoId}`, '');
    const def =
      ev.pruebas.find((p) => p.id === last) ??
      ev.pruebas.find((p) => p.estado === 'EN_CURSO') ??
      ev.pruebas.find((p) => p.estado === 'PENDIENTE') ??
      ev.pruebas[0];
    if (def) setPruebaId(def.id);
  }, [ev, eventoId, pruebaId]);

  // Cargar pistas guardadas localmente (recuperación si se recarga la página)
  useEffect(() => {
    if (!pruebaId) return;
    store.set(`crono:prueba:${eventoId}`, pruebaId);
    const saved = store.get<Lane[]>(`crono:lanes:${pruebaId}`, []);
    setLanes(Array.from({ length: numPistas }, (_, i) => saved[i] ?? laneVacia()));
    setFinLocal(new Set());
    setFocus(null);
    setCargado(pruebaId);
  }, [pruebaId, numPistas, eventoId]);

  useEffect(() => {
    if (cargado && cargado === pruebaId) store.set(`crono:lanes:${pruebaId}`, lanes);
  }, [lanes, pruebaId, cargado]);

  // Mantener la pantalla encendida mientras hay equipos en pista
  const hayActivos = lanes.some((l) => l.state === 'run' || l.state === 'det');
  useEffect(() => {
    if (!hayActivos || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [hayActivos]);

  const eqMap = useMemo(() => new Map((equipos ?? []).map((e) => [e.id, e])), [equipos]);
  const filas = useMemo(() => clas?.pruebas.find((p) => p.id === pruebaId)?.filas ?? [], [clas, pruebaId]);
  const finalizados = useMemo(() => {
    const s = new Set(finLocal);
    filas.forEach((f) => s.add(f.equipoId));
    return s;
  }, [filas, finLocal]);
  const orden = useMemo(() => (prueba && equipos ? ordenEfectivo(prueba.ordenSalida, equipos) : []), [prueba, equipos]);
  const enPista = lanes.filter((l) => l.equipoId && l.state !== 'idle').map((l) => l.equipoId!);
  const pendientes = orden.filter((e) => !finalizados.has(e.id));
  const disponibles = pendientes.filter((e) => !enPista.includes(e.id));

  // Cada pista libre recibe el siguiente equipo del orden de salida
  const pendientesIds = pendientes.map((e) => e.id).join(',');
  useEffect(() => {
    if (!auto || cargado !== pruebaId) return;
    const cola = pendientesIds ? pendientesIds.split(',') : [];
    setLanes((prev) => {
      const asignaciones = asignacionesLibres(prev, cola);
      if (!asignaciones.length) return prev;
      const nuevas = prev.slice();
      for (const [i, equipoId] of asignaciones) nuevas[i] = { ...laneVacia(), equipoId, state: 'rdy' };
      return nuevas;
    });
  }, [auto, cargado, pruebaId, pendientesIds, lanes]);

  const setLane = useCallback((i: number, l: Lane | ((prev: Lane) => Lane)) => {
    setLanes((prev) => prev.map((x, j) => (j === i ? (typeof l === 'function' ? l(x) : l) : x)));
  }, []);

  const guardarResultado = useCallback(
    async (i: number, l: Lane) => {
      if (!l.equipoId || !l.t0 || !l.lTs || l.brutoMs === null) return;
      try {
        await api(`/api/pruebas/${pruebaId}/resultados`, 'PUT', {
          equipoId: l.equipoId,
          pista: i + 1,
          salidaAt: new Date(l.t0).toISOString(),
          llegadaAt: new Date(l.lTs).toISOString(),
          brutoMs: l.brutoMs,
          detenciones: l.ints,
        });
        setLane(i, (p) => (p.equipoId === l.equipoId ? { ...p, guardado: 'si' } : p));
        mutClas();
        if (prueba?.estado === 'PENDIENTE') mutEv();
      } catch (e) {
        setLane(i, (p) => (p.equipoId === l.equipoId ? { ...p, guardado: 'error' } : p));
        toast(`⚠️ No se pudo guardar el tiempo: ${(e as Error).message}. Usa "Reintentar guardar".`, 'error');
      }
    },
    [pruebaId, setLane, mutClas, mutEv, prueba?.estado, toast],
  );

  const cargar = (i: number, equipoId: string) => setLane(i, { ...laneVacia(), equipoId, state: 'rdy' });

  const accion = (i: number) => {
    const l = lanes[i];
    if (!l || !prueba) return;
    const now = Date.now();
    if (l.state === 'idle') {
      const sig = disponibles[0];
      if (!sig) return toast('Sin equipos pendientes', 'warning');
      cargar(i, sig.id);
    } else if (l.state === 'rdy') {
      setLane(i, { ...l, state: 'run', t0: now });
    } else if (l.state === 'run' || l.state === 'det') {
      const ints = l.state === 'det' && l.detStart ? [...l.ints, { num: l.ints.length + 1, dur: now - l.detStart }] : l.ints;
      const fin: Lane = { ...l, state: 'fin', ints, detStart: null, lTs: now, brutoMs: now - (l.t0 ?? now), guardado: 'no' };
      setLane(i, fin);
      setFinLocal((s) => new Set(s).add(l.equipoId!));
      guardarResultado(i, fin);
      setLibDlg(i);
    } else if (l.state === 'fin') {
      setLibDlg(i);
    }
  };

  const togDet = (i: number) => {
    const l = lanes[i];
    if (!l) return;
    const now = Date.now();
    if (l.state === 'run') setLane(i, { ...l, state: 'det', detStart: now });
    else if (l.state === 'det' && l.detStart)
      setLane(i, { ...l, state: 'run', detStart: null, ints: [...l.ints, { num: l.ints.length + 1, dur: now - l.detStart }] });
  };

  const liberar = (i: number, siguiente: boolean) => {
    setLibDlg(null);
    const l = lanes[i];
    if (l?.state === 'fin' && l.guardado === 'error' && !confirm('Este tiempo NO se guardó en el servidor. ¿Liberar de todas formas?')) return;
    const otros = lanes.filter((_, j) => j !== i).map((x) => x.equipoId);
    const sig = siguiente ? disponibles.find((e) => e.id !== l?.equipoId && !otros.includes(e.id)) : undefined;
    setLane(i, sig ? { ...laneVacia(), equipoId: sig.id, state: 'rdy' } : laneVacia());
  };

  // Teclado y pulsador que emite una tecla
  const handlers = useRef({ accion, togDet, focus, setFocus, numPistas, pulsador: ev?.pulsadorKey ?? 'A' });
  handlers.current = { accion, togDet, focus, setFocus, numPistas, pulsador: ev?.pulsadorKey ?? 'A' };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return;
      const h = handlers.current;
      const k = e.key.toUpperCase();
      if (k === h.pulsador.toUpperCase() && h.focus !== null) {
        e.preventDefault();
        h.accion(h.focus);
        h.setFocus(null);
        return;
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= h.numPistas) {
        e.preventDefault();
        h.accion(n - 1);
        return;
      }
      const d = KEYS_DET.indexOf(k);
      if (d >= 0 && d < h.numPistas) {
        e.preventDefault();
        h.togDet(d);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Botón arcade / encoder USB (se ve como mando, no como teclado)
  useBotonesGamepad((boton) => {
    const h = handlers.current;
    const a = accionDeBoton(boton, h.numPistas, h.focus);
    if (a?.tipo === 'accion') {
      h.accion(a.pista);
      if (boton === 0) h.setFocus(null);
    } else if (a?.tipo === 'detenido') h.togDet(a.pista);
  }, (msg) => toast(msg, 'info'));

  const borrarTiempo = (f: FilaPrueba) => {
    if (!confirm(`¿Borrar el tiempo de "${f.nombre}"? El equipo vuelve a la cola para repetir la prueba.`)) return;
    run(async () => {
      await api(`/api/resultados/${f.resultadoId}`, 'DELETE');
      setFinLocal((s) => {
        const n = new Set(s);
        n.delete(f.equipoId);
        return n;
      });
      await mutClas();
    }, 'Tiempo eliminado');
  };

  // Corregir pista: equipos en pista + tiempos ya guardados que no están en ninguna pista
  const abrirCorregir = () => {
    const now = Date.now();
    const det = (l: Lane) => l.ints.reduce((a, d) => a + d.dur, 0) + (l.state === 'det' && l.detStart ? now - l.detStart : 0);
    const enPistas: OpcionCorregir[] = lanes.flatMap((l, i) => {
      if (!l.equipoId || l.state === 'idle') return [];
      const eq = eqMap.get(l.equipoId);
      const ms = l.state === 'fin' ? (l.brutoMs ?? 0) - det(l) : l.t0 ? now - l.t0 - det(l) : null;
      return [{
        equipoId: l.equipoId,
        nombre: eq?.nombre ?? '?',
        logo: eq?.logo,
        donde: `Pista ${i + 1} · ${ESTADO_PISTA[l.state]}`,
        ms,
        bloqueo: l.state === 'fin' && l.guardado === 'no' ? 'Guardando el tiempo… espera un momento' : undefined,
      }];
    });
    const ids = new Set(enPistas.map((o) => o.equipoId));
    const guardados: OpcionCorregir[] = filas
      .filter((f) => !ids.has(f.equipoId))
      .map((f) => ({
        equipoId: f.equipoId,
        nombre: f.nombre,
        logo: eqMap.get(f.equipoId)?.logo,
        donde: `Tiempo guardado${f.pista ? ` · pista ${f.pista}` : ''}`,
        ms: f.netoMs,
      }));
    setCorregir([...enPistas, ...guardados]);
  };

  const intercambiar = async (a: string, b: string) => {
    const enServidor = (id: string) =>
      filas.some((f) => f.equipoId === id) || lanes.some((l) => l.equipoId === id && l.state === 'fin' && l.guardado === 'si');
    try {
      if (enServidor(a) || enServidor(b)) {
        await api(`/api/pruebas/${pruebaId}/resultados/intercambiar`, 'POST', { equipoA: a, equipoB: b });
      }
    } catch (e) {
      toast(`No se pudo intercambiar: ${(e as Error).message}`, 'error');
      return;
    }
    setLanes((prev) => intercambiarEnPistas(prev, a, b));
    setFinLocal((s) => intercambiarEnSet(s, a, b));
    setCorregir(null);
    toast('🔄 Equipos intercambiados');
    mutClas();
  };

  const finalizarPrueba = () =>
    run(async () => {
      await api(`/api/pruebas/${pruebaId}`, 'PATCH', { estado: prueba?.estado === 'FINALIZADA' ? 'EN_CURSO' : 'FINALIZADA' });
      await mutEv();
    }, prueba?.estado === 'FINALIZADA' ? 'Prueba reabierta' : '🏁 Prueba finalizada');

  const guardarOrden = (ids: string[]) =>
    run(async () => {
      await api(`/api/pruebas/${pruebaId}`, 'PATCH', { ordenSalida: ids });
      await mutEv();
      setOrdenOpen(false);
    }, '✅ Orden guardado');

  if (!ev || !equipos) return null;
  if (!ev.pruebas.length)
    return esAdmin ? (
      <Vacio icono="⚙️">Este evento no tiene pruebas. <Link href={`/eventos/${eventoId}`}>Agrégalas en Configuración</Link>.</Vacio>
    ) : (
      <Vacio icono="⏳">Aún no hay pruebas habilitadas. Espera a que el administrador habilite la siguiente prueba.</Vacio>
    );
  if (!equipos.length)
    return esAdmin ? (
      <Vacio icono="🛡">Sin equipos. <Link href={`/eventos/${eventoId}/equipos`}>Agrega o importa equipos</Link>.</Vacio>
    ) : (
      <Vacio icono="🛡">Este evento aún no tiene equipos inscritos.</Vacio>
    );

  const penDe = (equipoId: string | null) => filas.find((f) => f.equipoId === equipoId)?.penMs ?? null;
  const libLane = libDlg !== null ? lanes[libDlg] : null;
  const libEq = libLane?.equipoId ? eqMap.get(libLane.equipoId) : null;
  const laneActiva = lanes.some((l) => l.state !== 'idle');

  return (
    <Box>
      {/* Barra de prueba */}
      <Paper sx={{ p: 1.25, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', bgcolor: COLORS.surf }}>
        <Typography variant="overline" color="text.secondary">Prueba</Typography>
        <TextField
          select
          value={pruebaId}
          onChange={(e) => {
            if (laneActiva && !confirm('Hay pistas ocupadas en esta prueba. Su estado se conserva en este equipo. ¿Cambiar de prueba?')) return;
            setPruebaId(e.target.value);
          }}
          sx={{ minWidth: 220, maxWidth: 340 }}
        >
          {ev.pruebas.map((p, i) => (
            <MenuItem key={p.id} value={p.id}>{i + 1}. {p.nombre} · {ESTADOS[p.estado].label}</MenuItem>
          ))}
        </TextField>
        {prueba && <Chip size="small" color={ESTADOS[prueba.estado].color} label={ESTADOS[prueba.estado].label} />}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
          Teclas: <b>1–{numPistas}</b> salida/llegada · <b>{KEYS_DET.slice(0, numPistas)}</b> detenido · 🔘 clic en pista + <b>botón del encoder</b> (o tecla <b>{ev.pulsadorKey}</b>)
        </Typography>
        <Button size="small" variant="outlined" color="info" startIcon={<SwapHorizIcon />} onClick={abrirCorregir}>Corregir pista</Button>
        <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=prueba&pruebaId=${pruebaId}`}>CSV</Button>
        <Tooltip title="Cada pista libre recibe el siguiente equipo del orden de salida">
          <FormControlLabel
            control={<Switch size="small" checked={auto} onChange={(e) => cambiarAuto(e.target.checked)} />}
            label={<Typography variant="body2">Asignación automática</Typography>}
            sx={{ mr: 0 }}
          />
        </Tooltip>
        <Button size="small" variant="outlined" startIcon={<FlagIcon />} onClick={finalizarPrueba}>
          {prueba?.estado === 'FINALIZADA' ? 'Reabrir prueba' : 'Finalizar prueba'}
        </Button>
      </Paper>

      {prueba?.estado === 'FINALIZADA' && (
        <Alert severity="info" sx={{ mb: 1.5 }}>Esta prueba está marcada como finalizada. Puedes seguir registrando tiempos si es necesario.</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 300px' }, gap: 1.5, alignItems: 'start' }}>
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${numPistas > 4 ? 190 : 230}px, 1fr))`, gap: 1.25, mb: 1.5 }}>
            {lanes.map((l, i) => (
              <LaneCard
                key={i}
                n={i + 1}
                lane={l}
                equipo={l.equipoId ? eqMap.get(l.equipoId) ?? null : null}
                focused={focus === i}
                dimmed={focus !== null && focus !== i}
                keyAccion={String(i + 1)}
                keyDet={KEYS_DET[i] ?? ''}
                penMs={penDe(l.equipoId)}
                candidatos={disponibles}
                onFocus={() => setFocus((f) => (f === i ? null : i))}
                onAccion={() => accion(i)}
                onDet={() => togDet(i)}
                onElegir={(id) => cargar(i, id)}
                onQuitar={auto ? undefined : () => setLane(i, laneVacia())}
                onCancelarSalida={() => confirm('¿Anular la salida y dejar el equipo listo para salir de nuevo?') && setLane(i, { ...laneVacia(), equipoId: l.equipoId, state: 'rdy' })}
                onReintentar={() => guardarResultado(i, l)}
              />
            ))}
          </Box>
          {/* Pistas adicionales solo en este dispositivo (como en la versión HTML) */}
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            {numPistas < MAX_PISTAS && (
              <Button fullWidth variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => cambiarExtra(extra + 1)}
                sx={{ borderStyle: 'dashed', color: COLORS.dim, '&:hover': { borderStyle: 'dashed', color: COLORS.blue } }}>
                Agregar pista
              </Button>
            )}
            {extra > 0 && ['idle', 'rdy'].includes(lanes[numPistas - 1]?.state ?? 'idle') && (
              <Button variant="outlined" color="inherit" startIcon={<RemoveIcon />} onClick={() => cambiarExtra(extra - 1)} sx={{ flexShrink: 0, color: COLORS.dim }}>
                Quitar pista {numPistas}
              </Button>
            )}
          </Stack>

          <Paper sx={{ p: 1.5, overflowX: 'auto' }}>
            <Typography variant="h5" sx={{ color: COLORS.gold, mb: 1 }}>🏆 Resultados {filas.length ? `(${filas.length})` : ''}</Typography>
            {!filas.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Sin tiempos aún</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pos.</TableCell><TableCell>Equipo</TableCell><TableCell>Salida</TableCell><TableCell>Llegada</TableCell>
                    <TableCell>Bruto</TableCell><TableCell>Det.</TableCell><TableCell>Disc.</TableCell><TableCell>Final</TableCell><TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.map((f) => (
                    <TableRow key={f.equipoId} hover>
                      <TableCell><PosChip pos={f.pos} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EquipoAvatar nombre={f.nombre} logo={eqMap.get(f.equipoId)?.logo} size={22} />
                          <b>{f.nombre}</b>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 11 }}>{fHora(f.salidaAt)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 11 }}>{fHora(f.llegadaAt)}</TableCell>
                      <TableCell sx={{ fontFamily: FONT_MONO }}>{fmt(f.brutoMs)}</TableCell>
                      <TableCell sx={{ color: COLORS.orange, fontSize: 11 }}>{f.detencionesMs ? `−${fmt(f.detencionesMs)}` : '—'}</TableCell>
                      <TableCell sx={{ color: f.penMs > 0 ? COLORS.red : f.penMs < 0 ? COLORS.green : 'text.secondary', fontSize: 11 }}>
                        {f.penMs ? fmtSeg(f.penMs) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: FONT_MONO, color: COLORS.gold, fontSize: 15 }}>{fmt(f.finalMs)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => setDetalle(f)}><SearchIcon fontSize="small" /></IconButton>
                        <Tooltip title="Borrar tiempo (repetir)">
                          <IconButton size="small" onClick={() => borrarTiempo(f)}><ReplayIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Box>

        {/* Panel lateral */}
        <Stack spacing={1.5}>
          <Paper sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ color: COLORS.gold }}>📋 Cola de salida ({pendientes.length})</Typography>
              <Stack direction="row">
                <Tooltip title="Imprimir orden de salida">
                  <IconButton size="small" disabled={!prueba}
                    onClick={() => prueba && !imprimirHtml(htmlOrdenSalida({ evento: ev.nombre, prueba: prueba.nombre, equipos: orden })) && toast('El navegador bloqueó la ventana de impresión', 'warning')}>
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button size="small" color="inherit" onClick={() => setOrdenOpen(true)}>🔀 Orden</Button>
              </Stack>
            </Stack>
            {!pendientes.length && <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Sin pendientes 🎉</Typography>}
            {pendientes.map((e) => {
              const ep = enPista.includes(e.id);
              const idx = disponibles.indexOf(e);
              const tag = ep
                ? { t: '🟢 En pista', c: COLORS.green }
                : idx === 0 ? { t: '⚡ Preparándose', c: COLORS.blue }
                  : idx === 1 ? { t: '→ Siguiente', c: COLORS.gold } : { t: `#${idx + 1}`, c: COLORS.dim };
              return <ColaItem key={e.id} e={e} n={orden.indexOf(e) + 1} tag={tag} />;
            })}
          </Paper>
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="h6" sx={{ color: COLORS.gold }}>✅ Finalizados ({filas.length})</Typography>
            {filas.map((f) => (
              <Stack key={f.equipoId} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5, borderBottom: `1px solid ${COLORS.border}` }}>
                <PosChip pos={f.pos} size={20} />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }} noWrap>{f.nombre}</Typography>
                <Typography variant="body2" sx={{ fontFamily: FONT_MONO, color: COLORS.gold }}>{fmt(f.finalMs)}</Typography>
              </Stack>
            ))}
          </Paper>
        </Stack>
      </Box>

      {/* Liberar pista */}
      <Dialog open={libDlg !== null} onClose={() => setLibDlg(null)} maxWidth="xs" disableRestoreFocus>
        <DialogTitle sx={{ textAlign: 'center', color: COLORS.gold }}>🏁 EQUIPO FINALIZADO</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary">{libEq?.nombre} llegó a meta en la pista {libDlg !== null ? libDlg + 1 : ''}.</Typography>
          {libLane?.brutoMs != null && (
            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 30, color: COLORS.gold, my: 1 }}>
              {fmt(libLane.brutoMs - libLane.ints.reduce((a, d) => a + d.dur, 0) + (penDe(libLane.equipoId) ?? 0))}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {disponibles.length
              ? `${auto ? 'Entrará automáticamente' : 'Siguiente en cola'}: ${disponibles.find((e) => e.id !== libLane?.equipoId)?.nombre ?? '—'}`
              : 'No quedan equipos en cola'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, flexWrap: 'wrap', gap: 1 }}>
          {/* Con asignación automática, liberar ya carga el siguiente equipo */}
          <Button variant="contained" color="success" onClick={() => libDlg !== null && liberar(libDlg, !auto)} autoFocus>
            {auto ? '✅ Liberar pista' : '✅ Liberar y cargar siguiente'}
          </Button>
          {!auto && <Button color="inherit" onClick={() => libDlg !== null && liberar(libDlg, false)}>Solo liberar</Button>}
          <Button color="inherit" onClick={() => setLibDlg(null)}>Esperar</Button>
        </DialogActions>
      </Dialog>

      {detalle && <DetalleDialog fila={detalle} onClose={() => setDetalle(null)} />}
      {corregir && <CorregirDialog opciones={corregir} onClose={() => setCorregir(null)} onConfirm={intercambiar} />}
      {ordenOpen && prueba && <OrdenDialog titulo={prueba.nombre} evento={ev.nombre} inicial={orden} onClose={() => setOrdenOpen(false)} onSave={guardarOrden} />}
    </Box>
  );
}

/** Pistas agregadas en este dispositivo, además de las del evento (se recuerdan por evento). */
function usePistasExtra(eventoId: string, pistasEvento: number) {
  const clave = `crono:pistasExtra:${eventoId}`;
  const [extra, setExtra] = useState(0);
  useEffect(() => setExtra(store.get(clave, 0)), [clave]);
  const limite = Math.max(0, MAX_PISTAS - pistasEvento);
  const cambiar = (n: number) => {
    const v = Math.max(0, Math.min(limite, n));
    setExtra(v);
    store.set(clave, v);
  };
  return [Math.min(extra, limite), cambiar] as const;
}

function ColaItem({ e, n, tag }: { e: EquipoDTO; n: number; tag: { t: string; c: string } }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.6, borderBottom: `1px solid ${COLORS.border}` }}>
      <Typography sx={{ color: COLORS.dim, width: 20, fontWeight: 700, fontSize: 13 }}>{n}</Typography>
      <EquipoAvatar nombre={e.nombre} logo={e.logo} size={24} />
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }} noWrap>{e.nombre}</Typography>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: tag.c, whiteSpace: 'nowrap' }}>{tag.t}</Typography>
    </Stack>
  );
}
