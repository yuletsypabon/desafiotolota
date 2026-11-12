'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment,
  MenuItem, Paper, Skeleton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { api, useEventos, useSesion } from '@/lib/client';
import { useRun } from '@/components/Toast';
import { useAppDialog } from '@/components/AppDialog';
import TarjetaEvento from '@/components/TarjetaEvento';
import LogoUpload from '@/components/LogoUpload';
import HabilitacionPrueba from '@/components/HabilitacionPrueba';
import Vacio from '@/components/Vacio';
import type { EstadoPrueba, EventoDTO, PruebaDTO } from '@/lib/types';
import { COLORS, ESPACIADO_SISTEMA } from '@/theme';
import { RUTAS } from '@/lib/rutas';
import { ESTADOS } from '@/lib/estados';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function Inicio() {
  const { data: eventos, isLoading, mutate } = useEventos();
  const { esAdmin } = useSesion();
  const [open, setOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<EventoDTO | null>(null);

  // Del más reciente al más antiguo, todos en una cuadrícula (el año va en cada tarjeta)
  const ordenados = [...(eventos ?? [])].sort((a, b) => b.anio - a.anio);
  return (
    <Container maxWidth="lg" sx={ESPACIADO_SISTEMA.pagina}>
      {esAdmin && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Nuevo evento
          </Button>
        </Stack>
      )}

      {isLoading && <Skeleton variant="rounded" height={120} />}
      {!isLoading && !eventos?.length && (
        <Vacio icono={<FlagOutlinedIcon />}>
          {esAdmin ? (
            <>
              Aún no hay eventos. Crea el primero, o ve a <Link href={RUTAS.respaldo}>Respaldo</Link> para importar los datos de
              la versión anterior.
            </>
          ) : (
            'Aún no hay eventos. El administrador debe crearlos.'
          )}
        </Vacio>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 2.5 }}>
        {ordenados.map((ev) => (
          <TarjetaEvento key={ev.id} ev={ev} onEditar={esAdmin ? () => setEventoEditando(ev) : undefined} />
        ))}
      </Box>

      <NuevoEventoDialog open={open} onClose={() => setOpen(false)} eventos={eventos ?? []} onCreado={() => mutate()} />
      {eventoEditando && (
        <EditarEventoDialog
          key={eventoEditando.id}
          evento={eventoEditando}
          onClose={() => setEventoEditando(null)}
          onGuardado={() => mutate()}
        />
      )}
    </Container>
  );
}

