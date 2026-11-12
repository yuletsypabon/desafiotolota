'use client';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material';
import { fFecha, fHora, fmt, fmtMsPreciso, fmtSeg } from '@/lib/format';
import type { FilaPrueba } from '@/lib/types';
import { COLORS, FONT_MONO } from '@/theme';

function Fila({ l, v, color, bold }: { l: string; v: string; color?: string; bold?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75, color }}>
      <Typography variant="body2" sx={{ color: color ?? 'text.secondary', fontWeight: bold ? 700 : 400 }}>{l}</Typography>
      <Typography variant="body2" sx={{ fontFamily: FONT_MONO, fontWeight: bold ? 700 : 500 }}>{v}</Typography>
    </Stack>
  );
}

export default function DetalleDialog({ fila, onClose }: { fila: FilaPrueba; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} maxWidth="xs">
      <DialogTitle>{fila.nombre.toUpperCase()}</DialogTitle>
      <DialogContent>
        <Fila l="Salida" v={`${fHora(fila.salidaAt)} — ${fFecha(fila.salidaAt)}`} />
        <Fila l="Llegada" v={`${fHora(fila.llegadaAt)} — ${fFecha(fila.llegadaAt)}`} />
        {fila.pista && <Fila l="Pista" v={String(fila.pista)} />}
        <Divider />
        <Fila l="Tiempo bruto" v={fmt(fila.brutoMs)} />
        {fila.detenciones.map((d) => (
          <Fila key={d.num} l={`   Detención #${d.num}`} v={`− ${fmt(d.dur)}`} color={COLORS.orange} />
        ))}
        {fila.detencionesMs > 0 && <Fila l="Total detenciones" v={`− ${fmt(fila.detencionesMs)}`} color={COLORS.orange} bold />}
        {fila.penMs !== 0 && (
          <>
            <Divider />
            <Fila l="Disciplina" v={fmtSeg(fila.penMs)} color={fila.penMs > 0 ? COLORS.red : COLORS.green} bold />
          </>
        )}
        {fila.puntosEspirituales > 0 && (
          <>
            <Divider />
            <Fila l={`Puntos espirituales (${fila.puntosEspirituales})`} v={`− ${fmtMsPreciso(fila.descuentoEspiritualMs)}`} color={COLORS.purple} bold />
          </>
        )}
        <Divider sx={{ borderColor: COLORS.gold, my: 0.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ color: COLORS.gold, fontWeight: 700 }}>TIEMPO FINAL</Typography>
          <Typography sx={{ fontFamily: FONT_MONO, fontSize: 22, color: COLORS.gold }}>{fmt(fila.finalMs)}</Typography>
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Posición en la prueba: {fila.pos}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
