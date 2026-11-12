'use client';
import { useEffect, useState } from 'react';
import { EVENTO, cuentaRegresiva } from '@/lib/evento';

/** Tiempo que falta para el inicio del Desafío; se actualiza cada segundo. */
export function useCuentaRegresiva() {
  const [cuenta, setCuenta] = useState(() => cuentaRegresiva(Date.now(), EVENTO.inicio.getTime()));
  useEffect(() => {
    const iv = setInterval(() => setCuenta(cuentaRegresiva(Date.now(), EVENTO.inicio.getTime())), 1000);
    return () => clearInterval(iv);
  }, []);
  return cuenta;
}
