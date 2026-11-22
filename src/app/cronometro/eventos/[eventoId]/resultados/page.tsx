'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import { api, fetcher, useClasificacion, useEquipos, useSesion } from '@/lib/client';
import { fHora, fmt, fmtSeg, fmtSegundos } from '@/lib/format';
import { ESTADOS } from '@/lib/estados';
import EquipoAvatar from '@/components/EquipoAvatar';
import PosChip from '@/components/PosChip';
import Vacio from '@/components/Vacio';
import DetalleDialog from '@/components/crono/DetalleDialog';
import type { Clasificacion, ClasificacionPrueba, FilaPrueba } from '@/lib/types';
import { COLORS, FONT_MONO, alfa, superficieVidrio } from '@/theme';

interface AccesoHistorico {
  configurada: boolean;
  autorizado: boolean;
}

interface CorreccionResultado {
  id: string;
  equipoAId: string;
  equipoBId: string;
  motivo: string;
  rol: 'ADMIN' | 'CRONO';
  createdAt: string;
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
            <Typography sx={{ fontWeight: 700 }} noWrap>{x.nombre.toLocaleUpperCase('es-CO')}</Typography>
            <Typography sx={{ fontFamily: FONT_MONO, color: COLORS.acento }}>{x.tiempo}</Typography>
          </Paper>
        );
      })}
    </Box>
  );
}

type VistaHistorico = 'indice' | 'general' | string;
type LogoEquipo = (id: string) => string | null | undefined;

/** Índice de resultados: una tarjeta por vista, igual a las actividades espirituales. */
function TarjetaHistorico({
  titulo, subtitulo, cantidad, ganador, estado, color, Icono, onAbrir,
}: {
  titulo: string;
  subtitulo: string;
  cantidad: number;
  ganador?: { nombre: string; tiempo: string };
  estado?: ClasificacionPrueba['estado'];
  color: string;
  Icono: typeof TimerOutlinedIcon;
  onAbrir: () => void;
}) {
  const estadoPrueba = estado ? ESTADOS[estado] : null;
  return (
    <Box component="article" sx={{
      ...superficieVidrio, borderRadius: '28px', p: 1.25, display: 'flex', flexDirection: 'column',
      transition: 'transform .2s ease, border-color .2s ease',
      '&:hover': { transform: 'translateY(-4px)', borderColor: alfa(color, .55) },
    }}>
      <Box sx={{
        minHeight: 132, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        bgcolor: alfa(color, .13), background: `linear-gradient(135deg, ${alfa(color, .28)}, transparent)`,
      }}>
        <Icono sx={{ fontSize: 58, color }} />
        {estadoPrueba ? (
          <Chip size="small" color={estadoPrueba.color} label={estadoPrueba.label} sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }} />
        ) : (
          <Chip size="small" label="ACUMULADA" color="primary" sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }} />
        )}
      </Box>
      <Box sx={{ px: 1.25, pt: 2, pb: 1, flex: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: 21, lineHeight: 1.25, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .75, minHeight: 40 }}>{subtitulo}</Typography>
      </Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.25, pt: 1, pb: .75 }}>
        <Stack direction="row" spacing={.5} alignItems="center" color="text.secondary">
          <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={700}>{cantidad}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 138, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ganador ? `1.º ${ganador.nombre.toLocaleUpperCase('es-CO')} · ${ganador.tiempo}` : 'Sin resultados'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={onAbrir} sx={{ px: 2.25, bgcolor: 'rgba(255,255,255,.08)', color: 'text.primary', '&:hover': { bgcolor: color, color: COLORS.bg } }}>
          Abrir
        </Button>
      </Stack>
    </Box>
  );
}

