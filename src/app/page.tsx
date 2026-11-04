'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Card, CardActionArea, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api, useEventos } from '@/lib/client';
import { useRun } from '@/components/Toast';
import EquipoAvatar from '@/components/EquipoAvatar';
import LogoUpload from '@/components/LogoUpload';
import Vacio from '@/components/Vacio';
import type { EventoDTO } from '@/lib/types';
import { COLORS } from '@/theme';

export default function Inicio() {
  const { data: eventos, isLoading, mutate } = useEventos();
  const [open, setOpen] = useState(false);

  const porAnio = new Map<number, EventoDTO[]>();
  (eventos ?? []).forEach((e) => porAnio.set(e.anio, [...(porAnio.get(e.anio) ?? []), e]));

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">📅 Eventos</Typography>
          <Typography variant="body2" color="text.secondary">
            Cada evento (edición) tiene sus pruebas, equipos, fichas, tiempos y disciplina.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Nuevo evento
        </Button>
      </Stack>

      {isLoading && <Skeleton variant="rounded" height={120} />}
      {!isLoading && !eventos?.length && (
        <Vacio icono="🏁">
          Aún no hay eventos. Crea el primero, o ve a <Link href="/respaldo">Respaldo</Link> para importar los datos de la
          versión anterior.
        </Vacio>
      )}

      {[...porAnio.entries()].map(([anio, evs]) => (
        <Box key={anio} sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ color: COLORS.gold, mb: 1 }}>
            {anio}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1.5 }}>
            {evs.map((ev) => {
              const hechas = ev.pruebas.filter((p) => p.estado === 'FINALIZADA').length;
              return (
                <Card key={ev.id}>
                  <CardActionArea component={Link} href={`/eventos/${ev.id}/cronometro`} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <EquipoAvatar nombre={ev.nombre} logo={ev.logo} size={52} square />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" noWrap>
                          {ev.nombre}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip size="small" label={`${ev._count?.equipos ?? 0} equipos`} />
                          <Chip size="small" label={`${hechas}/${ev.pruebas.length} pruebas`} />
                          <Chip size="small" label={`${ev.numPistas} pistas`} />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Box>
      ))}

      <NuevoEventoDialog open={open} onClose={() => setOpen(false)} eventos={eventos ?? []} onCreado={() => mutate()} />
    </Container>
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
  const [pruebas, setPruebas] = useState('Prueba 1\nPrueba 2\nPrueba 3');
  const [numPistas, setNumPistas] = useState(3);
  const [copiar, setCopiar] = useState('');
  const [busy, setBusy] = useState(false);

  const crear = async () => {
    setBusy(true);
    let id = '';
    const ok = await run(async () => {
      const ev = await api<{ id: string }>('/api/eventos', 'POST', {
        anio, nombre, logo, numPistas,
        pruebas: pruebas.split('\n').map((s) => s.trim()).filter(Boolean),
        copiarEquiposDe: copiar || undefined,
      });
      id = ev.id;
    }, '✅ Evento creado');
    setBusy(false);
    if (ok) {
      onCreado();
      onClose();
      router.push(`/eventos/${id}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>Nuevo evento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Año" type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value) || 0)} sx={{ maxWidth: { sm: 120 } }} />
            <TextField label="Nombre del evento" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Desafío Güela ${anio}`} autoFocus />
          </Stack>
          <LogoUpload value={logo} onChange={setLogo} label="Logo del evento" nombre={nombre} />
          <TextField label="Pruebas (una por línea)" multiline minRows={3} value={pruebas} onChange={(e) => setPruebas(e.target.value)} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Pistas simultáneas" value={numPistas} onChange={(e) => setNumPistas(Number(e.target.value))} sx={{ maxWidth: { sm: 180 } }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Copiar equipos y fichas de…" value={copiar} onChange={(e) => setCopiar(e.target.value)}>
              <MenuItem value="">— No copiar —</MenuItem>
              {eventos.map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.anio} · {e.nombre} ({e._count?.equipos ?? 0} eq.)</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={crear} disabled={busy || !nombre.trim()}>Crear evento</Button>
      </DialogActions>
    </Dialog>
  );
}
