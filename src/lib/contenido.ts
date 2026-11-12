// Contenido público del Desafío Tolotá (modalidades, equipos, bases, cronograma, inscripción y contacto).
// Un solo lugar para editar la información del sitio. Los campos vacíos ('') se muestran como "pronto".

import { EVENTO } from './evento';

/** Modalidades de participación. */
export const MODALIDADES = [
  {
    codigo: 'X2',
    nombre: 'Desafío X2 · Parejas',
    texto: 'Dos participantes enfrentan la pista juntos. Coordinación, ritmo y confianza total en tu compañero.',
  },
  {
    codigo: 'X4',
    nombre: 'Desafío X4 · Equipos de 4',
    texto: 'Cuatro integrantes por equipo. Estrategia, resistencia y nadie cruza la meta solo.',
  },
  {
    codigo: 'BIBLIA',
    nombre: 'Desafío bíblico',
    texto: 'Las iglesias se preparan con la cartilla de estudio y se evalúan durante el evento. Estos puntos también cuentan.',
  },
] as const;

/** Los equipos compiten en cuatro grupos (fases). */
export const GRUPOS = [
  { id: 'profeticas', nombre: 'Iglesias Proféticas', color: '#7b4fc0' },
  { id: 'apostolicas', nombre: 'Iglesias Apostólicas', color: '#3b7be8' },
  { id: 'heraldos', nombre: 'Iglesias de los Heraldos', color: '#e86a10' },
  { id: 'inquebrantable', nombre: 'Iglesia Inquebrantable', color: '#c0394a' },
] as const;

export type IdGrupo = (typeof GRUPOS)[number]['id'];

/** Equipos 2026: cada uno lleva el nombre de una iglesia del Nuevo Testamento y representa a una iglesia local. */
export const EQUIPOS_EDICION: { nombre: string; grupo: IdGrupo; iglesia?: string }[] = [
  { nombre: 'Jerusalén', grupo: 'heraldos' },
  { nombre: 'Éfeso', grupo: 'profeticas' },
  { nombre: 'Esmirna', grupo: 'profeticas' },
  { nombre: 'Corinto', grupo: 'apostolicas' },
  { nombre: 'Filadelfia', grupo: 'profeticas' },
  { nombre: 'Pérgamo', grupo: 'profeticas' },
  { nombre: 'Iconio', grupo: 'inquebrantable' },
  { nombre: 'Antioquía', grupo: 'heraldos' },
  { nombre: 'Colosas', grupo: 'apostolicas' },
  { nombre: 'Troas', grupo: 'heraldos' },
  { nombre: 'Roma', grupo: 'inquebrantable' },
  { nombre: 'Filipos', grupo: 'apostolicas' },
  { nombre: 'Tesalónica', grupo: 'apostolicas' },
  { nombre: 'Galacia', grupo: 'apostolicas' },
  { nombre: 'Berea', grupo: 'inquebrantable' },
  { nombre: 'Laodicea', grupo: 'profeticas' },
  { nombre: 'Sardis', grupo: 'profeticas' },
  { nombre: 'Listra', grupo: 'inquebrantable' },
  { nombre: 'Tiatira', grupo: 'profeticas' },
  { nombre: 'Cesarea', grupo: 'heraldos' },
  { nombre: 'Derbe', grupo: 'inquebrantable' },
];

/** Bases y reglamento. `url` = enlace al PDF (vacío = "disponible pronto"). */
export const DOCUMENTOS = [
  { titulo: 'Manual del participante', desc: 'Agenda, requisitos de llegada, menaje, normas de campamento y convivencia.', url: '' },
  { titulo: 'Manual de retos', desc: 'Reglamento de las pruebas físicas, obstáculos, penalizaciones y puntuación.', url: '' },
  { titulo: 'Guía de ruta', desc: 'Cómo llegar a la sede, horarios de recepción y recomendaciones de viaje.', url: '' },
];

/** Inscripción: la hace el capitán de cada equipo en el formulario oficial. */
export const INSCRIPCION = {
  url: '', // formulario oficial (Tally, Google Forms…); vacío = "formulario disponible pronto"
  cierre: '', // ej. "22 de noviembre de 2026"; vacío = no se muestra
  pasos: [
    'Lee las bases y el manual del participante con tu equipo.',
    'Elige la modalidad: Desafío X2 (parejas) o Desafío X4 (equipos de 4).',
    'El capitán llena el formulario con los datos de todos los integrantes.',
    'Espera la confirmación de la organización con los siguientes pasos.',
  ],
};

