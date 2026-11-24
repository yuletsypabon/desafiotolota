'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import FlechaAccion from './FlechaAccion';
import s from './historia.module.css';

const PERSONAS = [
  { nombre: 'Linda Gonzalez', cargo: 'Logística' },
  { nombre: 'Paul Sanchez', cargo: 'Especialidades' },
  { nombre: 'Humberto Salazar', cargo: 'Coordinador de pruebas' },
  { nombre: 'Diana Salazar', cargo: 'Coordinación general', destacada: true },
  { nombre: 'Fredy Pardo', cargo: 'Disciplina' },
  { nombre: 'Yuletsy Pabon', cargo: 'Secretaría' },
  { nombre: 'Marible Quiroga', cargo: 'Tesorería' },
] as const;

export default function PlantelEquipo() {
  const carrusel = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const lista = carrusel.current;
    const coordinadora = lista?.querySelector<HTMLElement>('[data-destacada="si"]');
    if (!lista || !coordinadora) return;
    const centroLista = lista.getBoundingClientRect().left + lista.clientWidth / 2;
    const centroCard = coordinadora.getBoundingClientRect().left + coordinadora.offsetWidth / 2;
    lista.scrollLeft += centroCard - centroLista;
  }, []);

  const mover = (sentido: -1 | 1) => {
    const lista = carrusel.current;
    const tarjeta = lista?.querySelector('li');
    if (!lista || !tarjeta) return;
    const espacio = Number.parseFloat(getComputedStyle(lista).columnGap) || 20;
    const movimiento = (tarjeta.getBoundingClientRect().width + espacio) * sentido;
    lista.scrollBy({ left: movimiento, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <>
      <div className={s.plantelMarco}>
        <ul id="plantel-carrusel" className={s.plantelTarjetas} ref={carrusel} aria-label="Coordinadores del Desafío Tolotá">
          {PERSONAS.map((persona) => (
            <li className={s.plantelTarjeta} data-destacada={'destacada' in persona && persona.destacada ? 'si' : undefined} key={persona.nombre}>
              <article>
                <div className={s.retratoPendiente}>
                  <span className={s.marcaVertical} aria-hidden="true">{persona.cargo}</span>
                  <div className={s.retratoMarco}>
                    <Image
                      src="/fotos/plantel/retrato-referencia.webp"
                      alt={`Retrato temporal de referencia para ${persona.nombre}`}
                      fill
                      sizes="(max-width: 560px) 78vw, 280px"
                      className={s.retratoImagen}
                      priority={'destacada' in persona}
                    />
                  </div>
                  <div className={s.identidadPersona}>
                    <h3>{persona.nombre}</h3>
                    <p className={s.cargoPersona}>{persona.cargo}</p>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
      <nav className={s.controlesPlantel} aria-label="Controles del carrusel del plantel">
        <button type="button" onClick={() => mover(-1)} aria-label="Ver personas anteriores" aria-controls="plantel-carrusel"><FlechaAccion direccion="izquierda" /></button>
        <button type="button" onClick={() => mover(1)} aria-label="Ver personas siguientes" aria-controls="plantel-carrusel"><FlechaAccion direccion="derecha" /></button>
      </nav>
      <a className={s.plantelContacto} href="/contacto">Contactar a la organización <FlechaAccion /></a>
    </>
  );
}
