import { Paper, Typography } from '@mui/material';
import { COLORS } from '@/colors';

export default function Espiritual() {
  return (
    <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderWidth: 2 }}>
      <Typography sx={{ fontSize: 42, mb: 1 }}>✝️</Typography>
      <Typography variant="h4" sx={{ color: COLORS.purple }}>
        Componente Espiritual
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Próximamente.
      </Typography>
    </Paper>
  );
}
