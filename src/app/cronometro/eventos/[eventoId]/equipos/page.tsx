'use client';
import { useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmergencyOutlinedIcon from '@mui/icons-material/EmergencyOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { api, descargarTexto, useEquipos, useEvento } from '@/lib/client';
import { decodificarCSV, parseEquiposCSV, PLANTILLA_EQUIPOS, type FilaEquipoCSV } from '@/lib/csv';
import { edad } from '@/lib/format';
import { useRun, useToast } from '@/components/Toast';
import { useAppDialog } from '@/components/AppDialog';
import MarcoLogo from '@/components/MarcoLogo';
import { tieneAlerta } from '@/lib/fichas';
import { useColorLogo } from '@/lib/colorLogo';
import LogoUpload from '@/components/LogoUpload';
import Vacio from '@/components/Vacio';
import type { EquipoDTO, ParticipanteDTO } from '@/lib/types';
import { COLORS, FONT_MONO, alfa, cajaVidrio, superficieVidrio } from '@/theme';

export default function EquiposPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { mutate: mutEv } = useEvento(eventoId);
  const { data: equipos, mutate } = useEquipos(eventoId);
  const run = useRun();
  const dialog = useAppDialog();
  const [q, setQ] = useState('');
  const [eqEdit, setEqEdit] = useState<EquipoDTO | 'nuevo' | null>(null);
  const [ficha, setFicha] = useState<{ equipo: EquipoDTO; p: ParticipanteDTO | null } | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const recargar = async () => {
    await mutate();
    mutEv();
  };

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return equipos ?? [];
    return (equipos ?? []).filter(
      (e) => e.nombre.toLowerCase().includes(t) || String(e.numero) === t || (e.capitan || '').toLowerCase().includes(t) ||
        e.participantes.some((p) => p.nombre.toLowerCase().includes(t)),
    );
  }, [equipos, q]);

  const totalPart = (equipos ?? []).reduce((a, e) => a + e.participantes.length, 0);

  const borrar = async (e: EquipoDTO) => {
    if (!await dialog({
      title: 'Eliminar equipo',
      message: `¿Eliminar "${e.nombre}"? Se borrarán sus fichas, tiempos y puntos de disciplina.`,
      tone: 'danger',
      confirmLabel: 'Eliminar equipo',
    })) return;
    run(async () => {
      await api(`/api/equipos/${e.id}`, 'DELETE');
      await recargar();
    }, 'Equipo eliminado');
  };

  return (
    <Box>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="flex-end">
          <TextField
            placeholder="Buscar equipo o persona"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEqEdit('nuevo')}>Agregar equipo</Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setCsvOpen(true)}>Importar CSV</Button>
          <Button color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=participantes`}>
            Fichas (CSV)
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {equipos?.length ?? 0} equipos · {totalPart} participantes
          </Typography>
        </Stack>
      </Stack>

      {equipos && !equipos.length && <Vacio icono={<ShieldOutlinedIcon />}>Sin equipos. Agrega el primero o importa desde CSV.</Vacio>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 440px), 1fr))', gap: 2 }}>
        {filtrados.map((e) => (
          <Paper
            component="article"
            key={e.id}
            sx={{
              p: 1.25,
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(96px, .78fr) minmax(0, 1.22fr)', sm: 'minmax(120px, .9fr) minmax(0, 1.1fr)' },
              alignItems: 'stretch',
              gap: { xs: 1.25, sm: 2 },
              ...superficieVidrio,
              borderRadius: '28px',
              transition: 'transform .2s ease, border-color .2s ease',
              '&:hover': { transform: 'translateY(-4px)', borderColor: alfa(COLORS.acento, .45) },
            }}
          >
            <MarcoLogo logo={e.logo} nombre={e.nombre} tamanoAvatar={88} sx={{ aspectRatio: '1 / 1', alignSelf: 'center', width: '100%' }} />
            <Stack spacing={1} justifyContent="space-between" sx={{ minWidth: 0, py: 0.25 }}>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                  <Typography variant="h5" sx={{ color: COLORS.acento, lineHeight: 1.1, overflowWrap: 'anywhere', textTransform: 'none', flex: 1 }}>
                    {e.nombre}
                  </Typography>
                  <Chip size="small" label={`N.º ${e.numero}`} color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>Capitán</Typography>
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere', fontWeight: 600 }}>{e.capitan || 'Sin asignar'}</Typography>
              </Box>

              <Box sx={{ minWidth: 0, borderTop: `1px solid ${COLORS.border}`, pt: 0.75 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Participantes · {e.participantes.length}
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, maxHeight: 72, overflowY: 'auto' }}>
                  {e.participantes.map((p) => (
                    <Tooltip key={p.id} title={tieneAlerta(p) ? 'Tiene información médica relevante' : 'Ver / editar ficha'}>
                      <Chip
                        size="small"
                        label={p.nombre}
                        onClick={() => setFicha({ equipo: e, p })}
                        color={tieneAlerta(p) ? 'warning' : 'default'}
                        variant={tieneAlerta(p) ? 'outlined' : 'filled'}
                        sx={{ maxWidth: '100%' }}
                      />
                    </Tooltip>
                  ))}
                  {!e.participantes.length && <Typography variant="caption" color="text.secondary">Aún no hay fichas.</Typography>}
                </Stack>
              </Box>

              <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5}>
                <Button size="small" variant="contained" startIcon={<PersonAddIcon />} onClick={() => setFicha({ equipo: e, p: null })} sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap' }}>
                  Añadir
                </Button>
                <Button size="small" variant="outlined" onClick={() => setEqEdit(e)}>Editar</Button>
                <Tooltip title="Eliminar equipo">
                  <IconButton size="small" aria-label={`Eliminar ${e.nombre}`} onClick={() => borrar(e)}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>

      {eqEdit && (
        <EquipoDialog
          eventoId={eventoId}
          equipo={eqEdit === 'nuevo' ? null : eqEdit}
          onClose={() => setEqEdit(null)}
          onSaved={recargar}
        />
      )}
      {ficha && <FichaDialog equipo={ficha.equipo} p={ficha.p} equipos={equipos ?? []} onClose={() => setFicha(null)} onSaved={recargar} />}
      {csvOpen && <CsvDialog eventoId={eventoId} onClose={() => setCsvOpen(false)} onSaved={recargar} />}
    </Box>
  );
}

function EquipoDialog({ eventoId, equipo, onClose, onSaved }: {
  eventoId: string; equipo: EquipoDTO | null; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const run = useRun();
  const [numero, setNumero] = useState(equipo ? String(equipo.numero) : '');
  const [nombre, setNombre] = useState(equipo?.nombre ?? '');
  const [capitan, setCapitan] = useState(equipo?.capitan ?? '');
  const [logo, setLogo] = useState<string | null>(equipo?.logo ?? null);
  const [color, setColor] = useState<string | null>(equipo?.color ?? null);
  const colorDelLogo = useColorLogo(logo);

  const guardar = async () => {
    const body = { numero: numero ? parseInt(numero) : undefined, nombre, capitan, logo, color };
    const ok = await run(async () => {
      if (equipo) await api(`/api/equipos/${equipo.id}`, 'PATCH', body);
      else await api(`/api/eventos/${eventoId}/equipos`, 'POST', body);
      await onSaved();
    }, 'Equipo guardado');
    if (ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs">
      <DialogTitle sx={{ color: COLORS.text, fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, letterSpacing: '0.01em' }}>
        {equipo ? 'Editar equipo' : 'Nuevo equipo'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField label="N° inscripción" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="auto" sx={{ maxWidth: 130 }} />
            <TextField label="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </Stack>
          <TextField label="Capitán" value={capitan} onChange={(e) => setCapitan(e.target.value)} />
          <LogoUpload value={logo} onChange={setLogo} nombre={nombre} />
          <ColorCapitan color={color} colorDelLogo={colorDelLogo} onChange={setColor} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!nombre.trim()}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Color de la carta del capitán: por defecto el color que más resalta del logo; se puede elegir otro a mano.
 */
function ColorCapitan({ color, colorDelLogo, onChange }: {
  color: string | null; colorDelLogo: string | null; onChange: (c: string | null) => void;
}) {
  const efectivo = color ?? colorDelLogo ?? COLORS.text;
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>Color del capitán</Typography>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          component="label"
          title="Elegir color"
          sx={{ position: 'relative', width: 44, height: 44, borderRadius: '12px', bgcolor: efectivo, border: `1px solid ${COLORS.border}`, cursor: 'pointer', flexShrink: 0 }}
        >
          <Box
            component="input"
            type="color"
            value={efectivo}
            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => onChange(ev.target.value)}
            aria-label="Color de la carta del capitán"
            sx={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {color ? 'Elegido a mano' : colorDelLogo ? 'Tomado del logo' : 'Blanco (el logo no tiene color)'}
        </Typography>
        {color && <Button size="small" color="inherit" onClick={() => onChange(null)}>Usar el del logo</Button>}
      </Stack>
    </Box>
  );
}

const CAMPOS_PERSONALES: [keyof ParticipanteDTO, string, string?][] = [
  ['nombre', 'Nombre completo *'],
  ['fechaNacimiento', 'Fecha de nacimiento', 'date'],
  ['telefono', 'Teléfono', 'tel'],
  ['email', 'Correo electrónico', 'email'],
  ['residencia', 'Lugar de residencia'],
  ['profesion', 'Profesión / Oficio / Deporte'],
];
const CAMPOS_MEDICOS: [keyof ParticipanteDTO, string, string][] = [
  ['alergias', 'Alergias', "Medicamentos, alimentos, picaduras… o 'Ninguna'"],
  ['enfermedades', 'Enfermedades crónicas', "Diabetes, hipertensión… o 'Ninguna'"],
  ['medicamentos', 'Medicamentos actuales', "Nombre y dosis… o 'Ninguno'"],
  ['limitaciones', 'Limitaciones físicas', "Lesiones, cirugías… o 'Ninguna'"],
  ['observaciones', 'Observaciones adicionales', ''],
];

function Seccion({ t, children }: { t: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ ...cajaVidrio, p: 1.5 }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>{t}</Typography>
      {children}
    </Box>
  );
}

function FichaDialog({ equipo, p, equipos, onClose, onSaved }: {
  equipo: EquipoDTO; p: ParticipanteDTO | null; equipos: EquipoDTO[]; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const run = useRun();
  const dialog = useAppDialog();
  const [f, setF] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    if (p) for (const [k, v] of Object.entries(p)) o[k] = v == null ? '' : String(v);
    o.equipoId = equipo.id;
    return o;
  });
  const set = (k: string) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const guardar = async () => {
    const { id: _id, ...body } = f;
    const ok = await run(async () => {
      if (p) await api(`/api/participantes/${p.id}`, 'PATCH', body);
      else await api(`/api/equipos/${equipo.id}/participantes`, 'POST', body);
      await onSaved();
    }, 'Ficha guardada');
    if (ok) onClose();
  };
  const borrar = async () => {
    if (!p || !await dialog({
      title: 'Eliminar ficha',
      message: `¿Eliminar la ficha de ${p.nombre}?`,
      tone: 'danger',
      confirmLabel: 'Eliminar ficha',
    })) return;
    run(async () => {
      await api(`/api/participantes/${p.id}`, 'DELETE');
      await onSaved();
      onClose();
    }, 'Ficha eliminada');
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm">
      <DialogTitle>
        {p ? 'Ficha' : 'Nueva ficha'} — {equipo.nombre}
        {f.fechaNacimiento && <Typography component="span" variant="body2" color="text.secondary"> · {edad(f.fechaNacimiento)}</Typography>}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Seccion t={<Stack direction="row" spacing={1} alignItems="center"><PersonOutlineIcon />Datos personales</Stack>}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {CAMPOS_PERSONALES.map(([k, label, type]) => (
                <TextField key={k} label={label} type={type} value={f[k] ?? ''} onChange={set(k)}
                  slotProps={type === 'date' ? { inputLabel: { shrink: true } } : undefined} />
              ))}
              {p && (
                <TextField select label="Equipo" value={f.equipoId} onChange={set('equipoId')}>
                  {equipos.map((e) => <MenuItem key={e.id} value={e.id}>{e.numero}. {e.nombre}</MenuItem>)}
                </TextField>
              )}
            </Box>
          </Seccion>
          <Seccion t={<Stack direction="row" spacing={1} alignItems="center"><EmergencyOutlinedIcon />Contacto de emergencia</Stack>}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
              <TextField label="Nombre" value={f.contactoNombre ?? ''} onChange={set('contactoNombre')} />
              <TextField label="Parentesco" value={f.contactoParentesco ?? ''} onChange={set('contactoParentesco')} placeholder="Madre, Padre…" />
              <TextField label="Teléfono" type="tel" value={f.contactoTelefono ?? ''} onChange={set('contactoTelefono')} />
            </Box>
          </Seccion>
          <Seccion t={<Stack direction="row" spacing={1} alignItems="center"><MedicalServicesOutlinedIcon />Ficha médica</Stack>}>
            <Stack spacing={1.5}>
              <TextField select label="Tipo de sangre" value={f.tipoSangre ?? ''} onChange={set('tipoSangre')} sx={{ maxWidth: 180 }}>
                <MenuItem value="">—</MenuItem>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              {CAMPOS_MEDICOS.map(([k, label, ph]) => (
                <TextField key={k} label={label} placeholder={ph} multiline minRows={1} value={f[k] ?? ''} onChange={set(k)} />
              ))}
            </Stack>
          </Seccion>
        </Stack>
      </DialogContent>
      <DialogActions>
        {p && <Button color="error" onClick={borrar} sx={{ mr: 'auto' }}>Eliminar</Button>}
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!f.nombre?.trim()}>Guardar ficha</Button>
      </DialogActions>
    </Dialog>
  );
}

function CsvDialog({ eventoId, onClose, onSaved }: { eventoId: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const run = useRun();
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [txt, setTxt] = useState('');
  const parsed = useMemo<{ filas: FilaEquipoCSV[]; errores: string[] }>(
    () => (txt.trim() ? parseEquiposCSV(txt) : { filas: [], errores: [] }),
    [txt],
  );

  const importar = async () => {
    const ok = await run(async () => {
      const r = await api<{ creados: number; actualizados: number; participantes: number; fichasActualizadas: number }>(
        `/api/eventos/${eventoId}/equipos/import`, 'POST', { filas: parsed.filas },
      );
      await onSaved();
      toast(
        `Importación lista: ${r.creados} equipos nuevos, ${r.actualizados} actualizados, ` +
        `${r.participantes} fichas nuevas y ${r.fichasActualizadas} fichas completadas.`,
      );
    });
    if (ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><UploadFileOutlinedIcon />Importar equipos desde CSV</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Una fila por participante con su ficha: <b>Equipo, Participante, Nacimiento, Teléfono, Contacto emergencia, Sangre,
          Alergias…</b> (descarga la plantilla). Sirve el mismo archivo de «Fichas (CSV)». Los equipos y participantes que ya
          existan con el mismo nombre se completan; los nuevos se crean. También acepta el formato anterior:
          <b> num, nombre_equipo, capitan, integrantes</b>.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => ref.current?.click()}>Subir archivo</Button>
          <Button color="inherit" startIcon={<DownloadIcon />} onClick={() => descargarTexto('plantilla_equipos.csv', PLANTILLA_EQUIPOS, 'text/csv')}>
            Plantilla
          </Button>
        </Stack>
        <input ref={ref} type="file" accept=".csv,.txt" hidden onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) setTxt(decodificarCSV(await file.arrayBuffer()));
        }} />
        <TextField multiline minRows={6} maxRows={14} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="…o pega aquí el contenido CSV"
          slotProps={{ htmlInput: { style: { fontFamily: FONT_MONO, fontSize: 12 } } }} />
        {txt.trim() && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2"><b>{parsed.filas.length}</b> equipos detectados · {parsed.filas.reduce((a, f) => a + f.integrantes.length, 0)} participantes
              {' '}· {parsed.filas.reduce((a, f) => a + f.integrantes.filter((p) => Object.keys(p).length > 1).length, 0)} con ficha</Typography>
            {parsed.errores.slice(0, 5).map((er) => <Typography key={er} variant="caption" color="error" sx={{ display: 'block' }}>{er}</Typography>)}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={importar} disabled={!parsed.filas.length}>Importar {parsed.filas.length || ''}</Button>
      </DialogActions>
    </Dialog>
  );
}
