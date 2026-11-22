'use client';
import { useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { resizeImage } from '@/lib/client';
import { useToast } from './Toast';
import { COLORS, VIDRIO_SISTEMA } from '@/theme';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

export default function LogoUpload({
  value,
  onChange,
  label = 'Logo',
  nombre,
  tipo = 'logo',
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  nombre?: string;
  /** Las fotos llenan el retrato; los logos se conservan completos. */
  tipo?: 'logo' | 'foto';
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
        sx={{ border: `2px dashed ${COLORS.border}`, borderRadius: VIDRIO_SISTEMA.radioChico, p: 1, cursor: 'pointer', '&:hover': { borderColor: COLORS.acento } }}
        onClick={() => ref.current?.click()}
      >
        {value ? (
          <Box
            component="img"
            src={value}
            alt={nombre || 'Imagen'}
            sx={{
              width: 56,
              height: tipo === 'foto' ? 72 : 56,
              p: tipo === 'foto' ? 0 : 0.5,
              flexShrink: 0,
              objectFit: tipo === 'foto' ? 'cover' : 'contain',
              borderRadius: 1,
              backgroundColor: tipo === 'foto' ? 'transparent' : '#fff',
              backgroundImage: tipo === 'foto' ? 'none' : `linear-gradient(45deg, rgba(15,23,42,0.08) 25%, transparent 25%, transparent 75%, rgba(15,23,42,0.08) 75%), linear-gradient(45deg, rgba(15,23,42,0.08) 25%, transparent 25%, transparent 75%, rgba(15,23,42,0.08) 75%)`,
              backgroundSize: '12px 12px', backgroundPosition: '0 0, 6px 6px',
            }}
          />
        ) : (
          <Box sx={{ width: 56, height: tipo === 'foto' ? 72 : 56, display: 'grid', placeItems: 'center', borderRadius: 1, bgcolor: VIDRIO_SISTEMA.fondoSuave }}>
            <ImageOutlinedIcon color="disabled" />
          </Box>
        )}
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
            onChange(await resizeImage(f, tipo === 'foto' ? 800 : 512));
          } catch (err) {
            toast((err as Error).message, 'error');
          }
        }}
      />
    </Box>
  );
}
