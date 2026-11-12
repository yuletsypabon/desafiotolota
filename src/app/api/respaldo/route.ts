import { HttpError, handler, ok } from '@/lib/api';
import { esLegacy, exportarTodo, importarLegacy, importarRespaldo } from '@/lib/respaldo';
import { exigirAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET — descarga respaldo JSON completo
export const GET = handler(async (req: Request) => {
  exigirAdmin(req);
  const data = await exportarTodo();
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="respaldo_desafio_tolota_${fecha}.json"`,
    },
  });
});

// POST — importa un respaldo propio o los datos de la versión HTML anterior (localStorage)
export const POST = handler(async (req: Request) => {
  exigirAdmin(req);
  const data = await req.json().catch(() => null);
  if (!data) throw new HttpError(400, 'El archivo no es JSON válido');
  if (data.app === 'desafio-tolota' && Array.isArray(data.eventos)) {
    return ok({ tipo: 'respaldo', ...(await importarRespaldo(data)) });
  }
  if (esLegacy(data)) {
    return ok({ tipo: 'legacy', ...(await importarLegacy(data)) });
  }
  throw new HttpError(400, 'Formato no reconocido. Usa un respaldo de esta app o la exportación de la versión anterior.');
});
