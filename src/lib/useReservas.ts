'use client';
import { useEffect, useRef, useState } from 'react';
import { api, store } from './client';
import { INTERVALO_RESERVA_MS, equiposEnPistas } from './reservas';

/** Identificador de este dispositivo (se guarda en el navegador). */
function idDispositivo() {
  let id = store.get<string>('crono:dispositivo', '');
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `d-${Math.random().toString(36).slice(2)}${Date.now()}`;
    store.set('crono:dispositivo', id);
  }
  return id;
}

/**
 * Reserva de equipos entre dispositivos: informa al servidor qué equipos tiene este dispositivo en sus pistas (al
 * cambiar y cada 4 s) y devuelve los que tienen cargados los demás. Si otro dispositivo ya tenía alguno de los
 * nuestros, llama a `onConflicto`. Sin red, simplemente no reserva (el cronómetro sigue funcionando).
 */
export function useReservas(
  pruebaId: string,
  lanes: { equipoId: string | null; state: string }[] | null,
  onConflicto: (equipos: string[]) => void,
) {
  const [enOtro, setEnOtro] = useState<Set<string>>(new Set());
  const conflicto = useRef(onConflicto);
  conflicto.current = onConflicto;
  const clave = lanes ? JSON.stringify(equiposEnPistas(lanes)) : null;

  useEffect(() => {
    if (!pruebaId || clave === null) return;
    let vigente = true;
    const dispositivo = idDispositivo();
    const enviar = async () => {
      try {
        const r = await api<{ otros: { equipoId: string }[]; conflictos: string[] }>(
          `/api/pruebas/${pruebaId}/reservas`, 'PUT', { dispositivo, equipos: JSON.parse(clave) },
        );
        if (!vigente) return;
        setEnOtro(new Set(r.otros.map((o) => o.equipoId)));
        if (r.conflictos.length) conflicto.current(r.conflictos);
      } catch {
        // sin conexión con el servidor: se intenta de nuevo en el próximo ciclo
      }
    };
    void enviar();
    const iv = setInterval(enviar, INTERVALO_RESERVA_MS);
    return () => {
      vigente = false;
      clearInterval(iv);
    };
  }, [pruebaId, clave]);

  return enOtro;
}
