'use client';
import { useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem,
  Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { api, descargarTexto, useEquipos, useEvento } from '@/lib/client';
import { parseEquiposCSV, PLANTILLA_EQUIPOS, type FilaEquipoCSV } from '@/lib/csv';
import { edad } from '@/lib/format';
import { useRun } from '@/components/Toast';
import EquipoAvatar from '@/components/EquipoAvatar';
import LogoUpload from '@/components/LogoUpload';
import Vacio from '@/components/Vacio';
import type { EquipoDTO, ParticipanteDTO } from '@/lib/types';
import { COLORS, FONT_DISPLAY } from '@/theme';

const tieneAlerta = (p: ParticipanteDTO) =>
  [p.alergias, p.enfermedades, p.medicamentos, p.limitaciones].some(
    (v) => v && !/^(ninguna?o?|no|n\/a|-)$/i.test(v.trim()),
  );

export default function EquiposPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { mutate: mutEv } = useEvento(eventoId);
  const { data: equipos, mutate } = useEquipos(eventoId);
  const run = useRun();
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

  const borrar = (e: EquipoDTO) => {
    if (!confirm(`¿Eliminar "${e.nombre}"? Se borrarán sus fichas, tiempos y puntos de disciplina.`)) return;
    run(async () => {
      await api(`/api/equipos/${e.id}`, 'DELETE');
      await recargar();
    }, 'Equipo eliminado');
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }} alignItems="center">
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEqEdit('nuevo')}>Agregar equipo</Button>
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setCsvOpen(true)}>Importar CSV</Button>
        <Button color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=participantes`}>
          Fichas (CSV)
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {equipos?.length ?? 0} equipos · {totalPart} participantes
        </Typography>
        <TextField
          placeholder="Buscar equipo o persona"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ maxWidth: 260 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
      </Stack>

      {equipos && !equipos.length && <Vacio icono="🛡">Sin equipos. Agrega el primero o importa desde CSV.</Vacio>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1.5 }}>
        {filtrados.map((e) => (
          <Paper key={e.id} sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.gold, width: 30, textAlign: 'center' }}>{e.numero}</Typography>
              <EquipoAvatar nombre={e.nombre} logo={e.logo} size={42} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap>{e.nombre}</Typography>
                <Typography variant="caption" color="text.secondary">Cap: {e.capitan || '—'} · {e.participantes.length} participantes</Typography>
              </Box>
              <IconButton size="small" onClick={() => setEqEdit(e)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => borrar(e)}><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {e.participantes.map((p) => (
                <Tooltip key={p.id} title={tieneAlerta(p) ? '⚕ Tiene información médica relevante' : 'Ver / editar ficha'}>
                  <Chip
                    size="small"
                    label={p.nombre}
                    onClick={() => setFicha({ equipo: e, p })}
                    color={tieneAlerta(p) ? 'error' : 'default'}
                    variant={tieneAlerta(p) ? 'outlined' : 'filled'}
                  />
                </Tooltip>
              ))}
              <Chip size="small" icon={<PersonAddIcon />} label="Ficha" variant="outlined" color="primary" onClick={() => setFicha({ equipo: e, p: null })} />
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

  const guardar = async () => {
    const body = { numero: numero ? parseInt(numero) : undefined, nombre, capitan, logo };
    const ok = await run(async () => {
      if (equipo) await api(`/api/equipos/${equipo.id}`, 'PATCH', body);
      else await api(`/api/eventos/${eventoId}/equipos`, 'POST', body);
      await onSaved();
    }, '✅ Equipo guardado');
    if (ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs">
      <DialogTitle>{equipo ? 'Editar equipo' : 'Nuevo equipo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField label="N° inscripción" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="auto" sx={{ maxWidth: 130 }} />
            <TextField label="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </Stack>
          <TextField label="Capitán" value={capitan} onChange={(e) => setCapitan(e.target.value)} />
          <LogoUpload value={logo} onChange={setLogo} nombre={nombre} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!nombre.trim()}>Guardar</Button>
      </DialogActions>
    </Dialog>
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

function Seccion({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: COLORS.surf, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 1.5 }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>{t}</Typography>
      {children}
    </Box>
  );
}

function FichaDialog({ equipo, p, equipos, onClose, onSaved }: {
  equipo: EquipoDTO; p: ParticipanteDTO | null; equipos: EquipoDTO[]; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const run = useRun();
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
    }, '✅ Ficha guardada');
    if (ok) onClose();
  };
  const borrar = () => {
    if (!p || !confirm(`¿Eliminar la ficha de ${p.nombre}?`)) return;
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
          <Seccion t="👤 Datos personales">
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
          <Seccion t="🚨 Contacto de emergencia">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
              <TextField label="Nombre" value={f.contactoNombre ?? ''} onChange={set('contactoNombre')} />
              <TextField label="Parentesco" value={f.contactoParentesco ?? ''} onChange={set('contactoParentesco')} placeholder="Madre, Padre…" />
              <TextField label="Teléfono" type="tel" value={f.contactoTelefono ?? ''} onChange={set('contactoTelefono')} />
            </Box>
          </Seccion>
          <Seccion t="🏥 Ficha médica">
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
  const ref = useRef<HTMLInputElement>(null);
  const [txt, setTxt] = useState('');
  const parsed = useMemo<{ filas: FilaEquipoCSV[]; errores: string[] }>(
    () => (txt.trim() ? parseEquiposCSV(txt) : { filas: [], errores: [] }),
    [txt],
  );

  const importar = async () => {
    const ok = await run(async () => {
      const r = await api<{ creados: number; actualizados: number; participantes: number }>(
        `/api/eventos/${eventoId}/equipos/import`, 'POST', { filas: parsed.filas },
      );
      await onSaved();
      alert(`Importación lista:\n• ${r.creados} equipos nuevos\n• ${r.actualizados} actualizados\n• ${r.participantes} participantes agregados`);
    });
    if (ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md">
      <DialogTitle>📥 Importar equipos desde CSV</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Columnas: <b>num, nombre_equipo, capitan, integrantes</b> (integrantes separados por <code>;</code>). Los equipos con el
          mismo nombre se actualizan; los integrantes se crean como fichas.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => ref.current?.click()}>Subir archivo</Button>
          <Button color="inherit" startIcon={<DownloadIcon />} onClick={() => descargarTexto('plantilla_equipos.csv', '﻿' + PLANTILLA_EQUIPOS, 'text/csv')}>
            Plantilla
          </Button>
        </Stack>
        <input ref={ref} type="file" accept=".csv,.txt" hidden onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) setTxt(await file.text());
        }} />
        <TextField multiline minRows={6} maxRows={14} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="…o pega aquí el contenido CSV"
          slotProps={{ htmlInput: { style: { fontFamily: 'var(--font-mono), monospace', fontSize: 12 } } }} />
        {txt.trim() && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2"><b>{parsed.filas.length}</b> equipos detectados · {parsed.filas.reduce((a, f) => a + f.integrantes.length, 0)} integrantes</Typography>
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
