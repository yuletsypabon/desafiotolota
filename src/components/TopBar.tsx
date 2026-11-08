'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Button, Chip, Toolbar, Typography } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { cerrarSesion, useSesion } from '@/lib/client';
import { ROL_LABEL } from '@/lib/sesion';
import { COLORS, FONT_DISPLAY } from '@/theme';

export default function TopBar() {
  const enLogin = usePathname() === '/login';
  const { rol, esAdmin } = useSesion(!enLogin);

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar variant="dense" sx={{ gap: 1, minHeight: 54 }}>
        <Typography
          component={Link}
          href="/"
          sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, letterSpacing: '0.18em', color: COLORS.gold, textDecoration: 'none' }}
        >
          DESAFÍO <Box component="span" sx={{ color: COLORS.text }}>Tolotá</Box>
        </Typography>
        <Box sx={{ flex: 1 }} />
        {rol && (
          <>
            <Button component={Link} href="/" size="small" color="inherit" startIcon={<HomeIcon />}>
              Eventos
            </Button>
            {esAdmin && (
              <Button component={Link} href="/respaldo" size="small" color="inherit" startIcon={<BackupIcon />}>
                Respaldo
              </Button>
            )}
            <Chip size="small" label={`${esAdmin ? '🛡' : '⏱'} ${ROL_LABEL[rol]}`} sx={{ display: { xs: 'none', sm: 'flex' } }} />
            <Button size="small" color="inherit" startIcon={<LogoutIcon />} onClick={cerrarSesion}>
              Salir
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
