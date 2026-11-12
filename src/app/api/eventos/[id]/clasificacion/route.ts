import { handler, ok, type Ctx } from '@/lib/api';
import { puedeVerHistorico, rolDe } from '@/lib/auth';
import { getClasificacion } from '@/lib/data';
import type { Clasificacion } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET — resultados por prueba (con disciplina aplicada) + tabla general acumulada
export const GET = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const clasificacion = await getClasificacion(id);
  if (rolDe(req) !== 'CRONO' || await puedeVerHistorico(req)) return ok(clasificacion);
  return ok(sinDatosHistoricos(clasificacion));
});

function sinDatosHistoricos(clasificacion: Clasificacion): Clasificacion {
  return {
    ...clasificacion,
    general: [],
    pruebas: clasificacion.pruebas.map((prueba) => ({
      ...prueba,
      filas: prueba.filas.map((fila) => ({
        ...fila,
        pos: 0,
        resultadoId: '',
        pista: null,
        llegadaAt: '',
        brutoMs: 0,
        detencionesMs: 0,
        detenciones: [],
        puntosEspirituales: 0,
        descuentoEspiritualMs: 0,
        netoMs: 0,
        finalMs: 0,
      })),
    })),
  };
}
