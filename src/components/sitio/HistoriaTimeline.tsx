import Image from 'next/image';
import { ANIO_INICIO } from '@/lib/evento';
import PlantelEquipo from './PlantelEquipo';
import Testimonios from './Testimonios';
import s from './historia.module.css';

type Hito = {
  anio: number;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  periodo?: string;
  logo: string;
  logoSize: { width: number; height: number };
  especialidades?: readonly string[];
  proximo?: boolean;
  textoMuestra?: boolean;
};

const HITOS: Hito[] = [
  {
    anio: ANIO_INICIO,
    etiqueta: 'Inicio del recorrido',
    titulo: 'Reto y Aventura',
    descripcion: 'Una jornada para desafiar los límites, fortalecer la fe y crecer como comunidad.',
    logo: '/marca/ediciones/desafio-2016.png',
    logoSize: { width: 70, height: 66 },
    textoMuestra: true,
  },
  {
    anio: 2017,
    etiqueta: 'Primera edición',
    titulo: 'Sobreviviendo',
    descripcion: 'Campamento Desafío X4 · FEJA Barbosa.',
    logo: '/marca/ediciones/desafio-2017.png',
    logoSize: { width: 58, height: 60 },
  },
  {
    anio: 2019,
    etiqueta: 'Edición histórica',
    titulo: 'Travesía Campestre',
    descripcion: 'Campamento de aventura con la identidad «Travesía Campestre».',
    periodo: 'Periodo de 2019 por confirmar',
    logo: '/marca/ediciones/desafio-2019-travesia-campestre.png',
    logoSize: { width: 63, height: 72 },
  },
  {
    anio: 2019,
    etiqueta: 'Edición histórica',
    titulo: 'Guía Extremo',
    descripcion: 'Una segunda identidad del Desafío Tolotá registrada en 2019.',
    periodo: 'Periodo de 2019 por confirmar',
    logo: '/marca/ediciones/desafio-2019-guia-extremo.png',
    logoSize: { width: 72, height: 66 },
  },
  {
    anio: 2022,
    etiqueta: 'Edición histórica',
    titulo: 'Guerreros del fin',
    descripcion: 'Desafío X4 · Tolotá Sur.',
    logo: '/marca/ediciones/desafio-2022.png',
    logoSize: { width: 72, height: 68 },
  },
  {
    anio: 2023,
    etiqueta: 'Edición histórica',
    titulo: 'Jesús X4 Élite',
    descripcion: 'Rumbo a la eternidad.',
    logo: '/marca/ediciones/desafio-2023.png',
    logoSize: { width: 54, height: 56 },
  },
  {
    anio: 2024,
    etiqueta: 'Edición histórica',
    titulo: 'Tiempo de guerra',
    descripcion: 'Desafío Tolotá 2024 · edición X4.',
    logo: '/marca/ediciones/desafio-2024.png',
    logoSize: { width: 62, height: 72 },
  },
  {
    anio: 2025,
    etiqueta: 'Edición histórica',
    titulo: 'Desafío X4',
    descripcion: 'Tolotá · diciembre de 2025.',
    logo: '/marca/ediciones/desafio-2025.png',
    logoSize: { width: 69, height: 72 },
  },
  {
    anio: 2026,
    etiqueta: 'Edición actual',
    titulo: "GE'ULLAH",
    descripcion: '15–20 de diciembre · Finca El Faisán Dorado · Gámbita, Santander.',
    logo: '/marca/ediciones/desafio-2026.png',
    logoSize: { width: 63, height: 70 },
    proximo: true,
  },
];

const PAREJAS: Hito[][] = [
  HITOS.slice(0, 2),
  HITOS.slice(2, 4),
  HITOS.slice(4, 6),
  HITOS.slice(6, 8),
  HITOS.slice(8, 9),
];

const CAPITULOS_HISTORIA = [
  {
    numero: '01', etapa: 'EL COMIENZO', titulo: '¿Cómo empezó todo?',
    pregunta: '¿Cuándo, dónde y con quién nació el Desafío?',
    ejemplo: `El recorrido comenzó en ${ANIO_INICIO}. Desde entonces, jóvenes de distintas iglesias se reúnen para vivir una experiencia que combina aventura, espiritualidad y conocimiento.`,
  },
  {
    numero: '02', etapa: 'EL PROPÓSITO', titulo: '¿Qué nos mueve?',
    pregunta: '¿Qué necesidad o sueño impulsó la creación del evento?',
    ejemplo: 'El Desafío busca que la competencia sea también una oportunidad para crecer: poner el cuerpo a prueba, fortalecer la fe y construir comunidad.',
  },
  {
    numero: '03', etapa: 'LA EXPERIENCIA', titulo: 'Mucho más que competir',
    pregunta: '¿Qué vive un equipo desde que llega hasta que vuelve a casa?',
    ejemplo: 'Hay pruebas físicas, desafíos de conocimiento bíblico, espacios espirituales y vida de campamento. Cada equipo avanza acompañado por su iglesia.',
  },
  {
    numero: '04', etapa: 'QUIENES LO HACEN', titulo: 'Una comunidad en movimiento',
    pregunta: '¿Quiénes participan y qué los hace regresar?',
    ejemplo: 'Jóvenes, capitanes, iglesias y organizadores aportan algo distinto. La experiencia se construye en equipo, dentro y fuera de las pruebas.',
  },
  {
    numero: '05', etapa: 'EL CAMINO', titulo: 'Una historia que evoluciona',
    pregunta: '¿Qué cambió entre las primeras ediciones y las actuales?',
    ejemplo: 'Cada edición suma un nombre, un logo y nuevos recuerdos. La línea del tiempo reúne esos hitos; aquí podremos contar qué aprendizajes y retos marcaron cada etapa.',
  },
  {
    numero: '06', etapa: 'LO QUE PERMANECE', titulo: 'La huella y lo que sigue',
    pregunta: '¿Qué queremos que cada participante se lleve y qué soñamos para el futuro?',
    ejemplo: 'La meta es que el desafío continúe inspirando servicio, fe y amistad, y que cada nueva edición abra espacio para más jóvenes y nuevas historias.',
  },
] as const;