function IndiceHistorico({ clas, onAbrirGeneral, onAbrirPrueba }: {
  clas: Clasificacion;
  onAbrirGeneral: () => void;
  onAbrirPrueba: (id: string) => void;
}) {
  const primeroGeneral = clas.general.find((fila) => fila.completadas === clas.totalPruebas) ?? clas.general[0];
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: .5 }}>Resultados del evento</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Abre una prueba para consultar su podio, resultados detallados y correcciones registradas.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 2.5 }}>
        <TarjetaHistorico
          titulo="Clasificación general"
          subtitulo={`${clas.totalPruebas} ${clas.totalPruebas === 1 ? 'prueba configurada' : 'pruebas configuradas'} · tiempos acumulados`}
          cantidad={clas.general.length}
          ganador={primeroGeneral ? { nombre: primeroGeneral.nombre, tiempo: fmt(primeroGeneral.totalMs) } : undefined}
          color={COLORS.acento}
          Icono={LeaderboardOutlinedIcon}
          onAbrir={onAbrirGeneral}
        />
        {clas.pruebas.map((prueba, indice) => {
          const primero = prueba.filas[0];
          return (
            <TarjetaHistorico
              key={prueba.id}
              titulo={`${indice + 1}. ${prueba.nombre}`}
              subtitulo={primero ? `Mejor tiempo: ${fmt(primero.finalMs)}` : 'Aún no hay resultados registrados'}
              cantidad={prueba.filas.length}
              ganador={primero ? { nombre: primero.nombre, tiempo: fmt(primero.finalMs) } : undefined}
              estado={prueba.estado}
              color={COLORS.blue}
              Icono={TimerOutlinedIcon}
              onAbrir={() => onAbrirPrueba(prueba.id)}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function BotonVolver({ onClick }: { onClick: () => void }) {
  return <Button color="inherit" size="small" startIcon={<ArrowBackOutlinedIcon />} onClick={onClick}>Todas las pruebas</Button>;
}

function GeneralHistorico({ clas, logo, onVolver }: { clas: Clasificacion; logo: LogoEquipo; onVolver: () => void }) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, overflowX: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <BotonVolver onClick={onVolver} />
          <Typography variant="h4">Clasificación general</Typography>
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Suma de tiempos finales, con detenciones descontadas y disciplina aplicada. Los equipos con más pruebas completadas van primero.
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
                <TableCell align="right">Plus</TableCell>
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
                        {g.completadas < clas.totalPruebas && <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>{g.completadas}/{clas.totalPruebas} pruebas</Typography>}
                      </Box>
                    </Stack>
                  </TableCell>
                  {clas.pruebas.map((p) => {
                    const x = g.porPrueba[p.id];
                    return <TableCell key={p.id} align="right" sx={{ fontFamily: FONT_MONO, fontSize: 12, whiteSpace: 'nowrap' }}>{x ? <>{fmt(x.finalMs)} <Typography component="span" variant="caption" color="text.secondary">({x.pos}°)</Typography></> : '—'}</TableCell>;
                  })}
                  <TableCell align="right" sx={{ color: g.penMs > 0 ? COLORS.red : g.penMs < 0 ? COLORS.green : 'text.secondary', fontSize: 12 }}>{g.penMs ? fmtSeg(g.penMs) : '—'}</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12, whiteSpace: 'nowrap' }}>{g.descuentoEspiritualMs > 0 ? `−${fmtSegundos(g.descuentoEspiritualMs)}` : '—'}</TableCell>
                  <TableCell align="right" sx={{ color: g.puntosPlus > 0 ? COLORS.acento : 'text.secondary', fontWeight: g.puntosPlus > 0 ? 700 : 400, fontSize: 12 }}>{g.puntosPlus > 0 ? `+${g.puntosPlus}` : '—'}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT_MONO, color: COLORS.acento, fontSize: 15, whiteSpace: 'nowrap' }}>{fmt(g.totalMs)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      {!!clas.puntosPlus.length && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Puntos Plus</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Reconocimientos espirituales registrados. No alteran tiempos ni posiciones.</Typography>
          <Stack direction="row" flexWrap="wrap" gap={.75}>{clas.puntosPlus.map((equipo) => <Chip key={equipo.equipoId} label={`${equipo.numero}. ${equipo.nombre} · +${equipo.puntos} pts`} color="primary" />)}</Stack>
        </Box>
      )}
    </Paper>
  );
}

