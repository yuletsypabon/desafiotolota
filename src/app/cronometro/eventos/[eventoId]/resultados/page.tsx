'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs,
  TextField, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { api, fetcher, useClasificacion, useEquipos, useSesion } from '@/lib/client';
import { fHora, fmt, fmtMsPreciso, fmtSeg } from '@/lib/format';
import { ESTADOS } from '@/lib/estados';
import EquipoAvatar from '@/components/EquipoAvatar';
import PosChip from '@/components/PosChip';
import Vacio from '@/components/Vacio';
import DetalleDialog from '@/components/crono/DetalleDialog';
import type { FilaPrueba } from '@/lib/types';
import { COLORS, FONT_MONO } from '@/theme';

interface AccesoHistorico {
  configurada: boolean;
  autorizado: boolean;
}

function Podio({ items }: { items: { id: string; nombre: string; logo?: string | null; tiempo: string }[] }) {
  const medallas = [LooksOneIcon, LooksTwoIcon, Looks3Icon];
  const col = ['#f59e0b', '#94a3b8', '#b45309'];
  if (!items.length) return null;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
      {items.slice(0, 3).map((x, i) => {
        const Medalla = medallas[i];
        return (
          <Paper key={x.id} sx={{ p: 1.5, textAlign: 'center', borderColor: col[i] }}>
            <Medalla sx={{ fontSize: 32, color: col[i] }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}><EquipoAvatar nombre={x.nombre} logo={x.logo} size={40} /></Box>
            <Typography sx={{ fontWeight: 700 }} noWrap>{x.nombre}</Typography>
            <Typography sx={{ fontFamily: FONT_MONO, color: COLORS.acento }}>{x.tiempo}</Typography>
          </Paper>
        );
      })}
    </Box>
  );
}

