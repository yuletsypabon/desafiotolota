/** Fotos locales que alimentan las tarjetas y el fondo dinámico del hero. */
export const MOMENTOS_HERO = [
  {
    titulo: 'Supera tus límites',
    src: '/fotos/reto-obstaculos.webp',
    alt: 'Participantes avanzan por una pista de obstáculos al aire libre',
  },
  {
    titulo: 'Reto en el río',
    src: '/fotos/rio-rapidos.webp',
    alt: 'Participantes superan una prueba en el río sobre neumáticos',
  },
  {
    titulo: 'Un equipo, un desafío',
    src: '/fotos/reto-equipo-rio.webp',
    alt: 'Integrantes de un equipo colaboran durante una prueba en el río',
  },
  {
    titulo: 'Corre por la meta',
    src: '/fotos/cierre-neumatico.webp',
    alt: 'Un participante corre con un neumático durante el desafío',
  },
  {
    titulo: 'Aprende en el camino',
    src: '/fotos/reto-cartilla.webp',
    alt: 'Una participante consulta la cartilla del desafío',
  },
  {
    titulo: 'Fe que nos une',
    src: '/fotos/espiritual-pergamino.webp',
    alt: 'Un equipo lee el mensaje de bienvenida del campamento',
  },
  {
    titulo: 'Juntos hasta el final',
    src: '/fotos/equipo-sonriendo.webp',
    alt: 'Integrantes de un equipo avanzan juntos por el campo',
  },
  {
    titulo: 'Vida de campamento',
    src: '/fotos/campamento-amanecer.webp',
    alt: 'Campamento al amanecer entre las montañas',
  },
] as const;

export type MomentoHero = (typeof MOMENTOS_HERO)[number];

/** Baraja el ciclo y evita repetir al inicio la última foto del ciclo anterior. */
export function mezclarMomentosHero(evitar?: string) {
  const orden = MOMENTOS_HERO.map((_, indice) => indice);
  for (let i = orden.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  if (evitar && MOMENTOS_HERO[orden[0]].src === evitar) {
    [orden[0], orden[1]] = [orden[1], orden[0]];
  }
  return orden;
}