function PruebaHistorico({ prueba, eventoId, logo, nombreEquipo, correcciones, onVolver, onDetalle }: {
  prueba: ClasificacionPrueba;
  eventoId: string;
  logo: LogoEquipo;
  nombreEquipo: (id: string) => string;
  correcciones?: CorreccionResultado[];
  onVolver: () => void;
  onDetalle: (fila: FilaPrueba) => void;
}) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, overflowX: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <BotonVolver onClick={onVolver} />
          <Typography variant="h4">{prueba.nombre}</Typography>
        </Box>
        <Chip size="small" color={ESTADOS[prueba.estado].color} label={ESTADOS[prueba.estado].label} />
        <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=prueba&pruebaId=${prueba.id}`}>CSV</Button>
      </Stack>
      {!prueba.filas.length ? (
        <Vacio icono={<TimerOutlinedIcon />}>Sin tiempos en esta prueba.</Vacio>
      ) : (
        <>
          <Podio items={prueba.filas.map((f) => ({ id: f.equipoId, nombre: f.nombre, logo: logo(f.equipoId), tiempo: fmt(f.finalMs) }))} />
          <Table size="small">
            <TableHead><TableRow><TableCell>Pos.</TableCell><TableCell>Equipo</TableCell><TableCell>Pista</TableCell><TableCell>Salida</TableCell><TableCell>Llegada</TableCell><TableCell>Bruto</TableCell><TableCell>Det.</TableCell><TableCell>Disc.</TableCell><TableCell>Puntos esp.</TableCell><TableCell>Descuento esp.</TableCell><TableCell>Final</TableCell></TableRow></TableHead>
            <TableBody>
              {prueba.filas.map((fila) => (
                <TableRow key={fila.equipoId} hover sx={{ cursor: 'pointer' }} onClick={() => onDetalle(fila)}>
                  <TableCell><PosChip pos={fila.pos} /></TableCell>
                  <TableCell><Stack direction="row" spacing={1} alignItems="center"><EquipoAvatar nombre={fila.nombre} logo={logo(fila.equipoId)} size={22} /><b>{fila.nombre}</b></Stack></TableCell>
                  <TableCell>{fila.pista ?? '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 11 }}>{fHora(fila.salidaAt)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 11 }}>{fHora(fila.llegadaAt)}</TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO }}>{fmt(fila.brutoMs)}</TableCell>
                  <TableCell sx={{ color: COLORS.detenido, fontSize: 11 }}>{fila.detencionesMs ? `−${fmt(fila.detencionesMs)}` : '—'}</TableCell>
                  <TableCell sx={{ fontSize: 11, color: fila.penMs > 0 ? COLORS.red : fila.penMs < 0 ? COLORS.green : 'text.secondary' }}>{fila.penMs ? fmtSeg(fila.penMs) : '—'}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{fila.puntosEspirituales || '—'}</TableCell>
                  <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fila.descuentoEspiritualMs > 0 ? `−${fmtSegundos(fila.descuentoEspiritualMs)}` : '—'}</TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO, color: COLORS.acento, fontSize: 15 }}>{fmt(fila.finalMs)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!!correcciones?.length && (
            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Correcciones registradas</Typography>
              <Stack spacing={.75}>{correcciones.map((correccion) => <Typography key={correccion.id} variant="body2" color="text.secondary"><b>{nombreEquipo(correccion.equipoAId)}</b> ⇄ <b>{nombreEquipo(correccion.equipoBId)}</b> · {correccion.motivo} · {new Date(correccion.createdAt).toLocaleString('es-CO')} · {correccion.rol}</Typography>)}</Stack>
            </Box>
          )}
        </>
      )}
    </Paper>
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
  const [vista, setVista] = useState<VistaHistorico>('indice');
  const [detalle, setDetalle] = useState<FilaPrueba | null>(null);
  const pr = clas?.pruebas.find((p) => p.id === vista);
  const { data: correcciones } = useSWR<CorreccionResultado[]>(
    autorizado && pr ? `/api/pruebas/${pr.id}/correcciones` : null,
    fetcher,
  );

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
  const nombreEquipo = (id: string) => equipos?.find((equipo) => equipo.id === id)?.nombre ?? 'Equipo eliminado';

  return (
    <Box>
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2, borderColor: `${COLORS.acento}55` }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
            <EmojiEventsOutlinedIcon sx={{ fontSize: 34, color: COLORS.acento }} />
            <Box>
              <Typography variant="h4">Histórico de resultados</Typography>
              <Typography variant="body2" color="text.secondary">Consulta cada prueba por separado o la clasificación acumulada.</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=general`}>General CSV</Button>
            <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=todas`}>Todas CSV</Button>
          </Stack>
        </Stack>
      </Paper>

      {vista === 'indice' ? (
        <IndiceHistorico clas={clas} onAbrirGeneral={() => setVista('general')} onAbrirPrueba={setVista} />
      ) : vista === 'general' ? (
        <GeneralHistorico clas={clas} logo={logo} onVolver={() => setVista('indice')} />
      ) : pr ? (
        <PruebaHistorico
          prueba={pr} eventoId={eventoId} logo={logo} nombreEquipo={nombreEquipo} correcciones={correcciones}
          onVolver={() => setVista('indice')} onDetalle={setDetalle}
        />
      ) : null}
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
