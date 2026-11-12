import { handler, ok, parseBody } from '@/lib/api';
import { exigirAdmin, guardarClaveHistorico } from '@/lib/auth';
import { cambioClaveHistorico } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const PUT = handler(async (req: Request) => {
  exigirAdmin(req);
  const { nueva } = await parseBody(req, cambioClaveHistorico);
  await guardarClaveHistorico(nueva);
  return ok({ ok: true });
});
