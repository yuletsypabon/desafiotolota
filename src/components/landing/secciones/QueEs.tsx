import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { MODALIDADES } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import Foto from '../Foto';
import s from '../Landing.module.css';

/** ¿Qué es el Desafío Tolotá?: el evento, el tema bíblico del año y las modalidades en tarjetas de vidrio. */
export default function QueEs() {
  const { tema } = EVENTO;
  return (
    <section className={s.seccion} aria-labelledby="quees-titulo">
      <div className={`${s.escena} ${s.quees}`}>
        <Foto id="evento" />
        <div className={s.veloQuees} aria-hidden="true" />
        <div className={s.reveal}>
          <p className={s.etiqueta}>¿Qué es el Desafío Tolotá?</p>
          <h2 id="quees-titulo" className={s.titulo}>Más que una<br /><em>carrera.</em></h2>
          <div className={s.queesTexto}>
            <p>
              El <strong>Desafío Tolotá</strong> es un evento anual que reúne a jóvenes adventistas en un campamento de varios
              días para competir en <strong>pistas de obstáculos por fases</strong>. Cada equipo representa a su iglesia y suma
              puntos en cada prueba física.
            </p>
            <p>
              Pero no todo es fuerza: las iglesias también compiten en <strong>conocimiento bíblico</strong>, con una cartilla
              de estudio que cada año profundiza en un tema distinto. En {EVENTO.inicio.getFullYear()} el tema es{' '}
              <strong>{tema.nombre}</strong>, palabra {tema.idioma} que significa <strong>{tema.significado}</strong>.
            </p>
            <p>
              Entre prueba y prueba hay devocionales, especialidades, alabanza y un sábado de reposo. Es un desafío para el
              cuerpo, la mente y el espíritu.
            </p>
          </div>
          <ul className={s.versiculos} aria-label="Versículos del tema">
            {tema.versiculos.map((v) => <li key={v} className={s.vidrio}>{v}</li>)}
          </ul>
        </div>
        <div className={s.modalidades}>
          {MODALIDADES.map((m, i) => (
            <article key={m.codigo} className={`${s.vidrio} ${s.modalidad} ${s.reveal} ${[s.d1, s.d2, s.d3][i]}`}>
              <b aria-hidden="true">{m.codigo === 'BIBLIA' ? <MenuBookOutlinedIcon /> : m.codigo}</b>
              <div>
                <h3>{m.nombre}</h3>
                <p>{m.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
