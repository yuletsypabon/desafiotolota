'use client';
import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Alert, Box, Button, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { api, fetcher } from '@/lib/client';
import { ROL_LABEL, type Rol } from '@/lib/sesion';
import { RUTAS } from '@/lib/rutas';
import { FONDO_FOTO, FUENTE_TITULOS, MARCA, OSCURO, VIDRIO } from '@/lib/marca';
import LogoTolota from '@/components/sitio/LogoTolota';

const LOGIN = {
  tinta: MARCA.texto,
  secundaria: MARCA.textoSuave,
  accion: MARCA.destacado,
  dorado: MARCA.destacado,
  fondo: MARCA.fondo,
  superficie: MARCA.vidrio,
  campo: OSCURO.tarjeta,
  borde: OSCURO.linea,
};

interface Estado {
  claves: Record<Rol, boolean>;
}

const ICONO: Record<Rol, typeof AdminPanelSettingsOutlinedIcon> = {
  ADMIN: AdminPanelSettingsOutlinedIcon,
  CRONO: TimerOutlinedIcon,
};

export default function Login() {
  return (
    <Suspense>
      <Pantalla />
    </Suspense>
  );
}

function Pantalla() {
  const { data: estado, error: errorEstado, mutate: reintentarEstado } = useSWR<Estado>('/api/auth/estado', fetcher);
  // Solo se aceptan rutas internas para volver después de entrar (evita redirigir a otro sitio)
  const next = useSearchParams().get('next');
  const destino = next?.startsWith('/') && !next.startsWith('//') ? next : RUTAS.cronometro;
  const entrar = () => window.location.assign(destino);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, color: LOGIN.tinta,
      background: `linear-gradient(90deg, rgba(5,5,5,.35), rgba(5,5,5,.8)), url(${FONDO_FOTO}) center / cover, ${LOGIN.fondo}` }}>
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          minHeight: '100vh',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          p: { md: 5, lg: 8 },
          color: LOGIN.tinta,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 760, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <LogoTolota tamano={68} prioridad animar />
          </Box>
          <Typography sx={{ mt: 3, width: '100%', mx: 'auto', textAlign: 'center', fontSize: 13, fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', color: LOGIN.dorado }}>
            Desafío Tolotá
          </Typography>
          <Typography component="h1" sx={{ mt: 1.5, width: '100%', fontFamily: FUENTE_TITULOS, fontSize: { md: 36, lg: 54, xl: 68 }, lineHeight: 0.98, textAlign: 'center', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
            Cada segundo cuenta.
          </Typography>
          <Typography sx={{ mt: 2, width: '100%', maxWidth: 560, mx: 'auto', textAlign: 'center', lineHeight: 1.7, color: LOGIN.secundaria }}>
            Ingresa al sistema de cronometraje y acompaña cada equipo hasta la meta.
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 }, minHeight: '100vh' }}>
        <Paper
          elevation={0}
          sx={{
            width: 440,
            maxWidth: '100%',
            p: { xs: 3, sm: 4 },
            bgcolor: LOGIN.superficie,
            color: LOGIN.tinta,
            textAlign: 'center',
            border: `1px solid ${MARCA.vidrioBorde}`,
            borderRadius: `${VIDRIO.radio}px`,
            backdropFilter: VIDRIO.desenfoque,
            boxShadow: VIDRIO.brillo,
          }}
        >
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <LogoTolota tamano={42} prioridad />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>DESAFÍO TOLOTÁ</Typography>
          </Box>
          <Typography component="h2" sx={{ fontFamily: FUENTE_TITULOS, fontSize: { xs: 32, sm: 38 }, lineHeight: 1.05, textTransform: 'uppercase', color: LOGIN.tinta }}>
            Bienvenido al cronometraje
          </Typography>
          <Typography sx={{ mt: 1, mb: 3.5, color: LOGIN.secundaria, fontSize: 14 }}>
            Inicia sesión para acceder al sistema del evento.
          </Typography>
          {errorEstado ? (
            <Alert
              severity="error"
              action={<Button color="inherit" size="small" onClick={() => reintentarEstado()}>Reintentar</Button>}
              sx={{ textAlign: 'left', bgcolor: LOGIN.campo }}
            >
              No se pudo cargar el inicio de sesión. Verifica que el servidor esté conectado a la base de datos e inténtalo de nuevo.
            </Alert>
          ) : !estado ? null : !estado.claves.ADMIN ? (
            <SinContrasenas />
          ) : (
            <IniciarSesion claves={estado.claves} onListo={entrar} />
          )}
          <Typography sx={{ mt: 3, textAlign: 'center', color: LOGIN.secundaria, fontSize: 12 }}>
            Acceso seguro · Sistema de cronometraje
          </Typography>
        </Paper>
      </Box>
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
    <Box component="form" onSubmit={enviar} sx={{ textAlign: 'center' }}>
      <Typography sx={{ mb: 1, color: LOGIN.tinta, fontSize: 13, fontWeight: 600 }}>Tipo de acceso</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 2.5 }}>
        {(['ADMIN', 'CRONO'] as Rol[]).map((r) => {
          const Icono = ICONO[r];
          return (
          <Button
            key={r}
            type="button"
            variant="outlined"
            onClick={() => setRol(r)}
            aria-pressed={rol === r}
            sx={{
              py: 1.5,
              borderRadius: 3,
              flexDirection: 'column',
              gap: 0.5,
              color: rol === r ? LOGIN.dorado : LOGIN.secundaria,
              borderColor: rol === r ? LOGIN.dorado : LOGIN.borde,
              bgcolor: rol === r ? `${LOGIN.dorado}12` : 'transparent',
              '&:hover': { borderColor: LOGIN.accion, bgcolor: `${LOGIN.accion}12` },
            }}
          >
            <Icono sx={{ fontSize: 22 }} aria-hidden="true" />
            {ROL_LABEL[r]}
          </Button>
          );
        })}
      </Box>
      {!claves[rol] ? (
        <Alert severity="info" sx={{ textAlign: 'center', color: LOGIN.tinta, bgcolor: LOGIN.campo, '& .MuiAlert-icon': { color: LOGIN.dorado } }}>
          El cronometrador aún no tiene contraseña. El administrador la crea en <b>Respaldo, sección Contraseñas</b>.
        </Alert>
      ) : (
        <>
          <Typography sx={{ mb: 1, color: LOGIN.tinta, fontSize: 13, fontWeight: 600 }}>Contraseña</Typography>
          <TextField
            type="password"
            autoFocus
            fullWidth
            placeholder="Ingresa tu contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            inputProps={{ 'aria-label': 'Contraseña' }}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    m: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <LockOutlined sx={{ color: LOGIN.secundaria, fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiFilledInput-root': {
                position: 'relative',
                minHeight: 52,
                bgcolor: LOGIN.campo,
                borderRadius: 3,
                '&:hover': { bgcolor: LOGIN.campo },
                '&.Mui-focused': { bgcolor: LOGIN.campo },
              },
              '& .MuiFilledInput-root:before, & .MuiFilledInput-root:after': { display: 'none' },
              '& .MuiInputBase-input': {
                boxSizing: 'border-box',
                width: '100%',
                color: LOGIN.tinta,
                textAlign: 'center',
                padding: '16px 48px',
                caretColor: LOGIN.dorado,
              },
              '& .MuiInputBase-input::placeholder': { color: LOGIN.secundaria, opacity: 1 },
              '& .MuiFilledInput-root.Mui-focused': { outline: `1px solid ${LOGIN.dorado}` },
            }}
            variant="filled"
          />
          <Typography role="alert" sx={{ color: LOGIN.dorado, fontSize: 12, minHeight: 22, mt: 0.75 }}>{error}</Typography>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={!clave || enviando}
            sx={{
              mt: 0.5,
              py: 1.3,
              borderRadius: 999,
              fontWeight: 700,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: LOGIN.fondo,
              bgcolor: LOGIN.accion,
              '&:hover': { bgcolor: MARCA.primarioHover },
              '&.Mui-disabled': { color: LOGIN.secundaria, bgcolor: LOGIN.borde },
            }}
          >
            {enviando ? 'Verificando…' : 'Ingresar'}
          </Button>
          <Typography
            component={Link}
            href={RUTAS.inicio}
            sx={{
              display: 'block',
              mt: 2,
              color: LOGIN.dorado,
              fontSize: 13,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Ir a la página principal
          </Typography>
        </>
      )}
    </Box>
  );
}

/** Aún no hay contraseñas: se crean en la terminal del servidor (no desde el navegador, por seguridad). */
function SinContrasenas() {
  return (
    <Alert severity="info" sx={{ textAlign: 'center', color: LOGIN.tinta, bgcolor: LOGIN.campo, '& .MuiAlert-icon': { color: LOGIN.dorado } }}>
      <b>Configuración inicial:</b> aún no hay contraseñas. En el computador del servidor, cierra y vuelve a abrir{' '}
      <b>Iniciar evento.bat</b> (las pedirá al arrancar) o ejecuta <code>npm run claves</code> en la carpeta del proyecto.
      Luego recarga esta página.
    </Alert>
  );
}
