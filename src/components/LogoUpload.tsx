'use client';
import { useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { resizeImage } from '@/lib/client';
import { useToast } from './Toast';
import EquipoAvatar from './EquipoAvatar';
import { COLORS } from '@/theme';

export default function LogoUpload({
  value,
  onChange,
  label = 'Logo',
  nombre,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  nombre?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ border: `2px dashed ${COLORS.border}`, borderRadius: 2, p: 1, cursor: 'pointer', '&:hover': { borderColor: COLORS.gold } }}
        onClick={() => ref.current?.click()}
      >
        <EquipoAvatar nombre={nombre || '📷'} logo={value} size={44} square />
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {value ? 'Cambiar imagen' : 'Subir imagen'}
        </Typography>
        {value && (
          <Button
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            Quitar
          </Button>
        )}
      </Stack>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onChange(await resizeImage(f));
          } catch (err) {
            toast((err as Error).message, 'error');
          }
        }}
      />
    </Box>
  );
}
