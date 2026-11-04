import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export default function Vacio({ icono = '📭', children }: { icono?: string; children: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, px: 2, color: 'text.secondary' }}>
      <Box sx={{ fontSize: 36, mb: 1 }}>{icono}</Box>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}
