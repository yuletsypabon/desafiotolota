'use client';
import { useRef, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { mutate } from 'swr';
import { api } from '@/lib/client';
import { useToast } from '@/components/Toast';
import { useAppDialog } from '@/components/AppDialog';

export default function RespaldoDatos() {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const dialog = useAppDialog();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Record<string, number | string> | null>(null);

  const importar = async (file: File) => {
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      toast('El archivo no es un JSON válido', 'error');
      return;
    }
    if (!await dialog({
      title: 'Importar respaldo',
      message: '¿Importar este archivo? Los eventos con el mismo ID se reemplazarán.',
      tone: 'warning',
      confirmLabel: 'Importar respaldo',
    })) return;
    setBusy(true);
    try {
      const resultado = await api<Record<string, number | string>>('/api/respaldo', 'POST', json);
      setRes(resultado);
      await mutate(() => true);
      toast('Importación completa');
    } catch (error) {
      toast((error as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Datos y respaldo</Typography>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Exportar todos los datos</Typography>
            <Typography variant="caption" color="text.secondary">
              Descarga un JSON con todos los eventos, pruebas, equipos, fichas, tiempos y disciplina.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<DownloadIcon />} href="/api/respaldo" sx={{ flexShrink: 0 }}>
            Exportar
          </Button>
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Importar datos</Typography>
            <Typography variant="caption" color="text.secondary">
              Restaura los datos desde un archivo de respaldo JSON.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={busy} onClick={() => ref.current?.click()} sx={{ flexShrink: 0 }}>
            {busy ? 'Importando…' : 'Importar'}
          </Button>
          <input
            ref={ref}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void importar(file);
            }}
          />
        </Stack>
        {res && (
          <Alert severity="success">
            {Object.entries(res).map(([key, value]) => <div key={key}><b>{key}</b>: {String(value)}</div>)}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
