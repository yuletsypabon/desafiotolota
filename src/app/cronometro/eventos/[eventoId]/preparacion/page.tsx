'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert, Box, Button, Chip, CircularProgress, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ViewWeekOutlinedIcon from '@mui/icons-material/ViewWeekOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import { useEquipos, useEvento, store } from '@/lib/client';
import { useEstadoGamepad } from '@/lib/gamepad';
import { evaluarPreparacion, preparacionLista, resumirPistasGuardadas, type ChequeoPreparacion, type EstadoChequeo, type ResumenRecuperacion } from '@/lib/preparacion';
import { RUTAS } from '@/lib/rutas';
import { COLORS, ESPACIADO_SISTEMA, cajaVidrio, superficieVidrio } from '@/theme';

const ICONOS = {
  servidor: StorageOutlinedIcon,
  equipos: GroupsOutlinedIcon,
  pistas: ViewWeekOutlinedIcon,
  prueba: TimerOutlinedIcon,
  recuperacion: RestoreOutlinedIcon,
  mando: SportsEsportsOutlinedIcon,
  respaldo: BackupOutlinedIcon,
} as const;

const ESTILOS: Record<EstadoChequeo, { color: string; Icono: typeof CheckCircleOutlineIcon; etiqueta: string }> = {
  ok: { color: COLORS.green, Icono: CheckCircleOutlineIcon, etiqueta: 'Listo' },
  advertencia: { color: COLORS.detenido, Icono: WarningAmberOutlinedIcon, etiqueta: 'Revisar' },
  pendiente: { color: COLORS.blue, Icono: PendingOutlinedIcon, etiqueta: 'Pendiente' },
  error: { color: COLORS.red, Icono: ErrorOutlineIcon, etiqueta: 'Requerido' },
};

/** Revisión operativa antes de abrir una prueba. Solo administra el equipo local; no depende de nube. */
export default function PreparacionEvento() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { data: evento, error: errorEvento, isLoading: cargandoEvento, mutate: recargarEvento } = useEvento(eventoId);
  const { data: equipos, error: errorEquipos, isLoading: cargandoEquipos, mutate: recargarEquipos } = useEquipos(eventoId);
  const mando = useEstadoGamepad();
  const [pruebaId, setPruebaId] = useState('');
  const [respaldoEn, setRespaldoEn] = useState<string | null>(null);
  const [recuperacion, setRecuperacion] = useState<ResumenRecuperacion>({ activas: 0, sinGuardar: 0 });

  useEffect(() => {
    setRespaldoEn(store.get<string | null>('respaldo:ultima-descarga', null));
  }, []);

  useEffect(() => {
    if (!evento || pruebaId) return;
    const guardada = store.get<string>(`crono:prueba:${eventoId}`, '');
    const porDefecto = evento.pruebas.find((prueba) => prueba.id === guardada)
      ?? evento.pruebas.find((prueba) => prueba.estado === 'EN_CURSO')
      ?? evento.pruebas.find((prueba) => prueba.estado === 'PENDIENTE')
      ?? evento.pruebas[0];
    if (porDefecto) setPruebaId(porDefecto.id);
  }, [evento, eventoId, pruebaId]);

  useEffect(() => {
    if (!pruebaId) return;
    setRecuperacion(resumirPistasGuardadas(store.get(`crono:lanes:${pruebaId}`, [])));
  }, [pruebaId]);

  const prueba = evento?.pruebas.find((item) => item.id === pruebaId) ?? null;
  const chequeos = useMemo(() => evaluarPreparacion({
    servidorDisponible: Boolean(evento) && !errorEvento && !errorEquipos,
    equipos: equipos?.length ?? 0,
    pistas: evento?.numPistas ?? 0,
    prueba,
    respaldoEn,
    mandoDetectado: mando.conectado,
    mandoProbado: mando.probado,
    recuperacion,
  }), [evento, errorEvento, errorEquipos, equipos?.length, prueba, respaldoEn, mando.conectado, mando.probado, recuperacion]);
  const lista = preparacionLista(chequeos);
  const cargando = cargandoEvento || cargandoEquipos;

  const elegirPrueba = (id: string) => {
    setPruebaId(id);
    store.set(`crono:prueba:${eventoId}`, id);
  };
  const actualizar = async () => {
    try {
      await Promise.all([recargarEvento(), recargarEquipos()]);
    } catch {
      // SWR conserva el error y la tarjeta de Base local comunica el problema sin ocultar los demás chequeos.
    }
    setRespaldoEn(store.get<string | null>('respaldo:ultima-descarga', null));
    if (pruebaId) setRecuperacion(resumirPistasGuardadas(store.get(`crono:lanes:${pruebaId}`, [])));
  };

  return (
    <Stack spacing={2.25}>
      <Paper sx={{ ...superficieVidrio, p: { xs: 2, sm: 2.5 }, borderColor: 'rgba(255,204,0,.55)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutlineIcon /> Preparación del evento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
              Comprueba este portátil antes de iniciar. La base local es lo importante; la nube nunca bloquea el cronometraje.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
            <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={() => void actualizar()} disabled={cargando}>
              Actualizar
            </Button>
            <Button component={Link} href={RUTAS.evento(eventoId, 'cronometro')} variant="contained" disabled={!lista || cargando} startIcon={cargando ? <CircularProgress color="inherit" size={16} /> : <TimerOutlinedIcon />}>
              Abrir cronometraje
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {(errorEvento || errorEquipos) && (
        <Alert severity="error">No se pudo consultar PostgreSQL local. Verifica que el servicio y la conexión de este portátil estén activos.</Alert>
      )}

      <Paper sx={ESPACIADO_SISTEMA.tarjeta}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h5">Prueba que se abrirá</Typography>
            <Typography variant="body2" color="text.secondary">Se guarda solo en este equipo para que el cronómetro abra la prueba correcta.</Typography>
          </Box>
          <TextField select value={pruebaId} onChange={(event) => elegirPrueba(event.target.value)} disabled={!evento?.pruebas.length} sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
            {evento?.pruebas.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        {chequeos.map((chequeo) => <TarjetaChequeo key={chequeo.id} chequeo={chequeo} />)}
      </Box>

      <Paper sx={{ ...cajaVidrio, p: { xs: 1.75, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <CloudOutlinedIcon sx={{ color: COLORS.blue }} />
        <Typography variant="body2" color="text.secondary">
          La sincronización con Supabase es opcional y se realiza después desde Configuración. El sistema sigue operativo aunque no haya internet.
        </Typography>
      </Paper>
    </Stack>
  );
}

function TarjetaChequeo({ chequeo }: { chequeo: ChequeoPreparacion }) {
  const Icono = ICONOS[chequeo.id];
  const estilo = ESTILOS[chequeo.estado];
  const IconoEstado = estilo.Icono;
  return (
    <Paper sx={{ ...superficieVidrio, p: 2, minHeight: 150, display: 'flex', flexDirection: 'column', gap: 1, borderColor: chequeo.estado === 'ok' ? 'rgba(95,209,122,.28)' : undefined }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: `${estilo.color}20`, color: estilo.color }}><Icono /></Box>
        <Chip size="small" icon={<IconoEstado />} label={estilo.etiqueta} sx={{ color: estilo.color, borderColor: `${estilo.color}90`, '& .MuiChip-icon': { color: 'inherit' } }} variant="outlined" />
      </Stack>
      <Typography variant="h6">{chequeo.titulo}</Typography>
      <Typography variant="body2" color="text.secondary">{chequeo.detalle}</Typography>
    </Paper>
  );
}
