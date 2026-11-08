import { HttpError, handler, parseBody } from '@/lib/api';
import { respuestaConSesion, verificarClave } from '@/lib/auth';
import { login } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// POST — { rol, clave } → inicia sesión
export const POST = handler(async (req: Request) => {
  const { rol, clave } = await parseBody(req, login);
  if (!(await verificarClave(rol, clave))) {
    await new Promise((r) => setTimeout(r, 600)); // frena a quien intente adivinar
    throw new HttpError(401, 'Contraseña incorrecta');
  }
  return respuestaConSesion(req, rol);
});