export default function Resultados() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { rol } = useSesion();
  const { data: acceso, error: errorAcceso, isLoading: cargandoAcceso, mutate: mutarAcceso } = useSWR<AccesoHistorico>(
    rol === 'CRONO' ? '/api/auth/historico' : null,
    fetcher,
  );
  const autorizado = rol === 'ADMIN' || acceso?.autorizado === true;
  const { data: clas } = useClasificacion(autorizado ? eventoId : undefined, 5000);
  const { data: equipos } = useEquipos(eventoId);
  const [tab, setTab] = useState('general');
  const [detalle, setDetalle] = useState<FilaPrueba | null>(null);

  if (rol === 'CRONO' && !autorizado) {
    if (cargandoAcceso) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
    if (errorAcceso) return <Alert severity="error">No se pudo verificar el acceso al Histórico: {errorAcceso.message}</Alert>;
    if (acceso && !acceso.configurada) {
      return <Alert severity="warning">El administrador debe configurar la contraseña adicional del Histórico antes de que puedas acceder.</Alert>;
    }
    return <AccesoHistorico onAutorizado={() => mutarAcceso()} />;
  }
  if (!autorizado || !clas) return null;
  const logo = (id: string) => equipos?.find((e) => e.id === id)?.logo;
  const pr = clas.pruebas.find((p) => p.id === tab);

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Tabs value={pr ? tab : 'general'} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minWidth: 0, borderBottom: 1, borderColor: 'divider' }}>
          <Tab value="general" icon={<EmojiEventsOutlinedIcon />} iconPosition="start" label="General acumulada" />
          {clas.pruebas.map((p, i) => (
            <Tab key={p.id} value={p.id} label={`${i + 1}. ${p.nombre} (${p.filas.length})`} />
          ))}
        </Tabs>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=general`}>General CSV</Button>
          <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=todas`}>Todas las pruebas CSV</Button>
        </Stack>
      </Stack>

      {!pr ? (
        <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, overflowX: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Suma de tiempos finales (con detenciones descontadas y disciplina aplicada). Los equipos con más pruebas completadas van primero.
            Se actualiza automáticamente.
          </Typography>
          {!clas.general.length ? (
            <Vacio icono={<FlagOutlinedIcon />}>Aún no hay tiempos registrados.</Vacio>
          ) : (
            <>
              <Podio items={clas.general.filter((g) => g.completadas === clas.totalPruebas).map((g) => ({ id: g.equipoId, nombre: g.nombre, logo: logo(g.equipoId), tiempo: fmt(g.totalMs) }))} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pos.</TableCell>
                    <TableCell>Equipo</TableCell>
                    {clas.pruebas.map((p) => <TableCell key={p.id} align="right">{p.nombre}</TableCell>)}
                    <TableCell align="right">Disc.</TableCell>
                    <TableCell align="right">Espiritual</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clas.general.map((g) => (
                    <TableRow key={g.equipoId} hover>
                      <TableCell><PosChip pos={g.pos} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EquipoAvatar nombre={g.nombre} logo={logo(g.equipoId)} size={24} />
                          <Box>
                            <b>{g.nombre}</b>
                            {g.completadas < clas.totalPruebas && (
                              <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>{g.completadas}/{clas.totalPruebas} pruebas</Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      {clas.pruebas.map((p) => {
                        const x = g.porPrueba[p.id];
                        return (
                          <TableCell key={p.id} align="right" sx={{ fontFamily: FONT_MONO, fontSize: 12, whiteSpace: 'nowrap' }}>
                            {x ? <>{fmt(x.finalMs)} <Typography component="span" variant="caption" color="text.secondary">({x.pos}°)</Typography></> : '—'}
                          </TableCell>
                        );
                      })}
                      <TableCell align="right" sx={{ color: g.penMs > 0 ? COLORS.red : g.penMs < 0 ? COLORS.green : 'text.secondary', fontSize: 12 }}>
                        {g.penMs ? fmtSeg(g.penMs) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {g.descuentoEspiritualMs > 0 ? `−${fmtMsPreciso(g.descuentoEspiritualMs)}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: FONT_MONO, color: COLORS.acento, fontSize: 15, whiteSpace: 'nowrap' }}>{fmt(g.totalMs)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, overflowX: 'auto' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
            <Typography variant="h4" sx={{ flex: 1 }}>{pr.nombre}</Typography>
            <Chip size="small" color={ESTADOS[pr.estado].color} label={ESTADOS[pr.estado].label} />
            <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=prueba&pruebaId=${pr.id}`}>CSV</Button>
          </Stack>
          {!pr.filas.length ? (
            <Vacio icono={<TimerOutlinedIcon />}>Sin tiempos en esta prueba.</Vacio>
          ) : (
            <>
              <Podio items={pr.filas.map((f) => ({ id: f.equipoId, nombre: f.nombre, logo: logo(f.equipoId), tiempo: fmt(f.finalMs) }))} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pos.</TableCell><TableCell>Equipo</TableCell><TableCell>Pista</TableCell><TableCell>Salida</TableCell><TableCell>Llegada</TableCell>
                    <TableCell>Bruto</TableCell><TableCell>Det.</TableCell><TableCell>Disc.</TableCell>
                    <TableCell>Puntos esp.</TableCell><TableCell>Descuento esp.</TableCell><TableCell>Final</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pr.filas.map((f) => (
                    <TableRow key={f.equipoId} hover sx={{ cursor: 'pointer' }} onClick={() => setDetalle(f)}>
                      <TableCell><PosChip pos={f.pos} /></TableCell>
                      <TableCell><Stack direction="row" spacing={1} alignItems="center"><EquipoAvatar nombre={f.nombre} logo={logo(f.equipoId)} size={22} /><b>{f.nombre}</b></Stack></TableCell>
                      <TableCell>{f.pista ?? '—'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 11 }}>{fHora(f.salidaAt)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 11 }}>{fHora(f.llegadaAt)}</TableCell>
                      <TableCell sx={{ fontFamily: FONT_MONO }}>{fmt(f.brutoMs)}</TableCell>
                      <TableCell sx={{ color: COLORS.detenido, fontSize: 11 }}>{f.detencionesMs ? `−${fmt(f.detencionesMs)}` : '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: f.penMs > 0 ? COLORS.red : f.penMs < 0 ? COLORS.green : 'text.secondary' }}>{f.penMs ? fmtSeg(f.penMs) : '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{f.puntosEspirituales || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                        {f.descuentoEspiritualMs > 0 ? `−${fmtMsPreciso(f.descuentoEspiritualMs)}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: FONT_MONO, color: COLORS.acento, fontSize: 15 }}>{fmt(f.finalMs)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Paper>
      )}
      {detalle && <DetalleDialog fila={detalle} onClose={() => setDetalle(null)} />}
    </Box>
  );
}

function AccesoHistorico({ onAutorizado }: { onAutorizado: () => Promise<unknown> }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const desbloquear = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await api('/api/auth/historico', 'POST', { clave });
      setClave('');
      await onAutorizado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo validar la contraseña');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Paper component="form" onSubmit={desbloquear} sx={{ maxWidth: 480, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} alignItems="center">
        <LockOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h5" textAlign="center">Acceso al Histórico</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Ingresa la contraseña adicional que configuró el administrador para consultar los resultados.
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        <TextField
          fullWidth
          autoFocus
          type="password"
          label="Contraseña del Histórico"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" fullWidth variant="contained" disabled={!clave || enviando}>
          {enviando ? 'Verificando…' : 'Ver Histórico'}
        </Button>
      </Stack>
    </Paper>
  );
}
