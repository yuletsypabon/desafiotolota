'use client';
import { useState } from 'react';
import { Box } from '@mui/material';
import FilaEquipo from './FilaEquipo';
import type { EquipoPublico } from '@/lib/landing/tiposEdicion';

/** Equipos de la edición, del 1 al último. Al tocar uno se despliega su alineación (uno a la vez). */
export default function EquiposEdicion({ equipos }: { equipos: EquipoPublico[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  return (
    <Box component="ol" sx={{
      m: 0,
      p: 0,
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
      columnGap: { xs: 0, lg: 3 },
      rowGap: { xs: 2, md: 3 },
      alignItems: 'start',
    }}>
      {equipos.map((e) => (
        <FilaEquipo key={e.id} equipo={e} abierto={abierto === e.id} onAlternar={() => setAbierto((a) => (a === e.id ? null : e.id))} />
      ))}
    </Box>
  );
}
