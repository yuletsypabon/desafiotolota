import { HttpError, handler, ok, parseBody } from '@/lib/api';
import { estadoClaves, exigirAdmin, guardarClave, verificarClave } from '@/lib/auth';
import { cambioClave } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  exigirAdmin(req);
  return ok(await estadoClaves());
});

// PUT — { rol, nueva, actual? }: el administrador cambia una contraseña (la suya exige la actual)
export const PUT = handler(async (req: Request) => {
  exigirAdmin(req);
  const { rol, nueva, actual } = await parseBody(req, cambioClave);
  if (rol === 'ADMIN' && !(actual && (await verificarClave('ADMIN', actual))))
    throw new HttpError(400, 'La contraseña actual del administrador no es correcta');
  await guardarClave(rol, nueva);
  return ok({ ok: true });
});
