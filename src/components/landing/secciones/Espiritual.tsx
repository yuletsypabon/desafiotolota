import { EVENTO } from '@/lib/evento';
import Foto from '../Foto';
import s from '../Landing.module.css';

// Reina Valera 1995
const VERSICULO = {
  texto: 'Cuando estas cosas comiencen a suceder, erguíos y levantad vuestra cabeza, porque vuestra redención está cerca.',
  cita: 'Lucas 21:28',
};

/** 04 · Algo más grande que tú: la parte espiritual y el tema bíblico del año. */
export default function Espiritual() {
  const { tema } = EVENTO;
  return (
    <section className={`${s.seccion} ${s.panoramica}`} aria-labelledby="espiritual-titulo">
      <div className={s.panoramicaFoto}>
        <Foto id="fogata" />
        <div className={s.veloLateral} aria-hidden="true" />
        <div className={`${s.vidrio} ${s.panoramicaTexto} ${s.reveal}`}>
          <p className={s.etiqueta}>04 / Algo más grande que tú</p>
          <h2 id="espiritual-titulo" className={s.titulo}>Fuertes por fuera.<br />Firmes por dentro.</h2>
          <p className={s.parrafo}>
            Más allá del esfuerzo hay un propósito. Devocionales, alabanza y un sábado de reposo con una comunidad que te
            impulsa a crecer. En {EVENTO.inicio.getFullYear()} estudiamos <strong>{tema.nombre}</strong>, palabra {tema.idioma}{' '}
            que significa <em>{tema.significado}</em>.
          </p>
          <blockquote className={s.versiculo}>
            <p>“{VERSICULO.texto}”</p>
            <cite>{VERSICULO.cita}</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
