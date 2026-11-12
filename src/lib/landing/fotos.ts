// Fotos de la portada. Para usar una foto real, guárdala en public/fotos/ (JPG o WebP, ~1920 px de ancho)
// y escribe su ruta en `src`, p. ej. '/fotos/hero.webp'. Mientras `src` esté vacío se muestra un fondo
// provisional con el tono de la escena.

export type TonoFoto = 'bosque' | 'amanecer' | 'fogata' | 'barro';

export const FOTOS = {
  hero: { src: '/fotos/hero-bosque.webp', tono: 'bosque', alt: 'Bosque de niebla con rayos de sol en la sede del Desafío' },
  proposito: { src: '/fotos/equipo-sonriendo.webp', tono: 'bosque', alt: 'Tres integrantes de un equipo, embarrados y sonrientes, avanzan juntos por el prado' },
  obstaculos: { src: '/fotos/reto-obstaculos.webp', tono: 'barro', alt: 'Participantes se arrastran bajo una red de cuerdas en la pista de obstáculos' },
  equipo: { src: '/fotos/reto-equipo-rio.webp', tono: 'barro', alt: 'Un equipo cruza el río en neumáticos tomados de la mano' },
  camino: { src: '/fotos/reto-cartilla.webp', tono: 'fogata', alt: 'Una participante lee la cartilla de estudio del Desafío' },
  fogata: { src: '/fotos/espiritual-pergamino.webp', tono: 'fogata', alt: 'Un equipo lee el pergamino de bienvenida a la luz de una lámpara' },
  evento: { src: '/fotos/campamento-amanecer.webp', tono: 'amanecer', alt: 'Campamento de carpas en el prado al amanecer' },
  pilares: { src: '/fotos/campamento-amanecer.webp', tono: 'amanecer', alt: 'Campamento de carpas al amanecer en la sede del Desafío' },
  cierre: { src: '/fotos/cierre-neumatico.webp', tono: 'bosque', alt: 'Un joven corre cargando un neumático en la pista' },
} satisfies Record<string, { src: string; tono: TonoFoto; alt: string }>;

export type IdFoto = keyof typeof FOTOS;
