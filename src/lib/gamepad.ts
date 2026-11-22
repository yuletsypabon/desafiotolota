// Botón arcade / encoder USB ("Zero Delay"): Windows lo ve como un mando (gamepad), no como teclado.
import { useEffect, useRef } from 'react';

export type AccionBoton = { tipo: 'accion'; pista: number } | null;

/**
 * El pulsador rojo (botón 1 / índice 0) solo acciona la pista seleccionada.
 * No hay una pista predeterminada deliberadamente: una pulsación sin selección no puede
 * iniciar, detener ni finalizar un tiempo por error. Los demás controles son manuales
 * dentro de la tarjeta de cada pista.
 */
export function accionDeBoton(boton: number, seleccionada: number | null): AccionBoton {
  if (boton !== 0 || seleccionada === null) return null;
  return { tipo: 'accion', pista: seleccionada };
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