/** Contacto de la organización. */
export const CONTACTO = {
  organizador: 'Diana Salazar',
  cargo: 'Coordinación general',
  whatsapp: '', // solo números con indicativo, ej. "573001234567"
  email: '',
};

type Actividad = { hora: string; que: string; destacada?: boolean };
export type DiaCronograma = { dia: string; num: number; titulo: string; resumen: string; actividades: Actividad[] };

const a = (hora: string, que: string, destacada = false): Actividad => ({ hora, que, destacada });
const rutina = [a('5:00 a. m.', 'Comunión con Dios'), a('5:30 a. m.', 'Aseo personal'), a('6:30 a. m.', 'Devocional'), a('8:00 a. m.', 'Desayuno')];
const noche = [a('5:00 p. m.', 'Aseo personal'), a('6:00 p. m.', 'Cena'), a('6:45 p. m.', 'Devocional'), a('8:00 p. m.', 'Esparcimiento'), a('9:30 p. m.', 'Descanso')];

/** Agenda de los participantes. Puede tener ajustes menores; los capitanes reciben los cambios en el evento. */
export const CRONOGRAMA: DiaCronograma[] = [
  {
    dia: 'Mar', num: 15, titulo: 'Llegada e inauguración', resumen: 'Recepción de equipos, asignación de terrenos y noche inaugural.',
    actividades: [
      a('Mañana', 'Sede disponible para quienes lleguen temprano'),
      a('12:00 – 4:00 p. m.', 'Recepción y distribución: documentos, kit de bienvenida y asignación de terreno', true),
      a('4:00 p. m.', 'Aseo personal'), a('5:30 p. m.', 'Cena'),
      a('6:30 – 9:15 p. m.', 'Inauguración con alabanza', true), a('9:15 p. m.', 'Descanso'),
    ],
  },
  {
    dia: 'Mié', num: 16, titulo: 'Prueba física 1 · Especialidad 1', resumen: 'Primer día de pista: arranca la competencia.',
    actividades: [...rutina, a('8:45 a. m. – 12:00 m.', 'Prueba física 1', true), a('12:00 m.', 'Almuerzo'), a('2:00 – 5:00 p. m.', 'Especialidad 1', true), ...noche],
  },
  {
    dia: 'Jue', num: 17, titulo: 'Pruebas físicas 2 y 3', resumen: 'Doble jornada de obstáculos.',
    actividades: [...rutina, a('8:45 a. m. – 12:00 m.', 'Prueba física 2', true), a('12:00 m.', 'Almuerzo'), a('1:45 – 5:00 p. m.', 'Prueba física 3', true), ...noche],
  },
  {
    dia: 'Vie', num: 18, titulo: 'Prueba física 4 · Especialidad 2', resumen: 'Última prueba de pista y recepción del sábado.',
    actividades: [
      ...rutina, a('8:45 a. m. – 12:00 m.', 'Prueba física 4', true), a('12:00 m.', 'Almuerzo'),
      a('1:45 – 4:30 p. m.', 'Especialidad 2', true), a('4:30 p. m.', 'Aseo personal'),
      a('5:45 p. m.', 'Recepción del sábado', true), a('7:00 p. m.', 'Cena'), a('7:45 p. m.', 'Esparcimiento'), a('9:00 p. m.', 'Descanso'),
    ],
  },
  {
    dia: 'Sáb', num: 19, titulo: 'Día de reposo y actividad social', resumen: 'Adoración, comunión y una noche de retos y juegos.',
    actividades: [
      a('5:00 a. m.', 'Comunión con Dios'), a('6:00 a. m.', 'Aseo personal'), a('7:00 a. m.', 'Desayuno'),
      a('8:15 a. m. – 12:00 m.', 'Programa de la mañana', true), a('12:00 m.', 'Almuerzo'), a('1:00 p. m.', 'Esparcimiento y descanso'),
      a('2:30 – 6:00 p. m.', 'Alabanza y programa de la tarde', true), a('6:00 p. m.', 'Despedida del sábado'), a('6:30 p. m.', 'Cena'),
      a('7:15 – 9:30 p. m.', 'Actividad social: retos físicos y juegos', true), a('9:30 p. m.', 'Descanso'),
    ],
  },
  {
    dia: 'Dom', num: 20, titulo: 'Clausura y regreso', resumen: 'Premiación, cierre y feliz regreso a casa.',
    actividades: [
      a('5:00 a. m.', 'Comunión con Dios'), a('5:30 a. m.', 'Aseo personal'), a('6:30 a. m.', 'Devocional'), a('7:50 a. m.', 'Desayuno'),
      a('8:40 a. m.', 'Clausura', true), a('9:40 a. m.', 'Actividad recreativa'), a('11:00 a. m.', 'Levantar campamento'),
      a('12:00 m.', 'Almuerzo'), a('12:30 p. m.', 'Feliz regreso', true),
    ],
  },
];

