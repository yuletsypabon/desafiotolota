'use client';
import { Box, type BoxProps } from '@mui/material';
import EquipoAvatar from '@/components/EquipoAvatar';
import { COLORS, VIDRIO_SISTEMA, alfa } from '@/theme';

type Props = Omit<BoxProps, 'children'> & {
  logo?: string | null;
  /** Para la inicial cuando no hay logo */
  nombre: string;
  tamanoAvatar?: number;
  /** Con `component={Link}` el marco es un enlace */
  href?: string;
};

/**
 * Marco redondeado para el logo de un evento o equipo. El logo se ve completo (contain) y se adapta a cualquier
 * proporción; detrás, el mismo logo desenfocado rellena el marco. Sin logo, muestra la inicial.
 */
export default function MarcoLogo({ logo, nombre, tamanoAvatar = 104, sx, ...resto }: Props) {
  return (
    <Box
      {...resto}
      sx={{
        position: 'relative', display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: '20px',
        aspectRatio: '4 / 3', bgcolor: VIDRIO_SISTEMA.fondoSuave,
        backgroundImage: logo ? 'none' : `radial-gradient(circle at 30% 20%, ${alfa(COLORS.acento, .18)}, transparent 60%)`,
        ...sx,
      }}
    >
      {logo ? (
        <>
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', inset: -20, backgroundImage: `url(${logo})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(.55)' }}
          />
          <Box component="img" src={logo} alt="" sx={{ position: 'relative', maxWidth: '82%', maxHeight: '82%', objectFit: 'contain', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,.45))' }} />
        </>
      ) : (
        <EquipoAvatar nombre={nombre} size={tamanoAvatar} />
      )}
    </Box>
  );
}