function EditarEventoDialog({
  evento, onClose, onGuardado,
}: { evento: EventoDTO; onClose: () => void; onGuardado: () => void }) {
  const run = useRun();
  const dialog = useAppDialog();
  const [anio, setAnio] = useState(evento.anio);
  const [nombre, setNombre] = useState(evento.nombre);
  const [logo, setLogo] = useState<string | null>(evento.logo);
  const [nombreX2, setNombreX2] = useState(evento.nombreX2 ?? '');
  const [nombreX4, setNombreX4] = useState(evento.nombreX4 ?? '');
  const [numPistas, setNumPistas] = useState(evento.numPistas);
  const [pulsadorKey, setPulsadorKey] = useState(evento.pulsadorKey);
  const [penLeve, setPenLeve] = useState(String(evento.penLeveMs / 1000));
  const [penMedia, setPenMedia] = useState(String(evento.penMediaMs / 1000));
  const [penGrave, setPenGrave] = useState(String(evento.penGraveMs / 1000));
  const [bonPositivo, setBonPositivo] = useState(String(evento.bonPositivoMs / 1000));
  const [pruebas, setPruebas] = useState(evento.pruebas);
  const [nuevaPrueba, setNuevaPrueba] = useState('');
  const [busy, setBusy] = useState(false);

  const guardar = async () => {
    setBusy(true);
    const ok = await run(async () => {
      await api(`/api/eventos/${evento.id}`, 'PATCH', {
        anio,
        nombre: nombre.trim(),
        logo,
        nombreX2: nombreX2.trim() || null,
        nombreX4: nombreX4.trim() || null,
        numPistas,
        pulsadorKey: pulsadorKey.toUpperCase(),
        penLeveMs: aMilisegundos(penLeve),
        penMediaMs: aMilisegundos(penMedia),
        penGraveMs: aMilisegundos(penGrave),
        bonPositivoMs: aMilisegundos(bonPositivo),
      });
      onGuardado();
    }, 'Datos del evento actualizados');
    setBusy(false);
    if (ok) onClose();
  };

  const actualizarPrueba = async (prueba: PruebaDTO, cambios: Partial<PruebaDTO>) => {
    const ok = await run(async () => {
      const actualizada = await api<PruebaDTO>(`/api/pruebas/${prueba.id}`, 'PATCH', cambios);
      setPruebas((actuales) => actuales.map((p) => p.id === prueba.id ? { ...p, ...actualizada } : p));
      onGuardado();
    });
    return ok;
  };

  const agregarPrueba = async () => {
    if (!nuevaPrueba.trim()) return;
    await run(async () => {
      const prueba = await api<PruebaDTO>(`/api/eventos/${evento.id}/pruebas`, 'POST', { nombre: nuevaPrueba.trim() });
      setPruebas((actuales) => [...actuales, prueba]);
      setNuevaPrueba('');
      onGuardado();
    }, 'Prueba agregada');
  };

  const eliminarPrueba = async (prueba: PruebaDTO) => {
    const resultados = prueba._count?.resultados ?? 0;
    if (!await dialog({
      title: 'Eliminar prueba',
      message: `¿Eliminar "${prueba.nombre}"?${resultados ? ` Se borrarán ${resultados} tiempos registrados y su disciplina.` : ''}`,
      tone: 'danger',
      confirmLabel: 'Eliminar prueba',
    })) return;
    await run(async () => {
      await api(`/api/pruebas/${prueba.id}`, 'DELETE');
      setPruebas((actuales) => actuales.filter((p) => p.id !== prueba.id));
      onGuardado();
    }, 'Prueba eliminada');
  };

  const moverPrueba = async (indice: number, direccion: -1 | 1) => {
    const siguiente = indice + direccion;
    if (siguiente < 0 || siguiente >= pruebas.length) return;
    const ordenadas = pruebas.slice();
    [ordenadas[indice], ordenadas[siguiente]] = [ordenadas[siguiente], ordenadas[indice]];
    await run(async () => {
      await api(`/api/eventos/${evento.id}/pruebas`, 'PUT', { ids: ordenadas.map((p) => p.id) });
      setPruebas(ordenadas);
      onGuardado();
    });
  };

  const eliminarEvento = async () => {
    if (!await dialog({
      title: 'Eliminar evento completo',
      message: 'Se eliminarán los equipos, fichas, tiempos y puntos de disciplina. Esta acción no se puede deshacer.\nEscribe el año para confirmar.',
      tone: 'danger',
      confirmLabel: 'Eliminar evento',
      requiredText: String(evento.anio),
      inputLabel: `Escribe ${evento.anio} para confirmar`,
    })) return;
    const ok = await run(async () => {
      await api(`/api/eventos/${evento.id}`, 'DELETE');
      onGuardado();
    }, 'Evento eliminado');
    if (ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar datos del evento</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Datos generales</Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Año"
                  type="number"
                  value={anio}
                  onChange={(event) => setAnio(parseInt(event.target.value) || 0)}
                  slotProps={{ htmlInput: { min: 2000, max: 2100 } }}
                  sx={{ maxWidth: { sm: 160 } }}
                />
                <TextField label="Nombre del evento" value={nombre} onChange={(event) => setNombre(event.target.value)} autoFocus />
              </Stack>
              <LogoUpload value={logo} onChange={setLogo} label="Logo del evento" nombre={nombre} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Nombre del Desafío X2" value={nombreX2} onChange={(event) => setNombreX2(event.target.value)} helperText="Se muestra en la portada" />
                <TextField label="Nombre del Desafío X4" value={nombreX4} onChange={(event) => setNombreX4(event.target.value)} helperText="Se muestra en la portada" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Pistas simultáneas" value={numPistas} onChange={(event) => setNumPistas(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((cantidad) => <MenuItem key={cantidad} value={cantidad}>{cantidad}</MenuItem>)}
                </TextField>
                <TextField
                  label="Tecla del encoder USB"
                  value={pulsadorKey}
                  onChange={(event) => setPulsadorKey(event.target.value.toUpperCase())}
                  slotProps={{ htmlInput: { maxLength: 1, style: { textTransform: 'uppercase', textAlign: 'center' } } }}
                  helperText="Tecla que emite el pulsador físico"
                />
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>Disciplina (segundos)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Ajusta los tiempos sumados o descontados por cada punto.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
              <TextField type="number" label="Leve +" value={penLeve} onChange={(event) => setPenLeve(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><WarningAmberIcon fontSize="small" /></InputAdornment> }, htmlInput: { min: 0, step: 0.1 } }} />
              <TextField type="number" label="Media +" value={penMedia} onChange={(event) => setPenMedia(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><ReportProblemOutlinedIcon fontSize="small" /></InputAdornment> }, htmlInput: { min: 0, step: 0.1 } }} />
              <TextField type="number" label="Grave +" value={penGrave} onChange={(event) => setPenGrave(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><ErrorOutlineIcon fontSize="small" /></InputAdornment> }, htmlInput: { min: 0, step: 0.1 } }} />
              <TextField type="number" label="Positivo −" value={bonPositivo} onChange={(event) => setBonPositivo(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><CheckCircleOutlineIcon fontSize="small" /></InputAdornment> }, htmlInput: { min: 0, step: 0.1 } }} />
            </Box>
          </Paper>

          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>Pruebas del evento</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Edita nombres, estado, acceso y orden de las pruebas.
            </Typography>
            <Stack spacing={1}>
              {pruebas.map((prueba, indice) => (
                <Stack key={prueba.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ py: 1, borderBottom: `1px solid ${COLORS.border}` }}>
                  <Typography sx={{ width: { sm: 24 }, color: COLORS.acento, fontWeight: 700 }}>{indice + 1}.</Typography>
                  <TextField
                    key={`${prueba.id}-${prueba.nombre}`}
                    defaultValue={prueba.nombre}
                    label="Nombre de la prueba"
                    onBlur={(event) => {
                      const nuevoNombre = event.target.value.trim();
                      if (nuevoNombre && nuevoNombre !== prueba.nombre) void actualizarPrueba(prueba, { nombre: nuevoNombre });
                    }}
                  />
                  <TextField
                    select
                    label="Estado"
                    value={prueba.estado}
                    onChange={(event) => void actualizarPrueba(prueba, { estado: event.target.value as EstadoPrueba })}
                    sx={{ minWidth: { sm: 150 } }}
                  >
                    {(Object.keys(ESTADOS) as EstadoPrueba[]).map((estado) => (
                      <MenuItem key={estado} value={estado}>{ESTADOS[estado].label}</MenuItem>
                    ))}
                  </TextField>
                  <HabilitacionPrueba
                    desde={prueba.habilitadaDesde}
                    onCambiar={(habilitadaDesde) => void actualizarPrueba(prueba, { habilitadaDesde })}
                  />
                  <Tooltip title="Tiempos registrados">
                    <Chip size="small" icon={<TimerOutlinedIcon />} label={prueba._count?.resultados ?? 0} />
                  </Tooltip>
                  <Stack direction="row">
                    <IconButton size="small" aria-label="Subir prueba" disabled={indice === 0} onClick={() => void moverPrueba(indice, -1)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Bajar prueba" disabled={indice === pruebas.length - 1} onClick={() => void moverPrueba(indice, 1)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" aria-label={`Eliminar ${prueba.nombre}`} onClick={() => void eliminarPrueba(prueba)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
              <TextField
                label="Nombre de la nueva prueba"
                value={nuevaPrueba}
                onChange={(event) => setNuevaPrueba(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && void agregarPrueba()}
              />
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => void agregarPrueba()} disabled={!nuevaPrueba.trim()}>
                Agregar prueba
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={eliminarEvento} disabled={busy} sx={{ mr: 'auto' }}>Eliminar evento</Button>
        <Button onClick={onClose} color="inherit" disabled={busy}>Cerrar</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={guardar}
          disabled={busy || anio < 2000 || anio > 2100 || !nombre.trim() || pulsadorKey.length !== 1}
        >
          {busy ? 'Guardando…' : 'Guardar datos del evento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function NuevoEventoDialog({
  open, onClose, eventos, onCreado,
}: { open: boolean; onClose: () => void; eventos: EventoDTO[]; onCreado: () => void }) {
  const router = useRouter();
  const run = useRun();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [nombre, setNombre] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [nombreX2, setNombreX2] = useState('');
  const [nombreX4, setNombreX4] = useState('');
  const [pulsadorKey, setPulsadorKey] = useState('A');
  const [penLeve, setPenLeve] = useState('0.3');
  const [penMedia, setPenMedia] = useState('0.5');
  const [penGrave, setPenGrave] = useState('1');
  const [bonPositivo, setBonPositivo] = useState('0.1');
  const [pruebas, setPruebas] = useState('Prueba 1\nPrueba 2\nPrueba 3');
  const [numPistas, setNumPistas] = useState(3);
  const [copiar, setCopiar] = useState('');
  const [busy, setBusy] = useState(false);

  const crear = async () => {
    setBusy(true);
    let id = '';
    const ok = await run(async () => {
      const ev = await api<{ id: string }>('/api/eventos', 'POST', {
        anio,
        nombre,
        logo,
        nombreX2: nombreX2.trim() || null,
        nombreX4: nombreX4.trim() || null,
        numPistas,
        pulsadorKey: pulsadorKey.toUpperCase(),
        penLeveMs: aMilisegundos(penLeve),
        penMediaMs: aMilisegundos(penMedia),
        penGraveMs: aMilisegundos(penGrave),
        bonPositivoMs: aMilisegundos(bonPositivo),
        pruebas: pruebas.split('\n').map((s) => s.trim()).filter(Boolean),
        copiarEquiposDe: copiar || undefined,
      });
      id = ev.id;
    }, 'Evento creado');
    setBusy(false);
    if (ok) {
      onCreado();
      onClose();
      router.push(RUTAS.evento(id));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Datos del evento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Año" type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value) || 0)} sx={{ maxWidth: { sm: 120 } }} />
            <TextField label="Nombre del evento" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Desafío Güela ${anio}`} autoFocus />
          </Stack>
          <LogoUpload value={logo} onChange={setLogo} label="Logo del evento" nombre={nombre} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Nombre del Desafío X2" value={nombreX2} onChange={(e) => setNombreX2(e.target.value)} helperText="Equipos de 2 · se muestra en la portada" />
            <TextField label="Nombre del Desafío X4" value={nombreX4} onChange={(e) => setNombreX4(e.target.value)} helperText="Equipos de 4 · se muestra en la portada" />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Pistas simultáneas" value={numPistas} onChange={(e) => setNumPistas(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tecla del encoder USB"
              value={pulsadorKey}
              slotProps={{ htmlInput: { maxLength: 1, style: { textTransform: 'uppercase', textAlign: 'center' } } }}
              onChange={(e) => setPulsadorKey(e.target.value.toUpperCase())}
              helperText="Tecla que emite el pulsador físico"
            />
          </Stack>
          <Box>
            <Typography variant="overline" color="text.secondary">Disciplina (segundos)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
              <TextField type="number" label="Leve +" value={penLeve} onChange={(e) => setPenLeve(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.1 } }} />
              <TextField type="number" label="Media +" value={penMedia} onChange={(e) => setPenMedia(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.1 } }} />
              <TextField type="number" label="Grave +" value={penGrave} onChange={(e) => setPenGrave(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.1 } }} />
              <TextField type="number" label="Positivo −" value={bonPositivo} onChange={(e) => setBonPositivo(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 0.1 } }} />
            </Box>
          </Box>
          <Typography variant="h6">Pruebas y equipos</Typography>
          <TextField label="Pruebas iniciales (una por línea)" multiline minRows={3} value={pruebas} onChange={(e) => setPruebas(e.target.value)} />
          <TextField select label="Copiar equipos y fichas de…" value={copiar} onChange={(e) => setCopiar(e.target.value)}>
            <MenuItem value="">— No copiar —</MenuItem>
            {eventos.map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.anio} · {e.nombre} ({e._count?.equipos ?? 0} eq.)</MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={crear} disabled={busy || !nombre.trim() || pulsadorKey.length !== 1}>Crear evento</Button>
      </DialogActions>
    </Dialog>
  );
}

const aMilisegundos = (segundos: string) => Math.round((parseFloat(segundos.replace(',', '.')) || 0) * 1000);