/** Los retos de la portada: cada tarjeta lleva una foto de fondo (ver lib/landing/fotos.ts). */
export const RETOS = [
  {
    foto: 'obstaculos',
    etiqueta: 'Pista de obstáculos',
    titulo: 'Rompe tus límites',
    texto: 'Circuitos rústicos de palos, lazos y cuerdas. Fuerza, equilibrio y decisión, prueba tras prueba.',
  },
  {
    foto: 'equipo',
    etiqueta: 'Desafío X2 · X4',
    titulo: 'Avanza en equipo',
    texto: 'En parejas o en equipos de 4, representando a tu iglesia. Nadie cruza la meta solo.',
  },
  {
    foto: 'camino',
    etiqueta: 'Desafío bíblico',
    titulo: 'Prepara la mente',
    texto: 'Las iglesias estudian la cartilla del año y compiten en conocimiento. Estos puntos también cuentan.',
  },
] as const;

/** Los tres pilares del evento (contexto oficial del Desafío). */
export const PILARES = [
  {
    id: 'aventura',
    nombre: 'Aventura',
    titulo: 'Activa tu mejor versión',
    texto: 'Pruebas de resistencia, trabajo en equipo y valentía bajo presión real.',
    enlace: { texto: 'Ver ediciones', ruta: '/ediciones' },
  },
  {
    id: 'espiritualidad',
    nombre: 'Espiritualidad',
    titulo: 'Vive una fe que se mueve',
    texto: 'Una cartilla bíblica temática que se estudia y se evalúa durante el evento, en comunidad con tu iglesia.',
    enlace: { texto: 'Ver sección espiritual', ruta: '/espiritual' },
  },
  {
    id: 'conocimiento',
    nombre: 'Conocimiento',
    titulo: 'Prepárate para ganar',
    texto: 'Pruebas de conocimiento bíblico entre iglesias, con manuales, reglamentos y cartillas para estudiar.',
    enlace: { texto: 'Ver recursos', ruta: '/recursos' },
  },
] as const;

/** Preguntas frecuentes de la portada. */
export const PREGUNTAS = [
  {
    pregunta: '¿Necesito experiencia deportiva?',
    respuesta: 'No. La actitud es el punto de partida: los retos se superan en equipo. Los requisitos de cada prueba están en el manual de retos.',
  },
  {
    pregunta: '¿Cómo se inscribe un equipo?',
    respuesta: 'Cada equipo representa a una iglesia local. El capitán elige la modalidad (X2 o X4) y llena el formulario con los datos de todos los integrantes.',
  },
  {
    pregunta: '¿Cuándo y dónde será el encuentro?',
    respuesta: `Del 15 al 21 de diciembre de ${EVENTO.inicio.getFullYear()} en la ${EVENTO.sede}, ${EVENTO.lugarDetalle}. La recepción empieza el martes 15 a las 12:00 m.`,
  },
  {
    pregunta: '¿Qué debo llevar?',
    respuesta: 'El manual del participante trae la lista de menaje, los requisitos de llegada y las normas de campamento.',
  },
] as const;

/** Frases de la franja «Manifiesto» que se desplaza bajo el hero. */
export const MANIFIESTO = ['Menos miedo', 'Más fe', 'Supera tus límites', 'Más propósito', 'Activa tu fe'] as const;
