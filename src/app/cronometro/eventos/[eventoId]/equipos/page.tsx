'use client';
import { useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
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
import { edad, iniciales, nombreYApellido } from '@/lib/format';
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
  const [integrantes, setIntegrantes] = useState<EquipoDTO | null>(null);
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
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, borderColor: `${COLORS.acento}55` }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
            <GroupsOutlinedIcon sx={{ fontSize: 34, color: COLORS.acento, flexShrink: 0 }} />
            <Box>
              <Typography variant="h4">Equipos</Typography>
              <Typography variant="body2" color="text.secondary">Administra los equipos, sus integrantes y las fichas del evento.</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
            <Stack direction="row" spacing={.5} alignItems="center" color="text.secondary">
              <GroupsOutlinedIcon sx={{ fontSize: 21, color: COLORS.acento }} />
              <Typography variant="body2" fontWeight={700}>{equipos?.length ?? 0}</Typography>
              <Typography variant="body2">equipos</Typography>
            </Stack>
            <Stack direction="row" spacing={.5} alignItems="center" color="text.secondary">
              <PersonOutlineIcon sx={{ fontSize: 21, color: COLORS.acento }} />
              <Typography variant="body2" fontWeight={700}>{totalPart}</Typography>
              <Typography variant="body2">participantes</Typography>
            </Stack>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEqEdit('nuevo')}>Agregar equipo</Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
          <TextField
            placeholder="Buscar equipo o persona"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setCsvOpen(true)}>Importar CSV</Button>
          <Button color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=participantes`}>
            Fichas (CSV)
          </Button>
        </Stack>
      </Stack>

      {equipos && !equipos.length && <Vacio icono={<ShieldOutlinedIcon />}>Sin equipos. Agrega el primero o importa desde CSV.</Vacio>}

      <Box sx={{
        display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2,
      }}>
        {filtrados.map((e) => (
          <Paper
            component="article"
            key={e.id}
            sx={{
              p: 1.25,
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(112px, .82fr) minmax(0, 1.18fr)', sm: 'minmax(190px, 230px) minmax(0, 1fr)' },
              alignItems: 'stretch',
              gap: { xs: 1.25, sm: 2 },
              ...superficieVidrio,
              borderRadius: '28px',
              transition: 'transform .2s ease, border-color .2s ease',
              '&:hover': { transform: 'translateY(-4px)', borderColor: alfa(COLORS.acento, .45) },
            }}
          >
            <MarcoLogo logo={e.logo} nombre={e.nombre} tamanoAvatar={96} sx={{ aspectRatio: '1 / 1', alignSelf: 'center', width: '100%' }} />
            <Stack spacing={1.25} justifyContent="space-between" sx={{ minWidth: 0, py: 0.25 }}>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                  <Typography variant="h5" sx={{ color: COLORS.acento, lineHeight: 1.1, overflowWrap: 'anywhere', textTransform: 'none', flex: 1 }}>
                    {e.nombre}
                  </Typography>
                  <Chip size="small" label={`N.º ${e.numero}`} color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  Capitán · <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{e.capitan || 'Sin asignar'}</Box>
                </Typography>
              </Box>

              <Box sx={{ ...cajaVidrio, p: .75 }}>
                <Stack direction="row" alignItems="center" sx={{ mb: .65 }}>
                  <Stack direction="row" spacing={.5} alignItems="center" sx={{ flex: 1 }}>
                    <GroupsOutlinedIcon sx={{ fontSize: 18, color: COLORS.acento }} />
                    <Typography variant="caption" fontWeight={800}>{e.participantes.length} integrantes</Typography>
                  </Stack>
                  <Tooltip title="Añadir integrante">
                    <IconButton size="small" aria-label={`Añadir integrante a ${e.nombre}`} onClick={() => setFicha({ equipo: e, p: null })} sx={{ color: COLORS.acento }}><PersonAddIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Button size="small" color="inherit" onClick={() => setIntegrantes(e)} sx={{ minWidth: 0, px: .5, color: COLORS.acento }}>Ver todos</Button>
                </Stack>
                {!e.participantes.length ? (
                  <Button fullWidth size="small" color="inherit" startIcon={<PersonAddIcon />} onClick={() => setFicha({ equipo: e, p: null })}>Añadir el primero</Button>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(e.participantes.length, 6)}, minmax(0, 1fr))`, gap: .5 }}>
                    {e.participantes.slice(0, e.participantes.length > 6 ? 5 : 6).map((participante) => {
                      const corto = nombreYApellido(participante.nombre);
                      const esCapitan = e.capitan?.trim().toLocaleLowerCase('es') === participante.nombre.trim().toLocaleLowerCase('es');
                      const colorFranja = esCapitan ? COLORS.blue : COLORS.acento;
                      const imagenFondo = participante.foto ?? e.logo;
                      return (
                        <Tooltip key={participante.id} title={tieneAlerta(participante) ? `${participante.nombre} · revisión médica` : participante.nombre}>
                          <Button
                            color="inherit" onClick={() => setFicha({ equipo: e, p: participante })}
                            aria-label={`Editar ficha de ${participante.nombre}`}
                            sx={{ minWidth: 0, minHeight: 132, p: 0, position: 'relative', overflow: 'hidden', borderRadius: '8px', justifyContent: 'flex-start', bgcolor: 'rgba(255,255,255,.025)', border: `1px solid ${COLORS.border}`, '&:hover': { borderColor: colorFranja, transform: 'translateY(-2px)' } }}
                          >
                            {imagenFondo ? (
                              <Box component="img" src={imagenFondo} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: participante.foto ? 'cover' : 'contain', opacity: participante.foto ? .62 : .24, filter: 'grayscale(.2) brightness(.55)' }} />
                            ) : (
                              <PersonOutlineIcon sx={{ position: 'absolute', inset: 0, m: 'auto', fontSize: 34, color: 'text.secondary' }} />
                            )}
                            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,8,11,.22), rgba(5,8,11,.84))' }} />
                            <Typography variant="caption" noWrap sx={{ position: 'absolute', top: 6, left: 6, right: 22, color: 'rgba(255,255,255,.68)', fontSize: 8, fontWeight: 800, textAlign: 'left', textTransform: 'uppercase' }}>
                              {participante.residencia || 'Integrante'}
                            </Typography>
                            <Typography sx={{ position: 'absolute', left: 7, bottom: 5, color: esCapitan ? COLORS.blue : COLORS.text, fontFamily: FONT_MONO, fontSize: 25, fontWeight: 800, lineHeight: 1 }}>
                              {iniciales(participante.nombre)}
                            </Typography>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colorFranja, color: COLORS.bg }}>
                              <Typography component="span" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8, fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
                                {corto.nombre ? `${corto.nombre} ${corto.apellido}` : participante.nombre}
                              </Typography>
                            </Box>
                            {tieneAlerta(participante) && <Box sx={{ position: 'absolute', top: 5, right: 23, width: 6, height: 6, borderRadius: '50%', bgcolor: COLORS.detenido }} />}
                          </Button>
                        </Tooltip>
                      );
                    })}
                    {e.participantes.length > 6 && (
                      <Button color="inherit" onClick={() => setIntegrantes(e)} sx={{ minWidth: 0, minHeight: 108, borderRadius: '8px', color: COLORS.acento }}>+{e.participantes.length - 5}</Button>
                    )}
                  </Box>
                )}
              </Box>

              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={.5}>
                <Tooltip title="Editar equipo"><IconButton size="small" aria-label={`Editar ${e.nombre}`} onClick={() => setEqEdit(e)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
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
      {integrantes && (
        <IntegrantesDialog
          equipo={integrantes}
          onClose={() => setIntegrantes(null)}
          onAbrirFicha={(p) => { setIntegrantes(null); setFicha({ equipo: integrantes, p }); }}
          onAgregar={() => { setIntegrantes(null); setFicha({ equipo: integrantes, p: null }); }}
        />
      )}
      {csvOpen && <CsvDialog eventoId={eventoId} onClose={() => setCsvOpen(false)} onSaved={recargar} />}
    </Box>
  );
}

