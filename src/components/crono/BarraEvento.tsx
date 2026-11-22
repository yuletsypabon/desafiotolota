'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Espacios de la franja del evento. La prueba activa se muestra centrada; las acciones operativas quedan a la derecha.
 */
interface DestinosBarraEvento {
  centro: HTMLElement | null;
  acciones: HTMLElement | null;
}

const BarraEventoContext = createContext<DestinosBarraEvento>({ centro: null, acciones: null });

export const BarraEventoProvider = BarraEventoContext.Provider;

/** Muestra el control principal de la sección en el centro de la franja del evento. */
export function EnBarraEvento({ children }: { children: ReactNode }) {
  const { centro } = useContext(BarraEventoContext);
  return centro ? createPortal(children, centro) : null;
}

/** Muestra acciones secundarias de la sección al extremo derecho de la franja del evento. */
export function EnAccionesBarraEvento({ children }: { children: ReactNode }) {
  const { acciones } = useContext(BarraEventoContext);
  return acciones ? createPortal(children, acciones) : null;
}
