import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody, type Ctx } from '@/lib/api';
import { participanteFields } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const data = await parseBody(req, participanteFields);
  const p = await prisma.participante.create({ data: { ...data, equipoId: id } });
  return ok(p, 201);
});
