'use client';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import { useToast } from '@/components/Toast';
import SincronizarNube from '@/components/SincronizarNube';
import Contrasenas from '@/components/Contrasenas';
import RespaldoDatos from '@/components/RespaldoDatos';
import { ESPACIADO_SISTEMA, FONT_MONO, cajaVidrio } from '@/theme';

// Script para extraer los datos guardados por la versión HTML anterior (localStorage)
const SNIPPET = `(()=>{const d={};for(const k of Object.keys(localStorage))if(k.startsWith('dt_'))d[k]=JSON.parse(localStorage.getItem(k));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));a.download='datos_version_anterior.json';a.click();})()`;

export default function Respaldo() {
  const toast = useToast();

  return (
    <Container maxWidth="md" sx={ESPACIADO_SISTEMA.pagina}>
      <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><BackupOutlinedIcon />Respaldo y migración</Typography>
      <Stack spacing={2}>
        <SincronizarNube />
        <Contrasenas />
        <RespaldoDatos />

        <Paper sx={ESPACIADO_SISTEMA.tarjeta}>
          <Typography variant="h5" sx={{ mb: 1 }}>Migrar desde la versión HTML anterior</Typography>
          <Box component="ol" sx={{ pl: 2.5, color: 'text.secondary', fontSize: 14, '& li': { mb: 1 } }}>
            <li>Abre el archivo <b>DESAFÍO Tolotá — Sistema de Cronometraje.html</b> en el mismo navegador y computador donde lo usabas.</li>
            <li>Presiona <b>F12</b> (o haz clic derecho y selecciona <b>Inspeccionar</b>), luego ve a la pestaña <b>Consola</b>.</li>
            <li>Pega el siguiente código y presiona Enter. Se descargará <code>datos_version_anterior.json</code>.</li>
            <li>Vuelve aquí y usa <b>Importar</b> con ese archivo. Se crea un evento por año con sus pruebas, equipos, fichas, tiempos y disciplina.</li>
          </Box>
          <Box sx={{ position: 'relative', mt: 1 }}>
            <Box component="pre" sx={{ ...cajaVidrio, m: 0, p: 1.5, pr: 6, fontFamily: FONT_MONO, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
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
