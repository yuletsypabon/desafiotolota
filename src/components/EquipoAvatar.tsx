'use client';
import { Avatar } from '@mui/material';
import { inicial } from '@/lib/format';
import { COLORS, FONT_DISPLAY } from '@/theme';

export default function EquipoAvatar({
  nombre,
  logo,
  size = 32,
  square = false,
}: {
  nombre?: string | null;
  logo?: string | null;
  size?: number;
  square?: boolean;
}) {
  return (
    <Avatar
      src={logo || undefined}
      alt={nombre || ''}
      variant={square ? 'rounded' : 'circular'}
      sx={{
        width: size,
        height: size,
        bgcolor: COLORS.border,
        color: COLORS.dim,
        fontFamily: FONT_DISPLAY,
        fontSize: size * 0.45,
        flexShrink: 0,
      }}
    >
      {inicial(nombre)}
    </Avatar>
  );
}
