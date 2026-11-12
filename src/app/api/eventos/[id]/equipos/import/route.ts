import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { equiposImport } from '@/lib/validators';
import { numerosSegunArchivo } from '@/lib/csv';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST — importa equipos y fichas (desde CSV ya leído en el navegador).
 * Si el equipo ya existe (mismo nombre en el evento) se actualiza. Cada integrante se busca por nombre dentro del
 * equipo: si ya existe se completa su ficha con los datos que traiga el archivo (los vacíos no borran nada);
 * si no, se crea.
 * Los equipos quedan numerados en el orden del archivo (así aparecen en la lista); los que no vienen en el archivo
 * pasan al final, en el orden que ya tenían.
 */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  exigirAdmin(req);
  const { id } = await params;
  const { filas } = await parseBody(req, equiposImport);

  const resumen = await prisma.$transaction(async (tx) => {
    let creados = 0;
    let actualizados = 0;
    let participantes = 0;
    let fichasActualizadas = 0;
    const numeros = numerosSegunArchivo(filas);
    const importados = new Set<string>();

    for (const [i, f] of filas.entries()) {
      const existente = await tx.equipo.findUnique({
        where: { eventoId_nombre: { eventoId: id, nombre: f.nombre } },
        include: { participantes: { select: { id: true, nombre: true } } },
      });
      const numero = numeros[i];
      const eq = existente
        ? await tx.equipo.update({ where: { id: existente.id }, data: { numero, capitan: f.capitan || existente.capitan } })
        : await tx.equipo.create({ data: { eventoId: id, nombre: f.nombre, numero, capitan: f.capitan || null } });
      if (existente) actualizados++;
      else creados++;
      importados.add(eq.id);

      const ya = new Map((existente?.participantes ?? []).map((p) => [p.nombre.toLowerCase(), p.id]));
      for (const ficha of f.integrantes ?? []) {
        const clave = ficha.nombre.toLowerCase();
        const idExistente = ya.get(clave);
        if (idExistente) {
          // Solo los campos que vienen con dato: un archivo con columnas vacías no borra lo ya guardado
          const datos = Object.fromEntries(Object.entries(ficha).filter(([k, v]) => k !== 'nombre' && v !== null));
          if (Object.keys(datos).length) {
            await tx.participante.update({ where: { id: idExistente }, data: datos });
            fichasActualizadas++;
          }
        } else {
          const nuevo = await tx.participante.create({ data: { ...ficha, equipoId: eq.id }, select: { id: true } });
          ya.set(clave, nuevo.id); // por si el archivo repite el nombre
          participantes++;
        }
      }
    }

    // Los equipos que no venían en el archivo van después, sin chocar con los números nuevos
    const otros = await tx.equipo.findMany({
      where: { eventoId: id, id: { notIn: [...importados] } },
      orderBy: [{ numero: 'asc' }, { nombre: 'asc' }],
      select: { id: true },
    });
    let siguiente = Math.max(0, ...numeros) + 1;
    for (const o of otros) await tx.equipo.update({ where: { id: o.id }, data: { numero: siguiente++ } });

    return { creados, actualizados, participantes, fichasActualizadas };
  }, { timeout: 60_000 }); // varias consultas por fila del CSV

  return ok(resumen);
});
