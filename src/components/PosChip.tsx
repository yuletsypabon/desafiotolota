import { Box } from '@mui/material';
import { COLORS } from '@/theme';

const C: Record<number, [string, string]> = {
  1: ['#f59e0b', '#000'],
  2: ['#94a3b8', '#000'],
  3: ['#92400e', '#fff'],
};

export default function PosChip({ pos, size = 24 }: { pos: number; size?: number }) {
  const [bg, fg] = C[pos] ?? [COLORS.border, COLORS.dim];
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.45,
        flexShrink: 0,
      }}
    >
      {pos}
    </Box>
  );
}
