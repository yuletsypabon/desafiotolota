'use client';
import { useEffect, useState } from 'react';
import { Box, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import EquipoAvatar from '@/components/EquipoAvatar';
import RelojDigital from './RelojDigital';
import { ahora } from '@/lib/reloj';
import { fHora, fmt, fmtSeg } from '@/lib/format';
import type { Detencion, EquipoDTO } from '@/lib/types';
import { COLORS, FONT_DISPLAY, FONT_MONO, alfa, superficieVidrio } from '@/theme';

export type LaneState = 'idle' | 'rdy' | 'run' | 'det' | 'fin';

export interface Lane {
  equipoId: string | null;
  state: LaneState;
  t0: number | null;
  ints: Detencion[];
  detStart: number | null;
  lTs: number | null;
  brutoMs: number | null;
  guardado: 'si' | 'no' | 'error';
}

export const laneVacia = (): Lane => ({
  equipoId: null, state: 'idle', t0: null, ints: [], detStart: null, lTs: null, brutoMs: null, guardado: 'no',
});

/** Reloj que se re-renderiza solo a sí mismo (~25 fps) */
function useNow(activo: boolean) {
  const [now, setNow] = useState(() => ahora());
  useEffect(() => {
    if (!activo) return;
    const iv = setInterval(() => setNow(ahora()), 40);
    return () => clearInterval(iv);
  }, [activo]);
  return now;
}

/** Botones grandes de la pista (llegada, detenido…): mismo tamaño y letra para que se vean iguales. */
const BOTON_PISTA = { fontWeight: 700, letterSpacing: '0.06em', px: 1, whiteSpace: 'nowrap', minHeight: 44 } as const;

/** Estado de la pista: texto y color (el color se lee de un vistazo en el evento). */
const BADGE: Record<LaneState, { t: string; c: string }> = {
  idle: { t: 'Libre', c: COLORS.dim },
  rdy: { t: 'Listo para salir', c: COLORS.blue },
  run: { t: 'En pista', c: COLORS.green },
  det: { t: 'Detenido', c: COLORS.detenido },
  fin: { t: 'Finalizado', c: COLORS.acento },
};
const BORDER: Record<LaneState, string> = {
  idle: COLORS.border, rdy: COLORS.dim, run: COLORS.green, det: COLORS.detenido, fin: COLORS.acento,
};

export default function LaneCard({
  n, lane, equipo, focused, dimmed, keyAccion, keyDet, penMs, candidatos,
  onFocus, onAccion, onDet, onElegir, onQuitar, onCancelarSalida,
}: {
  n: number;
  lane: Lane;
  equipo: EquipoDTO | null;
  focused: boolean;
  dimmed: boolean;
  keyAccion: string;
  keyDet: string;
  penMs: number | null;
  candidatos: EquipoDTO[];
  onFocus: () => void;
  onAccion: () => void;
  onDet: () => void;
  onElegir: (equipoId: string) => void;
  /** Sin función: no se muestra (con asignación automática la pista se volvería a llenar) */
  onQuitar?: () => void;
  onCancelarSalida: () => void;
}) {
  const activo = lane.state === 'run' || lane.state === 'det';
  const now = useNow(activo);
  const st = lane.state;

  const detMs = lane.ints.reduce((a, d) => a + d.dur, 0);
  let reloj = 0;
  if (activo && lane.t0) reloj = now - lane.t0;
  else if (st === 'fin' && lane.brutoMs !== null) reloj = Math.max(0, lane.brutoMs - detMs + (penMs ?? 0));

  const btn =
    st === 'idle' ? { t: 'CARGAR SIGUIENTE', color: 'inherit' as const, v: 'outlined' as const }
      : st === 'rdy' ? { t: 'DAR SALIDA', color: 'success' as const, v: 'contained' as const }
        : st === 'fin'
          ? lane.guardado === 'si'
            ? { t: 'LIBERAR PISTA', color: 'inherit' as const, v: 'outlined' as const }
            : lane.guardado === 'error'
              ? { t: 'REINTENTAR GUARDAR', color: 'error' as const, v: 'contained' as const }
              : { t: 'GUARDANDO…', color: 'success' as const, v: 'outlined' as const }
          : { t: 'LLEGADA', color: 'error' as const, v: 'contained' as const };

  return (
    <Box
      onClick={(e) => {
        const tag = (e.target as HTMLElement).closest('button,input,[role=combobox],li');
        if (!tag) onFocus();
      }}
      sx={{
        ...superficieVidrio,
        position: 'relative',
        border: `2px solid ${focused ? COLORS.blue : BORDER[st]}`,
        boxShadow: focused ? `0 0 0 3px ${COLORS.blue}, 0 0 24px ${alfa(COLORS.blue, .35)}` : activo ? `0 0 18px ${alfa(BORDER[st], .25)}` : superficieVidrio.boxShadow,
        opacity: dimmed ? 0.4 : 1,
        p: 1.5,
        pt: 3.5,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        minHeight: 320,
        cursor: 'pointer',
        transition: 'border-color .2s, box-shadow .2s, opacity .2s',
      }}
    >
      <Typography sx={{ position: 'absolute', top: 6, right: 10, fontFamily: FONT_DISPLAY, letterSpacing: '0.15em', fontSize: 12, color: COLORS.muted, textAlign: 'right' }}>
        PISTA {n}
      </Typography>
      <Box sx={{ position: 'absolute', top: 26, right: 8, display: 'flex', gap: 0.5 }}>
        {focused ? (
          <Chip size="small" label="SELECCIONADA" sx={{ height: 18, fontSize: 9, fontWeight: 700, color: COLORS.blue, bgcolor: alfa(COLORS.blue, .15) }} />
        ) : (
          <Typography variant="caption" sx={{ color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 10 }}>
            {keyAccion} · {keyDet}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
          px: 1.25, py: 0.4, borderRadius: 999, color: BADGE[st].c, bgcolor: alfa(BADGE[st].c, .14),
        }}
      >
        <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: BADGE[st].c }} />
        {BADGE[st].t}
      </Box>

      <EquipoAvatar nombre={equipo?.nombre ?? '?'} logo={equipo?.logo} size={58} />

      {st === 'idle' || st === 'rdy' ? (
        <TextField
          select
          value={lane.equipoId ?? ''}
          onChange={(e) => onElegir(e.target.value)}
          sx={{ '& .MuiSelect-select': { fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: '0.05em', textAlign: 'center' } }}
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value="" disabled>— Elegir equipo —</MenuItem>
          {equipo && <MenuItem value={equipo.id}>{equipo.numero}. {equipo.nombre}</MenuItem>}
          {candidatos.filter((c) => c.id !== equipo?.id).map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.numero}. {c.nombre}</MenuItem>
          ))}
        </TextField>
      ) : (
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, letterSpacing: '0.05em', textAlign: 'center', minHeight: 24 }}>
          {equipo?.nombre ?? '—'}
        </Typography>
      )}

      <Box sx={{ width: '100%' }}>
        <RelojDigital
          ms={reloj}
          color={st === 'run' ? COLORS.green : st === 'det' ? COLORS.detenido : st === 'fin' ? COLORS.acento : COLORS.text}
        />
      </Box>

      <Box sx={{ minHeight: 30, textAlign: 'center' }}>
        {lane.t0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Salida {fHora(lane.t0)}{lane.lTs && <> · Llegada {fHora(lane.lTs)}</>}</Typography>}
        {st === 'det' && lane.detStart && (
          <Typography variant="caption" sx={{ color: COLORS.detenido, fontFamily: FONT_MONO }}>Detenido {fmt(now - lane.detStart)}</Typography>
        )}
        {st === 'fin' && (
          <Typography variant="caption" sx={{ display: 'block', color: lane.guardado === 'si' ? COLORS.green : lane.guardado === 'error' ? COLORS.red : COLORS.detenido }}>
            {lane.guardado === 'si' ? 'Guardado en Resultados' : lane.guardado === 'error' ? 'No se guardó' : 'Guardando…'}
            {penMs ? ` · disc. ${fmtSeg(penMs)}` : ''}
            {detMs ? ` · det. −${fmt(detMs)}` : ''}
          </Typography>
        )}
      </Box>

      <Button fullWidth size="large" variant={btn.v} color={btn.color} onClick={onAccion} sx={BOTON_PISTA}>
        {btn.t}
      </Button>

      {activo && (
        <Button fullWidth size="large" variant={st === 'det' ? 'contained' : 'outlined'} color="warning" onClick={onDet} sx={BOTON_PISTA}>
          {st === 'det' ? 'ARRANCÓ' : 'MARCAR DETENIDO'}
        </Button>
      )}

      <Stack direction="row" spacing={0.5}>
        {st === 'rdy' && onQuitar && <Button size="small" color="inherit" onClick={onQuitar}>Quitar de pista</Button>}
        {activo && <Button size="small" color="inherit" onClick={onCancelarSalida}>Salida en falso</Button>}
      </Stack>

      {lane.ints.length > 0 && (
        <Box sx={{ width: '100%', maxHeight: 54, overflowY: 'auto', fontSize: 10, color: COLORS.dim }}>
          {lane.ints.map((d) => (
            <Stack key={d.num} direction="row" justifyContent="space-between" sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span>Det. #{d.num}</span>
              <span style={{ color: COLORS.detenido }}>−{fmt(d.dur)}</span>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}
