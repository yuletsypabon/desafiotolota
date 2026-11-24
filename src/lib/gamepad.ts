// Botón arcade / encoder USB ("Zero Delay"): Windows lo ve como un mando (gamepad), no como teclado.
import { useEffect, useRef } from 'react';
import { useState } from 'react';

export type AccionBoton = { tipo: 'accion'; pista: number } | null;

export interface EstadoGamepad {
  soportado: boolean;
  conectado: boolean;
  probado: boolean;
  nombre: string | null;
}

/**
 * Estado pasivo del mando para la pantalla de preparación. Detecta una pulsación, pero nunca
 * ejecuta una acción del cronómetro; así se puede verificar el arcade sin alterar una pista.
 */
export function useEstadoGamepad(): EstadoGamepad {
  const [estado, setEstado] = useState<EstadoGamepad>({ soportado: false, conectado: false, probado: false, nombre: null });
  const previo = useRef(new Map<number, boolean[]>());

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const actualizar = () => {
      const mandos = Array.from(navigator.getGamepads()).filter((mando): mando is Gamepad => Boolean(mando));
      const mando = mandos[0] ?? null;
      let pulso = false;
      for (const actual of mandos) {
        const antes = previo.current.get(actual.index) ?? [];
        if (actual.buttons.some((boton, indice) => boton.pressed && !antes[indice])) pulso = true;
        previo.current.set(actual.index, actual.buttons.map((boton) => boton.pressed));
      }
      const nombre = mando ? mando.id.split('(')[0].trim() : null;
      setEstado((anterior) => {
        // El sondeo es rápido para no perder una pulsación, pero no debe volver a renderizar 40 veces
        // por segundo cuando no cambió nada. Si se cambia o desconecta el mando, se pide probarlo de nuevo.
        const probado = mando && anterior.nombre === nombre ? anterior.probado || pulso : pulso;
        if (anterior.soportado && anterior.conectado === Boolean(mando) && anterior.probado === probado && anterior.nombre === nombre) return anterior;
        return { soportado: true, conectado: Boolean(mando), probado, nombre };
      });
    };
    actualizar();
    const intervalo = window.setInterval(actualizar, 25);
    window.addEventListener('gamepadconnected', actualizar);
    window.addEventListener('gamepaddisconnected', actualizar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener('gamepadconnected', actualizar);
      window.removeEventListener('gamepaddisconnected', actualizar);
    };
  }, []);

  return estado;
}

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
