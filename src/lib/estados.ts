import type { EstadoPrueba, TipoPunto } from './types';

export const ESTADOS: Record<EstadoPrueba, { label: string; color: 'default' | 'success' | 'primary' }> = {
  PENDIENTE: { label: 'Pendiente', color: 'default' },
  EN_CURSO: { label: 'En curso', color: 'success' },
  FINALIZADA: { label: 'Finalizada', color: 'primary' },
};

export const TIPOS: Record<TipoPunto, { label: string; color: string; signo: 1 | -1 }> = {
  LEVE: { label: '⚠️ Leve', color: '#f97316', signo: 1 },
  MEDIA: { label: '🔶 Media', color: '#fb923c', signo: 1 },
  GRAVE: { label: '🔴 Grave', color: '#f04040', signo: 1 },
  POSITIVO: { label: '✅ Positivo', color: '#1fd66b', signo: -1 },
};
