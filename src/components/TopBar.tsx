'use client';
import Link from 'next/link';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import HomeIcon from '@mui/icons-material/Home';
import { COLORS, FONT_DISPLAY } from '@/theme';

export default function TopBar() {
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
        <Button component={Link} href="/" size="small" color="inherit" startIcon={<HomeIcon />}>
          Eventos
        </Button>
        <Button component={Link} href="/respaldo" size="small" color="inherit" startIcon={<BackupIcon />}>
          Respaldo
        </Button>
      </Toolbar>
    </AppBar>
  );
}
