'use client';
import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import FilaEquipo from './FilaEquipo';
import type { EquipoPublico } from '@/lib/landing/tiposEdicion';

/** Equipos de la edición, del 1 al último. Al tocar uno se despliega su alineación (uno a la vez). */
export default function EquiposEdicion({ equipos }: { equipos: EquipoPublico[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const equiposVisibles = useMemo(() => {
    const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO');
    const termino = normalizar(busqueda.trim());
    if (!termino) return equipos;
    return equipos.filter((equipo) => normalizar(`${equipo.numero} ${equipo.nombre}`).includes(termino));
  }, [busqueda, equipos]);

  return (
    <>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(240px, 380px) auto' }, alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        component="input"
        type="search"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        placeholder="Buscar por equipo o número"
        aria-label="Buscar equipo por nombre o número"
        sx={{
          width: '100%', minWidth: 0, px: 2, py: 1.5, border: '1px solid rgba(244,243,236,.2)', borderRadius: '12px',
          background: 'rgba(255,255,255,.045)', color: 'var(--texto)', font: 'inherit', outline: 'none',
          '&:focus': { borderColor: 'var(--destacado)' }, '&::placeholder': { color: 'rgba(244,243,236,.62)' },
        }}
      />
      <Box component="p" aria-live="polite" sx={{ m: 0, color: 'rgba(244,243,236,.7)', fontSize: 13 }}>
        {equiposVisibles.length} de {equipos.length} equipos
      </Box>
    </Box>
    {equiposVisibles.length ? <Box component="ol" sx={{
      m: 0,
      p: 0,
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
      columnGap: { xs: 0, lg: 3 },
      rowGap: { xs: 2, md: 3 },
      alignItems: 'start',
    }}>
      {equiposVisibles.map((e) => (
        <FilaEquipo key={e.id} equipo={e} abierto={abierto === e.id} onAlternar={() => setAbierto((a) => (a === e.id ? null : e.id))} />
      ))}
    </Box> : <Box component="p" sx={{ m: 0, p: 2.5, border: '1px solid rgba(244,243,236,.16)', borderRadius: 2, color: 'rgba(244,243,236,.72)' }}>No hay equipos que coincidan con “{busqueda}”.</Box>}
    </>
  );
}
