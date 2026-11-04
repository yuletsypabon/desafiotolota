'use client';
import useSWR, { type SWRConfiguration } from 'swr';
import type { Clasificacion, EquipoDTO, EventoDTO, PuntoDTO } from './types';

export async function api<T = unknown>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  return data as T;
}

export const fetcher = <T,>(url: string) => api<T>(url);

export function useEventos() {
  return useSWR<EventoDTO[]>('/api/eventos', fetcher);
}
export function useEvento(id?: string) {
  return useSWR<EventoDTO>(id ? `/api/eventos/${id}` : null, fetcher);
}
export function useEquipos(eventoId?: string, cfg?: SWRConfiguration) {
  return useSWR<EquipoDTO[]>(eventoId ? `/api/eventos/${eventoId}/equipos` : null, fetcher, cfg);
}
export function usePuntos(eventoId?: string) {
  return useSWR<PuntoDTO[]>(eventoId ? `/api/eventos/${eventoId}/disciplina` : null, fetcher);
}
/** Se refresca cada `ms` para ver en vivo los tiempos registrados desde otros dispositivos. */
export function useClasificacion(eventoId?: string, ms = 5000) {
  return useSWR<Clasificacion>(eventoId ? `/api/eventos/${eventoId}/clasificacion` : null, fetcher, {
    refreshInterval: ms,
  });
}

/** Redimensiona una imagen en el navegador y devuelve un data URL liviano. */
export function resizeImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const webp = c.toDataURL('image/webp', 0.85);
      resolve(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}

export function descargarTexto(nombre: string, contenido: string, tipo = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** localStorage seguro (puede fallar en modo privado) */
export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : d;
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* sin almacenamiento */
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* */
    }
  },
};
