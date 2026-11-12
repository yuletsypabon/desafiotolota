import { HttpError, handler, ok, parseBody } from '@/lib/api';
import {
  anotarIntento, exigirIntentosDisponibles, puedeVerHistorico, respuestaConAccesoHistorico, rolDe, tieneClaveHistorico, verificarClaveHistorico,
} from '@/lib/auth';
import { accesoHistorico } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const rol = rolDe(req);
  if (!rol) throw new HttpError(403, 'Se requiere una sesión para consultar el acceso al histórico');
  const configurada = await tieneClaveHistorico();
  const autorizado = await puedeVerHistorico(req);
  return ok({ configurada, autorizado });
});

export const POST = handler(async (req: Request) => {
  if (rolDe(req) !== 'CRONO') throw new HttpError(403, 'Esta contraseña adicional es solo para el cronometrador');
  if (!(await tieneClaveHistorico())) throw new HttpError(503, 'El administrador aún no ha configurado la contraseña del histórico');
  exigirIntentosDisponibles(req);
  const { clave } = await parseBody(req, accesoHistorico);
  const correcta = await verificarClaveHistorico(clave);
  anotarIntento(req, correcta);
  if (!correcta) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    throw new HttpError(401, 'Contraseña del histórico incorrecta');
  }
  return respuestaConAccesoHistorico(req);
});