/** Recorrido cronológico. Las especialidades se muestran solo cuando la organización las confirme. */
export default function HistoriaTimeline() {
  return (
    <section className={s.seccion} aria-label="Línea del tiempo del Desafío Tolotá">
      <div className={s.cabecera}>
        <span className={s.contador}>{ANIO_INICIO} — {HITOS[HITOS.length - 1].anio}</span>
        <p>Un camino que sigue creciendo, edición tras edición.</p>
      </div>

      <ol className={s.linea}>
        {PAREJAS.map((pareja) => (
          <li className={s.par} data-solo={pareja.length === 1 ? 'si' : undefined} key={pareja.map((hito) => hito.titulo).join('-')}>
            {pareja.map((hito, indiceEnPareja) => {
              const lado = pareja.length === 1 ? 'centro' : indiceEnPareja === 0 ? 'izquierda' : 'derecha';

              return (
                <article className={s.hito} data-lado={lado} key={`${hito.anio}-${hito.titulo}`}>
                  <div className={s.tarjeta}>
                    <span
                      className={s.logo}
                      style={{ width: `${hito.logoSize.width}%`, height: `${hito.logoSize.height}%` }}
                    >
                      <Image
                        src={hito.logo}
                        alt={`Logo de ${hito.titulo}, Desafío Tolotá ${hito.anio}`}
                        fill
                        sizes="(max-width: 860px) 60vw, 240px"
                      />
                    </span>
                  </div>
                  <div className={s.contenido}>
                    <p className={s.anio}>{hito.anio}</p>
                    <p className={s.edicion}>{hito.etiqueta}</p>
                    {hito.periodo && <p className={s.periodo}>{hito.periodo}</p>}
                    <h2>{hito.titulo}</h2>
                    {hito.textoMuestra && <p className={s.textoMuestra}>Texto de muestra</p>}
                    <p className={s.descripcion}>{hito.descripcion}</p>
                    <span className={s.lineaDescripcion} aria-hidden="true" />

                    {hito.especialidades && hito.especialidades.length > 0 && (
                      <details className={s.detalles}>
                        <summary>Especialidades realizadas</summary>
                        <ul>
                          {hito.especialidades.map((especialidad) => <li key={especialidad}>{especialidad}</li>)}
                        </ul>
                      </details>
                    )}
                    {hito.proximo && <span className={s.proximo}>Próxima edición</span>}
                  </div>
                </article>
              );
            })}
          </li>
        ))}
      </ol>

      <section className={s.narrativa} aria-labelledby="estructura-relato">
        <div className={s.narrativaCabecera}>
          <span className={s.narrativaEtiqueta}>Una historia construida en comunidad</span>
          <h2 id="estructura-relato">De dónde venimos. Lo que vivimos. Lo que sigue.</h2>
          <p>Este es el hilo de la historia. Los textos son ejemplos provisionales; los datos y recuerdos de cada edición se completarán con el equipo organizador.</p>
          <span className={s.avisoEjemplo}>Estructura propuesta · ejemplos por confirmar</span>
        </div>

        <ol className={s.capasRelato}>
          {CAPITULOS_HISTORIA.map((capitulo) => (
            <li className={s.capaRelato} key={capitulo.numero}>
              <span className={s.numeroCapa}>{capitulo.numero}</span>
              <p className={s.etapaCapa}>{capitulo.etapa}</p>
              <h3>{capitulo.titulo}</h3>
              <p className={s.preguntaCapa}>{capitulo.pregunta}</p>
              <p className={s.descripcionCapa}>{capitulo.ejemplo}</p>
              <span className={s.marcaProvisional}>Texto de ejemplo</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.plantel} aria-labelledby="plantel-titulo">
        <header className={s.plantelCabecera}>
          <p className={s.narrativaEtiqueta}>Las personas detrás del encuentro</p>
          <h2 id="plantel-titulo">Nuestro equipo</h2>
          <p>Conoce a las personas que coordinan cada área y hacen posible el Desafío Tolotá.</p>
          <span className={s.avisoEjemplo}>Retratos pendientes · descripciones propuestas para validar</span>
        </header>

        <PlantelEquipo />
      </section>

      <Testimonios />
    </section>
  );
}
