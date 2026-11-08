'use client';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { api, fetcher } from '@/lib/client';
import { ROL_LABEL, type Rol } from '@/lib/sesion';
import { COLORS, FONT_DISPLAY } from '@/theme';

interface Estado {
  claves: Record<Rol, boolean>;
}

const ICONO: Record<Rol, string> = { ADMIN: '🛡', CRONO: '⏱' };

export default function Login() {
  return (
    <Suspense>
      <Pantalla />
    </Suspense>
  );
}

function Pantalla() {
  const { data: estado } = useSWR<Estado>('/api/auth/estado', fetcher);
  // Solo se aceptan rutas internas para volver después de entrar (evita redirigir a otro sitio)
  const next = useSearchParams().get('next');
  const destino = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  const entrar = () => window.location.assign(destino);

  return (
    <Box sx={{ minHeight: 'calc(100vh - 54px)', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: 380, maxWidth: '100%', textAlign: 'center' }}>
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 30, letterSpacing: '0.2em', color: COLORS.gold }}>
          DESAFÍO <Box component="span" sx={{ color: COLORS.text }}>TOLOTÁ</Box>
        </Typography>
        {!estado ? null : !estado.claves.ADMIN ? (
          <SinContrasenas />
        ) : (
          <IniciarSesion claves={estado.claves} onListo={entrar} />
        )}
      </Paper>
    </Box>
  );
}

function IniciarSesion({ claves, onListo }: { claves: Record<Rol, boolean>; onListo: () => void }) {
  const [rol, setRol] = useState<Rol>('CRONO');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await api('/api/auth/login', 'POST', { rol, clave });
      onListo();
    } catch (err) {
      setError((err as Error).message);
      setClave('');
      setEnviando(false);
    }
  };

  return (
    <Box component="form" onSubmit={enviar}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sistema de cronometraje · Selecciona tu rol</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 2 }}>
        {(['ADMIN', 'CRONO'] as Rol[]).map((r) => (
          <Button
            key={r}
            type="button"
            variant="outlined"
            color={rol === r ? 'primary' : 'inherit'}
            onClick={() => setRol(r)}
            aria-pressed={rol === r}
            sx={{ py: 1.75, flexDirection: 'column', borderWidth: 2, '&, &:hover': { borderWidth: 2 }, bgcolor: rol === r ? 'rgba(232,184,75,.12)' : undefined }}
          >
            <Box sx={{ fontSize: 24, lineHeight: 1.2 }}>{ICONO[r]}</Box>
            {ROL_LABEL[r]}
          </Button>
        ))}
      </Box>
      {!claves[rol] ? (
        <Alert severity="info" sx={{ textAlign: 'left' }}>
          El cronometrador aún no tiene contraseña. El administrador la crea en <b>Respaldo → Contraseñas</b>.
        </Alert>
      ) : (
        <>
          <TextField
            type="password"
            autoFocus
            fullWidth
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            inputProps={{ style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: 20 } }}
          />
          <Typography sx={{ color: COLORS.red, fontSize: 12, minHeight: 20, mt: 0.75 }}>{error}</Typography>
          <Button type="submit" fullWidth variant="contained" size="large" disabled={!clave || enviando}>
            {enviando ? 'Verificando…' : 'INGRESAR'}
          </Button>
        </>
      )}
    </Box>
  );
}

/** Aún no hay contraseñas: se crean en la terminal del servidor (no desde el navegador, por seguridad). */
function SinContrasenas() {
  return (
    <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
      <b>Configuración inicial:</b> aún no hay contraseñas. En el computador del servidor, cierra y vuelve a abrir{' '}
      <b>Iniciar evento.bat</b> (las pedirá al arrancar) o ejecuta <code>npm run claves</code> en la carpeta del proyecto.
      Luego recarga esta página.
    </Alert>
  );
}
