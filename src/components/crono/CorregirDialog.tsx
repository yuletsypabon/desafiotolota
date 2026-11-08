'use client';
import { useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography,
} from '@mui/material';
import EquipoAvatar from '@/components/EquipoAvatar';
import { fmt } from '@/lib/format';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '@/theme';

export interface OpcionCorregir {
  equipoId: string;
  nombre: string;
  logo?: string | null;
  /** "Pista 2 · En pista" o "Tiempo guardado" */
  donde: string;
  ms: number | null;
  /** Si no se puede elegir (p. ej. tiempo guardándose), el motivo */
  bloqueo?: string;
}

/**
 * Corregir pista: el operador elige dos equipos (en pista o con tiempo ya guardado) y se
 * intercambian. Cada tiempo se queda donde se cronometró; solo cambia el equipo al que pertenece.
 */
export default function CorregirDialog({
  opciones, onClose, onConfirm,
}: {
  opciones: OpcionCorregir[];
  onClose: () => void;
  onConfirm: (a: string, b: string) => Promise<void> | void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : [s[1], id]));

  const [a, b] = sel.map((id) => opciones.find((o) => o.equipoId === id)!);

  const confirmar = async () => {
    if (!a || !b) return;
    setEnviando(true);
    try {
      await onConfirm(a.equipoId, b.equipoId);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle sx={{ color: COLORS.gold }}>🔄 CORREGIR PISTA</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Si cronometraste al equipo equivocado, elige los dos equipos para intercambiarlos. Cada tiempo se queda
          donde se tomó; solo cambia a qué equipo pertenece. Los puntos de disciplina no se mueven.
        </Typography>

        {!opciones.length && <Alert severity="info">No hay equipos en pista ni tiempos guardados en esta prueba.</Alert>}

        <Stack spacing={0.75}>
          {opciones.map((o) => {
            const i = sel.indexOf(o.equipoId);
            const activo = i >= 0;
            return (
              <Box
                key={o.equipoId}
                role="button"
                aria-pressed={activo}
                aria-disabled={!!o.bloqueo}
                tabIndex={o.bloqueo ? -1 : 0}
                onClick={() => !o.bloqueo && toggle(o.equipoId)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !o.bloqueo && (e.preventDefault(), toggle(o.equipoId))}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2,
                  border: `1px solid ${activo ? COLORS.blue : COLORS.border}`,
                  bgcolor: activo ? 'rgba(79,142,247,.08)' : COLORS.surf,
                  cursor: o.bloqueo ? 'not-allowed' : 'pointer',
                  opacity: o.bloqueo ? 0.5 : 1,
                  '&:hover': o.bloqueo ? undefined : { borderColor: COLORS.gold },
                }}
              >
                <EquipoAvatar nombre={o.nombre} logo={o.logo} size={30} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{o.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{o.bloqueo ?? o.donde}</Typography>
                </Box>
                <Typography sx={{ fontFamily: FONT_MONO, color: COLORS.gold }}>{o.ms != null ? fmt(o.ms) : '—'}</Typography>
                <Typography sx={{ fontFamily: FONT_DISPLAY, color: COLORS.blue, width: 22, textAlign: 'center' }}>
                  {activo ? (i === 0 ? 'A' : 'B') : ''}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {a && b && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            <b>{a.nombre}</b> ({a.donde}{a.ms != null ? ` · ${fmt(a.ms)}` : ''}) ↔ <b>{b.nombre}</b> ({b.donde}
            {b.ms != null ? ` · ${fmt(b.ms)}` : ''}).<br />
            Quedará: <b>{b.nombre}</b> con el tiempo de {a.donde.toLowerCase()} y <b>{a.nombre}</b> con el de {b.donde.toLowerCase()}.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!a || !b || enviando} onClick={confirmar}>
          {enviando ? 'Intercambiando…' : '🔄 Intercambiar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
