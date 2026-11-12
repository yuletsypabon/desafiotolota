'use client';
import { useEffect, type RefObject } from 'react';

/**
 * Animación de aparición: marca la raíz con `claseActiva` (solo entonces el CSS oculta el contenido para animarlo;
 * sin JavaScript todo se ve) y marca con `clase` cada <section> cuando se ve en un 15 %. La marca no se quita.
 */
export function useReveal(raiz: RefObject<HTMLElement | null>, clase: string, claseActiva: string) {
  useEffect(() => {
    const el = raiz.current;
    const secciones = el?.querySelectorAll('section');
    if (!el || !secciones?.length) return;
    el.classList.add(claseActiva);
    const obs = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && e.target.classList.add(clase)),
      { threshold: 0.15 },
    );
    secciones.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [raiz, clase, claseActiva]);
}
