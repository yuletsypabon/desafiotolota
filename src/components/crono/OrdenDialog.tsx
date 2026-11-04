'use client';
import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { aplicarPatron, PATRONES } from '@/lib/orden';
import EquipoAvatar from '@/components/EquipoAvatar';
import type { EquipoDTO } from '@/lib/types';
import { COLORS, FONT_DISPLAY } from '@/theme';

export default function OrdenDialog({
  titulo, inicial, onClose, onSave,
}: {
  titulo: string;
  inicial: EquipoDTO[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [lista, setLista] = useState(inicial);
  const [drag, setDrag] = useState<number | null>(null);

  const mover = (i: number, j: number) => {
    if (j < 0 || j >= lista.length || i === j) return;
    const l = lista.slice();
    const [x] = l.splice(i, 1);
    l.splice(j, 0, x);
    setLista(l);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md">
      <DialogTitle>🔀 Orden de salida — {titulo}</DialogTitle>
      <DialogContent>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          {PATRONES.map((p) => (
            <Button key={p.id} size="small" variant="outlined" color="inherit"
              onClick={() => setLista(aplicarPatron(lista.slice().sort((a, b) => a.numero - b.numero), p.id))}>
              {p.label}
            </Button>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary">Arrastra las tarjetas o usa las flechas.</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0.75, mt: 1 }}>
          {lista.map((e, i) => (
            <Stack
              key={e.id}
              direction="row"
              spacing={1}
              alignItems="center"
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (drag !== null) mover(drag, i);
                setDrag(null);
              }}
              sx={{ bgcolor: COLORS.surf, border: `1px solid ${drag === i ? COLORS.gold : COLORS.border}`, borderRadius: 2, px: 1, py: 0.5, cursor: 'grab' }}
            >
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.gold, width: 22 }}>{i + 1}</Typography>
              <EquipoAvatar nombre={e.nombre} logo={e.logo} size={26} />
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }} noWrap>{e.nombre}</Typography>
              <IconButton size="small" onClick={() => mover(i, i - 1)}><ArrowUpwardIcon sx={{ fontSize: 16 }} /></IconButton>
              <IconButton size="small" onClick={() => mover(i, i + 1)}><ArrowDownwardIcon sx={{ fontSize: 16 }} /></IconButton>
            </Stack>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSave(lista.map((e) => e.id))}>Guardar orden</Button>
      </DialogActions>
    </Dialog>
  );
}
