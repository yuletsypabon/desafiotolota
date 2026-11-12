'use client';
import { useState } from 'react';
import { Box } from '@mui/material';
import FilaEquipo from './FilaEquipo';
import type { EquipoPublico } from '@/lib/landing/tiposEdicion';

/** Equipos de la edición, del 1 al último. Al tocar uno se despliega su alineación (uno a la vez). */
export default function EquiposEdicion({ equipos }: { equipos: EquipoPublico[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  return (
    <Box component="ol" sx={{ m: 0, p: 0, display: 'grid', gap: { xs: 2, md: 3 } }}>
      {equipos.map((e) => (
        <FilaEquipo key={e.id} equipo={e} abierto={abierto === e.id} onAlternar={() => setAbierto((a) => (a === e.id ? null : e.id))} />
      ))}
    </Box>
  );
}