/** Lista completa fuera de la tarjeta: conserva acceso a cada ficha sin saturar la vista de equipos. */
function IntegrantesDialog({
  equipo, onClose, onAbrirFicha, onAgregar,
}: {
  equipo: EquipoDTO;
  onClose: () => void;
  onAbrirFicha: (participante: ParticipanteDTO) => void;
  onAgregar: () => void;
}) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm">
      <DialogTitle>{equipo.nombre} · Integrantes</DialogTitle>
      <DialogContent dividers>
        {!equipo.participantes.length ? (
          <Vacio icono={<PersonOutlineIcon />}>Aún no hay integrantes registrados.</Vacio>
        ) : (
          <Stack spacing={.75}>
            {equipo.participantes.map((participante) => (
              <Button
                key={participante.id} fullWidth color="inherit" onClick={() => onAbrirFicha(participante)}
                sx={{ ...cajaVidrio, justifyContent: 'flex-start', px: 1.25, py: 1, textAlign: 'left', '&:hover': { borderColor: COLORS.acento, bgcolor: alfa(COLORS.acento, .08) } }}
              >
                <PersonOutlineIcon sx={{ color: COLORS.acento, mr: 1.25 }} />
                <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{participante.nombre}</Typography>
                {tieneAlerta(participante) && <Chip size="small" color="warning" label="Revisión médica" />}
              </Button>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={onAgregar}>Añadir integrante</Button>
        <Button color="inherit" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
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
          <LogoUpload
            label="Foto del participante"
            tipo="foto"
            value={f.foto || null}
            nombre={f.nombre}
            onChange={(foto) => setF((actual) => ({ ...actual, foto: foto ?? '' }))}
          />
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
