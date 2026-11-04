import 'server-only';
import { prisma } from './prisma';
import { calcularClasificacion } from './scoring';
import { notFound } from './api';

export async function getClasificacion(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: {
      id: true,
      nombre: true,
      anio: true,
      penLeveMs: true,
      penMediaMs: true,
      penGraveMs: true,
      bonPositivoMs: true,
      pruebas: { select: { id: true, nombre: true, estado: true, posicion: true } },
      equipos: { select: { id: true, numero: true, nombre: true } },
    },
  });
  if (!evento) notFound('Evento');
  const pruebaIds = evento.pruebas.map((p) => p.id);
  const [resultados, puntos] = await Promise.all([
    prisma.resultado.findMany({ where: { pruebaId: { in: pruebaIds } } }),
    prisma.puntoDisciplina.findMany({
      where: { pruebaId: { in: pruebaIds } },
      select: { pruebaId: true, equipoId: true, tipo: true },
    }),
  ]);
  return calcularClasificacion({
    evento,
    pruebas: evento.pruebas,
    equipos: evento.equipos,
    resultados,
    puntos,
  });
}

/** Siguiente número de inscripción libre en un evento */
export async function siguienteNumero(eventoId: string) {
  const max = await prisma.equipo.aggregate({ where: { eventoId }, _max: { numero: true } });
  return (max._max.numero ?? 0) + 1;
}
