'use client';
import { useRef, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { mutate } from 'swr';
import { api } from '@/lib/client';
import { useToast } from '@/components/Toast';
import { COLORS, FONT_MONO } from '@/theme';

// Script para extraer los datos guardados por la versión HTML anterior (localStorage)
const SNIPPET = `(()=>{const d={};for(const k of Object.keys(localStorage))if(k.startsWith('dt_'))d[k]=JSON.parse(localStorage.getItem(k));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));a.download='datos_version_anterior.json';a.click();})()`;

export default function Respaldo() {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Record<string, number | string> | null>(null);

  const importar = async (file: File) => {
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return toast('El archivo no es un JSON válido', 'error');
    }
    if (!confirm('¿Importar este archivo? Si es un respaldo de esta app, los eventos con el mismo ID se reemplazarán.')) return;
    setBusy(true);
    try {
      const r = await api<Record<string, number | string>>('/api/respaldo', 'POST', json);
      setRes(r);
      mutate(() => true);
      toast('✅ Importación completa');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>💾 Respaldo y migración</Typography>
      <Stack spacing={2}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Descargar respaldo completo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Un archivo JSON con todos los eventos, pruebas, equipos, fichas, tiempos y disciplina. Guárdalo antes y después de cada jornada.
          </Typography>
          <Button variant="contained" startIcon={<DownloadIcon />} href="/api/respaldo">Descargar respaldo (.json)</Button>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Importar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Acepta un respaldo de esta app, o el archivo exportado desde la versión HTML anterior (ver abajo).
          </Typography>
          <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? 'Importando…' : 'Elegir archivo .json'}
          </Button>
          <input ref={ref} type="file" accept=".json,application/json" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) importar(f);
          }} />
          {res && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {Object.entries(res).map(([k, v]) => <div key={k}><b>{k}</b>: {String(v)}</div>)}
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Migrar desde la versión HTML anterior</Typography>
          <Box component="ol" sx={{ pl: 2.5, color: 'text.secondary', fontSize: 14, '& li': { mb: 0.75 } }}>
            <li>Abre el archivo <b>DESAFÍO Tolotá — Sistema de Cronometraje.html</b> en el mismo navegador y computador donde lo usabas.</li>
            <li>Presiona <b>F12</b> (o clic derecho → Inspeccionar) y ve a la pestaña <b>Consola</b>.</li>
            <li>Pega el siguiente código y presiona Enter. Se descargará <code>datos_version_anterior.json</code>.</li>
            <li>Vuelve aquí y usa <b>Importar</b> con ese archivo. Se crea un evento por año con sus pruebas, equipos, fichas, tiempos y disciplina.</li>
          </Box>
          <Box sx={{ position: 'relative', mt: 1 }}>
            <Box component="pre" sx={{ m: 0, p: 1.5, pr: 6, bgcolor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 2, fontFamily: FONT_MONO, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {SNIPPET}
            </Box>
            <Button size="small" sx={{ position: 'absolute', top: 6, right: 6, minWidth: 0 }}
              onClick={() => navigator.clipboard.writeText(SNIPPET).then(() => toast('Copiado'))}>
              <ContentCopyIcon fontSize="small" />
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
}
