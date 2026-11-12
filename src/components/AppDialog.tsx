'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { VIDRIO } from '@/lib/marca';
import { COLORS, alfa } from '@/theme';

type DialogTone = 'danger' | 'warning' | 'info' | 'success';

interface DialogOptions {
  title: string;
  message: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string | null;
  requiredText?: string;
  inputLabel?: string;
}

interface DialogRequest extends DialogOptions {
  resolve: (confirmed: boolean) => void;
}

type DialogFn = (options: DialogOptions) => Promise<boolean>;

const DialogContext = createContext<DialogFn | null>(null);

/** Color e ícono de cada tono: el confirmar es rojo solo en acciones destructivas; si no, el amarillo de la marca. */
const TONE_CONFIG = {
  danger: { color: COLORS.red, Icon: DeleteOutlineIcon, boton: 'error' },
  warning: { color: COLORS.detenido, Icon: WarningAmberIcon, boton: 'primary' },
  info: { color: COLORS.blue, Icon: InfoOutlinedIcon, boton: 'primary' },
  success: { color: COLORS.green, Icon: CheckCircleOutlineIcon, boton: 'primary' },
} as const;

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [input, setInput] = useState('');

  const ask = useCallback<DialogFn>((options) => new Promise((resolve) => {
    setInput('');
    setRequest({ ...options, resolve });
  }), []);

  const close = useCallback((confirmed: boolean) => {
    if (!request) return;
    request.resolve(confirmed);
    setRequest(null);
  }, [request]);

  useEffect(() => {
    if (!request) setInput('');
  }, [request]);

  const tone = request ? TONE_CONFIG[request.tone ?? 'warning'] : TONE_CONFIG.warning;
  const Icon = tone.Icon;
  const matchesRequiredText = !request?.requiredText || input === request.requiredText;

  return (
    <DialogContext.Provider value={ask}>
      {children}
      <Dialog
        open={!!request}
        onClose={() => close(false)}
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              width: 'calc(100% - 32px)', maxWidth: 400, m: 2, p: { xs: 3, sm: 3.5 }, textAlign: 'center',
              borderRadius: `${VIDRIO.radio}px`, bgcolor: 'rgba(22,22,27,.92)', boxShadow: '0 30px 80px rgba(0,0,0,.6)',
            },
          },
        }}
      >
        {request && (
          <>
            <Box
              aria-hidden="true"
              sx={{
                width: 60, height: 60, mx: 'auto', mb: 2, display: 'grid', placeItems: 'center', borderRadius: '50%',
                color: tone.color, bgcolor: alfa(tone.color, .14), border: `1px solid ${alfa(tone.color, .35)}`,
                '& svg': { fontSize: 30 },
              }}
            >
              <Icon />
            </Box>
            <DialogTitle id="app-dialog-title" variant="h5" sx={{ p: 0, mb: 1 }}>{request.title}</DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Typography id="app-dialog-message" variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                {request.message}
              </Typography>
              {request.requiredText && (
                <TextField
                  autoFocus
                  label={request.inputLabel ?? 'Escribe para confirmar'}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  sx={{ mt: 2.5 }}
                />
              )}
            </DialogContent>
            <DialogActions
              sx={{
                p: 0, mt: 3, display: 'grid', gap: 1.25,
                gridTemplateColumns: request.cancelLabel === null ? '1fr' : '1fr 1fr',
                '& > :not(style) ~ :not(style)': { ml: 0 },
              }}
            >
              {request.cancelLabel !== null && (
                <Button
                  size="large"
                  onClick={() => close(false)}
                  sx={{ color: 'text.primary', bgcolor: 'rgba(255,255,255,.08)', '&:hover': { bgcolor: 'rgba(255,255,255,.14)' } }}
                >
                  {request.cancelLabel ?? 'Cancelar'}
                </Button>
              )}
              <Button
                size="large"
                variant="contained"
                color={tone.boton}
                disabled={!matchesRequiredText}
                onClick={() => close(true)}
                autoFocus={!request.requiredText}
              >
                {request.confirmLabel ?? 'Confirmar'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error('useAppDialog debe usarse dentro de AppDialogProvider');
  return dialog;
}
