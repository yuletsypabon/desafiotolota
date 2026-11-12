'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { api, fetcher, store } from '@/lib/client';
import { useToast } from '@/components/Toast';
import { useAppDialog } from '@/components/AppDialog';

interface Estado {
  configurado: boolean;
  destino: string | null;
}
interface Resultado {
  eventos: number;
  equipos: number;
  participantes: number;
  resultados: number;
  puntos: number;
  segundos: number;
  sincronizadoEn: string;
}

const KEY = 'nube:ultima';

/** Tarjeta "Sincronizar con la nube": copia la base local del portátil a Supabase. */
export default function SincronizarNube() {
  const { data: estado } = useSWR<Estado>('/api/sincronizar', fetcher);
  const toast = useToast();
  const dialog = useAppDialog();
  const [busy, setBusy] = useState(false);
  const [ultima, setUltima] = useState<Resultado | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setUltima(store.get<Resultado | null>(KEY, null));
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
    return () => {
      window.removeEventListener('online', upd);
      window.removeEventListener('offline', upd);
    };
  }, []);

  const sincronizar = async () => {
    if (!await dialog({
      title: 'Subir respaldo a Supabase',
      message: '¿Subir los datos de PostgreSQL local a Supabase? Los eventos con el mismo ID se reemplazarán en la nube.',
      tone: 'warning',
      confirmLabel: 'Subir respaldo',
    })) return;
    setBusy(true);
    try {
      const r = await api<Resultado>('/api/sincronizar', 'POST');
      setUltima(r);
      store.set(KEY, r);
      toast(`Sincronizado: ${r.eventos} evento(s), ${r.resultados} tiempo(s)`);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><CloudUploadIcon />Subir respaldo a Supabase</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Sube todos los datos de PostgreSQL local a Supabase. Los eventos con el mismo ID se reemplazan completos;
        los eventos que solo están en la nube se conservan. Se requiere conexión a internet.
      </Typography>

      {estado && !estado.configurado ? (
        <Alert severity="info">
          Este servidor no tiene nube configurada. Para el portátil del evento, agrega <code>NUBE_DATABASE_URL</code> en
          el archivo <code>.env</code> (ver README, sección «Día del evento sin internet»).
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button variant="contained" startIcon={<CloudUploadIcon />} disabled={busy || !estado} onClick={sincronizar}>
              {busy ? 'Subiendo respaldo…' : 'Subir respaldo'}
            </Button>
            {estado?.destino && <Typography variant="caption" color="text.secondary">Destino: {estado.destino}</Typography>}
          </Stack>
          {!online && <Alert severity="warning">Este dispositivo no detecta internet. La sincronización fallará hasta que vuelva la conexión.</Alert>}
          {ultima && (
            <Alert severity="success">
              <CloudDoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Última sincronización: <b>{new Date(ultima.sincronizadoEn).toLocaleString()}</b> · {ultima.eventos} evento(s),{' '}
              {ultima.equipos} equipos, {ultima.participantes} fichas, {ultima.resultados} tiempos, {ultima.puntos} puntos de
              disciplina · {ultima.segundos} s
            </Alert>
          )}
        </Stack>
      )}
    </Paper>
  );
}
