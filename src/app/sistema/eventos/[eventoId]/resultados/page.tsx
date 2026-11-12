'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Button, Chip, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useClasificacion, useEquipos } from '@/lib/client';
import { fHora, fmt, fmtSeg } from '@/lib/format';
import { ESTADOS } from '@/lib/estados';
import EquipoAvatar from '@/components/EquipoAvatar';
import PosChip from '@/components/PosChip';
import Vacio from '@/components/Vacio';
import DetalleDialog from '@/components/crono/DetalleDialog';
import type { FilaPrueba } from '@/lib/types';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '@/theme';

function Podio({ items }: { items: { id: string; nombre: string; logo?: string | null; tiempo: string }[] }) {
  const med = ['🥇', '🥈', '🥉'];
  const col = ['#f59e0b', '#94a3b8', '#b45309'];
  if (!items.length) return null;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
      {items.slice(0, 3).map((x, i) => (
        <Paper key={x.id} sx={{ p: 1.5, textAlign: 'center', borderColor: col[i] }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 28 }}>{med[i]}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}><EquipoAvatar nombre={x.nombre} logo={x.logo} size={40} /></Box>
          <Typography sx={{ fontWeight: 700 }} noWrap>{x.nombre}</Typography>
          <Typography sx={{ fontFamily: FONT_MONO, color: COLORS.gold }}>{x.tiempo}</Typography>
        </Paper>
      ))}
    </Box>
  );
}

export default function Resultados() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { data: clas } = useClasificacion(eventoId, 5000);
  const { data: equipos } = useEquipos(eventoId);
  const [tab, setTab] = useState('general');
  const [detalle, setDetalle] = useState<FilaPrueba | null>(null);

  if (!clas) return null;
  const logo = (id: string) => equipos?.find((e) => e.id === id)?.logo;
  const pr = clas.pruebas.find((p) => p.id === tab);

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Tabs value={pr ? tab : 'general'} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ flex: 1, minWidth: 0 }}>
          <Tab value="general" label="🏆 General acumulada" />
          {clas.pruebas.map((p, i) => (
            <Tab key={p.id} value={p.id} label={`${i + 1}. ${p.nombre} (${p.filas.length})`} />
          ))}
        </Tabs>
        <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=general`}>General CSV</Button>
        <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=todas`}>Todas las pruebas CSV</Button>
      </Stack>

      {!pr ? (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Suma de tiempos finales (con detenciones descontadas y disciplina aplicada). Los equipos con más pruebas completadas van primero.
            Se actualiza automáticamente.
          </Typography>
          {!clas.general.length ? (
            <Vacio icono="🏁">Aún no hay tiempos registrados.</Vacio>
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
                      <TableCell align="right" sx={{ fontFamily: FONT_MONO, color: COLORS.gold, fontSize: 15, whiteSpace: 'nowrap' }}>{fmt(g.totalMs)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h4" sx={{ flex: 1 }}>{pr.nombre}</Typography>
            <Chip size="small" color={ESTADOS[pr.estado].color} label={ESTADOS[pr.estado].label} />
            <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=prueba&pruebaId=${pr.id}`}>CSV</Button>
          </Stack>
          {!pr.filas.length ? (
            <Vacio icono="⏱">Sin tiempos en esta prueba.</Vacio>
          ) : (
            <>
              <Podio items={pr.filas.map((f) => ({ id: f.equipoId, nombre: f.nombre, logo: logo(f.equipoId), tiempo: fmt(f.finalMs) }))} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pos.</TableCell><TableCell>Equipo</TableCell><TableCell>Pista</TableCell><TableCell>Salida</TableCell><TableCell>Llegada</TableCell>
                    <TableCell>Bruto</TableCell><TableCell>Det.</TableCell><TableCell>Disc.</TableCell><TableCell>Final</TableCell>
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
                      <TableCell sx={{ color: COLORS.orange, fontSize: 11 }}>{f.detencionesMs ? `−${fmt(f.detencionesMs)}` : '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: f.penMs > 0 ? COLORS.red : f.penMs < 0 ? COLORS.green : 'text.secondary' }}>{f.penMs ? fmtSeg(f.penMs) : '—'}</TableCell>
                      <TableCell sx={{ fontFamily: FONT_MONO, color: COLORS.gold, fontSize: 15 }}>{fmt(f.finalMs)}</TableCell>
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
