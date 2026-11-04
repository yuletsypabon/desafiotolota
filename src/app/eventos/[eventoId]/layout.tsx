'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Box, Container, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useEvento } from '@/lib/client';
import EquipoAvatar from '@/components/EquipoAvatar';
import { COLORS } from '@/theme';

const TABS = [
  { seg: 'cronometro', label: '⏱ Cronometraje' },
  { seg: 'equipos', label: '🛡 Equipos' },
  { seg: 'disciplina', label: '⚖️ Disciplina' },
  { seg: 'resultados', label: '🏆 Resultados' },
  { seg: 'espiritual', label: '✝️ Espiritual' },
  { seg: '', label: '⚙️ Configuración' },
];

export default function EventoLayout({ children }: { children: ReactNode }) {
  const { eventoId } = useParams<{ eventoId: string }>();
  const path = usePathname();
  const { data: ev, error } = useEvento(eventoId);
  const base = `/eventos/${eventoId}`;
  const actual = path.replace(base, '').replace(/^\//, '').split('/')[0] || '';

  return (
    <Box>
      <Box sx={{ bgcolor: COLORS.surf, borderBottom: `1px solid ${COLORS.border}` }}>
        <Container maxWidth={false} sx={{ pt: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {ev ? <EquipoAvatar nombre={ev.nombre} logo={ev.logo} size={38} square /> : <Skeleton variant="rounded" width={38} height={38} />}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" noWrap sx={{ color: COLORS.gold, lineHeight: 1.1 }}>
                {ev ? ev.nombre : error ? 'Evento no encontrado' : '…'}
              </Typography>
              {ev && (
                <Typography variant="caption" color="text.secondary">
                  {ev.anio} · {ev._count?.equipos ?? 0} equipos · {ev.pruebas.length} pruebas
                </Typography>
              )}
            </Box>
          </Stack>
          <Tabs value={actual} variant="scrollable" scrollButtons="auto" sx={{ mt: 0.5 }}>
            {TABS.map((t) => (
              <Tab key={t.seg} value={t.seg} label={t.label} component={Link} href={t.seg ? `${base}/${t.seg}` : base} />
            ))}
          </Tabs>
        </Container>
      </Box>
      <Container maxWidth={false} sx={{ py: 2 }}>
        {children}
      </Container>
    </Box>
  );
}
