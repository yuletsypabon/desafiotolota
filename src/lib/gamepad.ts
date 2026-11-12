// Botón arcade / encoder USB ("Zero Delay"): Windows lo ve como un mando (gamepad), no como teclado.
import { useEffect, useRef } from 'react';

export type AccionBoton = { tipo: 'accion' | 'detenido'; pista: number } | null;

/**
 * Qué hace cada botón del encoder (igual que la versión HTML). Pistas desde 0.
 * - Botón 1 (índice 0): la pista seleccionada (clic en la pista); si no hay, la pista 1.
 * - Botones 2–4 (índices 1–3): salida/llegada en las pistas 2–4.
 * - Botones 5–7 (índices 4–6): marcar detenido en las pistas 1–3.
 */
export function accionDeBoton(boton: number, numPistas: number, seleccionada: number | null): AccionBoton {
  if (boton === 0) return { tipo: 'accion', pista: seleccionada ?? 0 };
  if (boton < Math.min(numPistas, 4)) return { tipo: 'accion', pista: boton };
  const det = boton - 4;
  if (det >= 0 && det < Math.min(numPistas, 3)) return { tipo: 'detenido', pista: det };
  return null;
}

/**
 * Llama `alPulsar(índice)` cada vez que se presiona un botón de cualquier mando conectado.
 * Solo cuenta el momento de presionar: mantenerlo apretado no repite la acción.
 * Nota: el navegador solo muestra el mando después de la primera pulsación con la página abierta.
 */
export function useBotonesGamepad(alPulsar: (boton: number) => void, avisar: (mensaje: string) => void) {
  const pulsar = useRef(alPulsar);
  const aviso = useRef(avisar);
  pulsar.current = alPulsar;
  aviso.current = avisar;

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const previo = new Map<number, boolean[]>();

    const revisar = () => {
      for (const gp of navigator.getGamepads()) {
        if (!gp) continue;
        const antes = previo.get(gp.index) ?? [];
        gp.buttons.forEach((b, i) => {
          if (b.pressed && !antes[i]) pulsar.current(i);
        });
        previo.set(gp.index, gp.buttons.map((b) => b.pressed));
      }
    };
    const conectado = (e: GamepadEvent) => aviso.current(`Botón arcade conectado (${e.gamepad.id.split('(')[0].trim()})`);
    const desconectado = (e: GamepadEvent) => {
      previo.delete(e.gamepad.index);
      aviso.current('Botón arcade desconectado');
    };

    window.addEventListener('gamepadconnected', conectado);
    window.addEventListener('gamepaddisconnected', desconectado);
    // Cada 10 ms con un temporizador, no por cuadro de pantalla: si la ventana queda detrás de otra, el
    // navegador baja los cuadros a 1–2 por segundo y una pulsación rápida se perdería. Además da ±10 ms de precisión.
    const intervalo = setInterval(revisar, 10);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('gamepadconnected', conectado);
      window.removeEventListener('gamepaddisconnected', desconectado);
    };
  }, []);
}
