import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export default function Vacio({ icono = <InboxOutlinedIcon />, children }: { icono?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, px: 2, color: 'text.secondary' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, '& svg': { fontSize: 36 } }}>{icono}</Box>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}
