'use client';
import { useEffect, useState } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';
import type { Clasificacion, EquipoDTO, EventoDTO, PuntoDTO } from './types';
import type { Rol } from './sesion';

export async function api<T = unknown>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  // Sesión vencida: volver a la pantalla de inicio de sesión
  if (res.status === 401 && !url.startsWith('/api/auth/') && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  return data as T;
}

export const fetcher = <T,>(url: string) => api<T>(url);

/** Rol de la sesión actual (null mientras carga o sin sesión). */
export function useSesion(activa = true) {
  const { data, isLoading } = useSWR<{ rol: Rol | null }>(activa ? '/api/auth/sesion' : null, fetcher);
  const rol = data?.rol ?? null;
  return { rol, esAdmin: rol === 'ADMIN', isLoading };
}

const CLAVE_ULTIMO_EVENTO = 'tolota.ultimoEvento';

/**
 * Último evento abierto en este navegador. Guarda `actual` cuando hay uno abierto; si no, devuelve el guardado.
 * Así las pestañas del sistema funcionan también desde la lista de eventos y Respaldo.
 */
export function useUltimoEvento(actual?: string) {
  const [guardado, setGuardado] = useState<string | null>(null);
  useEffect(() => {
    try {
      if (actual) localStorage.setItem(CLAVE_ULTIMO_EVENTO, actual);
      else setGuardado(localStorage.getItem(CLAVE_ULTIMO_EVENTO));
    } catch {
      // almacenamiento bloqueado (modo privado): se usa el evento más reciente
    }
  }, [actual]);
  return actual ?? guardado;
}

export async function cerrarSesion() {
  await api('/api/auth/logout', 'POST');
  window.location.href = '/login';
}

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

/**
 * Reduce la imagen en el navegador a un tamaño nítido para los marcos de logo (512 px por lado, el doble de lo que
 * ocupa en pantalla) y la guarda en WebP, que conserva la transparencia del archivo original. No se le quita el
 * fondo: borrar los píxeles blancos dejaba bordes dentados y huecos en las partes blancas del logo.
 */
export function resizeImage(file: File, max = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('No se pudo preparar el canvas');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const webp = c.toDataURL('image/webp', 0.9);
        resolve(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png'));
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error instanceof Error ? error : new Error('No se pudo procesar la imagen'));
      }
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
