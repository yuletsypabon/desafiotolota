import { HttpError, handler, parseBody } from '@/lib/api';
import { anotarIntento, exigirIntentosDisponibles, respuestaConSesion, verificarClave } from '@/lib/auth';
import { login } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// POST — { rol, clave } → inicia sesión
export const POST = handler(async (req: Request) => {
  exigirIntentosDisponibles(req);
  const { rol, clave } = await parseBody(req, login);
  const correcta = await verificarClave(rol, clave);
  anotarIntento(req, correcta);
  if (!correcta) {
    await new Promise((r) => setTimeout(r, 600)); // frena a quien intente adivinar
    throw new HttpError(401, 'Contraseña incorrecta');
  }
  return respuestaConSesion(req, rol);
});
