'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Espacio en la franja del evento (junto al selector de evento) donde cada sección puede poner sus controles.
 * El marco del evento ofrece el elemento; la sección lo llena con <EnBarraEvento>.
 */
const BarraEventoContext = createContext<HTMLElement | null>(null);

export const BarraEventoProvider = BarraEventoContext.Provider;

/** Muestra `children` en la franja del evento (si la sección está dentro del marco del evento). */
export function EnBarraEvento({ children }: { children: ReactNode }) {
  const destino = useContext(BarraEventoContext);
  return destino ? createPortal(children, destino) : null;
}
